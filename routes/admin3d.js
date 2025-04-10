/**
 * 3D Admin Dashboard Routes
 * Advanced admin interface with 3D visualization
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const config = require('../config');
const path = require('path');

// Apply admin authentication middleware to all routes
router.use(isAdmin);

/**
 * GET /admin3d
 * Root admin 3D dashboard route
 */
router.get('/', (req, res) => {
  res.render('admin3d/index', {
    title: '3D Admin Dashboard | SWOOSH Bot',
    user: req.user,
    client: req.app.get('client'),
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/commands
 * Commands management interface
 */
router.get('/commands', (req, res) => {
  // Get available commands from client
  const client = req.app.get('client');
  const commands = client ? 
    Array.from(client.commands.values())
      .filter(cmd => !cmd.hidden) // Filter out hidden commands
      .sort((a, b) => a.name.localeCompare(b.name)) : 
    [];

  // Get slash commands
  const slashCommands = client ? 
    Array.from(client.slashCommands.values())
      .filter(cmd => !cmd.hidden) // Filter out hidden commands
      .sort((a, b) => a.name.localeCompare(b.name)) : 
    [];
  
  res.render('admin3d/commands', {
    title: 'Commands Management | SWOOSH Bot',
    user: req.user,
    commands,
    slashCommands,
    client,
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/moderation
 * Moderation tools interface
 */
router.get('/moderation', (req, res) => {
  const client = req.app.get('client');
  
  res.render('admin3d/moderation', {
    title: 'Moderation Tools | SWOOSH Bot',
    user: req.user,
    client,
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/messages
 * Message management interface for sending news and embeds
 */
router.get('/messages', (req, res) => {
  const client = req.app.get('client');
  
  // Get available channels if client is available
  let channels = [];
  if (client) {
    // Get all text channels from all guilds
    client.guilds.cache.forEach(guild => {
      const guildChannels = guild.channels.cache
        .filter(channel => channel.type === 0) // 0 is TextChannel
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          guild: guild.name,
          guildId: guild.id
        }));
      
      channels = channels.concat(guildChannels);
    });
    
    // Sort channels by guild name then channel name
    channels.sort((a, b) => {
      if (a.guild !== b.guild) {
        return a.guild.localeCompare(b.guild);
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  res.render('admin3d/messages', {
    title: 'Message Management | SWOOSH Bot',
    user: req.user,
    client,
    channels,
    layout: 'layouts/admin3d'
  });
});

/**
 * POST /admin3d/messages/send-news
 * Send news update to configured channel
 */
router.post('/messages/send-news', (req, res) => {
  const { newsTitle, newsContent, newsColor, newsImage } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!newsTitle || !newsContent) {
    return res.json({
      success: false,
      message: 'News title and content are required'
    });
  }
  
  // Try to get news channel from database
  (async () => {
    try {
      // Attempt to get news channel from database
      let newsChannelId = null;
      let guild = null;
      
      // Try to get the news channel from the database
      if (client.discordDB) {
        const servers = client.guilds.cache.map(g => g.id);
        
        // Check each server for a news channel configuration
        for (const guildId of servers) {
          const guildConfig = await client.discordDB.getDocument('configs', guildId);
          
          if (guildConfig && guildConfig.newsChannel) {
            newsChannelId = guildConfig.newsChannel;
            guild = client.guilds.cache.get(guildId);
            break;
          }
        }
      }
      
      if (!newsChannelId) {
        return res.json({
          success: false,
          message: 'No news channel configured. Use the /setnews command in Discord first.'
        });
      }
      
      // Try to fetch the channel
      const channel = await client.channels.fetch(newsChannelId).catch(() => null);
      
      if (!channel) {
        return res.json({
          success: false,
          message: 'News channel not found or bot does not have access to it'
        });
      }
      
      // Create the news embed
      const embed = {
        title: newsTitle,
        description: newsContent,
        color: parseInt(newsColor.replace('#', ''), 16),
        timestamp: new Date(),
        footer: {
          text: `News by ${req.user.username} • SWOOSH Bot`
        }
      };
      
      // Add image if provided
      if (newsImage && newsImage.trim()) {
        embed.image = { url: newsImage };
      }
      
      // Send the news
      await channel.send({ embeds: [embed] });
      
      return res.json({
        success: true,
        message: `News sent to #${channel.name} in ${guild.name}`
      });
    } catch (error) {
      console.error('Error sending news:', error);
      return res.json({
        success: false,
        message: `Failed to send news: ${error.message}`
      });
    }
  })();
});

/**
 * POST /admin3d/messages/send-embed
 * Send an embed message to a specific channel
 */
router.post('/messages/send-embed', (req, res) => {
  const { channel, title, description, color, footer } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!channel || !title || !description) {
    return res.json({
      success: false,
      message: 'Channel, title, and description are required'
    });
  }
  
  (async () => {
    try {
      // Get the channel
      const targetChannel = await client.channels.fetch(channel).catch(() => null);
      
      if (!targetChannel) {
        return res.json({
          success: false,
          message: 'Channel not found or bot does not have access to it'
        });
      }
      
      // Check permissions
      const permissions = targetChannel.permissionsFor(targetChannel.guild.members.me);
      if (!permissions.has('ManageWebhooks')) {
        return res.json({
          success: false,
          message: 'Bot does not have permission to manage webhooks in that channel'
        });
      }
      
      // Create a webhook
      const webhookManager = require('../handlers/webhookManager');
      const webhookResult = await webhookManager.createWebhook(
        targetChannel,
        client.user.username,
        client.user.displayAvatarURL()
      );
      
      if (!webhookResult.success) {
        return res.json({
          success: false,
          message: `Failed to create webhook: ${webhookResult.error}`
        });
      }
      
      // Get the webhook
      const webhook = webhookResult.webhook;
      
      // Create the embed
      const embed = {
        title: title,
        description: description,
        color: color ? parseInt(color.replace('#', ''), 16) : 0x7289DA,
        timestamp: new Date(),
        footer: footer ? 
          { text: footer } : 
          { text: `Sent by ${req.user.username}` }
      };
      
      // Send the message via webhook
      await webhook.send({
        username: client.user.username,
        avatarURL: client.user.displayAvatarURL(),
        embeds: [embed]
      });
      
      return res.json({
        success: true,
        message: `Embed message sent to #${targetChannel.name}`
      });
    } catch (error) {
      console.error('Error sending webhook message:', error);
      return res.json({
        success: false,
        message: `Failed to send message: ${error.message}`
      });
    }
  })();
});

/**
 * GET /admin3d/tickets
 * Ticket management interface
 */
router.get('/tickets', (req, res) => {
  const client = req.app.get('client');
  
  res.render('admin3d/tickets', {
    title: 'Ticket Management | SWOOSH Bot',
    user: req.user,
    client,
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/roles
 * Role management interface
 */
router.get('/roles', (req, res) => {
  const client = req.app.get('client');
  
  res.render('admin3d/roles', {
    title: 'Role Management | SWOOSH Bot',
    user: req.user,
    client,
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/blacklist
 * Blacklist management interface
 */
router.get('/blacklist', (req, res) => {
  const client = req.app.get('client');
  
  res.render('admin3d/blacklist', {
    title: 'Blacklist Management | SWOOSH Bot',
    user: req.user,
    client,
    layout: 'layouts/admin3d'
  });
});

/**
 * POST /admin3d/blacklist/add
 * Add a user to the blacklist
 */
router.post('/blacklist/add', (req, res) => {
  const { userId, reason, duration, level } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!userId || !reason) {
    return res.json({
      success: false,
      message: 'User ID and reason are required'
    });
  }
  
  try {
    // Use blacklist manager from the client
    const blacklistManager = require('../handlers/blacklistManager');
    
    // Convert duration string to milliseconds if not permanent
    let durationMs = null;
    if (duration && duration !== 'permanent') {
      const unit = duration.slice(-1);
      const value = parseInt(duration.slice(0, -1));
      
      switch (unit) {
        case 'h': // Hours
          durationMs = value * 60 * 60 * 1000;
          break;
        case 'd': // Days
          durationMs = value * 24 * 60 * 60 * 1000;
          break;
        default:
          durationMs = 0; // Invalid unit
      }
    }
    
    // Add to blacklist
    const result = blacklistManager.addToBlacklist(
      userId,
      req.user.id, // Admin ID
      reason,
      durationMs,
      level || 'commands'
    );
    
    if (result && result.success) {
      return res.json({
        success: true,
        message: 'User added to blacklist successfully'
      });
    } else {
      return res.json({
        success: false,
        message: (result && result.message) || 'Failed to add user to blacklist'
      });
    }
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    return res.json({
      success: false,
      message: 'Failed to add to blacklist: ' + error.message
    });
  }
});

/**
 * GET /admin3d/stats
 * Server statistics and metrics
 */
router.get('/stats', (req, res) => {
  const client = req.app.get('client');
  
  // Calculate bot uptime
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  // Get system stats
  const cpuCount = require('os').cpus().length;
  const memoryUsage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const freeMemory = require('os').freemem();
  
  // Server stats
  let serverStats = {
    servers: client ? client.guilds.cache.size : 0,
    users: 0,
    channels: 0
  };
  
  if (client) {
    client.guilds.cache.forEach(guild => {
      serverStats.users += guild.memberCount;
      serverStats.channels += guild.channels.cache.size;
    });
  }
  
  res.render('admin3d/stats', {
    title: 'Server Statistics | SWOOSH Bot',
    user: req.user,
    client,
    uptime: { days, hours, minutes, seconds, totalSeconds: uptime },
    system: {
      cpuCount,
      memoryUsage,
      totalMemory,
      freeMemory,
      platform: require('os').platform(),
      arch: require('os').arch()
    },
    serverStats,
    layout: 'layouts/admin3d'
  });
});

/**
 * GET /admin3d/profile
 * Admin profile and settings
 */
router.get('/profile', (req, res) => {
  const client = req.app.get('client');
  
  // Get user roles from Discord if client is available
  let userRoles = [];
  let mutualGuilds = [];
  
  if (client && req.user) {
    // Get mutual guilds between the bot and the user
    mutualGuilds = client.guilds.cache
      .filter(guild => {
        // Check if user is in this guild
        return guild.members.cache.has(req.user.id) || 
          (req.user.guilds && req.user.guilds.some(g => g.id === guild.id));
      })
      .map(guild => ({
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL({ dynamic: true }) || null,
        memberCount: guild.memberCount
      }));
      
    // Get user roles from the first mutual guild
    if (mutualGuilds.length > 0 && client.guilds.cache.has(mutualGuilds[0].id)) {
      const guild = client.guilds.cache.get(mutualGuilds[0].id);
      const member = guild.members.cache.get(req.user.id);
      
      if (member) {
        userRoles = member.roles.cache
          .sort((a, b) => b.position - a.position)
          .map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            position: role.position
          }))
          .filter(role => role.name !== '@everyone');
      }
    }
  }
  
  res.render('admin3d/profile', {
    title: 'Admin Profile | SWOOSH Bot',
    user: req.user,
    client,
    userRoles,
    mutualGuilds,
    layout: 'layouts/admin3d'
  });
});

module.exports = router;