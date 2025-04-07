const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');
const config = require('../config');
const db = require('../utils/database');

// Helper function to get appropriate greeting based on time of day
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

// Protect all admin routes with isAdmin middleware
router.use(isAdmin);

/**
 * GET /admin
 * Root admin route - redirects to welcome page
 */
router.get('/', (req, res) => {
  res.redirect('/admin/welcome');
});

/**
 * GET /admin/test-ui
 * Test page for new UI templates
 */
router.get('/test-ui', (req, res) => {
  res.render('admin/test-new-ui', {
    title: 'Test New UI | SWOOSH Bot',
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/blacklist-new
 * New blacklist UI for testing
 */
router.get('/blacklist-new', (req, res) => {
  const blacklistedUsers = blacklistManager.getBlacklist();
  
  res.render('admin/blacklist-new', {
    title: 'Modern Blacklist | SWOOSH Bot',
    blacklistedUsers,
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/logs-new
 * New logs UI for testing
 */
router.get('/logs-new', (req, res) => {
  const logsDir = path.join(__dirname, '../logs');
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Get list of log files
  let logFiles = [];
  try {
    logFiles = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: `/admin/logs/${file}`,
        size: fs.statSync(path.join(logsDir, file)).size,
        mtime: fs.statSync(path.join(logsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
  } catch (error) {
    console.error('Error reading log directory:', error);
  }
  
  res.render('admin/logs-new', {
    title: 'Modern Logs | SWOOSH Bot',
    logFiles,
    user: req.user,
    formatFileSize, // Pass the helper function to the template
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/settings-new
 * New settings UI for testing
 */
router.get('/settings-new', (req, res) => {
  // Get the bot configuration
  const config = require('../config');
  
  // Get member data for bot management section
  const client = req.app.get('client');
  let memberData = [];
  
  if (client) {
    try {
      // Get guilds data for server management section
      const guilds = client.guilds.cache;
      
      for (const [guildId, guild] of guilds) {
        memberData.push({
          id: guildId,
          name: guild.name,
          iconURL: guild.iconURL({ dynamic: true }),
          totalMembers: guild.memberCount,
          region: guild.preferredLocale,
          owner: guild.members.cache.get(guild.ownerId)?.user?.username || 'Unknown'
        });
      }
      
      // Sort guilds by member count
      memberData.sort((a, b) => b.totalMembers - a.totalMembers);
    } catch (error) {
      console.error('Error fetching guild data:', error);
    }
  }
  
  res.render('admin/settings-new', {
    title: 'Modern Settings | SWOOSH Bot',
    user: req.user,
    config: config,
    memberData,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/dashboard
 * Admin dashboard home
 */
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard | SWOOSH Bot',
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/blacklist
 * Blacklist management
 */
router.get('/blacklist', (req, res) => {
  const blacklistedUsers = blacklistManager.getBlacklist();
  
  // First try to render the new template
  try {
    res.render('admin/blacklist-new', {
      title: 'Blacklist Management | SWOOSH Bot',
      blacklistedUsers,
      user: req.user,
      layout: 'layouts/admin'
    });
  } catch (err) {
    // Fall back to the original template if there's an error
    console.error('Error rendering new blacklist template:', err);
    res.render('admin/blacklist', {
      title: 'Blacklist Management | SWOOSH Bot',
      blacklistedUsers,
      user: req.user,
      layout: 'layouts/admin'
    });
  }
});

/**
 * POST /admin/blacklist/add
 * Add a user to blacklist
 */
router.post('/blacklist/add', (req, res) => {
  const { userId, username, reason } = req.body;
  
  if (!userId || !username || !reason) {
    req.flash('error', 'User ID, username, and reason are required');
    return res.redirect('/admin/blacklist');
  }
  
  const result = blacklistManager.addToBlacklist(
    userId,
    username,
    reason,
    req.user.id,
    req.user.username
  );
  
  if (result.success) {
    req.flash('success', `User ${username} has been blacklisted`);
  } else {
    req.flash('error', result.message || 'Failed to blacklist user');
  }
  
  res.redirect('/admin/blacklist');
});

/**
 * POST /admin/blacklist/remove
 * Remove a user from blacklist
 */
router.post('/blacklist/remove', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    req.flash('error', 'User ID is required');
    return res.redirect('/admin/blacklist');
  }
  
  const result = blacklistManager.removeFromBlacklist(userId);
  
  if (result.success) {
    req.flash('success', 'User has been removed from blacklist');
  } else {
    req.flash('error', result.message || 'Failed to remove user from blacklist');
  }
  
  res.redirect('/admin/blacklist');
});

/**
 * GET /admin/settings
 * Bot settings
 */
router.get('/settings', (req, res) => {
  // Get the bot configuration
  const config = require('../config');
  
  // Get member data for bot management section
  const client = req.app.get('client');
  let memberData = [];
  
  if (client) {
    try {
      // Get guilds data for server management section
      const guilds = client.guilds.cache;
      
      for (const [guildId, guild] of guilds) {
        memberData.push({
          id: guildId,
          name: guild.name,
          iconURL: guild.iconURL({ dynamic: true }),
          totalMembers: guild.memberCount,
          region: guild.preferredLocale,
          owner: guild.members.cache.get(guild.ownerId)?.user?.username || 'Unknown'
        });
      }
      
      // Sort guilds by member count
      memberData.sort((a, b) => b.totalMembers - a.totalMembers);
    } catch (error) {
      console.error('Error fetching guild data:', error);
    }
  }
  
  // First try to render the new template
  try {
    res.render('admin/settings-new', {
      title: 'Bot Settings | SWOOSH Bot',
      user: req.user,
      config: config,
      memberData,
      layout: 'layouts/admin'
    });
  } catch (err) {
    // Fall back to the original template if there's an error
    console.error('Error rendering new settings template:', err);
    res.render('admin/settings', {
      title: 'Bot Settings | SWOOSH Bot',
      user: req.user,
      config: config,
      layout: 'layouts/admin'
    });
  }
});

/**
 * GET /admin/logs
 * View bot logs
 */
router.get('/logs', (req, res) => {
  const logsDir = path.join(__dirname, '../logs');
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Get list of log files
  let logFiles = [];
  try {
    logFiles = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: `/admin/logs/${file}`,
        size: fs.statSync(path.join(logsDir, file)).size,
        mtime: fs.statSync(path.join(logsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
  } catch (error) {
    console.error('Error reading log directory:', error);
  }
  
  // First try to render the new template
  try {
    res.render('admin/logs-new', {
      title: 'System Logs | SWOOSH Bot',
      logFiles,
      user: req.user,
      formatFileSize, // Pass the helper function to the template
      layout: 'layouts/admin'
    });
  } catch (err) {
    // Fall back to the original template if there's an error
    console.error('Error rendering new logs template:', err);
    res.render('admin/logs', {
      title: 'Bot Logs | SWOOSH Bot',
      logFiles,
      user: req.user,
      formatFileSize, // Pass the helper function to the template
      layout: 'layouts/admin'
    });
  }
});

/**
 * GET /admin/logs/:filename
 * View specific log file
 */
router.get('/logs/:filename', (req, res) => {
  const filename = req.params.filename;
  const logPath = path.join(__dirname, '../logs', filename);
  
  if (!filename.endsWith('.log')) {
    req.flash('error', 'Invalid log file');
    return res.redirect('/admin/logs');
  }
  
  // Check if file exists
  if (!fs.existsSync(logPath)) {
    req.flash('error', 'Log file not found');
    return res.redirect('/admin/logs');
  }
  
  // Read log file
  let logContent = '';
  try {
    logContent = fs.readFileSync(logPath, 'utf8');
    
    // Format log entries
    logContent = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          const parts = line.split(' - ');
          if (parts.length >= 3) {
            const timestamp = parts[0];
            const level = parts[1];
            const message = parts.slice(2).join(' - ');
            
            let levelClass = '';
            switch (level.trim()) {
              case 'ERROR':
                levelClass = 'log-error';
                break;
              case 'WARN':
                levelClass = 'log-warn';
                break;
              case 'INFO':
                levelClass = 'log-info';
                break;
              case 'DEBUG':
                levelClass = 'log-debug';
                break;
              default:
                levelClass = '';
            }
            
            return {
              timestamp,
              level,
              message,
              levelClass
            };
          }
          return { raw: line };
        } catch (e) {
          return { raw: line };
        }
      });
  } catch (error) {
    console.error('Error reading log file:', error);
    req.flash('error', 'Failed to read log file');
    return res.redirect('/admin/logs');
  }
  
  res.render('admin/log-viewer', {
    title: `${filename} | SWOOSH Bot Logs`,
    filename,
    logContent,
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/stats
 * Detailed statistics
 */
router.get('/stats', (req, res) => {
  res.render('admin/stats', {
    title: 'Statistics | SWOOSH Bot',
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/members
 * Member tracker
 */
router.get('/members', async (req, res) => {
  const client = req.app.get('client');
  let memberData = [];
  let totalMembers = 0;
  let totalOnline = 0;
  let newMembers = [];
  let errorMessage = null;
  
  try {
    if (!client) {
      throw new Error('Discord client not available');
    }
    
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    
    // For each guild, get member info
    for (const [guildId, guild] of guilds) {
      try {
        // Fetch all members (this might take time for large servers)
        await guild.members.fetch();
        
        // Count total and online members
        const guildTotalMembers = guild.members.cache.size;
        const guildOnlineMembers = guild.members.cache.filter(m => 
          m.presence?.status === 'online' || 
          m.presence?.status === 'idle' || 
          m.presence?.status === 'dnd'
        ).size;
        
        totalMembers += guildTotalMembers;
        totalOnline += guildOnlineMembers;
        
        // Get new members (joined in last 7 days)
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentMembers = guild.members.cache
          .filter(m => m.joinedTimestamp > oneWeekAgo)
          .map(m => ({
            id: m.id,
            username: m.user.username,
            displayName: m.displayName,
            joinedAt: m.joinedAt,
            avatarURL: m.user.displayAvatarURL({ dynamic: true }),
            bot: m.user.bot,
            guildName: guild.name
          }))
          .sort((a, b) => b.joinedAt - a.joinedAt); // Sort newest first
        
        newMembers = [...newMembers, ...recentMembers];
        
        // Add to member data array
        memberData.push({
          id: guildId,
          name: guild.name,
          iconURL: guild.iconURL({ dynamic: true }),
          totalMembers: guildTotalMembers,
          onlineMembers: guildOnlineMembers,
          owner: guild.members.cache.get(guild.ownerId)?.user?.username || 'Unknown',
          region: guild.preferredLocale
        });
      } catch (error) {
        console.error(`Error fetching members for guild ${guild.name}:`, error);
      }
    }
    
    // Sort guilds by member count
    memberData.sort((a, b) => b.totalMembers - a.totalMembers);
    
  } catch (error) {
    console.error('Error getting member data:', error);
    errorMessage = error.message;
  }
  
  res.render('admin/members', {
    title: 'Member Tracker | SWOOSH Bot',
    user: req.user,
    memberData,
    totalMembers,
    totalOnline,
    newMembers: newMembers.slice(0, 50), // Limit to 50 newest members
    error: errorMessage,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/welcome
 * Welcome page with time-based greeting
 */
router.get('/welcome', (req, res) => {
  const greeting = getTimeBasedGreeting();
  
  // Make sure user is defined before accessing properties
  try {
    res.render('admin/welcome-fixed', {
      title: 'Welcome | SWOOSH Bot',
      greeting: `${greeting}`,
      user: req.user || null,
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering welcome page:', error);
    res.status(500).send('An error occurred while rendering the welcome page. Please try again later.');
  }
});

/**
 * GET /admin/users
 * Admin user management
 */
router.get('/users', async (req, res) => {
  // Get Discord client from Express app
  const client = req.app.get('client');
  
  // Parse admin users from config
  const adminUsers = await Promise.all(config.adminUserIds.map(async id => {
    // Extract comment from the config.js file structure (if available)
    const configContent = fs.readFileSync('./config.js', 'utf8');
    const commentMatch = new RegExp(`'${id}'[^,]*// ([^\\n]*)`, 'i').exec(configContent);
    const comment = commentMatch ? commentMatch[1].trim() : 'No comment';
    
    // If Discord client is available, fetch user data
    let username = null;
    let displayName = null;
    let avatarUrl = null;
    
    if (client) {
      try {
        const user = await client.users.fetch(id).catch(e => null);
        if (user) {
          username = user.username;
          displayName = user.globalName || user.username;
          avatarUrl = user.displayAvatarURL({ dynamic: true });
        }
      } catch (error) {
        console.error(`Failed to fetch Discord user data for ID ${id}:`, error);
      }
    }
    
    return {
      id,
      comment,
      username,
      displayName,
      avatarUrl
    };
  }));
  
  // Get all local admin users
  let localAdminUsers = [];
  try {
    // Get all local users and filter for admins
    const allLocalUsers = await db.getAllLocalUsers();
    localAdminUsers = allLocalUsers.filter(user => user.is_admin);
  } catch (error) {
    console.error('Error fetching local admin users:', error);
    req.flash('error', 'Failed to load local admin users');
  }
  
  res.render('admin/user-management', {
    title: 'Admin User Management | SWOOSH Bot',
    user: req.user,
    adminUsers,
    localAdminUsers,
    error: req.flash('error'),
    success: req.flash('success'),
    layout: 'layouts/admin'
  });
});

/**
 * POST /admin/users/add
 * Add a new admin user
 */
router.post('/users/add', (req, res) => {
  try {
    const { userId, comment } = req.body;
    
    // Validate input
    if (!userId || !comment) {
      req.flash('error', 'User ID and comment are required');
      return res.redirect('/admin/users');
    }
    
    // Check if user ID is already in the admin list
    if (config.adminUserIds.includes(userId)) {
      req.flash('error', 'This user is already an admin');
      return res.redirect('/admin/users');
    }
    
    // Create a new admin user ID list
    const newAdminUserIds = [...config.adminUserIds, userId];
    
    // Read the current config file
    let configContent = fs.readFileSync('./config.js', 'utf8');
    
    // Update the admin user IDs section
    const adminUserIdsSection = `  // Admin User IDs with full system access
  adminUserIds: [
    '${config.adminUserIds.join('\', // Admin user\n    \'')}', // Admin user
    '${userId}', // ${comment}
  ],`;
    
    // Replace the admin user IDs section in the config file
    configContent = configContent.replace(
      /^\s*\/\/\s*Admin User IDs[^\[]*\[[^\]]*\],/m,
      adminUserIdsSection
    );
    
    // Write the updated config file
    fs.writeFileSync('./config.js', configContent);
    
    // Clear the require cache for config.js
    delete require.cache[require.resolve('../config')];
    
    // Log the action
    console.log(`Admin ${req.user.username} (${req.user.id}) added new admin user ${userId} (${comment})`);
    
    req.flash('success', `Admin user ${comment} (${userId}) added successfully`);
    return res.redirect('/admin/users');
  } catch (error) {
    console.error('Error adding admin user:', error);
    req.flash('error', 'Failed to add admin user: ' + error.message);
    return res.redirect('/admin/users');
  }
});

/**
 * POST /admin/users/remove
 * Remove an admin user
 */
router.post('/users/remove', (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate input
    if (!userId) {
      req.flash('error', 'User ID is required');
      return res.redirect('/admin/users');
    }
    
    // Check if user ID is in the admin list
    if (!config.adminUserIds.includes(userId)) {
      req.flash('error', 'This user is not an admin');
      return res.redirect('/admin/users');
    }
    
    // Prevent removing the last admin
    if (config.adminUserIds.length <= 1) {
      req.flash('error', 'Cannot remove the last admin user');
      return res.redirect('/admin/users');
    }
    
    // Prevent removing yourself
    if (userId === req.user.id) {
      req.flash('error', 'Cannot remove yourself from admin users');
      return res.redirect('/admin/users');
    }
    
    // Create a new admin user ID list without the removed user
    const newAdminUserIds = config.adminUserIds.filter(id => id !== userId);
    
    // Read the current config file
    let configContent = fs.readFileSync('./config.js', 'utf8');
    
    // Update the admin user IDs section
    const adminUserIdsSection = `  // Admin User IDs with full system access
  adminUserIds: [
    '${newAdminUserIds.join('\',\n    \'')}',
  ],`;
    
    // Replace the admin user IDs section in the config file
    configContent = configContent.replace(
      /^\s*\/\/\s*Admin User IDs[^\[]*\[[^\]]*\],/m,
      adminUserIdsSection
    );
    
    // Write the updated config file
    fs.writeFileSync('./config.js', configContent);
    
    // Clear the require cache for config.js
    delete require.cache[require.resolve('../config')];
    
    // Log the action
    console.log(`Admin ${req.user.username} (${req.user.id}) removed admin user ${userId}`);
    
    req.flash('success', `Admin user ${userId} removed successfully`);
    return res.redirect('/admin/users');
  } catch (error) {
    console.error('Error removing admin user:', error);
    req.flash('error', 'Failed to remove admin user: ' + error.message);
    return res.redirect('/admin/users');
  }
});

/**
 * POST /admin/settings/update
 * Update bot configuration settings
 */
router.post('/settings/update', (req, res) => {
  try {
    // Get the current config and update values
    const config = require('../config');
    const fs = require('fs');
    
    // Get the form data
    const { 
      prefix, 
      embedColor, 
      ticketCategory, 
      logChannelId,
      deletedMessages,
      ticketTranscripts,
      commandUsage,
      botStatus,
      bountyMin,
      bountyMax
    } = req.body;
    
    // Validate required fields
    if (!prefix) {
      req.flash('error', 'Command prefix is required');
      return res.redirect('/admin/settings');
    }
    
    // Structure of config.js
    const configContent = `// config.js - Bot configuration
require('dotenv').config();

module.exports = {
  prefix: "${prefix}",
  embedColor: "${embedColor || config.embedColor}",
  ticketCategory: "${ticketCategory || config.ticketCategory}",
  logChannelId: "${logChannelId || config.logChannelId}",
  
  // Website and session settings
  website: {
    sessionSecret: process.env.SESSION_SECRET || 'swoosh-admin-dashboard-secret',
    sessionExpiry: 86400000, // 24 hours in milliseconds
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/swoosh',
    port: process.env.PORT || 3000,
    url: process.env.WEBSITE_URL || 'https://swooshfinal.onrender.com'
  },
  
  // Discord OAuth settings
  oauth: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'https://swooshfinal.onrender.com/auth/discord/callback',
    scopes: ['identify', 'guilds.join']
  },
  
  // Specific logging channels
  loggingChannels: {
    deletedMessages: "${deletedMessages || config.loggingChannels.deletedMessages}",
    ticketTranscripts: "${ticketTranscripts || config.loggingChannels.ticketTranscripts}",
    commandUsage: "${commandUsage || config.loggingChannels.commandUsage}",
    botStatus: "${botStatus || config.loggingChannels.botStatus}"
  },
  
  // Admin User IDs with full system access
  adminUserIds: ${JSON.stringify(config.adminUserIds)},
  
  // Ticket types and their configurations
  ticketTypes: ${JSON.stringify(config.ticketTypes, null, 2)},
  
  // Role IDs that can access tickets (will be overridden by database settings)
  staffRoles: ${JSON.stringify(config.staffRoles)},
  
  // Validation limits
  validation: {
    bountyMin: ${bountyMin || config.validation.bountyMin},
    bountyMax: ${bountyMax || config.validation.bountyMax},
    allowedImageTypes: ${JSON.stringify(config.validation.allowedImageTypes)}
  },
  
  // Webhook settings
  webhooks: {
    bountyAvatarUrl: '${config.webhooks.bountyAvatarUrl}',
    bountyName: '${config.webhooks.bountyName}',
  }
};
`;
    
    // Log the action
    console.log(`Admin ${req.user.username} (${req.user.id}) updated bot configuration`);
    
    // Write the config file
    fs.writeFileSync('./config.js', configContent);
    
    // Clear the require cache for config.js
    delete require.cache[require.resolve('../config')];
    
    req.flash('success', 'Bot configuration updated successfully');
    return res.redirect('/admin/settings');
  } catch (error) {
    console.error('Error updating configuration:', error);
    req.flash('error', 'Failed to update configuration: ' + error.message);
    return res.redirect('/admin/settings');
  }
});

module.exports = router;

/**
 * POST /admin/localusers/add
 * Add a new local admin user
 */
router.post('/localusers/add', async (req, res) => {
  try {
    const { username, password, email, display_name, permissions } = req.body;
    
    // Validate input
    if (!username || !password) {
      req.flash('error', 'Username and password are required');
      return res.redirect('/admin/users');
    }
    
    // Check if username already exists
    const existingUser = await db.getLocalUserByUsername(username);
    if (existingUser) {
      req.flash('error', 'Username already exists');
      return res.redirect('/admin/users');
    }
    
    // Parse permissions
    let parsedPermissions = {};
    if (permissions) {
      try {
        // Check if permissions is already an object
        if (typeof permissions === 'object') {
          parsedPermissions = permissions;
        } else {
          // Try to parse the permissions string
          parsedPermissions = JSON.parse(permissions);
        }
      } catch (error) {
        console.error('Error parsing permissions:', error);
        req.flash('error', 'Invalid permissions format');
        return res.redirect('/admin/users');
      }
    } else {
      // Default permissions for admin user
      parsedPermissions = {
        admin_management: true,
        user_management: true,
        logs_management: true,
        server_management: true,
        blacklist_management: true
      };
    }
    
    // Create the new user
    const newUser = await db.createLocalUser({
      username,
      password,
      email,
      display_name: display_name || username,
      is_admin: true,
      permissions: parsedPermissions
    });
    
    // Log the action
    console.log(`Admin ${req.user.username} (${req.user.id}) created new local admin user: ${username}`);
    
    req.flash('success', `Local admin user ${username} created successfully`);
    return res.redirect('/admin/users');
  } catch (error) {
    console.error('Error creating local admin user:', error);
    req.flash('error', 'Failed to create local admin user: ' + error.message);
    return res.redirect('/admin/users');
  }
});

/**
 * POST /admin/localusers/remove
 * Remove a local admin user
 */
router.post('/localusers/remove', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate input
    if (!userId) {
      req.flash('error', 'User ID is required');
      return res.redirect('/admin/users');
    }
    
    // Check if user exists
    const user = await db.getLocalUserById(userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Prevent removing yourself
    if (req.user.userType === 'local' && parseInt(userId) === parseInt(req.user.id)) {
      req.flash('error', 'Cannot remove your own account');
      return res.redirect('/admin/users');
    }
    
    // Delete the user
    await db.deleteLocalUser(userId);
    
    // Log the action
    console.log(`Admin ${req.user.username} (${req.user.id}) removed local admin user: ${user.username}`);
    
    req.flash('success', `Local admin user ${user.username} removed successfully`);
    return res.redirect('/admin/users');
  } catch (error) {
    console.error('Error removing local admin user:', error);
    req.flash('error', 'Failed to remove local admin user: ' + error.message);
    return res.redirect('/admin/users');
  }
});

/**
 * API Routes
 * Register admin API routes
 */

// Import member API routes
const memberApiRoutes = require('./api/members');

// Mount member API routes
router.use('/api/members', memberApiRoutes);

/**
 * GET /admin/profile
 * User profile page
 */
router.get('/profile', (req, res) => {
  res.render('admin/profile', {
    title: 'User Profile | SWOOSH Bot',
    user: req.user,
    messages: {
      success: req.flash('success'),
      error: req.flash('error')
    },
    layout: 'layouts/admin'
  });
});

/**
 * POST /admin/profile/update
 * Update user profile
 */
router.post('/profile/update', async (req, res) => {
  try {
    // Only local users can update their profile
    if (req.user.userType !== 'local') {
      req.flash('error', 'Only local users can update their profile');
      return res.redirect('/admin/profile');
    }
    
    const { display_name, email, avatar, current_password, new_password, confirm_password } = req.body;
    
    // Verify current password
    const user = await db.getLocalUserById(req.user.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/profile');
    }
    
    const isValidPassword = await db.verifyPassword(current_password, user.password);
    if (!isValidPassword) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/admin/profile');
    }
    
    // Prepare update data
    const updateData = {
      display_name,
      email
    };
    
    // Validate avatar URL if provided
    if (avatar) {
      // Simple URL validation
      if (!avatar.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
        req.flash('error', 'Avatar URL must be a valid image URL (jpg, png, gif)');
        return res.redirect('/admin/profile');
      }
      updateData.avatar = avatar;
    }
    
    // Check if password is being updated
    if (new_password) {
      if (new_password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters long');
        return res.redirect('/admin/profile');
      }
      
      if (new_password !== confirm_password) {
        req.flash('error', 'New passwords do not match');
        return res.redirect('/admin/profile');
      }
      
      updateData.password = new_password;
    }
    
    // Update user profile
    const updatedUser = await db.updateLocalUser(req.user.id, updateData);
    
    // Update session
    req.login(updatedUser, (err) => {
      if (err) {
        console.error('Error updating session:', err);
        req.flash('error', 'Profile updated but session refresh failed');
      } else {
        req.flash('success', 'Profile updated successfully');
      }
      return res.redirect('/admin/profile');
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Failed to update profile: ' + error.message);
    return res.redirect('/admin/profile');
  }
});

