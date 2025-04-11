/**
 * SWOOSH Discord Bot - Admin Routes
 * 
 * This file contains all routes for the admin dashboard
 * Routes are protected by the isAdmin middleware
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');
const config = require('../config');

// Protect all admin routes with isAdmin middleware
router.use(isAdmin);

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

/**
 * GET /admin
 * Root admin route - redirects to admin3d dashboard
 */
router.get('/', (req, res) => {
  res.redirect('/admin3d');
});

/**
 * GET /admin/welcome
 * Admin dashboard welcome page with time-based greeting
 */
router.get('/welcome', (req, res) => {
  const greeting = getTimeBasedGreeting();
  
  try {
    res.render('admin/welcome', {
      title: 'Dashboard | SWOOSH Bot',
      greeting: greeting,
      user: req.user,
      path: '/admin/welcome',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering welcome page:', error);
    res.status(500).send('Error loading welcome page: ' + error.message);
  }
});

/**
 * GET /admin/settings
 * Bot settings and administration configuration
 */
router.get('/settings', async (req, res) => {
  try {
    // Mark as static page to prevent WebSocket refreshing
    const staticPage = true;
    
    // Get active tab from query parameters
    const tab = req.query.tab || 'general';
    
    // Get Discord client from Express app
    const client = req.app.get('client');
    
    // Get admin users from config
    const adminUsers = config.adminUserIds || [];
    
    // Get local admin users from database if available
    const db = req.app.locals.db;
    const localAdminUsers = db && typeof db.getAllLocalUsers === 'function' ? 
                           (await db.getAllLocalUsers()).filter(user => user.is_admin) : [];
    
    // Fetch list of servers for the message sending section
    let servers = [];
    if (client) {
      servers = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount
      }));
    }
    
    // Render the settings page
    res.render('admin/settings-new', {
      title: 'Bot Settings | SWOOSH Bot',
      user: req.user,
      adminUsers,
      localAdminUsers,
      servers,
      staticPage,
      tab,
      path: '/admin/settings',
      config: config,
      client: client,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      },
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering settings page:', error);
    res.status(500).send('Error loading settings page: ' + error.message);
  }
});

/**
 * GET /admin/blacklist
 * Blacklist management page
 */
