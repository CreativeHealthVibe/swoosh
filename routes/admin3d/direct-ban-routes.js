/**
 * Direct Ban Access Routes 
 * These routes provide a more robust way to access bans when the API version has authentication issues
 * Used both by the direct-ban-access.ejs page and integrated into the main moderation.ejs page
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const { executeQuery } = require('../../utils/database');

// Apply admin authentication middleware to all routes
router.use(isAdmin);

/**
 * GET /admin3d/direct-bans
 * Direct access to ban list
 */
router.get('/direct-bans', async (req, res) => {
  const client = req.app.get('client');

  // Get available servers if client is available
  let servers = [];
  if (client) {
    servers = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name + ' (' + guild.memberCount + ')',
      memberCount: guild.memberCount
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  res.render('admin3d/direct-ban-access', {
    title: 'Direct Ban Management | SWOOSH Bot',
    user: req.user,
    client,
    servers,
    customStyles: ['direct-access.css'],
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/direct-bans/list/:serverId
 * Get ban list for a specific server
 */
router.get('/direct-bans/list/:serverId', async (req, res) => {
  try {
    const serverId = req.params.serverId;
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
    
    // Get the server
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or the bot does not have access to it'
      });
    }
    
    // Check if the bot has permission to view bans
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember || !botMember.permissions.has('BanMembers')) {
      return res.json({
        success: false,
        message: 'Bot does not have permission to view bans for this server'
      });
    }
    
    // Try to fetch bans with error handling and retries
    const bans = await fetchBansWithRetry(guild);
    
    // Process the bans to the format expected by the front-end
    const processedBans = bans.map(ban => {
      return {
        id: ban.user.id,
        userId: ban.user.id,
        username: ban.user.username || 'Unknown User',
        tag: ban.user.tag || ban.user.username || 'Unknown User',
        avatarURL: ban.user.displayAvatarURL ? ban.user.displayAvatarURL({ format: 'webp' }) : 
                  'https://cdn.discordapp.com/embed/avatars/0.png',
        reason: ban.reason || 'No reason provided',
        permanent: true, // Assume permanent for now
        bannedAt: new Date().toISOString(),
        bannedBy: 'Unknown'
      };
    });
    
    // Try to enhance ban data with information from the database
    const enhancedBans = await enhanceBanData(processedBans, serverId, client);
    
    return res.json({
      success: true,
      bans: enhancedBans,
      total: enhancedBans.length,
      serverId,
      serverName: guild.name
    });
  } catch (error) {
    console.error('Error fetching bans:', error);
    return res.json({
      success: false,
      message: `Error fetching bans: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/direct-bans/fetch
 * Fetch bans for a server using robust mechanism with fallback
 */
router.post('/direct-bans/fetch', async (req, res) => {
  try {
    const { serverId } = req.body;
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
    
    // Get the server
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or the bot does not have access to it'
      });
    }
    
    // Check if the bot has permission to view bans
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember || !botMember.permissions.has('BanMembers')) {
      return res.json({
        success: false,
        message: 'Bot does not have permission to view bans for this server'
      });
    }
    
    // Try to fetch bans with error handling and retries
    const bans = await fetchBansWithRetry(guild);
    
    // Process the bans to the format expected by the front-end
    const processedBans = bans.map(ban => {
      return {
        id: ban.user.id,
        username: ban.user.username || 'Unknown User',
        tag: ban.user.tag || ban.user.username || 'Unknown User',
        avatarURL: ban.user.displayAvatarURL ? ban.user.displayAvatarURL({ format: 'webp' }) : 
                  'https://cdn.discordapp.com/embed/avatars/0.png',
        reason: ban.reason || 'No reason provided',
        permanent: true, // Assume permanent for now
        bannedAt: new Date().toISOString(),
        bannedBy: 'Unknown'
      };
    });
    
    // Try to enhance ban data with information from the database
    const enhancedBans = await enhanceBanData(processedBans, serverId, client);
    
    return res.json({
      success: true,
      bans: enhancedBans,
      total: enhancedBans.length,
      serverId,
      serverName: guild.name
    });
  } catch (error) {
    console.error('Error fetching bans:', error);
    return res.json({
      success: false,
      message: `Error fetching bans: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/direct-bans/ban-user
 * Ban a user through a direct mechanism
 */
router.post('/direct-bans/ban-user', async (req, res) => {
  try {
    const { 
      serverId, 
      userId, 
      banReason, 
      deleteMessages, 
      addToBlacklist 
    } = req.body;
    
    const client = req.app.get('client');
    
    if (!client) {
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !userId) {
      return res.json({
        success: false,
        message: 'Server ID and User ID are required'
      });
    }
    
    // Get the server
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or the bot does not have access to it'
      });
    }
    
    // Check if the bot has permission to ban
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember || !botMember.permissions.has('BanMembers')) {
      return res.json({
        success: false,
        message: 'Bot does not have permission to ban members in this server'
      });
    }
    
    // Clean up user ID if it's a mention
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    
    // Determine how many days of messages to delete
    const deleteDays = deleteMessages === 'true' ? 7 : 0;

    // Add to ban logger if available
    const banLogger = client.banLogger || require('../../modules/ban-logger');
    
    // Create a ban log entry before banning
    if (banLogger && typeof banLogger.logBan === 'function') {
      try {
        await banLogger.logBan({
          userId: cleanUserId,
          guildId: serverId,
          moderatorId: req.user.id,
          reason: banReason || 'No reason provided',
          permanent: true,
          deleteDays: deleteDays
        });
      } catch (logError) {
        console.error('Error logging ban:', logError);
        // Continue with the ban even if logging fails
      }
    }
    
    // Attempt to ban the user
    await guild.members.ban(cleanUserId, { 
      reason: `${banReason || 'No reason provided'} | Banned by ${req.user.username || 'Admin'} via Control Panel`,
      deleteMessageDays: deleteDays
    });
    
    // Add to blacklist if requested
    if (addToBlacklist === 'true') {
      try {
        const blacklistManager = require('../../handlers/blacklistManager');
        blacklistManager.addToBlacklist(
          cleanUserId, 
          req.user.id, 
          banReason || 'No reason provided', 
          null, // Permanent
          'global'
        );
      } catch (blacklistError) {
        console.error('Error adding to blacklist:', blacklistError);
        // Continue even if blacklisting fails
      }
    }
    
    return res.json({
      success: true,
      message: `User ${cleanUserId} has been banned successfully`,
      userId: cleanUserId
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return res.json({
      success: false,
      message: `Error banning user: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/direct-bans/unban
 * Unban a user through a direct mechanism
 */
router.post('/direct-bans/unban', async (req, res) => {
  try {
    const { serverId, userId } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !userId) {
      return res.json({
        success: false,
        message: 'Server ID and User ID are required'
      });
    }
    
    // Get the server
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or the bot does not have access to it'
      });
    }
    
    // Check if the bot has permission to unban
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember || !botMember.permissions.has('BanMembers')) {
      return res.json({
        success: false,
        message: 'Bot does not have permission to unban members in this server'
      });
    }
    
    // Clean up user ID if necessary
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    
    // Log the unban action if a logger is available
    const banLogger = client.banLogger || require('../../modules/ban-logger');
    if (banLogger && typeof banLogger.logUnban === 'function') {
      try {
        await banLogger.logUnban({
          userId: cleanUserId,
          guildId: serverId,
          moderatorId: req.user.id,
          reason: 'Unbanned via Admin Dashboard'
        });
      } catch (logError) {
        console.error('Error logging unban:', logError);
        // Continue with the unban even if logging fails
      }
    }
    
    // Attempt to unban the user
    await guild.members.unban(cleanUserId, `Unbanned by ${req.user.username || 'Admin'} via Admin Dashboard`);
    
    return res.json({
      success: true,
      message: `User ${cleanUserId} has been unbanned successfully`,
      userId: cleanUserId
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return res.json({
      success: false,
      message: `Error unbanning user: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * GET /admin3d/direct-bans/details/:serverId/:userId
 * Get detailed information about a ban
 */
router.get('/direct-bans/details/:serverId/:userId', async (req, res) => {
  try {
    const { serverId, userId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !userId) {
      return res.json({
        success: false,
        message: 'Server ID and User ID are required'
      });
    }
    
    // Get the server
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or the bot does not have access to it'
      });
    }
    
    // Try to fetch ban information
    let banInfo = null;
    try {
      banInfo = await guild.bans.fetch(userId);
    } catch (banError) {
      console.error('Error fetching specific ban:', banError);
      return res.json({
        success: false,
        message: 'Ban not found or could not be retrieved'
      });
    }
    
    if (!banInfo) {
      return res.json({
        success: false,
        message: 'Ban not found'
      });
    }
    
    // Process the ban to the format expected by the front-end
    const processedBan = {
      id: banInfo.user.id,
      userId: banInfo.user.id,
      username: banInfo.user.username || 'Unknown User',
      tag: banInfo.user.tag || banInfo.user.username || 'Unknown User',
      avatarURL: banInfo.user.displayAvatarURL ? banInfo.user.displayAvatarURL({ format: 'webp' }) : 
                'https://cdn.discordapp.com/embed/avatars/0.png',
      reason: banInfo.reason || 'No reason provided',
      permanent: true, // Assume permanent for now
      bannedAt: new Date().toISOString(),
      bannedBy: 'Unknown'
    };
    
    // Try to enhance ban data with information from logs
    try {
      // Try to find the ban log entry
      let banLogEntry = null;
      if (client.discordDB) {
        const logs = await client.discordDB.getCollection('ban_logs');
        if (logs) {
          banLogEntry = Object.values(logs).find(log => 
            log.guildId === serverId && 
            log.userId === userId && 
            log.action === 'ban'
          );
        }
      }
      
      // If found, enhance the ban data
      if (banLogEntry) {
        processedBan.bannedAt = banLogEntry.timestamp || processedBan.bannedAt;
        processedBan.bannedBy = banLogEntry.moderatorName || banLogEntry.moderatorId || processedBan.bannedBy;
        processedBan.reason = banLogEntry.reason || processedBan.reason;
        processedBan.deleteDays = banLogEntry.deleteDays || 0;
        processedBan.executor = banLogEntry.moderatorName || banLogEntry.moderatorId;
      }
      
      // Try SQL as backup
      if (client.db && (!banLogEntry || !banLogEntry.moderatorName)) {
        const banRecords = await executeQuery({
          text: 'SELECT * FROM ban_logs WHERE guild_id = $1 AND user_id = $2',
          values: [serverId, userId]
        }, true);
        
        if (banRecords && banRecords.length > 0) {
          const record = banRecords[0];
          processedBan.bannedAt = record.created_at || processedBan.bannedAt;
          processedBan.bannedBy = record.moderator_name || record.moderator_id || processedBan.bannedBy;
          processedBan.reason = record.reason || processedBan.reason;
          processedBan.executor = record.moderator_name || record.moderator_id || processedBan.executor;
        }
      }
    } catch (logError) {
      console.error('Error enhancing ban details with logs:', logError);
      // Continue with the basic ban info
    }
    
    return res.json({
      success: true,
      ban: processedBan,
      serverId,
      serverName: guild.name
    });
  } catch (error) {
    console.error('Error getting ban details:', error);
    return res.json({
      success: false,
      message: `Error getting ban details: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/direct-bans/unban-user
 * Unban a user through a direct mechanism
 */
router.post('/direct-bans/unban-user', async (req, res) => {
  try {
    const { serverId, userId, unbanReason } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !userId) {
      return res.json({
        success: false,
        message: 'Server ID and User ID are required'
      });
    }
    
    // Get the server
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or the bot does not have access to it'
      });
    }
    
    // Check if the bot has permission to unban
    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember || !botMember.permissions.has('BanMembers')) {
      return res.json({
        success: false,
        message: 'Bot does not have permission to unban members in this server'
      });
    }
    
    // Clean up user ID if necessary
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    
    // Log the unban action if a logger is available
    const banLogger = client.banLogger || require('../../modules/ban-logger');
    if (banLogger && typeof banLogger.logUnban === 'function') {
      try {
        await banLogger.logUnban({
          userId: cleanUserId,
          guildId: serverId,
          moderatorId: req.user.id,
          reason: unbanReason || 'No reason provided'
        });
      } catch (logError) {
        console.error('Error logging unban:', logError);
        // Continue with the unban even if logging fails
      }
    }
    
    // Attempt to unban the user
    await guild.members.unban(cleanUserId, `${unbanReason || 'No reason provided'} | Unbanned by ${req.user.username || 'Admin'} via Control Panel`);
    
    return res.json({
      success: true,
      message: `User ${cleanUserId} has been unbanned successfully`,
      userId: cleanUserId
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return res.json({
      success: false,
      message: `Error unbanning user: ${error.message}`,
      error: error.toString()
    });
  }
});

// Helper Functions
/**
 * Fetch bans with retry mechanism
 * @param {Guild} guild - Discord guild
 * @returns {Promise<Array>} - Array of bans
 */
async function fetchBansWithRetry(guild, maxRetries = 3) {
  let retries = 0;
  let lastError = null;
  
  while (retries < maxRetries) {
    try {
      const bans = await guild.bans.fetch();
      return Array.from(bans.values());
    } catch (error) {
      lastError = error;
      retries++;
      console.log(`Retry ${retries}/${maxRetries} failed: ${error.message}`);
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  // If we get here, all retries failed
  throw new Error(`Failed to fetch bans after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Enhance ban data with information from logs
 * @param {Array} bans - Processed ban data
 * @param {string} guildId - Guild ID
 * @param {Client} client - Discord client
 * @returns {Array} - Enhanced ban data
 */
async function enhanceBanData(bans, guildId, client) {
  try {
    // Try to get ban logs from database
    if (!client.discordDB) {
      return bans; // No database available
    }
    
    // Create a map of user IDs to ban objects for quick lookup
    const banMap = new Map();
    bans.forEach(ban => {
      banMap.set(ban.id, ban);
    });
    
    try {
      // Try to fetch ban logs from the database
      const logs = await client.discordDB.getCollection('ban_logs');
      if (!logs) return bans;
      
      // Get all logs for this guild
      const guildLogs = Object.values(logs)
        .filter(log => log.guildId === guildId && log.action === 'ban');
      
      // Update ban data with log information
      guildLogs.forEach(log => {
        const ban = banMap.get(log.userId);
        if (ban) {
          // Update with information from the log
          ban.bannedAt = log.timestamp || ban.bannedAt;
          ban.bannedBy = log.moderatorName || log.moderatorId || ban.bannedBy;
          // If the log has a reason and the current ban doesn't, use the log reason
          if (log.reason && (!ban.reason || ban.reason === 'No reason provided')) {
            ban.reason = log.reason;
          }
        }
      });
    } catch (dbError) {
      console.error("Error getting ban logs from database:", dbError);
      // Continue without logs
    }
    
    try {
      // See if we have an alternative database
      if (client.db) {
        // Try to query the SQL database for ban information
        const banRecords = await executeQuery({
          text: 'SELECT * FROM ban_logs WHERE guild_id = $1',
          values: [guildId]
        }, true);
        
        if (banRecords && banRecords.length > 0) {
          banRecords.forEach(record => {
            const ban = banMap.get(record.user_id);
            if (ban) {
              ban.bannedAt = record.created_at || ban.bannedAt;
              ban.bannedBy = record.moderator_name || record.moderator_id || ban.bannedBy;
              if (record.reason && (!ban.reason || ban.reason === 'No reason provided')) {
                ban.reason = record.reason;
              }
            }
          });
        }
      }
    } catch (sqlError) {
      console.error("Error getting ban logs from SQL database:", sqlError);
      // Continue without SQL data
    }
    
    return bans;
  } catch (error) {
    console.error("Error enhancing ban data:", error);
    return bans; // Return original bans on error
  }
}

module.exports = router;