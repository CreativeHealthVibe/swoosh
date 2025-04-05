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
const http = require('http');
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
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
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

// Create a simple HTTP server for UptimeRobot to ping
// This helps keep the bot running 24/7 on services like Render
const server = http.createServer((req, res) => {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <head>
        <title>SWOOSH Discord Bot Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            text-align: center;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #5865F2;
          }
          .status {
            font-size: 24px;
            font-weight: bold;
            color: #43B581;
            margin: 20px 0;
          }
          .uptime {
            font-size: 18px;
            color: #4f545c;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SWOOSH Discord Bot</h1>
          <div class="status">Status: Online</div>
          <div class="uptime">
            Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s
          </div>
          <p>This is a status page for the SWOOSH Discord bot.</p>
          <p>Last checked: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
});

// Set the server to listen on the port Render assigns or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 HTTP Server running on port ${PORT}`);
  console.log(`🔗 Use this URL for UptimeRobot: https://your-render-url.onrender.com/`);
});

// Start bot
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Bot successfully logged in'))
  .catch(error => {
    console.error('❌ Login Failed:', error);
    process.exit(1);
  });
