/**
 * Warning System API Routes
 * 
 * This file contains the routes for the warning system in the Admin 3D panel.
 */

const express = require('express');
const router = express.Router();
const warningSystem = require('../../modules/warning-system');

// Initialize warning system on first use
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await warningSystem.initializeWarningSystem();
    isInitialized = true;
  }
}

/**
 * GET /admin3d/warnings/list/:serverId
 * Get warnings for a server
 */
router.get('/warnings/list/:serverId', async (req, res) => {
  try {
    await ensureInitialized();
    
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
    
    // Get warnings for the server
    const warnings = warningSystem.getGuildWarnings(serverId);
    
    // Enhance warning data with Discord user information
    const enhancedWarnings = await Promise.all(warnings.map(async warning => {
      try {
        // Try to get user information
        const user = await client.users.fetch(warning.userId).catch(() => null);
        
        if (user) {
          warning.username = user.username || warning.username;
          warning.tag = user.tag || warning.username;
          warning.avatarURL = user.displayAvatarURL ? user.displayAvatarURL({ format: 'webp' }) : 
                          'https://cdn.discordapp.com/embed/avatars/0.png';
        }
        
        // Try to get moderator information
        const moderator = await client.users.fetch(warning.moderatorId).catch(() => null);
        
        if (moderator) {
          warning.moderatorName = moderator.username || warning.moderatorName;
        }
        
        return warning;
      } catch (error) {
        console.error(`Error enhancing warning ${warning.id}:`, error);
        return warning;
      }
    }));
    
    return res.json({
      success: true,
      warnings: enhancedWarnings,
      total: enhancedWarnings.length,
      serverId,
      serverName: guild.name
    });
  } catch (error) {
    console.error('Error getting warnings:', error);
    return res.json({
      success: false,
      message: `Error getting warnings: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * GET /admin3d/warnings/user/:serverId/:userId
 * Get warnings for a specific user
 */
router.get('/warnings/user/:serverId/:userId', async (req, res) => {
  try {
    await ensureInitialized();
    
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
    
    // Get warnings for the user
    const warnings = warningSystem.getUserWarnings(serverId, userId);
    
    // Try to get user information
    let userInfo = { id: userId, username: 'Unknown User' };
    try {
      const user = await client.users.fetch(userId);
      if (user) {
        userInfo = {
          id: user.id,
          username: user.username,
          tag: user.tag,
          avatarURL: user.displayAvatarURL({ format: 'webp' })
        };
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
    }
    
    return res.json({
      success: true,
      warnings,
      total: warnings.length,
      user: userInfo,
      serverId,
      serverName: guild.name
    });
  } catch (error) {
    console.error('Error getting user warnings:', error);
    return res.json({
      success: false,
      message: `Error getting user warnings: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/warnings/add
 * Add a warning to a user
 */
router.post('/warnings/add', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { serverId, userId, reason } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !userId || !reason) {
      return res.json({
        success: false,
        message: 'Server ID, User ID and Reason are required'
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
    
    // Clean up user ID if it's a mention
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    
    // Get user and moderator information
    let username = 'Unknown User';
    let moderatorName = req.user ? req.user.username : 'Admin Panel';
    
    try {
      const user = await client.users.fetch(cleanUserId);
      if (user) {
        username = user.username;
      }
    } catch (error) {
      console.error(`Error fetching user ${cleanUserId}:`, error);
    }
    
    // Add the warning
    const warning = await warningSystem.addWarning({
      guildId: serverId,
      userId: cleanUserId,
      moderatorId: req.user ? req.user.id : 'admin-panel',
      moderatorName,
      username,
      reason
    });
    
    // Try to DM the user about the warning
    try {
      const user = await client.users.fetch(cleanUserId);
      if (user) {
        await user.send({
          embeds: [{
            title: `⚠️ Warning in ${guild.name}`,
            description: `You have received a warning in **${guild.name}**`,
            color: 0xFFAA00,
            fields: [
              { name: 'Reason', value: reason },
              { name: 'Moderator', value: moderatorName }
            ],
            timestamp: new Date()
          }]
        }).catch(error => {
          console.error(`Could not DM user ${cleanUserId}:`, error);
        });
      }
    } catch (error) {
      console.error(`Error DMing user ${cleanUserId}:`, error);
    }
    
    return res.json({
      success: true,
      message: `Warning added to user ${cleanUserId}`,
      warning
    });
  } catch (error) {
    console.error('Error adding warning:', error);
    return res.json({
      success: false,
      message: `Error adding warning: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/warnings/remove
 * Remove a warning
 */
router.post('/warnings/remove', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { serverId, warningId } = req.body;
    
    if (!serverId || !warningId) {
      return res.json({
        success: false,
        message: 'Server ID and Warning ID are required'
      });
    }
    
    // Remove the warning
    const success = await warningSystem.removeWarning(serverId, warningId);
    
    if (!success) {
      return res.json({
        success: false,
        message: 'Warning not found'
      });
    }
    
    return res.json({
      success: true,
      message: `Warning ${warningId} removed`
    });
  } catch (error) {
    console.error('Error removing warning:', error);
    return res.json({
      success: false,
      message: `Error removing warning: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/warnings/update-status
 * Update a warning's status
 */
router.post('/warnings/update-status', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { serverId, warningId, active } = req.body;
    
    if (!serverId || !warningId || active === undefined) {
      return res.json({
        success: false,
        message: 'Server ID, Warning ID and active status are required'
      });
    }
    
    // Update the warning status
    const success = await warningSystem.updateWarningStatus(serverId, warningId, active);
    
    if (!success) {
      return res.json({
        success: false,
        message: 'Warning not found'
      });
    }
    
    return res.json({
      success: true,
      message: `Warning ${warningId} status updated`,
      active
    });
  } catch (error) {
    console.error('Error updating warning status:', error);
    return res.json({
      success: false,
      message: `Error updating warning status: ${error.message}`,
      error: error.toString()
    });
  }
});

/**
 * POST /admin3d/warnings/clear
 * Clear all warnings for a user
 */
router.post('/warnings/clear', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { serverId, userId } = req.body;
    
    if (!serverId || !userId) {
      return res.json({
        success: false,
        message: 'Server ID and User ID are required'
      });
    }
    
    // Clean up user ID if it's a mention
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    
    // Clear the warnings
    const success = await warningSystem.clearUserWarnings(serverId, cleanUserId);
    
    if (!success) {
      return res.json({
        success: false,
        message: 'User has no warnings or not found'
      });
    }
    
    return res.json({
      success: true,
      message: `All warnings cleared for user ${cleanUserId}`
    });
  } catch (error) {
    console.error('Error clearing warnings:', error);
    return res.json({
      success: false,
      message: `Error clearing warnings: ${error.message}`,
      error: error.toString()
    });
  }
});

module.exports = router;