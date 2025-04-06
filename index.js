// index.js - Main Bot Entry Point
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection,
  REST,
  Routes 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');
const osUtils = require('os-utils');
const ejsLayouts = require('express-ejs-layouts');
require('dotenv').config();

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences, // Added for user status tracking
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User]
});

// Load modules
const ticketManager = require('./handlers/ticketManager');
const bountyManager = require('./handlers/bountyManager');
const blacklistManager = require('./handlers/blacklistManager');
const logging = require('./modules/logging');
const config = require('./config');
const adminUtils = require('./utils/admin');

// Path to autoroles configuration
const autrolesConfigPath = path.join(__dirname, 'data/autoroles.json');

// Initialize collections for commands
client.commands = new Collection();
client.slashCommands = new Collection();

// Load command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const slashCommands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  
  // Register regular commands
  if (command.name) {
    client.commands.set(command.name, command);
  }
  
  // Register slash commands
  if (command.data) {
    client.slashCommands.set(command.data.name, command);
    slashCommands.push(command.data.toJSON());
  }
}

// Bot login event
client.once('ready', async () => {
  console.log(`🚀 ${client.user.tag} is online!`);
  console.log(`Bot client ID: ${client.user.id}`);
  
  // Set custom bot status
  client.user.setPresence({
    activities: [{ 
      name: '.gg/swoosh',
      type: 3 // 0 is "Playing", 3 is "Watching", 2 is "Listening"
    }],
    status: 'online'
  });
  console.log('✅ Set custom status: Watching .gg/swoosh');
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }
    
    // Initialize autoroles configuration if it doesn't exist
    if (!fs.existsSync(autrolesConfigPath)) {
      fs.writeFileSync(autrolesConfigPath, JSON.stringify({}, null, 2));
      console.log('📄 Created autoroles configuration file');
    }
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    console.log('Started refreshing application (/) commands.');
    
    const guilds = client.guilds.cache;
    
    for (const [guildId, guild] of guilds) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guildId),
          { body: slashCommands },
        );
        console.log(`Successfully registered commands for guild ${guild.name} (${guildId})`);
      } catch (error) {
        console.error(`Failed to register commands for guild ${guildId}:`, error);
      }
    }
    
    // Initialize logging system
    await logging.setup(client);
    console.log('✅ Logging system initialized');
    
    // Initialize ticket and bounty managers
    ticketManager.init(client);
    bountyManager.init(client);
    console.log('✅ Ticket and Bounty systems initialized');
    
    // Post initial bot status
    logging.logBotStatus(client);
    
  } catch (error) {
    console.error('❌ Initialization Error:', error);
  }
});

