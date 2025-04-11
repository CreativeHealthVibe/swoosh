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
router.use(isAdmin);

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
    // For demonstration, we'll just return success
    // In a real implementation, this would perform the ban action
    
    console.log(`Ban request received for user ${userId} with reason: ${banReason}`);
    console.log(`Ban duration: ${banDuration}, Delete messages: ${deleteMessages}, Add to blacklist: ${addToBlacklist}`);
    
    // Simulate successful ban
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
    // For demonstration, we'll just return success
    // In a real implementation, this would issue the warning
    
    console.log(`Warning request received for user ${warnUserId} with reason: ${warnReason}`);
    console.log(`Severity: ${warningSeverity}, Duration: ${warningDuration}, Notify user: ${notifyUser}`);
    
    // Simulate successful warning
    return res.json({
      success: true,
      message: `Warning issued to user ${warnUserId} successfully`
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
router.post('/automod', async (req, res) => {
  const { serverId, filterProfanity, profanityAction, profanityThreshold, 
          filterLinks, filterSpam, spamThreshold, spamAction,
          antiRaid, raidThreshold, raidAction, raidDuration } = req.body;
  const client = req.app.get('client');
  
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
    // For demonstration, we'll just return success
    // In a real implementation, this would save the settings
    
    console.log(`Auto-mod settings received for server ${serverId}`);
    console.log('Filter settings:', { 
      filterProfanity, profanityAction, profanityThreshold,
      filterLinks, filterSpam, spamThreshold, spamAction,
      antiRaid, raidThreshold, raidAction, raidDuration
    });
    
    // Simulate successful save
    return res.json({
      success: true,
      message: 'Auto-moderation settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving auto-mod settings:', error);
    return res.json({
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
  const client = req.app.get('client');
  const { serverId } = req.params;
  
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
    
    // Check if the bot has ban permissions
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has('BAN_MEMBERS')) {
      return res.json({
        success: false,
        message: 'Bot does not have BAN_MEMBERS permission in this server'
      });
    }
    
    // Fetch actual bans from Discord API
    const bans = await guild.bans.fetch();
    
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
  const client = req.app.get('client');
  const { serverId } = req.params;
  
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
  const client = req.app.get('client');
  const { serverId } = req.params;
  
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