/**
 * Auto-Moderation Routes
 * API routes for auto-moderation settings, filters, and logs
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const autoMod = require('../../modules/auto-moderation').getInstance();

// Middleware to ensure all routes require admin authentication
router.use(isAdmin);

/**
 * Get auto-moderation settings for a server
 */
router.get('/settings/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Get settings
    const settings = autoMod.getServerSettings(serverId);
    
    // Get channels for logging
    const channels = await autoMod.getServerLogChannels(serverId);
    
    res.json({
      success: true,
      settings,
      channels
    });
    
  } catch (error) {
    console.error('Error getting auto-moderation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-moderation settings',
      error: error.message
    });
  }
});

/**
 * Save auto-moderation settings for a server
 */
router.post('/settings', async (req, res) => {
  try {
    const { serverId } = req.body;
    
    if (!serverId) {
      return res.status(400).json({
        success: false,
        message: 'Server ID is required'
      });
    }
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Extract settings from request body
    const {
      enableAutomod,
      logActions,
      logChannel,
      filterProfanity,
      filterLinks,
      filterInvites,
      filterMassMentions,
      mentionThreshold,
      antiSpam,
      spamThreshold,
      spamTimeWindow,
      antiCaps,
      capsThreshold,
      defaultAction,
      muteTime,
      muteTimeUnit,
      escalateRepeated,
      maxViolations,
      // New tier-based escalation system
      tier1Action,
      tier2Action,
      tier3Action,
      tier4Action
    } = req.body;
    
    // Format settings
    const settings = {
      enabled: enableAutomod === 'on' || enableAutomod === true,
      logActions: logActions === 'on' || logActions === true,
      logChannel: logChannel || '',
      filters: {
        profanity: filterProfanity === 'on' || filterProfanity === true,
        links: filterLinks === 'on' || filterLinks === true,
        invites: filterInvites === 'on' || filterInvites === true,
        massMentions: filterMassMentions === 'on' || filterMassMentions === true,
        caps: antiCaps === 'on' || antiCaps === true
      },
      mentionThreshold: parseInt(mentionThreshold) || 5,
      antiSpam: {
        enabled: antiSpam === 'on' || antiSpam === true,
        messageThreshold: parseInt(spamThreshold) || 5,
        timeWindow: parseInt(spamTimeWindow) || 5
      },
      capsThreshold: parseInt(capsThreshold) || 70,
      defaultAction: defaultAction || 'delete',
      muteTime: `${muteTime || 10}${muteTimeUnit || 'm'}`,
      escalateRepeated: escalateRepeated === 'on' || escalateRepeated === true,
      maxViolations: parseInt(maxViolations) || 7,
      // New tier-based escalation system
      tier1Action: tier1Action || 'warn',
      tier2Action: tier2Action || 'mute',
      tier3Action: tier3Action || 'kick',
      tier4Action: tier4Action || 'ban'
    };
    
    // Save settings
    const updatedSettings = await autoMod.saveServerSettings(serverId, settings);
    
    res.json({
      success: true,
      settings: updatedSettings
    });
    
  } catch (error) {
    console.error('Error saving auto-moderation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save auto-moderation settings',
      error: error.message
    });
  }
});

/**
 * Get custom filters for a server
 */
router.get('/filters/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Get filters
    const filters = autoMod.getServerFilters(serverId);
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting custom filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom filters',
      error: error.message
    });
  }
});

/**
 * Add a custom filter for a server
 */
router.post('/save-filter', async (req, res) => {
  try {
    const { serverId, filterType, filterContent, filterAction } = req.body;
    
    if (!serverId || !filterType || !filterContent) {
      return res.status(400).json({
        success: false,
        message: 'Server ID, filter type, and filter content are required'
      });
    }
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Create filter
    const filter = {
      type: filterType,
      content: filterContent,
      action: filterAction || 'delete'
    };
    
    // Add filter
    const newFilter = await autoMod.addFilter(serverId, filter);
    
    res.json({
      success: true,
      filter: newFilter
    });
    
  } catch (error) {
    console.error('Error adding custom filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add custom filter',
      error: error.message
    });
  }
});

/**
 * Remove a custom filter from a server
 */
router.post('/remove-filter', async (req, res) => {
  try {
    const { serverId, filterId } = req.body;
    
    if (!serverId || !filterId) {
      return res.status(400).json({
        success: false,
        message: 'Server ID and filter ID are required'
      });
    }
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Remove filter
    await autoMod.removeFilter(serverId, filterId);
    
    res.json({
      success: true,
      message: 'Filter removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing custom filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom filter',
      error: error.message
    });
  }
});

/**
 * Delete a custom filter from a server (DELETE method)
 */
router.delete('/delete-filter/:serverId/:filterId', async (req, res) => {
  try {
    const { serverId, filterId } = req.params;
    
    if (!serverId || !filterId) {
      return res.status(400).json({
        success: false,
        message: 'Server ID and filter ID are required'
      });
    }
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Remove filter
    await autoMod.removeFilter(serverId, filterId);
    
    res.json({
      success: true,
      message: 'Filter removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing custom filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom filter',
      error: error.message
    });
  }
});

/**
 * Get auto-moderation logs for a server
 */
router.get('/logs/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Get logs
    const logs = autoMod.getServerLogs(serverId, limit);
    
    res.json({
      success: true,
      logs
    });
    
  } catch (error) {
    console.error('Error getting auto-moderation logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-moderation logs',
      error: error.message
    });
  }
});

/**
 * Get available log channels for a server
 */
router.get('/log-channels/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Check if user has access to this server
    const userGuilds = req.session.guilds || [];
    const hasAccess = userGuilds.some(guild => guild.id === serverId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this server'
      });
    }
    
    // Get channels
    const channels = await autoMod.getServerLogChannels(serverId);
    
    res.json({
      success: true,
      channels
    });
    
  } catch (error) {
    console.error('Error getting log channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get log channels',
      error: error.message
    });
  }
});

module.exports = router;