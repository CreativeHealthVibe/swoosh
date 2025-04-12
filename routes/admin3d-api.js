/**
 * Admin3D API Routes
 * These routes handle API requests from the Admin3D interface
 */

const express = require('express');
const router = express.Router();

// Middleware to check admin authentication
const isAdmin = require('../middlewares/is-admin');
router.use(isAdmin);

/**
 * GET /admin3d/server-stats/:serverId
 * Get basic statistics for a server
 */
router.get('/server-stats/:serverId', async (req, res) => {
  const { serverId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    const guild = await client.guilds.fetch(serverId).catch(() => null);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or bot does not have access to it'
      });
    }
    
    // Get server statistics
    return res.json({
      success: true,
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      createdAt: guild.createdAt,
      owner: guild.ownerId
    });
  } catch (error) {
    console.error('Error getting server stats:', error);
    return res.json({
      success: false,
      message: `Failed to get server stats: ${error.message}`
    });
  }
});

/**
 * GET /admin3d/direct-bans/list/:serverId
 * Get list of banned users for a server (for the original direct interface)
 */
router.get('/direct-bans/list/:serverId', async (req, res) => {
  const { serverId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    const guild = await client.guilds.fetch(serverId).catch(() => null);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or bot does not have access to it'
      });
    }
    
    // Fetch ban list
    const bans = await guild.bans.fetch();
    
    // Format data for direct ban list (original format)
    return res.json({
      success: true,
      bans: Array.from(bans.values()).map(ban => ({
        user: {
          id: ban.user.id,
          username: ban.user.username,
          tag: ban.user.tag,
          displayAvatarURL: ban.user.displayAvatarURL({ dynamic: true })
        },
        reason: ban.reason || 'No reason provided'
      }))
    });
  } catch (error) {
    console.error('Error getting ban list:', error);
    return res.json({
      success: false,
      message: `Failed to get ban list: ${error.message}`
    });
  }
});

/**
 * GET /admin3d/bans/:serverId
 * Get list of banned users for a server (for the redesigned interface)
 */
router.get('/bans/:serverId', async (req, res) => {
  const { serverId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    const guild = await client.guilds.fetch(serverId).catch(() => null);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or bot does not have access to it'
      });
    }
    
    // Fetch ban list
    const bans = await guild.bans.fetch();
    
    // Format data
    const banList = Array.from(bans.values()).map(ban => ({
      user: {
        id: ban.user.id,
        tag: ban.user.tag,
        avatar: ban.user.displayAvatarURL({ format: 'png', dynamic: true })
      },
      reason: ban.reason || 'No reason provided',
      createdAt: Date.now() // Actual ban date not available in the API response
    }));
    
    return res.json({
      success: true,
      bans: banList,
      count: banList.length
    });
  } catch (error) {
    console.error('Error getting ban list:', error);
    return res.json({
      success: false,
      message: `Failed to get ban list: ${error.message}`
    });
  }
});

/**
 * POST /admin3d/unban/:serverId/:userId
 * Unban a user from a server
 */
router.post('/unban/:serverId/:userId', async (req, res) => {
  const { serverId, userId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    const guild = await client.guilds.fetch(serverId).catch(() => null);
    
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found or bot does not have access to it'
      });
    }
    
    // Unban the user
    await guild.bans.remove(userId, `Unbanned by ${req.user.username} via Admin Dashboard`);
    
    return res.json({
      success: true,
      message: 'User has been unbanned successfully'
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return res.json({
      success: false,
      message: `Failed to unban user: ${error.message}`
    });
  }
});

/**
 * GET /admin3d/warnings/list/:serverId
 * Get warning list for a server (for the original interface)
 */
router.get('/warnings/list/:serverId', async (req, res) => {
  const { serverId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    // Get warnings from the database
    if (!client.discordDB) {
      return res.json({
        success: false,
        message: 'Database not available'
      });
    }
    
    // Get warnings for the server from database
    const warnings = await client.discordDB.getAllDocuments('warnings');
    
    // Filter warnings for this server
    const serverWarnings = warnings
      .filter(warning => warning.guildId === serverId)
      .map(warning => {
        // Try to get user data
        const guild = client.guilds.cache.get(serverId);
        const member = guild ? guild.members.cache.get(warning.userId) : null;
        
        return {
          id: warning.id || warning._id,
          userId: warning.userId,
          username: member ? member.user.username : 'Unknown User',
          tag: member ? member.user.tag : 'Unknown User',
          avatarURL: member ? member.user.displayAvatarURL({ format: 'png', dynamic: true }) : null,
          reason: warning.reason,
          timestamp: warning.timestamp || warning.createdAt || Date.now(),
          active: warning.active !== false, // Default to active
          warnedBy: warning.moderatorId || warning.issuedBy || req.user.id
        };
      });
    
    return res.json({
      success: true,
      warnings: serverWarnings
    });
  } catch (error) {
    console.error('Error getting warning list:', error);
    return res.json({
      success: false,
      message: `Failed to get warning list: ${error.message}`
    });
  }
});

/**
 * GET /admin3d/warnings/:serverId
 * Get warning list for a server (for the redesigned interface)
 */
router.get('/warnings/:serverId', async (req, res) => {
  const { serverId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    // Get warnings from the database
    if (!client.discordDB) {
      return res.json({
        success: false,
        message: 'Database not available'
      });
    }
    
    // Get warnings for the server from database
    const warnings = await client.discordDB.getAllDocuments('warnings');
    
    // Filter warnings for this server
    const serverWarnings = warnings
      .filter(warning => warning.guildId === serverId)
      .map(warning => {
        // Try to get user data
        const guild = client.guilds.cache.get(serverId);
        const member = guild ? guild.members.cache.get(warning.userId) : null;
        
        return {
          id: warning.id || warning._id,
          userId: warning.userId,
          user: {
            id: warning.userId,
            tag: member ? member.user.tag : 'Unknown User',
            avatar: member ? member.user.displayAvatarURL({ format: 'png', dynamic: true }) : null
          },
          reason: warning.reason,
          timestamp: warning.timestamp || warning.createdAt || Date.now(),
          active: warning.active !== false, // Default to active
          warnedBy: warning.moderatorId || warning.issuedBy || req.user.id
        };
      });
    
    return res.json({
      success: true,
      warnings: serverWarnings,
      count: serverWarnings.length
    });
  } catch (error) {
    console.error('Error getting warning list:', error);
    return res.json({
      success: false,
      message: `Failed to get warning list: ${error.message}`
    });
  }
});

/**
 * POST /admin3d/warnings/revoke/:serverId/:warningId
 * Revoke a warning
 */
router.post('/warnings/revoke/:serverId/:warningId', async (req, res) => {
  const { serverId, warningId } = req.params;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    // Get database
    if (!client.discordDB) {
      return res.json({
        success: false,
        message: 'Database not available'
      });
    }
    
    // Get the warning
    const warning = await client.discordDB.getDocument('warnings', warningId);
    
    if (!warning) {
      return res.json({
        success: false,
        message: 'Warning not found'
      });
    }
    
    if (warning.guildId !== serverId) {
      return res.json({
        success: false,
        message: 'Warning does not belong to this server'
      });
    }
    
    // Update the warning
    warning.active = false;
    warning.revokedBy = req.user.id;
    warning.revokedAt = Date.now();
    
    await client.discordDB.updateDocument('warnings', warningId, warning);
    
    return res.json({
      success: true,
      message: 'Warning has been revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking warning:', error);
    return res.json({
      success: false,
      message: `Failed to revoke warning: ${error.message}`
    });
  }
});

module.exports = router;