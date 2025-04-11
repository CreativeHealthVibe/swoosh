/**
 * Moderation API Routes
 * Handles moderation actions like bans, warnings, and auto-moderation
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const banLogger = require('../../modules/ban-logger');
const logParser = require('../../modules/log-parser');
const path = require('path');
const fs = require('fs');

// Apply admin authentication middleware to all routes
// This ensures all endpoints require authentication
router.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.originalUrl}, Auth state: ${req.isAuthenticated()}`);
  
  // Call the isAdmin middleware
  isAdmin(req, res, next);
});

/**
 * POST /api/moderation/ban
 * Ban a user from a server
 */
router.post('/ban', async (req, res) => {
  const { userId, banReason, banDuration, deleteMessages, addToBlacklist } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!userId) {
    return res.json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  try {
    // Get the server ID from the request body
    const { serverId } = req.body;
    
    if (!serverId) {
      return res.json({
        success: false,
        message: 'Server ID is required'
      });
    }
    
    console.log(`Ban request received for user ${userId} in server ${serverId} with reason: ${banReason}`);
    console.log(`Ban duration: ${banDuration}, Delete messages: ${deleteMessages}, Add to blacklist: ${addToBlacklist}`);
    
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Guild not found or bot does not have access'
      });
    }
    
    // Check permissions
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember || !botMember.permissions.has('BAN_MEMBERS')) {
      return res.json({
        success: false,
        message: 'Bot does not have BAN_MEMBERS permission in this server'
      });
    }
    
    // Try to ban the user
    const deleteMessageSeconds = deleteMessages ? 60 * 60 * 24 * 7 : 0; // 7 days if true, 0 if false
    const fullReason = `${banReason} | Banned by: ${req.user.username || req.user.displayName || 'Admin'}`;
    
    await guild.members.ban(userId, {
      deleteMessageSeconds,
      reason: fullReason
    });
    
    // Log the ban using the ban logger
    banLogger.logBan({
      serverId,
      userId,
      reason: banReason,
      executor: {
        id: req.user.id || 'ADMIN_PANEL',
        name: req.user.username || req.user.displayName || 'Admin Panel',
        discriminator: req.user.discriminator || '0000'
      },
      duration: banDuration === 'permanent' ? null : banDuration
    });
    
    // Add to blacklist if requested
    if (addToBlacklist === 'true' || addToBlacklist === true) {
      try {
        // Use the blacklist manager to add the user to the blacklist
        const blacklistManager = require('../../handlers/blacklistManager');
        await blacklistManager.addToBlacklist(userId, banReason, 'global', req.user.id);
        console.log(`Added user ${userId} to blacklist`);
      } catch (blacklistError) {
        console.error('Error adding user to blacklist:', blacklistError);
        // Continue execution, as the ban was successful even if blacklisting failed
      }
    }
    
    return res.json({
      success: true,
      message: `User ${userId} has been banned successfully`
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return res.json({
      success: false,
      message: `Failed to ban user: ${error.message}`
    });
  }
});

/**
 * POST /api/moderation/warn
 * Issue a warning to a user
 */
