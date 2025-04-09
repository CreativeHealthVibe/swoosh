/**
 * API Routes for the SWOOSH Discord Bot
 * Provides server-side API endpoints for the admin dashboard and client applications
 */

const express = require('express');
const router = express.Router();
// Import middleware
const authMiddleware = require('../middlewares/auth');
const isAdmin = authMiddleware.isAdmin;
const isAuthenticated = authMiddleware.isAuthenticated;
const fs = require('fs');
const path = require('path');
const { attachFile } = require('discord.js');

// Import specialized API routers
const moderationRoutes = require('./api-moderation');

// Make client available to all routes
let client;
// Get the client object passed from the main app
router.use((req, res, next) => {
  client = req.app.get('client');
  next();
});

/**
 * General API status route (public)
 * @route GET /api/server-health
 * @access Public
 */
router.get('/server-health', (req, res) => {
  try {
    // Get basic server health information
    const health = {
      status: 'online',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      discord: {
        status: client.ws.status === 0 ? 'online' : 'degraded',
        ping: client.ws.ping,
        servers: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size
      }
    };
    
    res.json(health);
  } catch (error) {
    console.error('Error in /api/server-health:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get list of servers the bot is in
 * @route GET /api/servers
 * @access Private (Admins only)
 */
router.get('/servers', isAuthenticated, isAdmin, (req, res) => {
  try {
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 64 }) || null,
      memberCount: guild.memberCount,
      owner: guild.ownerId,
      createdAt: guild.createdAt,
      joinedAt: guild.joinedAt
    }));
    
    res.json({
      success: true,
      count: guilds.length,
      servers: guilds
    });
  } catch (error) {
    console.error('Error in /api/servers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get server list',
      message: error.message
    });
  }
});

/**
 * Get channels for a server
 * @route GET /api/servers/:serverId/channels
 * @access Private (Admins only)
 */
