/**
 * V2 API - Ticket Routes
 * Handles ticket-related API endpoints
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../../middlewares/auth');

// Apply auth middleware to all routes
router.use(isAuthenticated);

/**
 * GET /api/v2/servers/:serverId/tickets
 * Get all tickets for a server
 */
router.get('/servers/:serverId/tickets', async (req, res) => {
  try {
    const { serverId } = req.params;
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
    
    // Get guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Get tickets from ticket manager
    const tickets = await getTicketsForServer(ticketManager, serverId, guild);
    
    // Calculate stats
    const openTickets = tickets.filter(ticket => ticket.status.toLowerCase() === 'open');
    const closedTickets = tickets.filter(ticket => ticket.status.toLowerCase() === 'closed');
    
    // Calculate average response time (if available)
    let avgResponseTime = 0;
    const ticketsWithResponseTime = tickets.filter(ticket => ticket.firstResponseTime);
    
    if (ticketsWithResponseTime.length > 0) {
      avgResponseTime = ticketsWithResponseTime.reduce((total, ticket) => {
        return total + ticket.firstResponseTime;
      }, 0) / ticketsWithResponseTime.length;
    }
    
    return res.json({
      success: true,
      tickets,
      stats: {
        total: tickets.length,
        open: openTickets.length,
        closed: closedTickets.length,
        avgResponseTime
      }
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    return res.json({
      success: false,
      message: `Failed to get tickets: ${error.message}`
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
    
    // Get guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Get ticket config from ticket manager
    const config = await getTicketConfig(ticketManager, serverId);
    
    if (!config) {
      return res.json({
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
    console.error('Error getting ticket configuration:', error);
    return res.json({
      success: false,
      message: `Failed to get ticket configuration: ${error.message}`
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/ticket-config
 * Save ticket configuration for a server
 */
router.post('/servers/:serverId/ticket-config', async (req, res) => {
  try {
    const { serverId } = req.params;
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
    
    // Get guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Extract config from request body
    const {
      categoryId,
      supportRoleId,
      logChannelId,
      maxTickets,
      cooldown,
      autoTranscript,
      autoClose,
      inactiveHours,
      autoCloseMessage,
      requireTopic,
      useThreads,
      welcomeMessage,
      closeMessage
    } = req.body;
    
    // Create config object
    const config = {
      categoryId,
      supportRoleId,
      logChannelId,
      maxTickets: parseInt(maxTickets) || 1,
      cooldown: parseInt(cooldown) || 60,
      autoTranscript: autoTranscript === 'on',
      autoClose: autoClose === 'on',
      inactiveHours: parseInt(inactiveHours) || 24,
      autoCloseMessage,
      requireTopic: requireTopic === 'on',
      useThreads: useThreads === 'on',
      welcomeMessage,
      closeMessage
    };
    
    // Save config using ticket manager
    await saveTicketConfig(ticketManager, serverId, config);
    
    return res.json({
      success: true,
      message: 'Ticket configuration saved successfully',
      config
    });
  } catch (error) {
    console.error('Error saving ticket configuration:', error);
    return res.json({
      success: false,
      message: `Failed to save ticket configuration: ${error.message}`
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
    
    // Get guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Extract panel data from request body
    const {
      channelId,
      panelTitle,
      panelDescription,
      panelColor,
      panelImage,
      ticketTypes
    } = req.body;
    
    if (!channelId) {
      return res.json({
        success: false,
        message: 'Channel ID is required'
      });
    }
    
    // Parse ticket types
    let parsedTicketTypes = [];
    if (ticketTypes) {
      try {
        // Handle both string and array
        if (typeof ticketTypes === 'string') {
          parsedTicketTypes = JSON.parse(ticketTypes);
        } else {
          parsedTicketTypes = ticketTypes;
        }
      } catch (e) {
        console.error('Error parsing ticket types:', e);
      }
    }
    
    // Create panel data
    const panelData = {
      channelId,
      title: panelTitle || 'Support Tickets',
      description: panelDescription || 'Select an option below to create a ticket',
      color: panelColor || '#9b59b6',
      image: panelImage,
      ticketTypes: parsedTicketTypes
    };
    
    // Send panel using ticket manager
    await sendTicketPanel(ticketManager, serverId, panelData, guild);
    
    return res.json({
      success: true,
      message: 'Ticket panel sent successfully'
    });
  } catch (error) {
    console.error('Error sending ticket panel:', error);
    return res.json({
      success: false,
      message: `Failed to send ticket panel: ${error.message}`
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
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !ticketId) {
      return res.json({
        success: false,
        message: 'Server ID and ticket ID are required'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Get ticket details
    const ticket = await getTicket(ticketManager, serverId, ticketId);
    
    if (!ticket) {
      return res.json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    return res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error getting ticket details:', error);
    return res.json({
      success: false,
      message: `Failed to get ticket details: ${error.message}`
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
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !ticketId) {
      return res.json({
        success: false,
        message: 'Server ID and ticket ID are required'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Close ticket
    await closeTicket(ticketManager, serverId, ticketId, {
      reason,
      closedBy: req.user.id
    });
    
    return res.json({
      success: true,
      message: 'Ticket closed successfully'
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    return res.json({
      success: false,
      message: `Failed to close ticket: ${error.message}`
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/tickets/:ticketId/transcript
 * Get transcript for a ticket
 */
router.get('/servers/:serverId/tickets/:ticketId/transcript', async (req, res) => {
  try {
    const { serverId, ticketId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    if (!serverId || !ticketId) {
      return res.json({
        success: false,
        message: 'Server ID and ticket ID are required'
      });
    }
    
    // Get ticket manager
    const ticketManager = req.app.get('ticketManager');
    if (!ticketManager) {
      return res.json({
        success: false,
        message: 'Ticket manager not available'
      });
    }
    
    // Get ticket transcript
    const transcript = await getTicketTranscript(ticketManager, serverId, ticketId);
    
    if (!transcript) {
      return res.json({
        success: false,
        message: 'Transcript not found'
      });
    }
    
    return res.json({
      success: true,
      transcript
    });
  } catch (error) {
    console.error('Error getting ticket transcript:', error);
    return res.json({
      success: false,
      message: `Failed to get ticket transcript: ${error.message}`
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/channels
 * Get channels and categories for a server
 */
router.get('/servers/:serverId/channels', async (req, res) => {
  try {
    const { serverId } = req.params;
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
    
    // Get guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get channels
    const channels = guild.channels.cache
      .filter(channel => channel.type === 0)  // TextChannel
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: 'text',
        parentId: channel.parentId
      }));
    
    // Get categories
    const categories = guild.channels.cache
      .filter(channel => channel.type === 4)  // CategoryChannel
      .map(category => ({
        id: category.id,
        name: category.name,
        type: 'category'
      }));
    
    return res.json({
      success: true,
      channels,
      categories
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    return res.json({
      success: false,
      message: `Failed to get channels: ${error.message}`
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/roles
 * Get roles for a server
 */
router.get('/servers/:serverId/roles', async (req, res) => {
  try {
    const { serverId } = req.params;
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
    
    // Get guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Get roles
    const roles = guild.roles.cache
      .filter(role => !role.managed && role.id !== guild.id) // Exclude managed roles and @everyone
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position
      }))
      .sort((a, b) => b.position - a.position); // Sort by position (highest first)
    
    return res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    return res.json({
      success: false,
      message: `Failed to get roles: ${error.message}`
    });
  }
});

// Helper functions to interact with ticket manager
async function getTicketsForServer(ticketManager, serverId, guild) {
  // Check if getServerTickets method exists
  if (typeof ticketManager.getServerTickets === 'function') {
    return await ticketManager.getServerTickets(serverId);
  }
  
  // Fallback: Get tickets from database
  if (guild && typeof ticketManager.getTickets === 'function') {
    return await ticketManager.getTickets(guild.id);
  }
  
  // Fallback: Return empty array
  console.warn('No suitable method found to get tickets for server');
  return [];
}

async function getTicketConfig(ticketManager, serverId) {
  // Check if getServerConfig method exists
  if (typeof ticketManager.getServerConfig === 'function') {
    return await ticketManager.getServerConfig(serverId);
  }
  
  // Fallback: Get config from database
  if (typeof ticketManager.getConfig === 'function') {
    return await ticketManager.getConfig(serverId);
  }
  
  // Fallback: Return null
  console.warn('No suitable method found to get ticket config');
  return null;
}

async function saveTicketConfig(ticketManager, serverId, config) {
  // Check if saveServerConfig method exists
  if (typeof ticketManager.saveServerConfig === 'function') {
    return await ticketManager.saveServerConfig(serverId, config);
  }
  
  // Fallback: Save config to database
  if (typeof ticketManager.saveConfig === 'function') {
    return await ticketManager.saveConfig(serverId, config);
  }
  
  // Fallback: Log warning
  console.warn('No suitable method found to save ticket config');
  return false;
}

async function sendTicketPanel(ticketManager, serverId, panelData, guild) {
  // Check if sendTicketPanel method exists
  if (typeof ticketManager.sendTicketPanel === 'function') {
    return await ticketManager.sendTicketPanel(serverId, panelData);
  }
  
  // Fallback: Create panel manually
  if (typeof ticketManager.createTicketPanel === 'function') {
    return await ticketManager.createTicketPanel(guild, panelData);
  }
  
  // Fallback: Log warning
  console.warn('No suitable method found to send ticket panel');
  return false;
}

async function getTicket(ticketManager, serverId, ticketId) {
  // Check if getTicket method exists
  if (typeof ticketManager.getTicket === 'function') {
    return await ticketManager.getTicket(serverId, ticketId);
  }
  
  // Fallback: Get ticket from database
  if (typeof ticketManager.getTicketById === 'function') {
    return await ticketManager.getTicketById(serverId, ticketId);
  }
  
  // Fallback: Return null
  console.warn('No suitable method found to get ticket');
  return null;
}

async function closeTicket(ticketManager, serverId, ticketId, options) {
  // Check if closeTicketById method exists
  if (typeof ticketManager.closeTicketById === 'function') {
    return await ticketManager.closeTicketById(serverId, ticketId, options);
  }
  
  // Fallback: Close ticket via different method
  if (typeof ticketManager.closeTicket === 'function') {
    return await ticketManager.closeTicket(serverId, ticketId, options);
  }
  
  // Fallback: Log warning
  console.warn('No suitable method found to close ticket');
  return false;
}

async function getTicketTranscript(ticketManager, serverId, ticketId) {
  // Check if getTicketTranscript method exists
  if (typeof ticketManager.getTicketTranscript === 'function') {
    return await ticketManager.getTicketTranscript(serverId, ticketId);
  }
  
  // Fallback: Generate transcript via different method
  if (typeof ticketManager.generateTranscript === 'function') {
    return await ticketManager.generateTranscript(serverId, ticketId);
  }
  
  // Fallback: Log warning
  console.warn('No suitable method found to get ticket transcript');
  return null;
}

module.exports = router;