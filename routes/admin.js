const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');
const config = require('../config');

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
  
  res.render('admin/blacklist', {
    title: 'Blacklist Management | SWOOSH Bot',
    blacklistedUsers,
    user: req.user,
    layout: 'layouts/admin'
  });
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
  
  res.render('admin/settings', {
    title: 'Bot Settings | SWOOSH Bot',
    user: req.user,
    config: config,
    layout: 'layouts/admin'
  });
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
  
  res.render('admin/logs', {
    title: 'Bot Logs | SWOOSH Bot',
    logFiles,
    user: req.user,
    formatFileSize, // Pass the helper function to the template
    layout: 'layouts/admin'
  });
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
router.get('/users', (req, res) => {
  // Parse admin users from config
  const adminUsers = config.adminUserIds.map(id => {
    // Extract comment from the config.js file structure (if available)
    const configContent = fs.readFileSync('./config.js', 'utf8');
    const commentMatch = new RegExp(`'${id}'[^,]*// ([^\\n]*)`, 'i').exec(configContent);
    const comment = commentMatch ? commentMatch[1].trim() : 'No comment';
    
    return {
      id,
      comment
    };
  });
  
  res.render('admin/user-management', {
    title: 'Admin User Management | SWOOSH Bot',
    user: req.user,
    adminUsers,
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
 * API Routes
 * Register admin API routes
 */

// Import member API routes
const memberApiRoutes = require('./api/members');

// Mount member API routes
router.use('/api/members', memberApiRoutes);

