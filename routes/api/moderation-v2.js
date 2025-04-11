/**
 * SWOOSH BOT - Premium Administration Dashboard
 * Moderation API (V2) with improved reliability and error handling
 * 
 * This version focuses on enhanced error handling, session reliability and better
 * authentication and client-side interface integration. All routes return consistent
 * response structures and proper error handling.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Get references to required modules
let banLogger, logParser, executeQuery;
try {
  banLogger = require('../../modules/ban-logger');
  logParser = require('../../modules/log-parser');
  executeQuery = require('../../utils/database').executeQuery;
} catch (error) {
  console.error('Error loading modules for moderation-v2 API:', error);
}

/**
 * Authentication middleware specifically for the premium moderation API
 * Significantly enhanced version with better error handling and logging
 */
function isAdminV2(req, res, next) {
  // Start with authentication check logging
  console.log('Admin V2 Authentication check for:', req.originalUrl);
  
  // Check if session is initialized
  if (!req.session) {
    console.error('V2 Admin check failed: No session available');
    return res.status(401).json({
      success: false,
      message: 'Session not initialized',
      error: 'SESSION_MISSING',
      status: 401
    });
  }
  
  // Log session ID for debugging
  console.log('V2 Session ID:', req.session.id);
  
  // Check if isAuthenticated exists
  if (typeof req.isAuthenticated !== 'function') {
    console.error('V2 Admin check failed: isAuthenticated is not a function');
    return res.status(401).json({
      success: false,
      message: 'Authentication system not properly initialized',
      error: 'AUTH_FUNCTION_MISSING',
      status: 401
    });
  }
  
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    console.error('V2 Admin check failed: User not authenticated');
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED',
      status: 401,
      redirectTo: '/login'
    });
  }
  
  // Check if user object exists
  if (!req.user) {
    console.error('V2 Admin check failed: No user object in request');
    return res.status(401).json({
      success: false,
      message: 'User data not available',
      error: 'USER_MISSING',
      status: 401,
      redirectTo: '/login'
    });
  }
  
  // Log user info for debugging
  console.log('V2 User details:', {
    id: req.user.id,
    username: req.user.username || req.user.displayName,
    isAdmin: !!(req.user.isAdmin || req.user.is_admin)
  });
  
  // Check admin status
  if (!req.user.isAdmin && !req.user.is_admin) {
    console.error('V2 Admin check failed: User is not an admin');
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required',
      error: 'NOT_ADMIN',
      status: 403
    });
  }
  
  // Authentication successful
  console.log('V2 Admin authentication successful for user:', req.user.username || req.user.displayName);
  next();
}

// Apply the admin check middleware to all routes in this router
router.use(isAdminV2);

/**
 * GET /api/moderation-v2/servers
 * Get list of available servers
 */
router.get('/servers', (req, res) => {
  console.log('V2 Fetching servers list');
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available',
      error: 'CLIENT_MISSING',
      status: 503
    });
  }
  
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL({ dynamic: true }) || null,
      permissions: client.botHasPermissions(guild, [
        'BAN_MEMBERS', 
        'KICK_MEMBERS', 
        'MANAGE_MESSAGES'
      ])
    }));
    
    console.log(`V2 Found ${guilds.length} available servers`);
    
    return res.json({
      success: true,
      servers: guilds,
      total: guilds.length
    });
  } catch (error) {
    console.error('V2 Error fetching servers:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch servers: ${error.message}`,
      error: 'SERVER_FETCH_ERROR',
      status: 500
    });
  }
});

/**
 * GET /api/moderation-v2/bans/:serverId
 * Get list of banned users for a specific server
 */
