/**
 * Tickets API Routes
 * Handles ticket operations from the 3D admin panel
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const fs = require('fs').promises;
const path = require('path');

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * GET /api/v2/servers/:serverId/tickets
 * Get all tickets for a server
 */
router.get('/servers/:serverId/tickets', async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to get tickets
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.getTickets !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Get tickets for the server
    const tickets = await ticketManager.getTickets(serverId);
    
    // Get ticket statistics
    const stats = {
      total: tickets.length,
      open: tickets.filter(ticket => ticket.status === 'OPEN').length,
      closed: tickets.filter(ticket => ticket.status === 'CLOSED').length,
      avgResponseTime: calculateAverageResponseTime(tickets)
    };
    
    res.json({
      success: true,
      serverId,
      tickets,
      stats
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tickets: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId
 * Get details for a specific ticket
 */
router.get('/servers/:serverId/tickets/:ticketId', async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to get ticket details
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.getTicketById !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Get ticket details
    const ticket = await ticketManager.getTicketById(serverId, ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error getting ticket details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket details: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/tickets/:ticketId/close
 * Close a ticket
 */
router.post('/servers/:serverId/tickets/:ticketId/close', async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const { reason } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to close the ticket
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.closeTicket !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Close the ticket
    const result = await ticketManager.closeTicket(serverId, ticketId, {
      closedBy: req.user.id,
      reason: reason || 'Closed by admin via dashboard'
    });
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Failed to close ticket'
      });
    }
    
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

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId/transcript-preview
 * Get a preview of the transcript for a ticket
 */
router.get('/servers/:serverId/tickets/:ticketId/transcript-preview', async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to get transcript preview
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.getTicketById !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Get ticket details
    const ticket = await ticketManager.getTicketById(serverId, ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Get channel
    const channel = guild.channels.cache.get(ticket.channelId);
    
    if (!channel) {
      return res.json({
        success: true,
        messages: []
      });
    }
    
    // Fetch last 25 messages
    const messages = await channel.messages.fetch({ limit: 25 });
    
    // Format messages for preview
    const formattedMessages = Array.from(messages.values())
      .reverse() // Most recent first
      .map(message => ({
        id: message.id,
        content: message.content || '[Attachment or Embed]',
        timestamp: message.createdAt,
        author: {
          id: message.author.id,
          username: message.author.username,
          discriminator: message.author.discriminator || '0000',
          avatar: message.author.displayAvatarURL({ dynamic: true, size: 64 }),
          isBot: message.author.bot
        }
      }));
    
    res.json({
      success: true,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error getting transcript preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transcript preview: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId/transcript-download
 * Download the transcript for a ticket
 */
router.get('/servers/:serverId/tickets/:ticketId/transcript-download', async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to generate transcript
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.generateTranscript !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Transcript generation not available'
      });
    }
    
    // Get ticket details
    const ticket = await ticketManager.getTicketById(serverId, ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Get channel
    const channel = guild.channels.cache.get(ticket.channelId);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Ticket channel not found'
      });
    }
    
    // Generate transcript
    const transcriptPath = await ticketManager.generateTranscript(channel);
    
    if (!transcriptPath) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate transcript'
      });
    }
    
    // Send the file
    res.download(transcriptPath, `ticket-${ticketId}.html`, err => {
      if (err) {
        console.error('Error sending transcript:', err);
      }
      
      // Clean up temporary file
      fs.unlink(transcriptPath).catch(unlinkErr => {
        console.error('Error deleting temporary transcript file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Error downloading transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download transcript: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/ticket-config
 * Get ticket configuration for a server
 */
router.get('/servers/:serverId/ticket-config', async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to get configuration
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.getConfig !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Get ticket configuration
    const config = await ticketManager.getConfig(serverId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ticket configuration not found',
        code: 'CONFIG_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error getting ticket configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket configuration: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/ticket-config
 * Set ticket configuration for a server
 */
router.post('/servers/:serverId/ticket-config', async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Use the ticket manager to set configuration
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.setConfig !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Set ticket configuration
    const config = req.body;
    const result = await ticketManager.setConfig(serverId, config);
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Failed to set ticket configuration'
      });
    }
    
    res.json({
      success: true,
      message: 'Ticket configuration saved successfully',
      config: result.config
    });
  } catch (error) {
    console.error('Error setting ticket configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set ticket configuration: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/ticket-panel
 * Send a ticket panel to a channel
 */
router.post('/servers/:serverId/ticket-panel', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { channelId, title, description, buttonLabel } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Check if channel exists
    const channel = guild.channels.cache.get(channelId);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    // Use the ticket manager to send panel
    const ticketManager = req.app.get('ticketManager') || require('../../handlers/ticketManager');
    
    if (!ticketManager || typeof ticketManager.sendTicketPanel !== 'function') {
      return res.status(501).json({
        success: false,
        message: 'Ticket system not initialized or not available'
      });
    }
    
    // Send ticket panel
    const result = await ticketManager.sendTicketPanel(channel, {
      title: title || 'Support Tickets',
      description: description || 'Click the button below to create a support ticket.',
      buttonLabel: buttonLabel || 'Create Ticket'
    });
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Failed to send ticket panel'
      });
    }
    
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

/**
 * Calculate average response time for tickets
 * @param {Array} tickets - List of tickets
 * @returns {number} - Average response time in seconds
 */
function calculateAverageResponseTime(tickets) {
  if (!tickets || tickets.length === 0) {
    return 0;
  }
  
  // Filter tickets with response time data
  const ticketsWithResponseTime = tickets.filter(ticket => ticket.firstResponseTime);
  
  if (ticketsWithResponseTime.length === 0) {
    return 0;
  }
  
  // Calculate average
  const totalResponseTime = ticketsWithResponseTime.reduce(
    (total, ticket) => total + ticket.firstResponseTime, 0
  );
  
  return Math.round(totalResponseTime / ticketsWithResponseTime.length);
}

module.exports = router;