router.post('/warn', async (req, res) => {
  const { warnUserId, warnReason, warningSeverity, warningDuration, notifyUser } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!warnUserId || !warnReason) {
    return res.json({
      success: false,
      message: 'User ID and reason are required'
    });
  }
  
  try {
    // Get the server ID from the request body
    const { serverId } = req.body;
    
    if (!serverId) {
      return res.json({
        success: false,
        message: 'Server ID is required'
      });
    }
    
    console.log(`Warning request received for user ${warnUserId} in server ${serverId} with reason: ${warnReason}`);
    console.log(`Severity: ${warningSeverity}, Duration: ${warningDuration}, Notify user: ${notifyUser}`);
    
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Guild not found or bot does not have access'
      });
    }
    
    // Validate user ID format
    if (!/^\d{17,19}$/.test(warnUserId)) {
      return res.json({
        success: false,
        message: 'Invalid Discord user ID format'
      });
    }
    
    // Check if Discord database is initialized
    if (!client.discordDB || !client.discordDB.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Discord database not initialized'
      });
    }
    
    // Generate warning ID
    const warningId = `warning_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Calculate expiration date if not permanent
    let expiresAt = null;
    if (warningDuration && warningDuration !== 'permanent') {
      expiresAt = new Date();
      
      // Parse duration
      const value = parseInt(warningDuration.slice(0, -1));
      const unit = warningDuration.slice(-1);
      
      switch (unit) {
        case 'd': // Days
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'w': // Weeks
          expiresAt.setDate(expiresAt.getDate() + (value * 7));
          break;
        case 'm': // Months
          expiresAt.setMonth(expiresAt.getMonth() + value);
          break;
        default:
          // Default to 30 days if format is unknown
          expiresAt.setDate(expiresAt.getDate() + 30);
      }
    }
    
    // Create warning document
    const warningDoc = {
      id: warningId,
      userId: warnUserId,
      guildId: serverId,
      reason: warnReason,
      severity: warningSeverity || 'medium',
      issuedBy: req.user.username || req.user.displayName || 'Admin Panel',
      issuedById: req.user.id || 'ADMIN_PANEL',
      timestamp: new Date().toISOString(),
      expires: expiresAt ? expiresAt.toISOString() : null
    };
    
    // Save to database
    await client.discordDB.setDocument('warnings', warningId, warningDoc);
    
    // Try to notify the user if requested
    let notificationSent = false;
    if (notifyUser === 'true' || notifyUser === true) {
      try {
        // Try to fetch the user
        const user = await client.users.fetch(warnUserId).catch(() => null);
        
        if (user) {
          // Create the warning embed
          const embed = {
            title: 'Warning Notification',
            description: `You have received a warning in **${guild.name}**`,
            color: 0xffcc00, // Yellow/orange color for warnings
            fields: [
              {
                name: 'Reason',
                value: warnReason || 'No reason provided'
              },
              {
                name: 'Severity',
                value: warningSeverity.charAt(0).toUpperCase() + warningSeverity.slice(1) || 'Medium'
              }
            ],
            timestamp: new Date(),
            footer: {
              text: `Warning ID: ${warningId}`
            }
          };
          
          // Add expiration field if not permanent
          if (expiresAt) {
            embed.fields.push({
              name: 'Expires',
              value: expiresAt.toLocaleDateString()
            });
          }
          
          // Send the DM
          await user.send({ embeds: [embed] });
          notificationSent = true;
        }
      } catch (dmError) {
        console.error(`Failed to send warning DM to user ${warnUserId}:`, dmError);
        // Continue execution even if notification fails
      }
    }
    
    // Log the warning in the moderation log
    try {
      const logMessage = `Warning issued to user ${warnUserId} - Severity: ${warningSeverity}, Reason: ${warnReason}`;
      const logPath = path.join(banLogger.logsDir, `mod-log-${serverId}.txt`);
      
      // Ensure directory exists
      const logsDir = path.dirname(logPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Format log entry
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] WARNING: ${logMessage}\n`;
      
      // Append to log file
      fs.appendFileSync(logPath, logEntry);
    } catch (logError) {
      console.error('Error writing to warning log:', logError);
      // Continue execution even if logging fails
    }
    
    return res.json({
      success: true,
      message: `Warning issued to user ${warnUserId} successfully`,
      warningId,
      notified: notificationSent
    });
  } catch (error) {
    console.error('Error warning user:', error);
    return res.json({
      success: false,
      message: `Failed to warn user: ${error.message}`
    });
  }
});

/**
 * POST /api/moderation/automod
 * Save auto-moderation settings
 */
/**
 * GET /api/moderation/automod/:serverId
 * Get auto-moderation settings for a specific server
 */