router.get('/bans/:serverId', async (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`V2 Ban list request for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available',
      error: 'CLIENT_MISSING',
      status: 503
    });
  }
  
  if (!serverId) {
    return res.status(400).json({
      success: false,
      message: 'Server ID is required',
      error: 'MISSING_SERVER_ID',
      status: 400
    });
  }
  
  try {
    console.log(`V2 Fetching ban list for server ID: ${serverId}`);
    
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      console.log(`V2 Guild not found with ID: ${serverId}`);
      return res.json({
        success: false,
        message: 'Guild not found or bot does not have access',
        error: 'GUILD_NOT_FOUND',
        status: 404
      });
    }
    
    console.log(`V2 Found guild: ${guild.name}`);
    
    // Check if the bot has ban permissions - safely with error handling
    try {
      const botMember = guild.members.cache.get(client.user.id);
      if (botMember && !botMember.permissions.has('BAN_MEMBERS')) {
        console.log('V2 Bot does not have BAN_MEMBERS permission');
        return res.json({
          success: false,
          message: 'Bot does not have BAN_MEMBERS permission in this server',
          error: 'MISSING_PERMISSIONS',
          status: 403
        });
      }
    } catch (permError) {
      console.warn('V2 Error checking permissions:', permError);
      // Continue anyway - we'll attempt to fetch bans regardless
    }
    
    // Fetch actual bans from Discord API with error handling
    console.log('V2 Attempting to fetch bans from Discord API...');
    let bans;
    try {
      bans = await guild.bans.fetch();
      console.log(`V2 Successfully fetched ${bans.size} bans from Discord API`);
    } catch (fetchError) {
      console.error('V2 Error fetching bans from Discord API:', fetchError);
      // Return a partial response with just the error
      return res.status(fetchError.status || 500).json({
        success: false,
        message: `Error fetching bans: ${fetchError.message}`,
        error: 'BAN_FETCH_ERROR',
        status: fetchError.status || 500,
        errorCode: fetchError.code || 'UNKNOWN'
      });
    }
    
    // Get ban logs to enhance the ban data with additional information
    let allBanEvents = [];
    
    try {
      // Get guild-specific ban logs, with proper error handling
      if (banLogger && typeof banLogger.getBanLogs === 'function') {
        const banLogs = banLogger.getBanLogs(serverId);
        console.log(`V2 Retrieved ${banLogs?.length || 0} ban logs for server ${serverId}`);
        
        if (banLogs && Array.isArray(banLogs) && banLogs.length > 0 && 
            logParser && typeof logParser.extractBanEvents === 'function') {
          const banEvents = logParser.extractBanEvents(banLogs);
          allBanEvents = [...banEvents];
          console.log(`V2 Extracted ${banEvents?.length || 0} ban events from server logs`);
        } else {
          console.log('V2 No specific ban logs found for this server');
        }
        
        // Also get logs from the main bot log which might contain more ban events
        const botLogPath = path.join(banLogger.logsDir, 'bot-log.txt');
        
        // Add any additional ban events from the main log
        if (fs.existsSync(botLogPath) && typeof logParser.parseLogFile === 'function') {
          try {
            const botLogs = logParser.parseLogFile(botLogPath);
            const mainBanEvents = logParser.extractBanEvents(botLogs);
            console.log(`V2 Found ${mainBanEvents?.length || 0} ban events in main bot log`);
            
            // Only add events that aren't already included
            if (mainBanEvents && Array.isArray(mainBanEvents)) {
              mainBanEvents.forEach(event => {
                if (event && event.userId && 
                    !allBanEvents.some(existing => existing && existing.userId === event.userId)) {
                  allBanEvents.push(event);
                }
              });
            }
          } catch (mainLogError) {
            console.warn('V2 Could not process bot-log.txt:', mainLogError.message);
          }
        } else {
          console.log('V2 Main bot log file not found or parser not available');
        }
      } else {
        console.warn('V2 Ban logger module not available');
      }
    } catch (logError) {
      console.error('V2 Error processing ban logs:', logError);
      // Continue without ban logs - we'll still have the basic ban data from Discord API
    }
    
    // Map bans to a more detailed format
    const bannedUsers = [];
    bans.forEach(ban => {
      // Find matching log entry for this ban, with null checks
      const logEntry = allBanEvents && Array.isArray(allBanEvents) ? 
        allBanEvents.find(event => event && event.userId === ban.user.id) : null;
      
      const banInfo = {
        id: ban.user.id,
        username: ban.user.username || 'Unknown',
        tag: ban.user.tag || 'Unknown', 
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
    console.error('V2 Error fetching banned users:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch banned users: ${error.message}`,
      error: 'BAN_PROCESS_ERROR',
      status: 500
    });
  }
});

