/**
 * API v2 - Server Routes
 * Handles server-related API endpoints
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../../middlewares/auth');

// Get All Servers
router.get('/', isAdmin, (req, res) => {
  const client = req.app.get('client');
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  const servers = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    memberCount: guild.memberCount,
    icon: guild.iconURL({ dynamic: true, size: 128 }),
    joined: guild.joinedAt
  }));
  
  res.json({
    success: true,
    servers
  });
});

// Get Server Channels
router.get('/:serverId/channels', isAdmin, (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  // Get guild
  const guild = client.guilds.cache.get(serverId);
  
  if (!guild) {
    return res.status(404).json({
      success: false,
      message: 'Server not found'
    });
  }
  
  // Get channels
  const channels = guild.channels.cache
    .filter(channel => channel.type !== 4) // Exclude categories
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      position: channel.position,
      parentId: channel.parentId
    }));
  
  // Get categories
  const categories = guild.channels.cache
    .filter(channel => channel.type === 4) // Only categories
    .map(category => ({
      id: category.id,
      name: category.name,
      position: category.position
    }));
  
  res.json({
    success: true,
    channels,
    categories
  });
});

// Get Server Roles
router.get('/:serverId/roles', isAdmin, (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  // Get guild
  const guild = client.guilds.cache.get(serverId);
  
  if (!guild) {
    return res.status(404).json({
      success: false,
      message: 'Server not found'
    });
  }
  
  // Get roles
  const roles = guild.roles.cache.map(role => ({
    id: role.id,
    name: role.name,
    color: role.color,
    position: role.position,
    managed: role.managed,
    permissions: role.permissions.bitfield.toString()
  }));
  
  res.json({
    success: true,
    roles
  });
});

// Get Server Tickets
router.get('/:serverId/tickets', isAdmin, (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const { serverId } = req.params;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  try {
    // Get tickets
    const tickets = ticketManager.getTickets(serverId) || [];
    
    // Calculate stats
    const open = tickets.filter(ticket => ticket.status.toLowerCase() === 'open').length;
    const closed = tickets.filter(ticket => ticket.status.toLowerCase() === 'closed').length;
    const total = tickets.length;
    
    // Calculate average response time if available
    let avgResponseTime = null;
    const ticketsWithResponse = tickets.filter(ticket => ticket.responseTime);
    if (ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum, ticket) => sum + ticket.responseTime, 0);
      avgResponseTime = Math.round(totalResponseTime / ticketsWithResponse.length);
    }
    
    res.json({
      success: true,
      tickets,
      stats: {
        total,
        open,
        closed,
        avgResponseTime
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets: ' + error.message
    });
  }
});

// Get Ticket Configuration
router.get('/:serverId/ticket-config', isAdmin, (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const { serverId } = req.params;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  try {
    // Get config
    const config = ticketManager.getConfig(serverId);
    
    if (!config) {
      return res.json({
        success: false,
        code: 'CONFIG_NOT_FOUND',
        message: 'No ticket configuration found for this server'
      });
    }
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching ticket config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket configuration: ' + error.message
    });
  }
});

// Save Ticket Configuration
router.post('/:serverId/ticket-config', isAdmin, express.json(), (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const { serverId } = req.params;
  const config = req.body;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  try {
    // Save config
    ticketManager.saveConfig(serverId, config);
    
    res.json({
      success: true,
      message: 'Ticket configuration saved successfully',
      config
    });
  } catch (error) {
    console.error('Error saving ticket config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save ticket configuration: ' + error.message
    });
  }
});

// Send Ticket Panel
router.post('/:serverId/ticket-panel', isAdmin, express.json(), (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const client = req.app.get('client');
  const { serverId } = req.params;
  const { channelId, title, description, buttonLabel } = req.body;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    // Send panel
    ticketManager.sendPanel(client, serverId, channelId, {
      title: title || 'Support Tickets',
      description: description || 'Click the button below to create a support ticket',
      buttonLabel: buttonLabel || 'Create Ticket'
    });
    
    res.json({
      success: true,
      message: 'Ticket panel sent successfully'
    });
  } catch (error) {
    console.error('Error sending ticket panel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket panel: ' + error.message
    });
  }
});

// Close Ticket
router.post('/:serverId/tickets/:ticketId/close', isAdmin, express.json(), (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const client = req.app.get('client');
  const { serverId, ticketId } = req.params;
  const { reason } = req.body;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  try {
    // Close ticket
    ticketManager.closeTicket(client, serverId, ticketId, req.user.username, reason);
    
    res.json({
      success: true,
      message: 'Ticket closed successfully'
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket: ' + error.message
    });
  }
});

// Get Ticket Transcript Preview
router.get('/:serverId/tickets/:ticketId/transcript-preview', isAdmin, (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const { serverId, ticketId } = req.params;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  try {
    // Get messages (limited preview)
    const messages = ticketManager.getTicketMessages(serverId, ticketId, 20);
    
    if (!messages) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or no messages available'
      });
    }
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket messages: ' + error.message
    });
  }
});

// Download Ticket Transcript
router.get('/:serverId/tickets/:ticketId/transcript-download', isAdmin, (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  const { serverId, ticketId } = req.params;
  
  if (!ticketManager) {
    return res.status(503).json({
      success: false,
      message: 'Ticket manager not available'
    });
  }
  
  try {
    // Generate transcript
    const transcript = ticketManager.generateTranscript(serverId, ticketId);
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Failed to generate transcript'
      });
    }
    
    // Set content type and attachment header
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.html"`);
    
    // Send transcript
    res.send(transcript);
  } catch (error) {
    console.error('Error generating transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate transcript: ' + error.message
    });
  }
});

module.exports = router;