router.get('/automod/:serverId', async (req, res) => {
  // First, check if user is authenticated and admin
  if (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.is_admin)) {
    console.error('Attempt to access automod settings without authentication or admin privileges');
    return res.status(403).json({
      success: false,
      message: 'Authentication failed. Admin privileges required.'
    });
  }

  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`Automod settings GET request received for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    // Check for server ID
    if (!serverId) {
      return res.status(400).json({
        success: false,
        message: 'Server ID is required'
      });
    }

    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false, 
        message: 'Guild not found or bot does not have access'
      });
    }
    
    // Get automod settings from client database
    // If database has no settings, return defaults
    let automodSettings = {};
    
    if (client.discordDB && client.discordDB.initialized) {
      // Look for settings in database
      const settings = client.discordDB.findDocuments('configs', (doc) => {
        return doc.guildId === serverId && doc.type === 'automod';
      });
      
      if (settings && settings.length > 0) {
        automodSettings = settings[0];
      }
    }
    
    // If no settings found, use defaults
    const defaultSettings = {
      filterProfanity: true,
      profanityAction: 'delete',
      profanityThreshold: 'medium',
      filterLinks: true,
      filterSpam: true,
      spamThreshold: 5,
      spamAction: 'mute',
      antiRaid: false,
      raidThreshold: 10,
      raidAction: 'lockdown',
      raidDuration: '30m',
      logActions: true,
      notifyUsers: true
    };
    
    // Merge defaults with found settings
    const finalSettings = { ...defaultSettings, ...automodSettings };
    
    return res.json({
      success: true,
      settings: finalSettings
    });
    
  } catch (error) {
    console.error(`Error fetching automod settings: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Error fetching automod settings: ${error.message}`
    });
  }
});

/**
 * POST /api/moderation/automod
 * Save auto-moderation settings
 */
router.post('/automod', async (req, res) => {
  // Check authentication - using the isAdmin middleware
  // This should already be applied by router.use(isAdmin) at the top of the file
  if (!req.user) {
    console.error('Attempt to save automod settings without authentication');
    return res.status(403).json({
      success: false,
      message: 'Authentication failed. Please log in.'
    });
  }
  
  // Log the authentication details for debugging
  console.log('Authentication check passed for automod settings API', {
    userId: req.user.id,
    username: req.user.username || req.user.displayName,
    isAdmin: req.user.isAdmin || req.user.is_admin
  });
  
  const { serverId, filterProfanity, profanityAction, profanityThreshold, 
          filterLinks, filterSpam, spamThreshold, spamAction,
          antiRaid, raidThreshold, raidAction, raidDuration } = req.body;
  const client = req.app.get('client');
  
  console.log(`Automod settings POST request received for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!serverId) {
    return res.status(400).json({
      success: false,
      message: 'Server ID is required'
    });
  }
  
  try {
    // Get the guild from the client to validate
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false, 
        message: 'Guild not found or bot does not have access'
      });
    }
    
    console.log(`Auto-mod settings received for server ${serverId}`);
    console.log('Filter settings:', { 
      filterProfanity, profanityAction, profanityThreshold,
      filterLinks, filterSpam, spamThreshold, spamAction,
      antiRaid, raidThreshold, raidAction, raidDuration
    });
    
    // Save settings to database if available
    if (client.discordDB && client.discordDB.initialized) {
      // Prepare settings object
      const settings = {
        guildId: serverId,
        type: 'automod',
        filterProfanity: filterProfanity === true || filterProfanity === 'true',
        profanityAction: profanityAction || 'delete',
        profanityThreshold: profanityThreshold || 'medium',
        filterLinks: filterLinks === true || filterLinks === 'true',
        filterSpam: filterSpam === true || filterSpam === 'true',
        spamThreshold: parseInt(spamThreshold) || 5,
        spamAction: spamAction || 'mute',
        antiRaid: antiRaid === true || antiRaid === 'true',
        raidThreshold: parseInt(raidThreshold) || 10,
        raidAction: raidAction || 'lockdown',
        raidDuration: raidDuration || '30m',
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id || req.user.userId || 'admin'
      };
      
      // Find existing settings
      const existingSettings = client.discordDB.findDocuments('configs', (doc) => {
        return doc.guildId === serverId && doc.type === 'automod';
      });
      
      if (existingSettings && existingSettings.length > 0) {
        // Update existing
        client.discordDB.updateDocument('configs', existingSettings[0].id, settings);
        console.log(`Updated existing automod settings for ${serverId}`);
      } else {
        // Create new
        settings.id = `automod-${serverId}-${Date.now()}`;
        settings.createdAt = new Date().toISOString();
        client.discordDB.insertDocument('configs', settings);
        console.log(`Created new automod settings for ${serverId}`);
      }
      
      // Successfully saved to database
      return res.json({
        success: true,
        message: 'Auto-moderation settings saved successfully to database'
      });
    } else {
      // Database not available, but we'll still return success
      // In a production environment, you might want to handle this differently
      console.log('Auto-mod settings could not be saved: Database not available');
      return res.json({
        success: true,
        message: 'Auto-moderation settings processed (but database unavailable for persistence)'
      });
    }
  } catch (error) {
    console.error('Error saving auto-mod settings:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to save settings: ${error.message}`
    });
  }
});

