/**
 * Direct Ban List Access Routes
 * Alternative routes for accessing ban data with less authentication complexity
 * This is a workaround for issues with the standard API approach
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const path = require('path');
const fs = require('fs');

// Get references to required modules
let banLogger, logParser;
try {
  banLogger = require('../../modules/ban-logger');
  logParser = require('../../modules/log-parser');
} catch (error) {
  console.error('Error loading modules for direct-ban-routes:', error);
}

// Apply admin middleware
router.use(isAdmin);

/**
 * Direct Ban List Access Page
 * GET /admin3d/direct-bans
 */
router.get('/direct-bans', (req, res) => {
  // Get the Discord client from the app
  const client = req.app.get('client');
  
  if (!client) {
    return res.render('admin3d/error', {
      message: 'Discord client not available',
      error: { status: 503, stack: 'Bot client is not initialized' }
    });
  }
  
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL({ dynamic: true }) || null
    }));
    
    // Render the direct ban access page
    return res.render('admin3d/direct-ban-access', {
      servers: guilds,
      user: req.user,
      totalServers: guilds.length,
      title: 'Direct Ban Access',
      csrf: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error rendering direct ban access page:', error);
    return res.render('admin3d/error', {
      message: 'Failed to load direct ban access page',
      error: { status: 500, stack: error.stack }
    });
  }
});

/**
 * Direct Ban Fetch Handler (POST version)
 * POST /admin3d/direct-ban-fetch
 */