// Message creation event handler
client.on('messageCreate', async (message) => {
  try {
    // Skip bot messages
    if (message.author.bot) return;
    
    // Check if user is blacklisted
    if (message.guild) {
      const blacklistEntry = blacklistManager.isBlacklisted(message.author.id);
      if (blacklistEntry && !adminUtils.isAdmin(message.member)) {
        // Log the message from a blacklisted user
        logging.logAction('Blacklisted User Message', message.author, null, {
          channel: message.channel.name,
          content: message.content.substring(0, 1000)
        });
        // Return early if user is blacklisted
        return;
      }
    }
    
    // Handle AFK functionality
    const afkModule = client.commands.get('afk');
    
    // Check if user is no longer AFK
    if (afkModule && message.guild && !message.content.startsWith(config.prefix)) {
      const wasAfk = await afkModule.handleReturnFromAfk(message);
      if (wasAfk) return; // If user was AFK, process no further
    }
    
    // Check if user mentioned AFK users
    if (afkModule && message.guild && message.mentions.users.size > 0) {
      await afkModule.handleAfkMention(message);
    }
    
    // Continue only if message is a command
    if (!message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    // Log command usage to the special channel
    logging.logCommandUsage(message.author, commandName, args);
    
    // Execute the command
    await command.execute(message, args, client);
  } catch (error) {
    console.error(`Command Error:`, error);
    message.reply('There was an error trying to execute that command!');
    logging.logAction('Command Error', message.author, null, {
      command: message.content,
      error: error.message
    });
  }
});

// Slash command and interaction handler
client.on('interactionCreate', async interaction => {
  try {
    // Skip interactions from blacklisted users (except for admins)
    if (interaction.guild) {
      const blacklistEntry = blacklistManager.isBlacklisted(interaction.user.id);
      const member = interaction.member;
      
      if (blacklistEntry && member && !adminUtils.isAdmin(member)) {
        // Log the interaction attempt from a blacklisted user
        logging.logAction('Blacklisted User Interaction', interaction.user, null, {
          type: interaction.type,
          location: interaction.channel?.name || 'Unknown channel'
        });
        
        // Silently ignore blacklisted user interactions
        return;
      }
    }
    
    // Handle slash commands
    if (interaction.isCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;
      
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Slash Command Error (${interaction.commandName}):`, error);
        const replyContent = { 
          content: 'There was an error while executing this command!', 
          ephemeral: true 
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyContent);
        } else {
          await interaction.reply(replyContent);
        }
        
        logging.logAction('Slash Command Error', interaction.user, null, {
          command: interaction.commandName,
          error: error.message
        });
      }
    }
    
    // Handle ticket dropdown menu selection
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
      try {
        await ticketManager.handleTicketCreation(interaction, interaction.values[0], client);
      } catch (error) {
        console.error('Ticket Creation Error:', error);
        interaction.reply({
          content: 'There was an error creating your ticket. Please try again later.',
          ephemeral: true
        });
        
        logging.logAction('Ticket Creation Error', interaction.user, null, {
          error: error.message
        });
      }
    }
    
    // Handle ticket buttons (close, claim, etc.)
    if (interaction.isButton()) {
      // Handle create ticket button
      if (interaction.customId === 'create_ticket') {
        try {
          await ticketManager.handleTicketButton(interaction);
        } catch (error) {
          console.error('Ticket Button Error:', error);
          interaction.reply({
            content: 'There was an error creating your ticket. Please try again later.',
            ephemeral: true
          });
          
          logging.logAction('Ticket Button Error', interaction.user, null, {
            button: interaction.customId,
            error: error.message
          });
        }
      }
      
      // Handle close ticket button
      else if (interaction.customId === 'close_ticket') {
        try {
          await ticketManager.closeTicket(interaction, client);
        } catch (error) {
          console.error('Close Ticket Error:', error);
          interaction.reply({
            content: 'There was an error closing this ticket. Please try again later.',
            ephemeral: true
          });
          
          logging.logAction('Close Ticket Error', interaction.user, null, {
            button: interaction.customId,
            error: error.message
          });
        }
      }
      
      // Handle transcript button
      else if (interaction.customId === 'transcript') {
        try {
          await ticketManager.generateChannelTranscript(interaction);
        } catch (error) {
          console.error('Transcript Generation Error:', error);
          interaction.reply({
            content: 'There was an error generating the transcript. Please try again later.',
            ephemeral: true
          });
          
          logging.logAction('Transcript Error', interaction.user, null, {
            button: interaction.customId,
            error: error.message
          });
        }
      }
      
      // Handle add user button
      else if (interaction.customId === 'add_user') {
        try {
          await interaction.reply({
            content: "Please use the `.adduser @user` command to add a user to this ticket.",
            ephemeral: true
          });
        } catch (error) {
          console.error('Add User Button Error:', error);
          logging.logAction('Add User Button Error', interaction.user, null, {
            error: error.message
          });
        }
      }
    }
  } catch (error) {
    console.error('Interaction Handler Error:', error);
    logging.logAction('Critical Error', null, null, {
      error: error.message
    });
  }
});

// Handle message deletion
client.on('messageDelete', async message => {
  try {
    // Skip bot messages and empty messages
    if (message.author && !message.author.bot && message.content) {
      // Log the deleted message
      logging.logDeletedMessage(message);
    }
  } catch (error) {
    console.error('Message Delete Log Error:', error);
  }
});

// Handle new member joins (auto-roles)
client.on('guildMemberAdd', async member => {
  try {
    // Check if autoroles are configured for this guild
    if (fs.existsSync(autrolesConfigPath)) {
      const autoroles = JSON.parse(fs.readFileSync(autrolesConfigPath, 'utf8'));
      const guildId = member.guild.id;

      // Check if guild has autoroles configured
      if (autoroles[guildId] && autoroles[guildId].length > 0) {
        let rolesAdded = 0;
        
        // Add each configured role
        for (const roleId of autoroles[guildId]) {
          try {
            const role = member.guild.roles.cache.get(roleId);
            if (role && role.manageable) {
              await member.roles.add(role);
              rolesAdded++;
            }
          } catch (roleError) {
            console.error(`Error adding role ${roleId} to member ${member.user.tag}:`, roleError);
          }
        }
        
        // Log autorole assignment
        if (rolesAdded > 0) {
          logging.logAction('Autoroles Assigned', member.user, null, {
            count: rolesAdded,
            member: member.user.tag
          });
          console.log(`✅ Assigned ${rolesAdded} autorole(s) to new member: ${member.user.tag}`);
        }
      }
    }
  } catch (error) {
    console.error('Autorole Error:', error);
    logging.logAction('Autorole Error', member.user, null, {
      error: error.message
    });
  }
});

// Error handling
process.on('unhandledRejection', error => {
  console.error('‼️ Unhandled Rejection:', error);
  logging.logAction('Critical Error', null, null, {
    error: error.stack.substring(0, 1000)
  });
});

process.on('uncaughtException', error => {
  console.error('‼️ Uncaught Exception:', error);
  logging.logAction('Fatal Error', null, null, {
    error: error.stack.substring(0, 1000)
  });
  process.exit(1);
});

// Create an Express application for the website
const app = express();
const PORT = process.env.PORT || 5000;
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('express-flash');

// Set up EJS as the view engine with layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'website/views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Set up static file serving
app.use(express.static(path.join(__dirname, 'website/public')));

// Set up JSON request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'swoosh-admin-dashboard-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  },
  store: process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb') ? 
    MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    }) : null
}));

// Set up flash messages
app.use(flash());

// Set up passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Configure Discord authentication strategy
require('./utils/passport/discord')();

// Make client object available to routes
app.set('client', client);
app.set('config', config);

// Calculate bot uptime
function getBotUptime() {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return { days, hours, minutes, seconds, totalSeconds: uptime };
}

// Routes for the website
app.get('/', (req, res) => {
  // Render landing page
  res.render('landing', {
    title: 'SWOOSH Bot - Discord Utility Bot',
    client: client,
    activeNav: 'home'
  });
});

app.get('/home', (req, res) => {
  // Render home page
  res.render('index', {
    title: 'SWOOSH Bot - Home',
    uptime: getBotUptime(),
    client: client,
    lastChecked: new Date().toLocaleString(),
    activeNav: 'home'
  });
});

app.get('/commands', (req, res) => {
  // Get commands for display
  const regularCommands = Array.from(client.commands.values())
    .filter(cmd => cmd.name && cmd.description)
    .map(cmd => ({ 
      name: cmd.name, 
      description: cmd.description,
      usage: cmd.usage || null,
      category: cmd.category || 'General'
    }));
    
  const slashCommands = Array.from(client.slashCommands.values())
    .map(cmd => ({
      name: cmd.data.name,
      description: cmd.data.description,
      category: cmd.category || 'General'
    }));
    
  res.render('commands', {
    title: 'SWOOSH Bot - Commands',
    regularCommands,
    slashCommands,
    prefix: config.prefix,
    activeNav: 'commands'
  });
});

app.get('/status', (req, res) => {
  // Render status page with bot information
  res.render('status', {
    title: 'SWOOSH Bot - Status',
    uptime: getBotUptime(),
    client: client,
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    channels: client.channels.cache.size,
    lastChecked: new Date().toLocaleString(),
    activeNav: 'status'
  });
});

app.get('/bot-status', (req, res) => {
  // Render detailed bot status analytics page
  res.render('bot-status', {
    title: 'SWOOSH Bot - Status',
    uptime: getBotUptime(),
    client: client,
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    channels: client.channels.cache.size,
    lastChecked: new Date().toLocaleString(),
    activeNav: 'server-health'
  });
});

// Server Health Dashboard with real-time updates
app.get('/server-health', (req, res) => {
  // Get initial system stats
  const cpuCount = os.cpus().length;
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  res.render('server-health', {
    title: 'SWOOSH Bot - Server Health',
    uptime: getBotUptime(),
    cpuCount: cpuCount,
    totalMemory: totalMemory,
    freeMemory: freeMemory,
    usedMemory: memoryUsage.rss,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    loadAverage: os.loadavg(),
    client: client,
    lastChecked: new Date().toLocaleString(),
    activeNav: 'server-health'
  });
});

// Electron app route
app.get('/electron', (req, res) => {
  res.render('electron', {
    title: 'SWOOSH Bot - Desktop App',
    uptime: getBotUptime(),
    client: client,
    lastChecked: new Date().toLocaleString(),
    activeNav: 'electron'
  });
});

// Downloads page route
app.get('/download', (req, res) => {
  res.render('download', {
    title: 'SWOOSH Bot - Download Desktop App',
    activeNav: 'download'
  });
});

// Direct download route
app.get('/downloads/swoosh-bot-setup.exe', (req, res) => {
  const filePath = path.join(__dirname, 'website/public/downloads/swoosh-bot-setup.exe');
  res.download(filePath, 'swoosh-bot-setup.exe', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).send('File not found');
    }
  });
});

// API routes
app.get('/api/status', (req, res) => {
  const uptime = getBotUptime();
  res.json({
    status: 'online',
    uptime: uptime,
    guilds: client.guilds.cache.size,
    timestamp: new Date().toISOString()
  });
});

// API endpoint for server health metrics
app.get('/api/server-health', (req, res) => {
  // Get system stats
  const cpuCount = os.cpus().length;
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  // Calculate used memory percentage
  const usedMemoryPercentage = Math.round((1 - (freeMemory / totalMemory)) * 100);
  
  // Get current CPU usage
  osUtils.cpuUsage((cpuUsage) => {
    res.json({
      uptime: getBotUptime(),
      cpu: {
        count: cpuCount,
        usage: Math.round(cpuUsage * 100),
        loadAverage: os.loadavg()
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: memoryUsage.rss,
        usedPercentage: usedMemoryPercentage
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
      },
      discord: {
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size,
        commands: client.commands.size + client.slashCommands.size
      }
    });
  });
});

// API endpoint for team members data
app.get('/api/team', async (req, res) => {
  try {
    const teamMembers = [
      {
        id: '930131254106550333',
        name: 'gh_Sman',
        role: 'Bot Owner',
        description: 'Project Lead & Core Developer for SWOOSH Bot. Specializes in Discord.js implementation and user experience design.',
        github: 'ghSman',
        discordId: '930131254106550333',
        twitter: 'gh_sman',
        specialties: ['Discord.js', 'UI/UX Design', 'Bot Architecture'],
        joinedAt: '2022-01-15',
        badge: {
          icon: 'fas fa-crown',
          title: 'Project Founder'
        }
      },
      {
        id: '1196042021488570391',
        name: 'fl4ddie',
        role: 'Bot Owner',
        description: 'Systems Engineer & DevOps specialist. Handles deployment, hosting, and database implementations.',
        github: 'fl4ddie',
        discordId: '1196042021488570391',
        twitter: null,
        specialties: ['Infrastructure', 'DevOps', 'Database Management'],
        joinedAt: '2022-02-08',
        badge: {
          icon: 'fas fa-server',
          title: 'Infrastructure Lead'
        }
      },
      {
        id: '506323791140356106',
        name: 'cdn.gov',
        role: 'Bot Developer',
        description: 'Backend Developer & Integration Specialist. Creates APIs and implements new bot features.',
        github: 'cdngov',
        discordId: '506323791140356106',
        twitter: 'cdn_gov',
        specialties: ['API Integration', 'Backend Systems', 'Feature Development'],
        joinedAt: '2022-03-22',
        badge: {
          icon: 'fas fa-code',
          title: 'Core Developer'
        }
      }
    ];
    
    // Fetch avatars and status from Discord for each team member
    const teamWithAvatars = await Promise.all(teamMembers.map(async (member) => {
      try {
        // Force-fetch user with cache bypass to ensure we get the latest avatar
        const user = await client.users.fetch(member.id, { force: true });
        
        // Get user status - if presence is not enabled, will default to 'offline'
        const status = user.presence?.status || 'offline';
        
        // Calculate member's time on the team in months
        const joinDate = new Date(member.joinedAt);
        const now = new Date();
        const monthsOnTeam = Math.floor(
          (now - joinDate) / (1000 * 60 * 60 * 24 * 30.4)
        );
        
        // Add cache-busting parameter to avatar URL
        const avatarURL = `${user.displayAvatarURL({ size: 256, format: 'png', dynamic: true })}?t=${Date.now()}`;
        
        return {
          ...member,
          avatarURL: avatarURL,
          status: status,
          username: user.username,
          discriminator: user.discriminator,
          monthsOnTeam: monthsOnTeam,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error fetching user ${member.id}:`, error);
        // Use default image path if avatar fetching fails
        const defaultAvatarPath = `/img/default-avatar-${member.role.toLowerCase().replace(' ', '-')}.svg`;
        
        return {
          ...member,
          avatarURL: defaultAvatarPath,
          status: 'offline',
          error: 'Could not fetch user data',
          lastUpdated: new Date().toISOString()
        };
      }
    }));
    
    // Add a timestamp to the response
    const response = {
      team: teamWithAvatars,
      timestamp: new Date().toISOString(),
      count: teamWithAvatars.length
    };
    
    // Don't cache response to ensure fresh avatar data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(response);
    
    // Log successful fetch
    console.log(`Successfully served team data for ${teamWithAvatars.length} members`);
  } catch (error) {
    console.error('Error in team API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Team page route
app.get('/team', (req, res) => {
  res.render('team', {
    title: 'SWOOSH Bot - Our Team',
    client: client,
    activeNav: 'team'
  });
});

// Demo page route for showcasing Three.js animations
app.get('/demo', (req, res) => {
  res.render('demo', {
    title: 'SWOOSH Bot - Demo',
    client: client,
    activeNav: 'demo',
    layout: false // Render without layout to have full control
  });
});

// API endpoint for team member data

// Load routes for admin and auth
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Register routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist',
    error: {
      status: 404,
      stack: process.env.NODE_ENV === 'development' ? 'Page not found' : ''
    }
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).render('error', {
    title: 'Error',
    message: err.message || 'An error occurred',
    error: {
      status: status,
      stack: process.env.NODE_ENV === 'development' ? err.stack : ''
    }
  });
});