/**
 * POST /api/moderation-v2/unban
 * Unban a user from a server
 */
router.post('/unban', async (req, res) => {
  const client = req.app.get('client');
  const { serverId, userId } = req.body;
  
  console.log(`V2 Unban request for user ${userId} in server ${serverId} by ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available',
      error: 'CLIENT_MISSING',
      status: 503
    });
  }
  
  if (!serverId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Server ID and User ID are required',
      error: 'MISSING_PARAMETERS',
      status: 400
    });
  }
  
  try {
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Guild not found or bot does not have access',
        error: 'GUILD_NOT_FOUND',
        status: 404
      });
    }
    
    // Attempt to unban the user
    await guild.members.unban(userId, `Unbanned by ${req.user.username || req.user.displayName} via Admin Dashboard`);
    
    console.log(`V2 Successfully unbanned user ${userId} from ${guild.name}`);
    
    // Log this action
    if (banLogger && typeof banLogger.logUnban === 'function') {
      banLogger.logUnban(serverId, userId, {
        executorId: req.user.id,
        executorName: req.user.username || req.user.displayName,
        reason: `Unbanned by ${req.user.username || req.user.displayName} via Admin Dashboard`
      });
    }
    
    return res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('V2 Error unbanning user:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to unban user: ${error.message}`,
      error: 'UNBAN_ERROR',
      status: error.status || 500,
      errorCode: error.code || 'UNKNOWN'
    });
  }
});

/**
 * GET /api/moderation-v2/warnings/:serverId
 * Get list of warned users for a specific server
 */
router.get('/warnings/:serverId', async (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`V2 Warnings list request for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available',
      error: 'CLIENT_MISSING',
      status: 503
    });
  }
  
  if (!serverId) {
    return res.status(400).json({
      success: false,
      message: 'Server ID is required',
      error: 'MISSING_SERVER_ID',
      status: 400
    });
  }
  
  try {
    // Check if Discord database is initialized (with fallback)
    if (!client.discordDB || !client.discordDB.initialized) {
      console.warn('V2 Discord database not initialized for warnings endpoint');
      // Return empty array instead of error to allow UI to still function
      return res.json({
        success: true,
        warnings: [],
        total: 0,
        message: 'Discord database not available, returning empty warnings list'
      });
    }
    
    // Get warnings from Discord database for the server (with error handling)
    let warnings = [];
    try {
      warnings = client.discordDB.findDocuments('warnings', (doc) => {
        return doc.guildId === serverId;
      }) || [];
    } catch (findError) {
      console.error(`V2 Error finding warnings for server ${serverId}:`, findError);
      // Continue with empty warnings array rather than failing completely
    }
    
    // If no warnings are found, return an empty array
    if (!warnings || warnings.length === 0) {
      return res.json({
        success: true,
        warnings: [],
        total: 0
      });
    }
    
    // Enhance the warnings with more data
    const enhancedWarnings = [];
    for (const warning of warnings) {
      try {
        // Create an enhanced warning object with user data if possible
        const enhancedWarning = {
          ...warning,
          username: 'Unknown User'
        };
        
        // Try to get user data from Discord
        try {
          const guild = client.guilds.cache.get(serverId);
          if (guild) {
            const member = await guild.members.fetch(warning.userId).catch(() => null);
            if (member) {
              enhancedWarning.username = member.user.username || member.user.tag;
              enhancedWarning.avatarURL = member.user.displayAvatarURL({ dynamic: true });
            }
          }
        } catch (userError) {
          console.warn(`V2 Could not fetch user ${warning.userId} data:`, userError.message);
        }
        
        // Add to the enhanced warnings
        enhancedWarnings.push(enhancedWarning);
      } catch (enhanceError) {
        console.error(`V2 Error enhancing warning ${warning.id}:`, enhanceError);
        // Add the original warning as a fallback
        enhancedWarnings.push(warning);
      }
    }
    
    // Sort by date (newest first)
    enhancedWarnings.sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
    
    return res.json({
      success: true,
      warnings: enhancedWarnings,
      total: enhancedWarnings.length
    });
  } catch (error) {
    console.error('V2 Error fetching warnings:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch warnings: ${error.message}`,
      error: 'WARNING_FETCH_ERROR',
      status: 500
    });
  }
});

