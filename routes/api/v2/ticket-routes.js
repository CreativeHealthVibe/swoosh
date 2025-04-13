/**
 * Ticket Management API Routes
 * API endpoints for the ticket management system
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../middlewares/auth');

/**
 * GET /api/v2/servers/:serverId/tickets
 * Get all tickets for a server
 */
router.get('/servers/:serverId/tickets', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Get tickets for the server
    const tickets = await client.ticketManager.getTickets(serverId);
    
    // Get ticket stats
    const stats = {
      total: tickets.length,
      open: tickets.filter(ticket => ticket.status === 'OPEN').length,
      closed: tickets.filter(ticket => ticket.status === 'CLOSED').length,
      avgResponseTime: calculateAvgResponseTime(tickets)
    };
    
    return res.json({
      success: true,
      tickets,
      stats
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId
 * Get a specific ticket
 */
router.get('/servers/:serverId/tickets/:ticketId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Get ticket
    const ticket = await client.ticketManager.getTicket(serverId, ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    return res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error getting ticket:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId/transcript
 * Get transcript for a ticket
 */
router.get('/servers/:serverId/tickets/:ticketId/transcript', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Get transcript
    const transcript = await client.ticketManager.getTranscript(serverId, ticketId);
    
    return res.json({
      success: true,
      transcript
    });
  } catch (error) {
    console.error('Error getting transcript:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId/transcript/download
 * Download transcript for a ticket
 */
router.get('/servers/:serverId/tickets/:ticketId/transcript/download', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Generate transcript HTML
    const transcript = await client.ticketManager.generateTranscript(serverId, ticketId);
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found'
      });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.html"`);
    
    // Send transcript HTML
    return res.send(transcript.html || transcript.content || 'No transcript content available');
  } catch (error) {
    console.error('Error downloading transcript:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/tickets/:ticketId/close
 * Close a ticket
 */
router.post('/servers/:serverId/tickets/:ticketId/close', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const { reason } = req.body;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Close ticket
    await client.ticketManager.closeTicket(serverId, ticketId, {
      reason,
      closedBy: req.user.id,
      saveTranscript: true
    });
    
    return res.json({
      success: true,
      message: 'Ticket closed successfully'
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/ticket-config
 * Get ticket configuration for a server
 */
router.get('/servers/:serverId/ticket-config', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Get ticket configuration
    const config = await client.ticketManager.getConfig(serverId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ticket configuration not found',
        code: 'CONFIG_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error getting ticket config:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/ticket-config
 * Save ticket configuration
 */
router.post('/servers/:serverId/ticket-config', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const config = req.body;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    // Save configuration
    await client.ticketManager.saveConfig(serverId, config);
    
    return res.json({
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving ticket config:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/channels
 * Get channels for a server
 */
router.get('/servers/:serverId/channels', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Discord client is not available' 
      });
    }
    
    // Get guild
    const guild = await client.guilds.fetch(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get channels and categories
    const channels = [];
    const categories = [];
    
    guild.channels.cache.forEach(channel => {
      if (channel.type === 0) { // Text channel
        channels.push({
          id: channel.id,
          name: channel.name,
          type: 'text',
          parentId: channel.parentId
        });
      } else if (channel.type === 4) { // Category
        categories.push({
          id: channel.id,
          name: channel.name
        });
      }
    });
    
    return res.json({
      success: true,
      channels,
      categories
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/roles
 * Get roles for a server
 */
router.get('/servers/:serverId/roles', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Discord client is not available' 
      });
    }
    
    // Get guild
    const guild = await client.guilds.fetch(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get roles
    const roles = guild.roles.cache
      .filter(role => !role.managed && role.id !== guild.id) // Exclude bot roles and @everyone
      .sort((a, b) => b.position - a.position)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor
      }));
    
    return res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/ticket-panel
 * Create a ticket panel
 */
router.post('/servers/:serverId/ticket-panel', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { 
      channelId, 
      panelTitle, 
      panelDescription, 
      panelColor,
      panelImage,
      ticketTypes 
    } = req.body;
    
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'Channel ID is required'
      });
    }
    
    // Parse ticket types if it's a string
    let parsedTicketTypes = ticketTypes;
    if (typeof ticketTypes === 'string') {
      try {
        parsedTicketTypes = JSON.parse(ticketTypes);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket types format'
        });
      }
    }
    
    // Create panel
    try {
      console.log('Ticket Manager:', typeof client.ticketManager);
      console.log('createPanel Method:', typeof client.ticketManager.createPanel);
      console.log('Attempting to create panel in server:', serverId);
      console.log('Channel ID:', channelId);
      
      const result = await client.ticketManager.createPanel(serverId, {
        channelId,
        title: panelTitle,
        description: panelDescription,
        color: panelColor ? panelColor : '#9b59b6',
        image: panelImage,
        ticketTypes: parsedTicketTypes
      });
      
      console.log('Panel creation result:', result);
    } catch (err) {
      console.error('Error in createPanel route:', err);
      throw err;
    }
    
    return res.json({
      success: true,
      message: 'Ticket panel created successfully'
    });
  } catch (error) {
    console.error('Error creating ticket panel:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Calculate average response time
 * @param {Array} tickets - Array of tickets
 * @returns {number} - Average response time in seconds
 */
function calculateAvgResponseTime(tickets) {
  const ticketsWithResponses = tickets.filter(ticket => 
    ticket.firstResponseTime && ticket.firstResponseTime > 0
  );
  
  if (ticketsWithResponses.length === 0) {
    return null;
  }
  
  const totalResponseTime = ticketsWithResponses.reduce(
    (sum, ticket) => sum + ticket.firstResponseTime, 
    0
  );
  
  return Math.floor(totalResponseTime / ticketsWithResponses.length);
}

module.exports = router;