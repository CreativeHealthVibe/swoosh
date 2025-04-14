/**
 * API Routes for Ticket Setup Integration
 * This module provides endpoints for the Admin3D ticket setup interface
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../middlewares/auth');
const { getClient } = require('../../../modules/discord-bot');
const { getTicketManager } = require('../../../handlers/ticketManager');
const { getBountyManager } = require('../../../handlers/bountyManager');
const { logAction } = require('../../../modules/logging');

/**
 * Get ticket configuration for a server
 * GET /api/v2/servers/:serverId/ticket-config
 */
router.get('/servers/:serverId/ticket-config', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = getClient();
    
    if (!client) {
      return res.status(500).json({ success: false, error: 'Discord bot is not available' });
    }
    
    const ticketManager = getTicketManager();
    
    if (!ticketManager) {
      return res.status(500).json({ success: false, error: 'Ticket system is not available' });
    }
    
    // Get ticket configuration
    const config = await ticketManager.getServerConfig(serverId);
    
    // Get bounty configuration if available
    const bountyManager = getBountyManager();
    let bountyConfig = null;
    
    if (bountyManager) {
      bountyConfig = await bountyManager.getConfig(serverId);
    }
    
    // Combine configurations
    const fullConfig = {
      ...config,
      bountyConfig
    };
    
    return res.json({ success: true, config: fullConfig });
  } catch (error) {
    console.error('Error getting ticket config:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Save ticket configuration for a server
 * POST /api/v2/servers/:serverId/ticket-config
 */
router.post('/servers/:serverId/ticket-config', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const config = req.body;
    const client = getClient();
    
    if (!client) {
      return res.status(500).json({ success: false, error: 'Discord bot is not available' });
    }
    
    const ticketManager = getTicketManager();
    
    if (!ticketManager) {
      return res.status(500).json({ success: false, error: 'Ticket system is not available' });
    }
    
    // Save ticket configuration
    await ticketManager.updateServerConfig(serverId, config);
    
    // Log the action
    const user = req.user;
    const guild = client.guilds.cache.get(serverId);
    const guildName = guild ? guild.name : serverId;
    
    logAction({
      type: 'TICKET_CONFIG_UPDATE',
      user: user ? { id: user.id, username: user.username } : null,
      guild: { id: serverId, name: guildName },
      details: 'Updated ticket configuration via Admin3D Dashboard'
    });
    
    return res.json({ success: true, message: 'Ticket configuration saved successfully' });
  } catch (error) {
    console.error('Error saving ticket config:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Save bounty configuration for a server
 * POST /api/v2/servers/:serverId/bounty-config
 */
router.post('/servers/:serverId/bounty-config', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const config = req.body;
    const client = getClient();
    
    if (!client) {
      return res.status(500).json({ success: false, error: 'Discord bot is not available' });
    }
    
    const bountyManager = getBountyManager();
    
    if (!bountyManager) {
      return res.status(500).json({ success: false, error: 'Bounty system is not available' });
    }
    
    // Save bounty configuration
    await bountyManager.saveConfig(serverId, config);
    
    // Log the action
    const user = req.user;
    const guild = client.guilds.cache.get(serverId);
    const guildName = guild ? guild.name : serverId;
    
    logAction({
      type: 'BOUNTY_CONFIG_UPDATE',
      user: user ? { id: user.id, username: user.username } : null,
      guild: { id: serverId, name: guildName },
      details: 'Updated bounty configuration via Admin3D Dashboard'
    });
    
    return res.json({ success: true, message: 'Bounty configuration saved successfully' });
  } catch (error) {
    console.error('Error saving bounty config:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a quick setup ticket panel
 * POST /api/v2/servers/:serverId/quick-setup
 */
router.post('/servers/:serverId/quick-setup', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { channelId, categoryId, supportRoleId, panelColor, panelTitle, panelDescription, ticketTypes } = req.body;
    const client = getClient();
    
    if (!client) {
      return res.status(500).json({ success: false, error: 'Discord bot is not available' });
    }
    
    const ticketManager = getTicketManager();
    
    if (!ticketManager) {
      return res.status(500).json({ success: false, error: 'Ticket system is not available' });
    }
    
    // Get the guild and channel
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({ success: false, error: 'Server not found' });
    }
    
    const channel = guild.channels.cache.get(channelId);
    
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    // Update ticket configuration
    await ticketManager.updateServerConfig(serverId, {
      categoryId,
      supportRoleId,
      logChannelId: req.body.logChannelId || null,
      autoTranscript: req.body.autoTranscript || false,
      requireTopic: req.body.requireTopic || false
    });
    
    // Create the ticket panel
    const panel = await ticketManager.createTicketPanel(serverId, {
      channelId,
      color: panelColor || '#000000',
      title: panelTitle || 'Support Tickets',
      description: panelDescription || 'Select an option below to create a support ticket.',
      ticketTypes: Array.isArray(ticketTypes) ? ticketTypes : [
        {
          label: 'General Support',
          emoji: '🔧',
          description: 'General questions and support'
        }
      ]
    });
    
    // Log the action
    const user = req.user;
    
    logAction({
      type: 'TICKET_PANEL_CREATE',
      user: user ? { id: user.id, username: user.username } : null,
      guild: { id: serverId, name: guild.name },
      details: `Created ticket panel in channel #${channel.name} via Quick Setup`
    });
    
    return res.json({ success: true, message: 'Ticket panel created successfully', panel });
  } catch (error) {
    console.error('Error creating ticket panel:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a bounty ticket panel
 * POST /api/v2/servers/:serverId/bounty-setup
 */
router.post('/servers/:serverId/bounty-setup', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { channelId, bountyManagerRoleId, titleText, descriptionText } = req.body;
    const client = getClient();
    
    if (!client) {
      return res.status(500).json({ success: false, error: 'Discord bot is not available' });
    }
    
    const ticketManager = getTicketManager();
    const bountyManager = getBountyManager();
    
    if (!ticketManager || !bountyManager) {
      return res.status(500).json({ success: false, error: 'Ticket or bounty system is not available' });
    }
    
    // Get the guild and channel
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({ success: false, error: 'Server not found' });
    }
    
    const channel = guild.channels.cache.get(channelId);
    
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    // Update bounty configuration
    await bountyManager.saveConfig(serverId, {
      enableBounties: true,
      bountyManagerRoleId: bountyManagerRoleId || null,
      bountyChannelId: channelId
    });
    
    // Create the bounty ticket panel
    const panel = await ticketManager.createTicketPanel(serverId, {
      channelId,
      color: req.body.panelColor || '#000000',
      title: titleText || '🏆 SWOOSH Bounty System',
      description: descriptionText || 'Select an option below to interact with the bounty system.',
      ticketTypes: [
        {
          label: 'Claim Bounty',
          emoji: '💰',
          description: 'Submit evidence to claim a bounty',
          customId: 'claim_bounty'
        },
        {
          label: 'Set Bounty',
          emoji: '🎯',
          description: 'Set a new bounty on a player',
          customId: 'set_bounty'
        },
        {
          label: 'Claim XP',
          emoji: '⭐',
          description: 'Discuss your XP and claim your role',
          customId: 'claim_xp_role'
        },
        {
          label: 'General Support',
          emoji: '🔧',
          description: 'General questions and support',
          customId: 'general_support'
        }
      ]
    });
    
    // Log the action
    const user = req.user;
    
    logAction({
      type: 'BOUNTY_PANEL_CREATE',
      user: user ? { id: user.id, username: user.username } : null,
      guild: { id: serverId, name: guild.name },
      details: `Created bounty ticket panel in channel #${channel.name}`
    });
    
    return res.json({ success: true, message: 'Bounty ticket panel created successfully', panel });
  } catch (error) {
    console.error('Error creating bounty panel:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;