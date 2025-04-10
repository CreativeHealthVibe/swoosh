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
 * Moderation tools interface - Premium Edition
 */
router.get('/moderation', (req, res) => {
  const client = req.app.get('client');
  
  // Get available servers if client is available
  let servers = [];
  if (client) {
    servers = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name + ' (' + guild.memberCount + ')',
      memberCount: guild.memberCount
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  res.render('admin3d/moderation', {
    title: 'Moderation Command Center | SWOOSH Bot',
    user: req.user,
    client,
    servers,
    customStyles: ['admin3d-moderation-custom.css'], // Add custom moderation styles
    layout: 'layouts/admin3d'
  });
});

/**
 * POST /admin3d/moderation/ban-user
 * Ban a user from a server
 */
router.post('/moderation/ban-user', (req, res) => {
  const { userId, banReason, banDuration, deleteMessages, addToBlacklist } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!userId) {
    return res.json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  // For demonstration, we'll just return success
  console.log(`Ban request received for user ${userId} with reason: ${banReason}`);
  
  // This would be replaced with actual ban logic in a real implementation
  return res.json({
    success: true,
    message: `User ${userId} has been banned successfully`
  });
});

/**
 * POST /admin3d/moderation/warn-user
 * Issue a warning to a user
 */
router.post('/moderation/warn-user', (req, res) => {
  const { warnUserId, warnReason, warningSeverity, warningDuration, notifyUser } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!warnUserId) {
    return res.json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  // For demonstration, we'll just return success
  console.log(`Warning request received for user ${warnUserId} with reason: ${warnReason}`);
  
  // This would be replaced with actual warning logic in a real implementation
  return res.json({
    success: true,
    message: `Warning issued to user ${warnUserId} successfully`
  });
});

/**
 * POST /admin3d/moderation/automod-settings
 * Save auto-moderation settings
 */
router.post('/moderation/automod-settings', (req, res) => {
  const { serverId } = req.body;
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
  
  // For demonstration, we'll just return success
  console.log(`Auto-mod settings received for server ${serverId}`);
  
  // This would be replaced with actual settings save logic in a real implementation
  return res.json({
    success: true,
    message: 'Auto-moderation settings saved successfully'
  });
});

/**
 * POST /admin3d/moderation/save-filter
 * Save a custom message filter
 */
router.post('/moderation/save-filter', (req, res) => {
  const { 
    serverId, filterName, conditionType, conditionValue, 
    conditionLogic, customLogic, filterAction, actionMessage 
  } = req.body;
  
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!serverId || !filterName) {
    return res.json({
      success: false,
      message: 'Server ID and filter name are required'
    });
  }
  
  // Log the filter details for demonstration
  console.log('New filter created:', {
    serverId,
    filterName,
    conditions: Array.isArray(conditionType) ? 
      conditionType.map((type, i) => ({
        type,
        value: conditionValue[i]
      })) : 
      [{ type: conditionType, value: conditionValue }],
    logic: conditionLogic === 'custom' ? customLogic : conditionLogic,
    action: filterAction,
    actionMessage
  });
  
  // Create unique filter ID using timestamp
  const filterId = `filter_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
  // This would be replaced with actual database storage in a real implementation
  return res.json({
    success: true,
    message: 'Message filter saved successfully',
    filterId
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
 * POST /admin3d/messages/send-dm
 * Send a direct message to a Discord user
 */
router.post('/messages/send-dm', (req, res) => {
  const { userId, messageContent } = req.body;
  const client = req.app.get('client');
  
  if (!client) {
    return res.json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  if (!userId || !messageContent) {
    return res.json({
      success: false,
      message: 'User ID and message content are required'
    });
  }
  
  // Validate user ID format
  if (!/^\d{17,19}$/.test(userId)) {
    return res.json({
      success: false,
      message: 'Invalid Discord user ID format'
    });
  }
  
  (async () => {
    try {
      // Try to fetch the user
      const targetUser = await client.users.fetch(userId);
      
      if (!targetUser) {
        return res.json({
          success: false,
          message: 'Could not find that user'
        });
      }
      
      // Create the DM embed
      const embed = {
        title: 'Message from Bot Admin',
        description: messageContent,
        color: 0x8936ff,
        timestamp: new Date(),
        footer: {
          text: `Sent by ${req.user.username || 'Administrator'} • SWOOSH Bot`
        }
      };
      
      // Send the DM
      await targetUser.send({ embeds: [embed] });
      
      // Log the DM
      console.log(`DM sent to ${targetUser.tag} (${targetUser.id}) by ${req.user.username}`);
      
      return res.json({
        success: true,
        message: `Message sent to ${targetUser.tag}`
      });
    } catch (error) {
      console.error('Error sending DM:', error);
      return res.json({
        success: false,
        message: `Failed to send DM: ${error.message}`
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
router.get('/profile', async (req, res) => {
  const client = req.app.get('client');
  
  // Get user roles from Discord if client is available
  let userRoles = [];
  let mutualGuilds = [];
  let userInfo = req.user; // Start with the basic user info from session
  
  try {
    // Debug what we have in the session
    console.log('Session user data:', JSON.stringify(req.user, null, 2));
    
    // Check if we have the user's access token from OAuth
    if (req.user && req.user.accessToken) {
      console.log('Access token found in session, making Discord API call');
      // Make a call to Discord API to get detailed user info
      const fetch = require('node-fetch');
      
      // Get user profile from Discord
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bearer ${req.user.accessToken}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('Discord user data fetched successfully:', JSON.stringify(userData, null, 2));
        
        // Enhance user object with more details from the API
        userInfo = {
          ...req.user,
          ...userData,
          // Make sure we have the avatar URL properly formatted
          avatarURL: userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
            : 'https://cdn.discordapp.com/embed/avatars/0.png'
        };
        
        // Get user's connections if authorized
        try {
          const connectionsResponse = await fetch('https://discord.com/api/v10/users/@me/connections', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          });
          
          if (connectionsResponse.ok) {
            userInfo.connections = await connectionsResponse.json();
          }
        } catch (connErr) {
          console.error('Error fetching user connections:', connErr);
        }
        
        // Get user's guilds if authorized
        try {
          const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          });
          
          if (guildsResponse.ok) {
            const userGuilds = await guildsResponse.json();
            console.log('User guilds fetched:', userGuilds.length);
            // Process user's guilds
            
            // Now get mutual guilds with the bot
            if (client) {
              const botGuildIds = client.guilds.cache.map(g => g.id);
              
              mutualGuilds = userGuilds
                .filter(g => botGuildIds.includes(g.id))
                .map(guild => {
                  // If we have the guild in the bot's cache, use that for member count
                  const botGuild = client.guilds.cache.get(guild.id);
                  return {
                    id: guild.id,
                    name: guild.name,
                    iconURL: guild.icon 
                      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
                      : null,
                    memberCount: botGuild ? botGuild.memberCount : '?',
                    permissions: guild.permissions
                  };
                });
                
              // For the first mutual guild, try to get the user's roles
              if (mutualGuilds.length > 0) {
                const primaryGuild = client.guilds.cache.get(mutualGuilds[0].id);
                if (primaryGuild) {
                  try {
                    // Fetch member to ensure we have the latest data
                    const member = await primaryGuild.members.fetch(req.user.id);
                    
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
                  } catch (memberErr) {
                    console.error('Error fetching guild member:', memberErr);
                  }
                }
              }
            }
          }
        } catch (guildsErr) {
          console.error('Error fetching user guilds:', guildsErr);
        }
      } else {
        const errorText = await userResponse.text();
        console.error('Discord API error:', userResponse.status, errorText);
      }
    }
  } catch (err) {
    console.error('Error fetching Discord user data:', err);
  }
  
  // If client is available but we didn't get mutual guilds from API (token might be expired)
  if (client && req.user && mutualGuilds.length === 0) {
    // Get mutual guilds between the bot and the user using the bot's cache
    mutualGuilds = client.guilds.cache
      .filter(guild => {
        return guild.members.cache.has(req.user.id);
      })
      .map(guild => ({
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL({ dynamic: true }) || null,
        memberCount: guild.memberCount
      }));
      
    // Get user roles from the first mutual guild
    if (mutualGuilds.length > 0 && userRoles.length === 0) {
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
    user: userInfo,
    client,
    userRoles,
    mutualGuilds,
    layout: 'layouts/admin3d'
  });
});

module.exports = router;