// Legacy status route for UptimeRobot
app.get('/status-check', (req, res) => {
  res.status(200).send('OK');
});

// Start the HTTP server
const server = http.createServer(app);

// Set up WebSocket server for real-time updates
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);
  
  // Send initial data
  sendServerStats(ws);
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast server stats to all connected clients
function broadcastServerStats() {
  if (clients.size === 0) return; // No clients connected
  
  // Get CPU usage and other system stats
  osUtils.cpuUsage((cpuUsage) => {
    // Format the stats for the dashboard
    const stats = {
      // Basic stats in the format expected by the dashboard
      cpu: Math.round(cpuUsage * 100),
      memory: Math.round((1 - (os.freemem() / os.totalmem())) * 100),
      uptime: getBotUptime().totalSeconds,
      ping: Math.round(client.ws.ping),
      servers: client.guilds.cache.size,
      users: client.users.cache.size,
      
      // Command usage statistics (mock data for now)
      commandUsage: {
        help: 42,
        emoji: 38,
        role: 24,
        whos: 56,
        ban: 12,
        kick: 8
      },
      
      // System info
      nodeVersion: process.version,
      discordVersion: require('discord.js').version,
      os: `${os.platform()} ${os.release()}`,
      
      // Detailed stats
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: process.memoryUsage().rss,
      timestamp: new Date().toISOString(),
      channels: client.channels.cache.size,
      commands: client.commands.size + client.slashCommands.size
    };
    
    // Send to all connected clients
    for (const wsClient of clients) {
      if (wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify(stats));
      }
    }
  });
}