/**
 * GET /api/moderation/bans/:serverId
 * Get list of banned users for a specific server
 */
router.get('/bans/:serverId', async (req, res) => {
  // Check authentication - using the isAdmin middleware
  // This should already be applied by router.use(isAdmin) at the top of the file
  // Added additional check to provide clear error message
  if (!req.user) {
    console.error('Attempt to access ban list without authentication');
    return res.status(403).json({
      success: false,
      message: 'Authentication failed. Please log in.'
    });
  }
  
  // Log the authentication details for debugging
  console.log('Authentication check passed for ban list API', {
    userId: req.user.id,
    username: req.user.username || req.user.displayName,
    isAdmin: req.user.isAdmin || req.user.is_admin
  });
  
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`Ban list request received for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!serverId) {
    return res.json({
      success: false,
      message: 'Server ID is required'
    });
  }
  
  try {
    console.log(`Fetching ban list for server ID: ${serverId}`);
    
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      console.log(`Guild not found with ID: ${serverId}`);
      return res.json({
        success: false,
        message: 'Guild not found or bot does not have access'
      });
    }
    
    console.log(`Found guild: ${guild.name}`);
    
    // Check if the bot has ban permissions - safely with error handling
    try {
      const botMember = guild.members.cache.get(client.user.id);
      if (botMember && !botMember.permissions.has('BAN_MEMBERS')) {
        console.log('Bot does not have BAN_MEMBERS permission');
        return res.json({
          success: false,
          message: 'Bot does not have BAN_MEMBERS permission in this server'
        });
      }
    } catch (permError) {
      console.error('Error checking permissions:', permError);
      // Continue anyway - we'll attempt to fetch bans regardless
    }
    
    // Fetch actual bans from Discord API with error handling
    console.log('Attempting to fetch bans from Discord API...');
    let bans;
    try {
      bans = await guild.bans.fetch();
      console.log(`Successfully fetched ${bans.size} bans from Discord API`);
    } catch (fetchError) {
      console.error('Error fetching bans from Discord API:', fetchError);
      // Return a partial response with just the error
      return res.json({
        success: false,
        message: `Error fetching bans: ${fetchError.message}`,
        errorCode: fetchError.code || 'UNKNOWN'
      });
    }
    
    // Get ban logs to enhance the ban data
    const banLogs = banLogger.getBanLogs(serverId);
    const banEvents = logParser.extractBanEvents(banLogs);
    
    // Also get logs from the main bot log which might contain more ban events
    const botLogPath = path.join(banLogger.logsDir, 'bot-log.txt');
    let allBanEvents = [...banEvents]; // Start with guild-specific logs
    
    // Add any additional ban events from the main log
    if (fs.existsSync(botLogPath)) {
      try {
        const botLogs = logParser.parseLogFile(botLogPath);
        const mainBanEvents = logParser.extractBanEvents(botLogs);
        // Only add events that aren't already included
        mainBanEvents.forEach(event => {
          if (!allBanEvents.some(existing => existing.userId === event.userId)) {
            allBanEvents.push(event);
          }
        });
      } catch (error) {
        console.warn('Could not process bot-log.txt:', error.message);
      }
    }
    
    // Map bans to a more detailed format
    const bannedUsers = [];
    bans.forEach(ban => {
      // Find matching log entry for this ban
      const logEntry = allBanEvents.find(event => event.userId === ban.user.id);
      
      const banInfo = {
        id: ban.user.id,
        username: ban.user.username,
        tag: ban.user.tag, 
        avatarURL: ban.user.displayAvatarURL({ dynamic: true }),
        reason: ban.reason || 'No reason provided',
        permanent: true // Default to permanent since Discord doesn't store duration
      };
      
      // Add extra data from logs if available
      if (logEntry) {
        banInfo.bannedBy = logEntry.executorName;
        banInfo.bannedAt = logEntry.date.toISOString();
        
        // Check if there's duration info in the details
        if (logEntry.details && logEntry.details.duration) {
          banInfo.permanent = false;
          banInfo.duration = logEntry.details.duration;
        }
      } else {
        // For bans without log entries, set default values
        banInfo.bannedAt = new Date().toISOString();
        banInfo.bannedBy = 'Unknown';
      }
      
      // Ensure all bans are displayed regardless of log availability
      bannedUsers.push(banInfo);
    });
    
    // Sort by date (newest first)
    bannedUsers.sort((a, b) => new Date(b.bannedAt) - new Date(a.bannedAt));
    
    return res.json({
      success: true,
      bans: bannedUsers,
      total: bannedUsers.length
    });
  } catch (error) {
    console.error('Error fetching banned users:', error);
    return res.json({
      success: false,
      message: `Failed to fetch banned users: ${error.message}`
    });
  }
});

/**
 * GET /api/moderation/warnings/:serverId
 * Get list of warned users for a specific server
 */
router.get('/warnings/:serverId', async (req, res) => {
  // Check authentication - using the isAdmin middleware
  // This should already be applied by router.use(isAdmin) at the top of the file
  if (!req.user) {
    console.error('Attempt to access warnings list without authentication');
    return res.status(403).json({
      success: false,
      message: 'Authentication failed. Please log in.'
    });
  }
  
  // Log the authentication details for debugging
  console.log('Authentication check passed for warnings list API', {
    userId: req.user.id,
    username: req.user.username || req.user.displayName,
    isAdmin: req.user.isAdmin || req.user.is_admin
  });
  
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`Warnings list request received for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!serverId) {
    return res.json({
      success: false,
      message: 'Server ID is required'
    });
  }
  
  try {
    // Check if Discord database is initialized
    if (!client.discordDB || !client.discordDB.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Discord database not initialized'
      });
    }
    
    // Get warnings from Discord database for the server
    const warnings = client.discordDB.findDocuments('warnings', (doc) => {
      return doc.guildId === serverId;
    });
    
    // If no warnings are found, return an empty array
    if (!warnings || warnings.length === 0) {
      return res.json({
        success: true,
        warnings: [],
        total: 0
      });
    }
    
    // Enhance the warnings with more data
    const enhancedWarnings = await Promise.all(warnings.map(async (warning) => {
      // Default values
      let username = 'Unknown User';
      let avatarURL = 'https://cdn.discordapp.com/embed/avatars/0.png';
      
      // Try to get user data from the Discord API
      try {
        if (warning.userId) {
          const guild = client.guilds.cache.get(serverId);
          if (guild) {
            try {
              const member = await guild.members.fetch(warning.userId).catch(() => null);
              if (member) {
                username = member.user.username;
                avatarURL = member.user.displayAvatarURL({ dynamic: true });
              } else {
                // Try to fetch from user cache if not in guild
                const user = await client.users.fetch(warning.userId).catch(() => null);
                if (user) {
                  username = user.username;
                  avatarURL = user.displayAvatarURL({ dynamic: true });
                }
              }
            } catch (error) {
              console.error(`Error fetching user data for warning ${warning.id}:`, error);
            }
          }
        }
      } catch (userError) {
        console.error(`Error processing user for warning ${warning.id}:`, userError);
      }
      
      // Format the warning for response
      const formattedWarning = {
        id: warning.id,
        userId: warning.userId,
        username: username,
        avatarURL: avatarURL,
        reason: warning.reason || 'No reason provided',
        severity: warning.severity || 'medium',
        issuedBy: warning.issuedBy || 'System',
        issuedAt: warning.timestamp || new Date().toISOString()
      };
      
      // Add expiration if it exists
      if (warning.expires) {
        const expiryDate = new Date(warning.expires);
        formattedWarning.expires = expiryDate.toISOString();
        
        // Check if warning is expired
        const now = new Date();
        formattedWarning.status = now > expiryDate ? 'Expired' : 'Active';
      } else {
        formattedWarning.status = 'Active';
      }
      
      return formattedWarning;
    }));
    
    // Sort warnings by date (newest first)
    enhancedWarnings.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
    
    return res.json({
      success: true,
      warnings: enhancedWarnings,
      total: enhancedWarnings.length
    });
  } catch (error) {
    console.error('Error fetching warnings:', error);
    return res.json({
      success: false,
      message: `Failed to fetch warnings: ${error.message}`
    });
  }
});