router.post('/direct-ban-fetch', async (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.body;
  
  console.log(`Direct ban fetch request (POST) for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.render('admin3d/error', {
      message: 'Discord client not available',
      error: { status: 503, stack: 'Bot client is not initialized' }
    });
  }
  
  if (!serverId) {
    return res.render('admin3d/error', {
      message: 'Server ID is required',
      error: { status: 400, stack: 'Missing server ID' }
    });
  }
  
  try {
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      console.error(`Guild not found with ID: ${serverId}`);
      return res.render('admin3d/error', {
        message: 'Guild not found or bot does not have access',
        error: { status: 404, stack: `Guild with ID ${serverId} not found` }
      });
    }
    
    // Fetch bans from Discord API
    console.log(`Direct: Fetching ban list for guild: ${guild.name}`);
    const bans = await guild.bans.fetch();
    console.log(`Direct: Successfully fetched ${bans.size} bans from Discord API`);
    
    // Get ban logs to enhance the ban data (if available)
    let allBanEvents = [];
    
    try {
      if (banLogger && typeof banLogger.getBanLogs === 'function') {
        const banLogs = banLogger.getBanLogs(serverId);
        
        if (banLogs && Array.isArray(banLogs) && banLogs.length > 0 && 
            logParser && typeof logParser.extractBanEvents === 'function') {
          const banEvents = logParser.extractBanEvents(banLogs);
          allBanEvents = [...banEvents];
          console.log(`Direct: Found ${banEvents.length} ban events from logs`);
        }
        
        // Also check main bot log for more ban events
        const botLogPath = path.join(banLogger.logsDir, 'bot-log.txt');
        
        if (fs.existsSync(botLogPath) && typeof logParser.parseLogFile === 'function') {
          const botLogs = logParser.parseLogFile(botLogPath);
          const mainBanEvents = logParser.extractBanEvents(botLogs);
          
          if (mainBanEvents && Array.isArray(mainBanEvents)) {
            mainBanEvents.forEach(event => {
              if (event && event.userId && 
                  !allBanEvents.some(existing => existing && existing.userId === event.userId)) {
                allBanEvents.push(event);
              }
            });
          }
        }
      }
    } catch (logError) {
      console.error('Direct: Error processing ban logs:', logError);
      // Continue with basic ban data only
    }
    
    // Map bans to a detailed format
    const bannedUsers = [];
    bans.forEach(ban => {
      // Find matching log entry
      const logEntry = allBanEvents.find(event => event && event.userId === ban.user.id);
      
      const banInfo = {
        id: ban.user.id,
        username: ban.user.username || 'Unknown',
        tag: ban.user.tag || 'Unknown User', 
        avatarURL: ban.user.displayAvatarURL({ dynamic: true }),
        reason: ban.reason || 'No reason provided',
        permanent: true
      };
      
      // Add extra data from logs if available
      if (logEntry) {
        banInfo.bannedBy = logEntry.executorName;
        banInfo.bannedAt = logEntry.date.toISOString();
        
        if (logEntry.details && logEntry.details.duration) {
          banInfo.permanent = false;
          banInfo.duration = logEntry.details.duration;
        }
      } else {
        banInfo.bannedAt = new Date().toISOString();
        banInfo.bannedBy = 'Unknown';
      }
      
      bannedUsers.push(banInfo);
    });
    
    // Sort by date (newest first)
    bannedUsers.sort((a, b) => new Date(b.bannedAt) - new Date(a.bannedAt));
    
    // Create response data object
    const banData = {
      success: true,
      bans: bannedUsers,
      total: bannedUsers.length,
      serverId: serverId,
      serverName: guild.name
    };
    
    // Redirect back to the direct-bans page with the ban data in query params
    return res.redirect(`/admin3d/direct-bans?banData=${encodeURIComponent(JSON.stringify(banData))}&serverId=${serverId}`);
  } catch (error) {
    console.error('Direct: Error fetching banned users:', error);
    return res.render('admin3d/error', {
      message: `Failed to fetch banned users: ${error.message}`,
      error: { status: 500, stack: error.stack }
    });
  }
});

/**
 * Direct Ban Fetch Handler (GET version - used by embedded iframes)
 * GET /admin3d/direct-ban-fetch
 */
router.get('/direct-ban-fetch', async (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.query;
  
  console.log(`Direct ban fetch request (GET) for server ${serverId} by user ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.render('admin3d/error', {
      message: 'Discord client not available',
      error: { status: 503, stack: 'Bot client is not initialized' }
    });
  }
  
  if (!serverId) {
    return res.render('admin3d/error', {
      message: 'Server ID is required',
      error: { status: 400, stack: 'Missing server ID' }
    });
  }
  
  try {
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      console.error(`Guild not found with ID: ${serverId}`);
      return res.render('admin3d/error', {
        message: 'Guild not found or bot does not have access',
        error: { status: 404, stack: `Guild with ID ${serverId} not found` }
      });
    }
    
    // Fetch bans from Discord API
    console.log(`Direct: Fetching ban list for guild: ${guild.name}`);
    const bans = await guild.bans.fetch();
    console.log(`Direct: Successfully fetched ${bans.size} bans from Discord API`);
    
    // Get ban logs to enhance the ban data (if available)
    let allBanEvents = [];
    
    try {
      if (banLogger && typeof banLogger.getBanLogs === 'function') {
        const banLogs = banLogger.getBanLogs(serverId);
        
        if (banLogs && Array.isArray(banLogs) && banLogs.length > 0 && 
            logParser && typeof logParser.extractBanEvents === 'function') {
          const banEvents = logParser.extractBanEvents(banLogs);
          allBanEvents = [...banEvents];
          console.log(`Direct: Found ${banEvents.length} ban events from logs`);
        }
        
        // Also check main bot log for more ban events
        const botLogPath = path.join(banLogger.logsDir, 'bot-log.txt');
        
        if (fs.existsSync(botLogPath) && typeof logParser.parseLogFile === 'function') {
          const botLogs = logParser.parseLogFile(botLogPath);
          const mainBanEvents = logParser.extractBanEvents(botLogs);
          
          if (mainBanEvents && Array.isArray(mainBanEvents)) {
            mainBanEvents.forEach(event => {
              if (event && event.userId && 
                  !allBanEvents.some(existing => existing && existing.userId === event.userId)) {
                allBanEvents.push(event);
              }
            });
          }
        }
      }
    } catch (logError) {
      console.error('Direct: Error processing ban logs:', logError);
      // Continue with basic ban data only
    }
    
    // Map bans to a detailed format
    const bannedUsers = [];
    bans.forEach(ban => {
      // Find matching log entry
      const logEntry = allBanEvents.find(event => event && event.userId === ban.user.id);
      
      const banInfo = {
        id: ban.user.id,
        username: ban.user.username || 'Unknown',
        tag: ban.user.tag || 'Unknown User', 
        avatarURL: ban.user.displayAvatarURL({ dynamic: true }),
        reason: ban.reason || 'No reason provided',
        permanent: true
      };
      
      // Add extra data from logs if available
      if (logEntry) {
        banInfo.bannedBy = logEntry.executorName;
        banInfo.bannedAt = logEntry.date.toISOString();
        
        if (logEntry.details && logEntry.details.duration) {
          banInfo.permanent = false;
          banInfo.duration = logEntry.details.duration;
        }
      } else {
        banInfo.bannedAt = new Date().toISOString();
        banInfo.bannedBy = 'Unknown';
      }
      
      bannedUsers.push(banInfo);
    });
    
    // Sort by date (newest first)
    bannedUsers.sort((a, b) => new Date(b.bannedAt) - new Date(a.bannedAt));
    
    // Create response data object
    const banData = {
      success: true,
      bans: bannedUsers,
      total: bannedUsers.length,
      serverId: serverId,
      serverName: guild.name
    };
    
    // Redirect back to the direct-bans page with the ban data in query params
    return res.redirect(`/admin3d/direct-bans?banData=${encodeURIComponent(JSON.stringify(banData))}&serverId=${serverId}`);
  } catch (error) {
    console.error('Direct: Error fetching banned users:', error);
    return res.render('admin3d/error', {
      message: `Failed to fetch banned users: ${error.message}`,
      error: { status: 500, stack: error.stack }
    });
  }
});