// Function to send server stats to a specific client
function sendServerStats(ws) {
  if (ws.readyState !== WebSocket.OPEN) return;
  
  osUtils.cpuUsage((cpuUsage) => {
    // Format the stats for the dashboard - same format as broadcastServerStats
    const stats = {
      // Basic stats in the format expected by the dashboard
      cpu: Math.round(cpuUsage * 100),
      memory: Math.round((1 - (os.freemem() / os.totalmem())) * 100),
      uptime: getBotUptime().totalSeconds,
      ping: Math.round(client.ws.ping),
      servers: client.guilds.cache.size,
      users: client.users.cache.size,
      
      // Command usage statistics
      commandUsage: {
        help: 42,
        emoji: 38,
        role: 24,
        whos: 56,
        ban: 12,
        kick: 8
      },
      
      // System info
      nodeVersion: process.version,
      discordVersion: require('discord.js').version,
      os: `${os.platform()} ${os.release()}`,
      
      // Detailed stats
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: process.memoryUsage().rss,
      timestamp: new Date().toISOString(),
      channels: client.channels.cache.size,
      commands: client.commands.size + client.slashCommands.size
    };
    
    ws.send(JSON.stringify(stats));
  });
}

// Set up interval to broadcast stats every 2 seconds
const statsInterval = setInterval(broadcastServerStats, 2000);

// Clean up interval on process exit
process.on('exit', () => {
  clearInterval(statsInterval);
});

// Start the server
server.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
  console.log(`🔗 Website URL: https://swooshfinal.onrender.com/`);
  console.log(`📊 Real-time server health monitoring enabled`);
});

// Start bot
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log('Bot successfully logged in'))
  .catch(error => {
    console.error('❌ Login Failed:', error);
    process.exit(1);
  });