/**
 * GET /api/moderation-v2/history/:serverId
 * Get moderation history for a specific server
 */
router.get('/history/:serverId', async (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  console.log(`V2 Moderation history request for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available',
      error: 'CLIENT_MISSING',
      status: 503
    });
  }
  
  if (!serverId) {
    return res.status(400).json({
      success: false,
      message: 'Server ID is required',
      error: 'MISSING_SERVER_ID',
      status: 400
    });
  }
  
  try {
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Guild not found or bot does not have access',
        error: 'GUILD_NOT_FOUND',
        status: 404
      });
    }
    
    // Start with empty arrays for both ban and mod logs
    let banLogEntries = [];
    let modLogEntries = [];
    
    // Process ban logs if available
    try {
      if (banLogger && typeof banLogger.getBanLogs === 'function') {
        const banLogs = banLogger.getBanLogs(serverId);
        
        if (!banLogs || !Array.isArray(banLogs) || banLogs.length === 0) {
          console.log(`V2 No ban log file exists for guild ${serverId}`);
        } else if (logParser && typeof logParser.extractBanEvents === 'function') {
          banLogEntries = logParser.extractBanEvents(banLogs) || [];
          console.log(`V2 Found ${banLogEntries.length} ban log entries for server ${serverId}`);
        } else {
          console.warn('V2 Log parser module not available');
        }
      } else {
        console.warn('V2 Ban logger module not available');
      }
    } catch (banLogError) {
      console.error(`V2 Error processing ban logs for server ${serverId}:`, banLogError);
      // Continue with empty ban logs
    }
    
    // Process moderation logs if available
    try {
      if (client.logManager && typeof client.logManager.getModerationLog === 'function') {
        const modLogs = client.logManager.getModerationLog(serverId);
        
        if (!modLogs || !Array.isArray(modLogs) || modLogs.length === 0) {
          console.log(`V2 No moderation log file exists for guild ${serverId}`);
        } else {
          modLogEntries = modLogs;
          console.log(`V2 Found ${modLogEntries.length} moderation log entries for server ${serverId}`);
        }
      } else {
        console.warn('V2 Log manager module not available');
      }
    } catch (modLogError) {
      console.error(`V2 Error processing mod logs for server ${serverId}:`, modLogError);
      // Continue with empty mod logs
    }
    
    // Combine and format the log entries
    const allLogs = [
      // Format ban log entries
      ...banLogEntries.map(entry => ({
        type: 'ban',
        userId: entry.userId,
        username: entry.username || 'Unknown User',
        actionAt: entry.date ? entry.date.toISOString() : new Date().toISOString(),
        reason: entry.reason || 'No reason provided',
        executorId: entry.executorId,
        executorName: entry.executorName || 'Unknown',
        details: entry.details || {}
      })),
      
      // Format mod log entries
      ...modLogEntries.map(entry => ({
        type: entry.type || 'action',
        userId: entry.userId,
        username: entry.username || 'Unknown User',
        actionAt: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString(),
        reason: entry.reason || 'No reason provided',
        executorId: entry.executorId,
        executorName: entry.executorName || 'Unknown',
        details: entry.details || {}
      }))
    ];
    
    // Sort by date (newest first)
    allLogs.sort((a, b) => new Date(b.actionAt) - new Date(a.actionAt));
    
    return res.json({
      success: true,
      history: allLogs,
      total: allLogs.length
    });
  } catch (error) {
    console.error('V2 Error fetching moderation history:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch moderation history: ${error.message}`,
      error: 'HISTORY_FETCH_ERROR',
      status: 500
    });
  }
});

module.exports = router;