/**
 * Direct Unban Handler
 * POST /admin3d/direct-unban
 */
router.post('/direct-unban', async (req, res) => {
  const client = req.app.get('client');
  const { serverId, userId } = req.body;
  
  console.log(`Direct unban request for user ${userId} in server ${serverId} by ${req.user.username || req.user.displayName}`);
  
  if (!client) {
    return res.render('admin3d/error', {
      message: 'Discord client not available',
      error: { status: 503, stack: 'Bot client is not initialized' }
    });
  }
  
  if (!serverId || !userId) {
    return res.render('admin3d/error', {
      message: 'Server ID and User ID are required',
      error: { status: 400, stack: 'Missing required parameters' }
    });
  }
  
  try {
    // Get the guild from the client
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.render('admin3d/error', {
        message: 'Guild not found or bot does not have access',
        error: { status: 404, stack: `Guild with ID ${serverId} not found` }
      });
    }
    
    // Attempt to unban the user
    await guild.members.unban(userId, `Unbanned by ${req.user.username || req.user.displayName} via Admin Dashboard`);
    
    console.log(`Direct: Successfully unbanned user ${userId} from ${guild.name}`);
    
    // Log this action
    if (banLogger && typeof banLogger.logUnban === 'function') {
      banLogger.logUnban(serverId, userId, {
        executorId: req.user.id,
        executorName: req.user.username || req.user.displayName,
        reason: `Unbanned by ${req.user.username || req.user.displayName} via Admin Dashboard`
      });
    }
    
    // Successfully unbanned - now reload the ban list to show updated data
    return res.redirect(`/admin3d/direct-ban-fetch?serverId=${serverId}`);
  } catch (error) {
    console.error('Direct: Error unbanning user:', error);
    return res.render('admin3d/error', {
      message: `Failed to unban user: ${error.message}`,
      error: { status: 500, stack: error.stack }
    });
  }
});

module.exports = router;