/**
 * Ticket Setup API Routes
 * Endpoints for managing ticket setup
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../middlewares/auth');

// Import utilities
const discordUtils = require('../../../utils/discord-utils');
const ticketManager = require('../../../handlers/ticketManager');

/**
 * Create a ticket panel in a channel
 * POST /api/tickets/setup
 */
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const {
      serverId,
      channelId,
      title,
      description,
      color,
      ticketTypes
    } = req.body;

    if (!serverId || !channelId) {
      return res.status(400).json({
        success: false,
        message: 'Server ID and Channel ID are required'
      });
    }

    // Get the Discord client from the request app
    const client = req.app.get('discordClient');
    if (!client) {
      return res.status(500).json({
        success: false,
        message: 'Discord client not available'
      });
    }

    // Get the guild and channel
    const guild = await discordUtils.getGuildById(client, serverId);
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    const channel = await discordUtils.getChannelById(client, channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Get the user who is making the request
    const user = await discordUtils.getUserById(client, req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build the options for the ticket panel
    const options = {
      title: title || '🎫 SWOOSH Support Tickets',
      description: description || 'Please select a ticket type from the dropdown below to get assistance.',
      color: color || '#5865F2'
    };

    // Only include ticket types if they were specified
    if (ticketTypes && Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      options.ticketTypes = ticketTypes;
    }

    // Create the ticket panel
    const result = await ticketManager.setupTicketPanel(channel, user, options);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create ticket panel. Check server logs for details.'
      });
    }

    // Save the panel configuration
    const panelConfig = {
      id: Date.now().toString(),
      channelId,
      serverId,
      options,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };

    // Track the panel in the ticket manager's panels collection
    let serverPanels = ticketManager.ticketPanels.get(serverId) || [];
    serverPanels.push(panelConfig);
    ticketManager.ticketPanels.set(serverId, serverPanels);

    return res.status(200).json({
      success: true,
      message: 'Ticket panel created successfully',
      panel: panelConfig
    });
  } catch (error) {
    console.error('Error creating ticket panel:', error);
    return res.status(500).json({
      success: false,
      message: `Error creating ticket panel: ${error.message}`
    });
  }
});

/**
 * Get ticket panel configurations for a server
 * GET /api/tickets/setup/:serverId
 */
router.get('/:serverId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    
    if (!serverId) {
      return res.status(400).json({
        success: false,
        message: 'Server ID is required'
      });
    }

    // Get the ticket panels for the server
    const panels = ticketManager.ticketPanels.get(serverId) || [];
    
    return res.status(200).json({
      success: true,
      panels
    });
  } catch (error) {
    console.error('Error getting ticket panels:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting ticket panels: ${error.message}`
    });
  }
});

module.exports = router;