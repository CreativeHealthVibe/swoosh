/**
 * Ticket Management API Routes
 * API endpoints for the ticket management system
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../middlewares/auth');

// Initialize the routes with access to the client and ticketManager
router.use((req, res, next) => {
  // Get client on each request to ensure we have the latest reference
  const client = req.app.get('client');
  
  // Log warning if client or ticketManager is missing
  if (!client) {
    console.warn('Discord client not available for ticket routes');
  } else if (!client.ticketManager) {
    console.warn('TicketManager not available for ticket routes');
  } else if (!client.ticketManager.ticketPanels) {
    console.warn('ticketPanels Map not available for ticket routes');
  }
  
  next();
});

/**
 * GET /api/v2/servers/:serverId/ticket-panels
 * Get all ticket panels for a server
 */
router.get('/servers/:serverId/ticket-panels', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    console.log('Getting ticket panels for server:', serverId);
    
    // Get existing panels
    let panels = [];
    try {
      panels = await client.ticketManager.getTickets(serverId);
    } catch (err) {
      console.error('Error getting ticket panels:', err);
    }
    
    // Ensure we have an array
    if (!Array.isArray(panels)) {
      console.warn('Panels not returned as an array, using empty array instead');
      panels = [];
    }
    
    return res.json({
      success: true,
      panels: panels
    });
  } catch (error) {
    console.error('Error getting ticket panels:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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
    
    // Check if this is a request for ticket panels
    const isPanelRequest = req.query.type === 'panels' || 
                          req.originalUrl.includes('tickets') ||
                          req.headers.referer?.includes('tickets');
    
    console.log('Is panel request:', isPanelRequest);
    console.log('URL:', req.originalUrl);
    console.log('Referer:', req.headers.referer);
    
    // Get tickets or panels for the server
    let tickets;
    
    try {
      if (isPanelRequest) {
        console.log('Getting ticket panels for server:', serverId);
        // Get panels instead of tickets if that's what was requested
        tickets = await client.ticketManager.getTickets(serverId);
      } else {
        console.log('Getting tickets for server:', serverId);
        tickets = await client.ticketManager.getTickets(serverId);
      }
    } catch (err) {
      console.error('Error getting tickets or panels:', err);
      tickets = [];
    }
    
    // Ensure we have an array
    if (!Array.isArray(tickets)) {
      console.warn('Tickets/panels not returned as an array, using empty array instead');
      tickets = [];
    }
    
    // Get ticket stats (only for tickets, not panels)
    const stats = !isPanelRequest ? {
      total: tickets.length,
      open: tickets.filter(ticket => ticket.status === 'OPEN').length,
      closed: tickets.filter(ticket => ticket.status === 'CLOSED').length,
      avgResponseTime: calculateAvgResponseTime(tickets)
    } : null;
    
    // Return response
    return res.json({
      success: true,
      tickets: tickets,
      stats: stats
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
    
    // Import Discord.js components directly
    const { ChannelType } = require('discord.js');
    
    guild.channels.cache.forEach(channel => {
      if (channel.type === ChannelType.GuildText) { // Text channel
        channels.push({
          id: channel.id,
          name: channel.name,
          type: 'text',
          parentId: channel.parentId
        });
      } else if (channel.type === ChannelType.GuildCategory) { // Category
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
      console.log('Creating ticket panel with these details:');
      console.log('Server ID:', serverId);
      console.log('Channel ID:', channelId);
      console.log('Panel Title:', panelTitle);
      console.log('Panel Description:', panelDescription);
      console.log('Panel Color:', panelColor);
      console.log('Panel Image:', panelImage);
      console.log('Ticket Types:', JSON.stringify(parsedTicketTypes));
      
      // Validate ticket types array
      if (!Array.isArray(parsedTicketTypes)) {
        console.warn('Ticket types is not an array, converting to empty array');
        parsedTicketTypes = [];
      }
      
      // Ensure each ticket type has required properties
      parsedTicketTypes = parsedTicketTypes.map(type => ({
        label: type.label || 'Support',
        emoji: type.emoji || '🎫',
        description: type.description || 'Get support from our team'
      }));
      
      // If no ticket types, add a default one
      if (parsedTicketTypes.length === 0) {
        console.log('No ticket types provided, adding default');
        parsedTicketTypes.push({
          label: 'General Support',
          emoji: '🎫',
          description: 'Get help from our team'
        });
      }
      
      const result = await client.ticketManager.createPanel(serverId, {
        channelId,
        title: panelTitle || 'Support Tickets',
        description: panelDescription || 'Please select a ticket type from the dropdown below to get assistance.',
        color: panelColor || '#9b59b6',
        image: panelImage || null,
        ticketTypes: parsedTicketTypes
      });
      
      console.log('Panel creation result:', result);
      
      if (!result) {
        throw new Error('Failed to create ticket panel');
      }
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
 * DELETE /api/v2/servers/:serverId/ticket-panel/:panelId
 * Delete a ticket panel
 */
router.delete('/servers/:serverId/ticket-panel/:panelId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId, panelId } = req.params;
    const client = req.app.get('client');
    
    if (!client || !client.ticketManager) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ticket manager is not available' 
      });
    }
    
    console.log('Deleting ticket panel:', panelId, 'from server:', serverId);
    
    // Get existing panels
    const panels = await client.ticketManager.getTickets(serverId);
    
    // Find the panel to delete
    const panelIndex = panels.findIndex(panel => panel.id === panelId);
    
    if (panelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Panel not found'
      });
    }
    
    // Get the panel data
    const panel = panels[panelIndex];
    
    // Remove panel from storage
    panels.splice(panelIndex, 1);
    
    // Update panels in storage using client reference
    client.ticketManager.ticketPanels.set(serverId, panels);
    
    // Try to delete the message from Discord
    try {
      // Get the guild and channel
      const guild = await client.guilds.fetch(serverId);
      
      if (!guild) {
        throw new Error('Guild not found');
      }
      
      const channel = await guild.channels.fetch(panel.channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      // Try to delete the message if messageId exists
      if (panel.messageId) {
        await channel.messages.delete(panel.messageId).catch(() => {
          console.log('Could not delete panel message, it may have been deleted already');
        });
      }
    } catch (err) {
      console.error('Error deleting panel message from Discord:', err);
      // Continue even if Discord message deletion fails
    }
    
    return res.json({
      success: true,
      message: 'Panel deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket panel:', error);
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