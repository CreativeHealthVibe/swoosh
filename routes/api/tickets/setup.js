/**
 * Ticket Setup API Routes
 * Handles ticket panel setup for the admin interface
 */

const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../../middlewares/auth');
const ticketManager = require('../../../handlers/ticketManager');
const validationUtils = require('../../../utils/validation');
const { getGuildById } = require('../../../utils/discord-utils');

// Setup ticket panel
router.post('/', isAdmin, async (req, res) => {
  try {
    // Get request data
    const { serverId, channelId, title, description, color, categoryId } = req.body;
    
    // Validate inputs
    if (!serverId || !channelId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Server ID and channel ID are required' 
      });
    }
    
    // Get the Discord client
    const client = req.app.get('client');
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Discord client is not available' 
      });
    }
    
    // Validate the server
    const guild = await getGuildById(client, serverId);
    if (!guild) {
      return res.status(404).json({ 
        success: false, 
        message: 'Server not found or bot does not have access' 
      });
    }
    
    // Get the channel
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Channel not found or bot does not have access' 
      });
    }
    
    // Check permissions
    const permissions = channel.permissionsFor(guild.members.me);
    if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have required permissions in the channel'
      });
    }
    
    // Get the category if provided
    let category = null;
    if (categoryId) {
      category = await guild.channels.fetch(categoryId).catch(() => null);
      if (!category || category.type !== 4) { // 4 is CategoryChannel
        return res.status(404).json({
          success: false,
          message: 'Category not found or is not a valid category'
        });
      }
    }
    
    // Set up ticket configuration (pre-setup for bounty system)
    const setupOptions = {
      title: title || '🎫 SWOOSH Support Tickets',
      description: description || 'Select an option below to interact with the bounty system.',
      color: validationUtils.isValidHexColor(color) ? color : '#000000',
      categoryId: category ? category.id : null,
      // Bounty system specific ticket types are included by default
      ticketTypes: [
        'claim_bounty',
        'set_bounty',
        'claim_xp_role',
        'general_support'
      ]
    };
    
    // Call the ticket manager to set up the panel
    const result = await ticketManager.setupTicketPanel(channel, req.user, setupOptions);
    
    if (result) {
      return res.json({
        success: true,
        message: 'Ticket panel has been set up successfully',
        channelId: channel.id,
        channelName: channel.name,
        guildId: guild.id,
        guildName: guild.name
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to set up ticket panel'
      });
    }
  } catch (error) {
    console.error('Error setting up ticket panel:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while setting up the ticket panel',
      error: error.message
    });
  }
});

module.exports = router;