/**
 * GET /api/moderation/history/:serverId
 * Get moderation action history for a specific server
 */
router.get('/history/:serverId', async (req, res) => {
  // Check authentication - using the isAdmin middleware
  // This should already be applied by router.use(isAdmin) at the top of the file
  if (!req.user) {
    console.error('Attempt to access moderation history without authentication');
    return res.status(403).json({
      success: false,
      message: 'Authentication failed. Please log in.'
    });
  }
  
  // Log the authentication details for debugging
  console.log('Authentication check passed for moderation history API', {
    userId: req.user.id,
    username: req.user.username || req.user.displayName,
    isAdmin: req.user.isAdmin || req.user.is_admin
  });
  
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`Moderation history request received for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!serverId) {
    return res.json({
      success: false,
      message: 'Server ID is required'
    });
  }
  
  try {
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Guild not found or bot does not have access'
      });
    }
    
    // Read logs from various sources
    const logs = [];
    
    // Check for ban logs
    const banLogs = banLogger.getBanLogs(serverId);
    if (banLogs && banLogs.length > 0) {
      // Extract ban/unban events
      const banEvents = logParser.extractBanEvents(banLogs);
      
      // Format and add to logs
      banEvents.forEach(event => {
        logs.push({
          id: `ban-${event.userId}-${event.date.getTime()}`,
          type: event.eventType === 'ban' ? 'ban' : 'unban',
          userId: event.userId,
          username: event.userName || 'Unknown User',
          reason: event.details && event.details.reason ? event.details.reason : 'No reason provided',
          actionBy: event.executorName || 'System',
          actionAt: event.date.toISOString(),
          guild: guild.name,
          guildId: serverId
        });
      });
    }
    
    // Add data from general moderation logs
    const modLogsPath = path.join(banLogger.logsDir, `mod-log-${serverId}.txt`);
    if (fs.existsSync(modLogsPath)) {
      const modLogs = logParser.parseLogFile(modLogsPath);
      
      // Format and add to logs
      modLogs.forEach(log => {
        // Try to determine the event type
        let type = 'other';
        if (log.eventType === 'User Kicked') type = 'kick';
        if (log.eventType === 'User Muted') type = 'mute';
        if (log.eventType === 'User Unmuted') type = 'unmute';
        if (log.eventType === 'Message Deleted') type = 'message-delete';
        if (log.eventType === 'Warning Issued') type = 'warning';
        
        const userId = log.user ? log.user.id : null;
        
        // Only add if we have a user ID
        if (userId) {
          logs.push({
            id: `${type}-${userId}-${log.date.getTime()}`,
            type: type,
            userId: userId,
            username: log.user.name || 'Unknown User',
            reason: log.details && log.details.reason ? log.details.reason : 'No reason provided',
            actionBy: log.executor ? log.executor.name : 'System',
            actionAt: log.date.toISOString(),
            guild: guild.name,
            guildId: serverId,
            details: log.details
          });
        }
      });
    }
    
    // Check for warnings in the Discord database
    if (client.discordDB && client.discordDB.initialized) {
      const warnings = client.discordDB.findDocuments('warnings', (doc) => {
        return doc.guildId === serverId;
      });
      
      // Add warnings to the history
      if (warnings && warnings.length > 0) {
        warnings.forEach(warning => {
          logs.push({
            id: warning.id || `warning-${warning.userId}-${new Date(warning.timestamp).getTime()}`,
            type: 'warning',
            userId: warning.userId,
            username: warning.username || 'Unknown User',
            reason: warning.reason || 'No reason provided',
            actionBy: warning.issuedBy || 'System',
            actionAt: warning.timestamp || new Date().toISOString(),
            guild: guild.name,
            guildId: serverId,
            severity: warning.severity || 'medium',
            expires: warning.expires || null
          });
        });
      }
    }
    
    // Sort all logs by date (newest first)
    logs.sort((a, b) => new Date(b.actionAt) - new Date(a.actionAt));
    
    return res.json({
      success: true,
      history: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error fetching moderation history:', error);
    return res.json({
      success: false,
      message: `Failed to fetch moderation history: ${error.message}`
    });
  }
});

module.exports = router;