router.get('/servers/:serverId/channels', isAuthenticated, isAdmin, (req, res) => {
  try {
    const serverId = req.params.serverId;
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }
    
    // Get all text channels where the bot can send messages
    const textChannels = guild.channels.cache
      .filter(channel => 
        channel.type === 0 && // TextChannel type
        channel.permissionsFor(guild.members.me).has('SendMessages')
      )
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: 'text',
        parentId: channel.parentId,
        position: channel.position
      }));
    
    // Get categories to organize channels
    const categories = guild.channels.cache
      .filter(channel => channel.type === 4) // CategoryChannel type
      .map(category => ({
        id: category.id,
        name: category.name,
        type: 'category',
        position: category.position
      }));
    
    res.json({
      success: true,
      serverId: serverId,
      serverName: guild.name,
      categories: categories,
      channels: textChannels
    });
  } catch (error) {
    console.error(`Error in /api/servers/${req.params.serverId}/channels:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get channels',
      message: error.message
    });
  }
});

/**
 * Send a message to a channel
 * @route POST /api/servers/:serverId/channels/:channelId/messages
 * @access Private (Admins only)
 */
router.post('/servers/:serverId/channels/:channelId/messages', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    const { content, title, color, footer, attachment } = req.body;
    
    if (!content && !title) {
      return res.status(400).json({
        success: false,
        error: 'Message content or embed title is required'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }
    
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    // Check if the bot can send messages in this channel
    if (!channel.permissionsFor(guild.members.me).has('SendMessages')) {
      return res.status(403).json({
        success: false,
        error: 'Bot does not have permission to send messages in this channel'
      });
    }
    
    let attachmentFile = null;
    
    // If sending a regular message
    if (content && !title) {
      await channel.send(content);
    } 
    // If sending an embed
    else {
      const embed = {
        title: title || undefined,
        description: content || undefined,
        color: color ? parseInt(color.replace('#', ''), 16) : 0x7289DA,
        timestamp: new Date(),
        footer: footer ? { text: footer } : undefined
      };
      
      // Send the embed
      await channel.send({ embeds: [embed] });
    }
    
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message',
      message: error.message
    });
  }
});

/**
 * Get user information from Discord
 * @route GET /api/users/:userId
 * @access Private (Admins only)
 */
router.get('/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    try {
      // Try to fetch from the client cache first
      let user = client.users.cache.get(userId);
      
      // If not in cache, fetch from API
      if (!user) {
        user = await client.users.fetch(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Get mutual servers
      const mutualGuilds = client.guilds.cache
        .filter(guild => guild.members.cache.has(userId))
        .map(guild => ({
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL({ dynamic: true, size: 32 })
        }));
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator || '0',
          avatar: user.displayAvatarURL({ dynamic: true }),
          createdAt: user.createdAt,
          isBot: user.bot,
          mutualGuilds
        }
      });
    } catch (fetchError) {
      // If Discord API couldn't find the user
      return res.status(404).json({
        success: false,
        error: 'User not found or could not be fetched from Discord API'
      });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user information',
      message: error.message
    });
  }
});

/**
 * Verify a ban ID exists
 * @route GET /api/bans/:banId
 * @access Private (Admins only)
 */
router.get('/bans/:banId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const banId = req.params.banId;
    
    // Load ban data from database or file storage
    const bansPath = path.join(__dirname, '../data/bans.json');
    
    if (!fs.existsSync(bansPath)) {
      return res.status(404).json({
        success: false,
        error: 'Ban database not found'
      });
    }
    
    const bansData = JSON.parse(fs.readFileSync(bansPath, 'utf8'));
    const ban = bansData.find(b => b.id === banId);
    
    if (!ban) {
      return res.status(404).json({
        success: false,
        error: 'Ban record not found'
      });
    }
    
    res.json({
      success: true,
      ban
    });
  } catch (error) {
    console.error('Error verifying ban:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify ban',
      message: error.message
    });
  }
});

/**
 * Get news channel for a server
 * @route GET /api/servers/:serverId/news-channel
 * @access Private (Admins only)
 */
router.get('/servers/:serverId/news-channel', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const serverId = req.params.serverId;
    
    // Load news channel data
    const newsChannelsPath = path.join(__dirname, '../data/news-channels.json');
    
    if (!fs.existsSync(newsChannelsPath)) {
      return res.json({
        success: true,
        hasNewsChannel: false,
        message: 'No news channel configured'
      });
    }
    
    const newsChannels = JSON.parse(fs.readFileSync(newsChannelsPath, 'utf8'));
    const serverNewsChannel = newsChannels[serverId];
    
    if (!serverNewsChannel) {
      return res.json({
        success: true,
        hasNewsChannel: false,
        message: 'No news channel configured for this server'
      });
    }
    
    // Verify the channel still exists
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }
    
    const channel = guild.channels.cache.get(serverNewsChannel.channelId);
    if (!channel) {
      return res.json({
        success: true,
        hasNewsChannel: false,
        message: 'Configured news channel no longer exists',
        savedChannel: serverNewsChannel
      });
    }
    
    res.json({
      success: true,
      hasNewsChannel: true,
      newsChannel: {
        id: channel.id,
        name: channel.name,
        serverId: serverId,
        serverName: guild.name,
        setBy: serverNewsChannel.setBy,
        setAt: serverNewsChannel.setAt
      }
    });
  } catch (error) {
    console.error('Error getting news channel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get news channel information',
      message: error.message
    });
  }
});

// Use moderation API routes
router.use('/moderation', moderationRoutes);

// Enhanced system information for monitoring and stats
router.get('/system-stats', isAuthenticated, isAdmin, (req, res) => {
  try {
    const os = require('os');
    
    // CPU information
    const cpuCount = os.cpus().length;
    const loadAverage = os.loadAverage();
    const cpuUsage = Math.round(loadAverage[0] * 100 / cpuCount);
    
    // Memory information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = process.memoryUsage().rss;
    const memoryUsedPercentage = Math.round((totalMemory - freeMemory) * 100 / totalMemory);
    
    // System information
    const systemInfo = {
      uptime: {
        totalSeconds: process.uptime(),
        days: Math.floor(process.uptime() / 86400),
        hours: Math.floor(process.uptime() / 3600) % 24,
        minutes: Math.floor(process.uptime() / 60) % 60,
        seconds: Math.floor(process.uptime() % 60)
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
      },
      cpu: {
        count: cpuCount,
        usage: cpuUsage,
        loadAverage: loadAverage
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usedPercentage: memoryUsedPercentage
      },
      discord: {
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size,
        commands: client.commands ? client.commands.size : 'N/A'
      }
    };
    
    res.json(systemInfo);
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get system statistics',
      message: error.message
    });
  }
});

module.exports = router;