router.get('/blacklist', (req, res) => {
  try {
    const blacklistedUsers = blacklistManager.getBlacklist();
    
    res.render('admin/blacklist', {
      title: 'Blacklist Management | SWOOSH Bot',
      blacklistedUsers,
      user: req.user,
      path: '/admin/blacklist',
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      },
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering blacklist page:', error);
    res.status(500).send('Error loading blacklist page: ' + error.message);
  }
});

/**
 * POST /admin/blacklist/add
 * Add a user to the blacklist
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
 * Remove a user from the blacklist
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
 * GET /admin/logs
 * View system logs
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
  
  // Helper function to get type icon for log files
  function getLogTypeIcon(filename) {
    if (filename.includes('error')) return 'exclamation-triangle';
    if (filename.includes('debug')) return 'bug';
    if (filename.includes('system')) return 'server';
    if (filename.includes('command')) return 'terminal';
    if (filename.includes('ticket')) return 'ticket-alt';
    if (filename.includes('moderation')) return 'shield-alt';
    return 'file-code';
  }
  
  // Helper function to calculate age label
  function getAgeLabel(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  try {
    // Get list of log files
    let logFiles = [];
    
    try {
      logFiles = fs.readdirSync(logsDir)
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const stats = fs.statSync(path.join(logsDir, file));
          return {
            name: file,
            path: `/admin/logs/${file}`,
            size: stats.size,
            mtime: stats.mtime,
            age: getAgeLabel(stats.mtime),
            icon: getLogTypeIcon(file.toLowerCase()),
            type: file.split('.')[0].split('-')[0].toUpperCase()
          };
        })
        .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
    } catch (error) {
      console.error('Error reading log directory:', error);
    }
    
    // Get system stats for logs dashboard
    const logStats = {
      totalSize: logFiles.reduce((sum, file) => sum + file.size, 0),
      newestFile: logFiles.length > 0 ? logFiles[0] : null,
      oldestFile: logFiles.length > 0 ? logFiles[logFiles.length - 1] : null,
      totalCount: logFiles.length,
      categories: {
        error: logFiles.filter(f => f.name.toLowerCase().includes('error')).length,
        system: logFiles.filter(f => f.name.toLowerCase().includes('system')).length,
        command: logFiles.filter(f => f.name.toLowerCase().includes('command')).length,
        general: logFiles.filter(f => !f.name.toLowerCase().includes('error') && 
                                    !f.name.toLowerCase().includes('system') && 
                                    !f.name.toLowerCase().includes('command')).length
      }
    };
    
    // Render the logs template
    res.render('admin/logs', {
      title: 'System Logs | SWOOSH Bot',
      logFiles,
      logStats,
      user: req.user,
      formatFileSize,
      path: '/admin/logs',
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      },
      layout: 'layouts/admin',
      staticPage: true
    });
  } catch (error) {
    console.error('Error rendering logs page:', error);
    res.status(500).send('Error loading logs page: ' + error.message);
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
  
  try {
    // Read log file
    let logContent = fs.readFileSync(logPath, 'utf8');
    
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
    
    res.render('admin/log-viewer', {
      title: `${filename} | SWOOSH Bot Logs`,
      filename,
      logContent,
      user: req.user,
      path: '/admin/logs',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error reading log file:', error);
    req.flash('error', 'Failed to read log file');
    return res.redirect('/admin/logs');
  }
});

/**
 * GET /admin/members
 * Member tracker and management
 */
router.get('/members', async (req, res) => {
  try {
    const client = req.app.get('client');
    let memberData = [];
    let totalMembers = 0;
    let totalOnline = 0;
    let newMembers = [];
    let errorMessage = null;
    
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
    
    res.render('admin/members', {
      title: 'Member Tracker | SWOOSH Bot',
      user: req.user,
      memberData,
      totalMembers,
      totalOnline,
      newMembers: newMembers.slice(0, 50), // Limit to 50 newest members
      error: errorMessage,
      path: '/admin/members',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering members page:', error);
    res.status(500).send('Error loading members page: ' + error.message);
  }
});

/**
 * GET /admin/customization
 * Bot customization and appearance settings
 */
router.get('/customization', (req, res) => {
  try {
    const botConfig = require('../config');
    const client = req.app.get('client');
    
    res.render('admin/customization', {
      title: 'Bot Customization | SWOOSH Bot',
      user: req.user,
      path: '/admin/customization',
      config: botConfig,
      client: client,
      messages: req.flash(),
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering customization page:', error);
    res.status(500).send('Error loading customization page: ' + error.message);
  }
});

/**
 * POST /admin/customization/update-appearance
 * Update the bot's appearance settings
 */
router.post('/customization/update-appearance', (req, res) => {
  try {
    const { 
      primaryColor, secondaryColor, defaultBotName, 
      defaultAvatarUrl, defaultFooterText 
    } = req.body;
    
    // Read the current config file
    const configPath = path.join(__dirname, '../config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');

    // Update appearance settings
    if (primaryColor) {
      configContent = configContent.replace(
        /primaryColor:\s*['"].*?['"]/,
        `primaryColor: '${primaryColor}'`
      );
    }
    
    if (defaultBotName) {
      configContent = configContent.replace(
        /botName:\s*['"].*?['"]/,
        `botName: '${defaultBotName}'`
      );
    }
    
    if (defaultAvatarUrl) {
      configContent = configContent.replace(
        /bountyAvatarUrl:\s*['"].*?['"]/,
        `bountyAvatarUrl: '${defaultAvatarUrl}'`
      );
    }
    
    // Store the changes
    fs.writeFileSync(configPath, configContent);
    
    // Log the changes
    console.log(`Appearance customization updated by admin user: ${req.user.username} (${req.user.id})`);
    
    // Flash success message and redirect back
    req.flash('success', 'Appearance settings updated successfully!');
    res.redirect('/admin/customization');
  } catch (error) {
    console.error('Error saving appearance settings:', error);
    req.flash('error', 'Failed to save appearance settings: ' + error.message);
    res.redirect('/admin/customization');
  }
});

/**
 * POST /admin/customization/send-bounty
 * Send a bounty to a target user
 */
router.post('/customization/send-bounty', (req, res) => {
  try {
    const { targetUserId, bountyAmount, bountyReason } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      req.flash('error', 'Discord client not available');
      return res.redirect('/admin/customization');
    }
    
    if (!targetUserId || !bountyAmount || !bountyReason) {
      req.flash('error', 'User ID, amount, and reason are required');
      return res.redirect('/admin/customization');
    }
    
    // Reference to the bounty handler
    const bountyManager = req.app.get('bountyManager');
    
    if (!bountyManager) {
      req.flash('error', 'Bounty system not available');
      return res.redirect('/admin/customization');
    }
    
    // Send the bounty
    bountyManager.sendBounty(
      targetUserId,
      parseInt(bountyAmount),
      bountyReason,
      req.user.id,
      req.user.username
    ).then(result => {
      if (result.success) {
        req.flash('success', `Bounty of ${bountyAmount} sent successfully to user!`);
      } else {
        req.flash('error', result.message || 'Failed to send bounty');
      }
      res.redirect('/admin/customization');
    }).catch(error => {
      console.error('Error sending bounty:', error);
      req.flash('error', 'Error sending bounty: ' + error.message);
      res.redirect('/admin/customization');
    });
  } catch (error) {
    console.error('Error in bounty sending process:', error);
    req.flash('error', 'Error sending bounty: ' + error.message);
    res.redirect('/admin/customization');
  }
});

/**
 * POST /admin/customization/send-news
 * Send news update to configured channel
 */
router.post('/customization/send-news', (req, res) => {
  const { newsTitle, newsContent, newsColor, newsImage } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    req.flash('error', 'Discord client not available');
    return res.redirect('/admin/customization');
  }
  
  if (!newsTitle || !newsContent) {
    req.flash('error', 'News title and content are required');
    return res.redirect('/admin/customization');
  }
  
  // Get news channel ID from config
  const newsChannelId = config.newsChannel;
  
  if (!newsChannelId) {
    req.flash('error', 'News channel not configured in config.js');
    return res.redirect('/admin/customization');
  }
  
  try {
    // Get the channel
    const channel = client.channels.cache.get(newsChannelId);
    
    if (!channel) {
      req.flash('error', `Channel with ID ${newsChannelId} not found`);
      return res.redirect('/admin/customization');
    }
    
    // Create embed
    const { MessageEmbed } = require('discord.js');
    const newsEmbed = new MessageEmbed()
      .setTitle(newsTitle)
      .setDescription(newsContent)
      .setColor(newsColor || '#5865F2')
      .setTimestamp()
      .setFooter({ text: `Posted by ${req.user.username}` });
    
    // Add image if provided
    if (newsImage) {
      newsEmbed.setImage(newsImage);
    }
    
    // Send message
    channel.send({ embeds: [newsEmbed] })
      .then(() => {
        req.flash('success', 'News update sent successfully!');
        res.redirect('/admin/customization');
      })
      .catch(error => {
        console.error('Error sending news update:', error);
        req.flash('error', 'Failed to send news update: ' + error.message);
        res.redirect('/admin/customization');
      });
  } catch (error) {
    console.error('Error in news sending process:', error);
    req.flash('error', 'Error sending news: ' + error.message);
    res.redirect('/admin/customization');
  }
});

/**
 * POST /admin/users/add
 * Add a Discord user as admin
 */
router.post('/users/add', (req, res) => {
  try {
    const { userId, comment } = req.body;
    
    if (!userId) {
      req.flash('error', 'User ID is required');
      return res.redirect('/admin/settings?tab=admins');
    }
    
    // Read config file
    const configPath = path.join(__dirname, '../config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Find the adminUserIds array in the config
    const match = configContent.match(/adminUserIds:\s*\[(.*?)\]/s);
    
    if (!match) {
      req.flash('error', 'adminUserIds array not found in config.js');
      return res.redirect('/admin/settings?tab=admins');
    }
    
    // Get current admin IDs
    const currentAdminIds = match[1].split(',').map(id => id.trim().replace(/['"]/g, ''));
    
    // Check if user is already an admin
    if (currentAdminIds.includes(userId)) {
      req.flash('error', 'User is already an admin');
      return res.redirect('/admin/settings?tab=admins');
    }
    
    // Add the new admin ID
    const newAdminIds = [...currentAdminIds, userId].filter(id => id); // Remove empty values
    
    // Update the config file
    const newAdminIdsString = newAdminIds.map(id => `'${id}'`).join(', ');
    configContent = configContent.replace(
      /adminUserIds:\s*\[(.*?)\]/s,
      `adminUserIds: [${newAdminIdsString}]`
    );
    
    fs.writeFileSync(configPath, configContent);
    
    // Log the action
    console.log(`Admin user added by ${req.user.username} (${req.user.id}): ${userId}`);
    
    req.flash('success', 'Admin user added successfully');
    res.redirect('/admin/settings?tab=admins');
  } catch (error) {
    console.error('Error adding admin user:', error);
    req.flash('error', 'Failed to add admin user: ' + error.message);
    res.redirect('/admin/settings?tab=admins');
  }
});

/**
 * POST /admin/users/remove
 * Remove a Discord user from admin
 */
router.post('/users/remove', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      req.flash('error', 'User ID is required');
      return res.redirect('/admin/settings?tab=admins');
    }
    
    // Don't allow removing yourself
    if (userId === req.user.id) {
      req.flash('error', 'You cannot remove yourself from admin');
      return res.redirect('/admin/settings?tab=admins');
    }
    
    // Read config file
    const configPath = path.join(__dirname, '../config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Find the adminUserIds array in the config
    const match = configContent.match(/adminUserIds:\s*\[(.*?)\]/s);
    
    if (!match) {
      req.flash('error', 'adminUserIds array not found in config.js');
      return res.redirect('/admin/settings?tab=admins');
    }
    
    // Get current admin IDs
    const currentAdminIds = match[1].split(',').map(id => id.trim().replace(/['"]/g, ''));
    
    // Remove the admin ID
    const newAdminIds = currentAdminIds.filter(id => id !== userId && id); // Remove userId and empty values
    
    // Update the config file
    const newAdminIdsString = newAdminIds.map(id => `'${id}'`).join(', ');
    configContent = configContent.replace(
      /adminUserIds:\s*\[(.*?)\]/s,
      `adminUserIds: [${newAdminIdsString}]`
    );
    
    fs.writeFileSync(configPath, configContent);
    
    // Log the action
    console.log(`Admin user removed by ${req.user.username} (${req.user.id}): ${userId}`);
    
    req.flash('success', 'Admin user removed successfully');
    res.redirect('/admin/settings?tab=admins');
  } catch (error) {
    console.error('Error removing admin user:', error);
    req.flash('error', 'Failed to remove admin user: ' + error.message);
    res.redirect('/admin/settings?tab=admins');
  }
});

/**
 * POST /admin/settings/update
 * Update bot configuration settings
 */
router.post('/settings/update', (req, res) => {
  try {
    const { 
      prefix, embedColor, ticketCategory, logChannelId,
      deletedMessages, ticketTranscripts, commandUsage, botStatus,
      bountyMin, bountyMax 
    } = req.body;
    
    // Read config file
    const configPath = path.join(__dirname, '../config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update various config settings
    if (prefix) {
      configContent = configContent.replace(
        /prefix:\s*['"].*?['"]/,
        `prefix: '${prefix}'`
      );
    }
    
    if (embedColor) {
      configContent = configContent.replace(
        /embedColor:\s*['"].*?['"]/,
        `embedColor: '${embedColor}'`
      );
    }
    
    if (ticketCategory) {
      configContent = configContent.replace(
        /ticketCategory:\s*['"].*?['"]/,
        `ticketCategory: '${ticketCategory}'`
      );
    }
    
    if (logChannelId) {
      configContent = configContent.replace(
        /logChannelId:\s*['"].*?['"]/,
        `logChannelId: '${logChannelId}'`
      );
    }
    
    // Update logging channels
    if (deletedMessages) {
      configContent = configContent.replace(
        /deletedMessages:\s*['"].*?['"]/,
        `deletedMessages: '${deletedMessages}'`
      );
    }
    
    if (ticketTranscripts) {
      configContent = configContent.replace(
        /ticketTranscripts:\s*['"].*?['"]/,
        `ticketTranscripts: '${ticketTranscripts}'`
      );
    }
    
    if (commandUsage) {
      configContent = configContent.replace(
        /commandUsage:\s*['"].*?['"]/,
        `commandUsage: '${commandUsage}'`
      );
    }
    
    if (botStatus) {
      configContent = configContent.replace(
        /botStatus:\s*['"].*?['"]/,
        `botStatus: '${botStatus}'`
      );
    }
    
    // Update validation settings
    if (bountyMin) {
      configContent = configContent.replace(
        /bountyMin:\s*\d+/,
        `bountyMin: ${bountyMin}`
      );
    }
    
    if (bountyMax) {
      configContent = configContent.replace(
        /bountyMax:\s*\d+/,
        `bountyMax: ${bountyMax}`
      );
    }
    
    // Write updated config
    fs.writeFileSync(configPath, configContent);
    
    // Log the action
    console.log(`Bot settings updated by ${req.user.username} (${req.user.id})`);
    
    req.flash('success', 'Bot settings updated successfully. Restart the bot for changes to take effect.');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Error updating bot settings:', error);
    req.flash('error', 'Failed to update bot settings: ' + error.message);
    res.redirect('/admin/settings');
  }
});

/**
 * POST /admin/settings/send-message
 * Send a message as the bot to a specific channel
 */
router.post('/settings/send-message', (req, res) => {
  try {
    const { serverId, channelId, messageContent, embedMessage } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      req.flash('error', 'Discord client not available');
      return res.redirect('/admin/settings');
    }
    
    if (!serverId || !channelId || !messageContent) {
      req.flash('error', 'Server, channel, and message content are required');
      return res.redirect('/admin/settings');
    }
    
    // Get the guild and channel
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      req.flash('error', `Server with ID ${serverId} not found`);
      return res.redirect('/admin/settings');
    }
    
    const channel = guild.channels.cache.get(channelId);
    
    if (!channel) {
      req.flash('error', `Channel with ID ${channelId} not found`);
      return res.redirect('/admin/settings');
    }
    
    // Send the message
    if (embedMessage === 'on') {
      // Send as embed
      const { MessageEmbed } = require('discord.js');
      const embed = new MessageEmbed()
        .setDescription(messageContent)
        .setColor(config.embedColor || '#5865F2')
        .setTimestamp()
        .setFooter({ text: `Sent by ${req.user.username} via admin panel` });
      
      channel.send({ embeds: [embed] })
        .then(() => {
          req.flash('success', 'Message sent successfully as embed');
          res.redirect('/admin/settings');
        })
        .catch(error => {
          console.error('Error sending embed message:', error);
          req.flash('error', 'Failed to send message: ' + error.message);
          res.redirect('/admin/settings');
        });
    } else {
      // Send as regular message
      channel.send(messageContent)
        .then(() => {
          req.flash('success', 'Message sent successfully');
          res.redirect('/admin/settings');
        })
        .catch(error => {
          console.error('Error sending message:', error);
          req.flash('error', 'Failed to send message: ' + error.message);
          res.redirect('/admin/settings');
        });
    }
  } catch (error) {
    console.error('Error in message sending process:', error);
    req.flash('error', 'Error sending message: ' + error.message);
    res.redirect('/admin/settings');
  }
});

/**
 * POST /admin/settings/send-news
 * Send news update to configured channel (from Settings page)
 */
router.post('/settings/send-news', (req, res) => {
  const { newsTitle, newsContent, newsColor, newsImage } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    req.flash('error', 'Discord client not available');
    return res.redirect('/admin/settings');
  }
  
  if (!newsTitle || !newsContent) {
    req.flash('error', 'News title and content are required');
    return res.redirect('/admin/settings');
  }
  
  // Get news channel ID from config
  const newsChannelId = config.newsChannel;
  
  if (!newsChannelId) {
    req.flash('error', 'News channel not configured in config.js');
    return res.redirect('/admin/settings');
  }
  
  try {
    // Get the channel
    const channel = client.channels.cache.get(newsChannelId);
    
    if (!channel) {
      req.flash('error', `Channel with ID ${newsChannelId} not found`);
      return res.redirect('/admin/settings');
    }
    
    // Create embed
    const { MessageEmbed } = require('discord.js');
    const newsEmbed = new MessageEmbed()
      .setTitle(newsTitle)
      .setDescription(newsContent)
      .setColor(newsColor || '#5865F2')
      .setTimestamp()
      .setFooter({ text: `Posted by ${req.user.username}` });
    
    // Add image if provided
    if (newsImage) {
      newsEmbed.setImage(newsImage);
    }
    
    // Send message
    channel.send({ embeds: [newsEmbed] })
      .then(() => {
        req.flash('success', 'News update sent successfully!');
        res.redirect('/admin/settings');
      })
      .catch(error => {
        console.error('Error sending news update:', error);
        req.flash('error', 'Failed to send news update: ' + error.message);
        res.redirect('/admin/settings');
      });
  } catch (error) {
    console.error('Error in news sending process:', error);
    req.flash('error', 'Error sending news: ' + error.message);
    res.redirect('/admin/settings');
  }
});

/**
 * GET /admin/profile
 * User profile page
 */
router.get('/profile', (req, res) => {
  try {
    res.render('admin/profile', {
      title: 'Admin Profile | SWOOSH Bot',
      user: req.user,
      path: '/admin/profile',
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      },
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering profile page:', error);
    res.status(500).send('Error loading profile page: ' + error.message);
  }
});

/**
 * POST /admin/profile/update
 * Update user profile
 */
router.post('/profile/update', (req, res) => {
  try {
    // Profile update logic would go here
    // This is just a placeholder for now
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Failed to update profile: ' + error.message);
    res.redirect('/admin/profile');
  }
});

/**
 * GET /api/servers/:serverId/channels
 * Get channels for a server
 */
router.get('/api/servers/:serverId/channels', (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(500).json({ error: 'Discord client not available' });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Get text channels that the bot can access
    const channels = guild.channels.cache
      .filter(channel => 
        channel.type === 'GUILD_TEXT' && 
        channel.permissionsFor(guild.me).has('SEND_MESSAGES')
      )
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        position: channel.position,
        type: channel.type
      }))
      .sort((a, b) => a.position - b.position);
    
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels: ' + error.message });
  }
});

/**
 * Restart Bot API endpoint
 * POST /admin/api/bot/restart
 */
router.post('/api/bot/restart', (req, res) => {
  const client = req.app.get('client');
  
  if (!client) {
    return res.status(500).json({ success: false, message: 'Bot client not available' });
  }
  
  try {
    // Log restart attempt
    console.log(`Bot restart initiated by admin user: ${req.user.username} (${req.user.id})`);
    
    // Signal for bot restart - in a production environment, you might use process managers like PM2
    // For this demo, we'll just return success
    res.json({ success: true, message: 'Bot restart has been initiated' });
    
    // In a real implementation, you would restart the bot here
    // Example: process.exit() if using PM2 with --restart-delay
  } catch (error) {
    console.error('Error restarting bot:', error);
    res.status(500).json({ success: false, message: 'Failed to restart bot: ' + error.message });
  }
});

/**
 * Stop Bot API endpoint
 * POST /admin/api/bot/stop
 */
router.post('/api/bot/stop', (req, res) => {
  const client = req.app.get('client');
  
  if (!client) {
    return res.status(500).json({ success: false, message: 'Bot client not available' });
  }
  
  try {
    // Log stop attempt
    console.log(`Bot stop initiated by admin user: ${req.user.username} (${req.user.id})`);
    
    // In a real implementation, you would stop the bot here
    // For this demo, we'll just return success
    res.json({ success: true, message: 'Bot shutdown has been initiated' });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ success: false, message: 'Failed to stop bot: ' + error.message });
  }
});

/**
 * Start Bot API endpoint
 * POST /admin/api/bot/start
 */
router.post('/api/bot/start', (req, res) => {
  const client = req.app.get('client');
  
  if (!client) {
    return res.status(500).json({ success: false, message: 'Bot client not available' });
  }
  
  try {
    // Log start attempt
    console.log(`Bot start initiated by admin user: ${req.user.username} (${req.user.id})`);
    
    // In a real implementation, you would start the bot here
    // For this demo, we'll just return success
    res.json({ success: true, message: 'Bot startup has been initiated' });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({ success: false, message: 'Failed to start bot: ' + error.message });
  }
});

module.exports = router;