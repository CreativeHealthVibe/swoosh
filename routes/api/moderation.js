/**
 * Moderation API Routes
 * Handles moderation operations from the 3D admin panel
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * GET /api/v2/servers/:serverId/bans
 * Get all bans for a server
 */
router.get('/servers/:serverId/bans', async (req, res) => {
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
    
    // Fetch bans
    const bans = await guild.bans.fetch();
    
    // Convert to array and enhance with metadata if available
    const banList = Array.from(bans.values()).map(ban => {
      const enhancedBan = {
        id: ban.user.id,
        user: {
          id: ban.user.id,
          username: ban.user.username,
          discriminator: ban.user.discriminator || '0000',
          avatar: ban.user.displayAvatarURL({ dynamic: true })
        },
        reason: ban.reason
      };
      
      // Try to find additional ban info in logs
      if (client.logs && client.logs.bans) {
        const banLog = client.logs.bans.find(log => log.userId === ban.user.id && log.guildId === serverId);
        
        if (banLog) {
          enhancedBan.executor = banLog.executorId ? {
            id: banLog.executorId,
            username: banLog.executorName || 'Unknown',
            discriminator: banLog.executorDiscriminator || '0000',
            avatar: banLog.executorAvatar || null
          } : null;
          
          enhancedBan.createdAt = banLog.timestamp;
        }
      }
      
      return enhancedBan;
    });
    
    res.json({
      success: true,
      serverId,
      banCount: banList.length,
      bans: banList
    });
  } catch (error) {
    console.error('Error getting bans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bans: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/moderation-logs
 * Get moderation logs for a server
 */
router.get('/servers/:serverId/moderation-logs', async (req, res) => {
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
    
    // Initialize logs array
    let logs = [];
    
    // Get ban logs if available
    if (client.logs && client.logs.bans) {
      const banLogs = client.logs.bans
        .filter(log => log.guildId === serverId)
        .map(log => ({
          type: 'ban',
          user: {
            id: log.userId,
            username: log.userName || 'Unknown',
            discriminator: log.userDiscriminator || '0000',
            avatar: log.userAvatar || null
          },
          executor: log.executorId ? {
            id: log.executorId,
            username: log.executorName || 'Unknown',
            discriminator: log.executorDiscriminator || '0000',
            avatar: log.executorAvatar || null
          } : null,
          reason: log.reason,
          timestamp: log.timestamp,
          deleteDays: log.deleteDays
        }));
      
      logs = logs.concat(banLogs);
    }
    
    // Get unban logs if available
    if (client.logs && client.logs.unbans) {
      const unbanLogs = client.logs.unbans
        .filter(log => log.guildId === serverId)
        .map(log => ({
          type: 'unban',
          user: {
            id: log.userId,
            username: log.userName || 'Unknown',
            discriminator: log.userDiscriminator || '0000',
            avatar: log.userAvatar || null
          },
          executor: log.executorId ? {
            id: log.executorId,
            username: log.executorName || 'Unknown',
            discriminator: log.executorDiscriminator || '0000',
            avatar: log.executorAvatar || null
          } : null,
          reason: log.reason,
          timestamp: log.timestamp
        }));
      
      logs = logs.concat(unbanLogs);
    }
    
    // Get kick logs if available
    if (client.logs && client.logs.kicks) {
      const kickLogs = client.logs.kicks
        .filter(log => log.guildId === serverId)
        .map(log => ({
          type: 'kick',
          user: {
            id: log.userId,
            username: log.userName || 'Unknown',
            discriminator: log.userDiscriminator || '0000',
            avatar: log.userAvatar || null
          },
          executor: log.executorId ? {
            id: log.executorId,
            username: log.executorName || 'Unknown',
            discriminator: log.executorDiscriminator || '0000',
            avatar: log.executorAvatar || null
          } : null,
          reason: log.reason,
          timestamp: log.timestamp
        }));
      
      logs = logs.concat(kickLogs);
    }
    
    // Get timeout logs if available
    if (client.logs && client.logs.timeouts) {
      const timeoutLogs = client.logs.timeouts
        .filter(log => log.guildId === serverId)
        .map(log => ({
          type: 'timeout',
          user: {
            id: log.userId,
            username: log.userName || 'Unknown',
            discriminator: log.userDiscriminator || '0000',
            avatar: log.userAvatar || null
          },
          executor: log.executorId ? {
            id: log.executorId,
            username: log.executorName || 'Unknown',
            discriminator: log.executorDiscriminator || '0000',
            avatar: log.executorAvatar || null
          } : null,
          reason: log.reason,
          timestamp: log.timestamp,
          duration: log.duration
        }));
      
      logs = logs.concat(timeoutLogs);
    }
    
    // Get warning logs if available
    if (client.logs && client.logs.warnings) {
      const warningLogs = client.logs.warnings
        .filter(log => log.guildId === serverId)
        .map(log => ({
          type: 'warn',
          user: {
            id: log.userId,
            username: log.userName || 'Unknown',
            discriminator: log.userDiscriminator || '0000',
            avatar: log.userAvatar || null
          },
          executor: log.executorId ? {
            id: log.executorId,
            username: log.executorName || 'Unknown',
            discriminator: log.executorDiscriminator || '0000',
            avatar: log.executorAvatar || null
          } : null,
          reason: log.reason,
          timestamp: log.timestamp,
          severity: log.severity
        }));
      
      logs = logs.concat(warningLogs);
    }
    
    // Get purge logs if available
    if (client.logs && client.logs.purges) {
      const purgeLogs = client.logs.purges
        .filter(log => log.guildId === serverId)
        .map(log => ({
          type: 'purge',
          executor: log.executorId ? {
            id: log.executorId,
            username: log.executorName || 'Unknown',
            discriminator: log.executorDiscriminator || '0000',
            avatar: log.executorAvatar || null
          } : null,
          channel: log.channelId ? {
            id: log.channelId,
            name: log.channelName || 'Unknown'
          } : null,
          reason: log.reason,
          timestamp: log.timestamp,
          amount: log.amount
        }));
      
      logs = logs.concat(purgeLogs);
    }
    
    // Sort logs by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 100 most recent logs
    logs = logs.slice(0, 100);
    
    res.json({
      success: true,
      serverId,
      logCount: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error getting moderation logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation logs: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/warnings/:userId
 * Get warnings for a specific user
 */
router.get('/servers/:serverId/warnings/:userId', async (req, res) => {
  try {
    const { serverId, userId } = req.params;
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
    
    // Check if warnings system is available
    if (!client.discordDB) {
      return res.status(501).json({
        success: false,
        message: 'Warnings system not available'
      });
    }
    
    // Get warnings from database
    const warnings = await client.discordDB.getWarnings(serverId, userId);
    
    if (!warnings || warnings.length === 0) {
      return res.json({
        success: false,
        message: 'No warnings found for this user',
        code: 'NO_WARNINGS',
        warnings: []
      });
    }
    
    // Format warnings
    const formattedWarnings = warnings.map((warning, index) => ({
      id: warning.id || index + 1,
      userId,
      reason: warning.reason,
      severity: warning.severity || 'medium',
      timestamp: warning.timestamp || new Date().toISOString(),
      executorId: warning.executorId,
      executorName: warning.executorName || 'Unknown'
    }));
    
    res.json({
      success: true,
      userId,
      serverId,
      warnings: formattedWarnings
    });
  } catch (error) {
    console.error('Error getting warnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get warnings: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/warnings
 * Add a warning to a user
 */
router.post('/servers/:serverId/warnings', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId, reason, severity } = req.body;
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
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    // Check if warnings system is available
    if (!client.discordDB) {
      return res.status(501).json({
        success: false,
        message: 'Warnings system not available'
      });
    }
    
    // Create warning
    const warning = {
      userId,
      reason,
      severity: severity || 'medium',
      timestamp: new Date().toISOString(),
      executorId: req.user.id,
      executorName: req.user.username
    };
    
    // Add warning to database
    const result = await client.discordDB.addWarning(serverId, warning);
    
    if (!result || !result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add warning to database'
      });
    }
    
    // Try to DM the user
    try {
      // Fetch the user
      const user = await client.users.fetch(userId).catch(() => null);
      
      if (user) {
        // Create warning embed
        const embed = {
          title: 'Warning Received',
          description: `You have received a warning in ${guild.name}.`,
          color: 0xFFD700,
          fields: [
            {
              name: 'Reason',
              value: reason
            },
            {
              name: 'Severity',
              value: severity.charAt(0).toUpperCase() + severity.slice(1)
            }
          ],
          timestamp: new Date(),
          footer: {
            text: `Warned by ${req.user.username}`
          }
        };
        
        // Send DM
        await user.send({ embeds: [embed] }).catch(() => {
          // Silently fail if DM fails
          console.log(`Failed to send warning DM to ${userId}`);
        });
      }
    } catch (dmError) {
      console.error('Error sending warning DM:', dmError);
      // Don't fail the whole request if DM fails
    }
    
    // Log the warning
    if (client.logs && !client.logs.warnings) {
      client.logs.warnings = [];
    }
    
    if (client.logs && client.logs.warnings) {
      client.logs.warnings.push({
        userId,
        userName: (await client.users.fetch(userId).catch(() => null))?.username || 'Unknown',
        userDiscriminator: (await client.users.fetch(userId).catch(() => null))?.discriminator || '0000',
        userAvatar: (await client.users.fetch(userId).catch(() => null))?.displayAvatarURL({ dynamic: true }) || null,
        executorId: req.user.id,
        executorName: req.user.username,
        executorDiscriminator: req.user.discriminator || '0000',
        executorAvatar: req.user.avatar || null,
        reason,
        severity,
        timestamp: warning.timestamp,
        guildId: serverId
      });
    }
    
    res.json({
      success: true,
      message: 'Warning added successfully',
      warning: {
        ...warning,
        id: result.warningId
      }
    });
  } catch (error) {
    console.error('Error adding warning:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add warning: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/bans
 * Ban a user
 */
router.post('/servers/:serverId/bans', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId, reason, deleteDays } = req.body;
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
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if the bot has permission to ban
    const botMember = guild.members.me;
    if (!botMember.permissions.has('BanMembers')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to ban members'
      });
    }
    
    // Ban the user
    await guild.members.ban(userId, {
      deleteMessageDays: deleteDays || 0,
      reason: `${reason || 'No reason provided'} (Banned by ${req.user.username})`
    });
    
    // Log the ban
    if (client.logs && !client.logs.bans) {
      client.logs.bans = [];
    }
    
    if (client.logs && client.logs.bans) {
      client.logs.bans.push({
        userId,
        userName: (await client.users.fetch(userId).catch(() => null))?.username || 'Unknown',
        userDiscriminator: (await client.users.fetch(userId).catch(() => null))?.discriminator || '0000',
        userAvatar: (await client.users.fetch(userId).catch(() => null))?.displayAvatarURL({ dynamic: true }) || null,
        executorId: req.user.id,
        executorName: req.user.username,
        executorDiscriminator: req.user.discriminator || '0000',
        executorAvatar: req.user.avatar || null,
        reason,
        deleteDays: deleteDays || 0,
        timestamp: new Date().toISOString(),
        guildId: serverId
      });
    }
    
    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user: ' + error.message
    });
  }
});

/**
 * DELETE /api/v2/servers/:serverId/bans/:userId
 * Unban a user
 */
router.delete('/servers/:serverId/bans/:userId', async (req, res) => {
  try {
    const { serverId, userId } = req.params;
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
    
    // Check if the bot has permission to unban
    const botMember = guild.members.me;
    if (!botMember.permissions.has('BanMembers')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to unban members'
      });
    }
    
    // Unban the user
    await guild.members.unban(userId, `${reason || 'No reason provided'} (Unbanned by ${req.user.username})`);
    
    // Log the unban
    if (client.logs && !client.logs.unbans) {
      client.logs.unbans = [];
    }
    
    if (client.logs && client.logs.unbans) {
      client.logs.unbans.push({
        userId,
        userName: (await client.users.fetch(userId).catch(() => null))?.username || 'Unknown',
        userDiscriminator: (await client.users.fetch(userId).catch(() => null))?.discriminator || '0000',
        userAvatar: (await client.users.fetch(userId).catch(() => null))?.displayAvatarURL({ dynamic: true }) || null,
        executorId: req.user.id,
        executorName: req.user.username,
        executorDiscriminator: req.user.discriminator || '0000',
        executorAvatar: req.user.avatar || null,
        reason,
        timestamp: new Date().toISOString(),
        guildId: serverId
      });
    }
    
    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unban user: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/kicks
 * Kick a user
 */
router.post('/servers/:serverId/kicks', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId, reason } = req.body;
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
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if the member exists
    const member = await guild.members.fetch(userId).catch(() => null);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in server'
      });
    }
    
    // Check if the bot has permission to kick
    const botMember = guild.members.me;
    if (!botMember.permissions.has('KickMembers')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to kick members'
      });
    }
    
    // Check if the member is kickable
    if (!member.kickable) {
      return res.status(403).json({
        success: false,
        message: 'Cannot kick this member (higher role hierarchy or missing permissions)'
      });
    }
    
    // Kick the member
    await member.kick(`${reason || 'No reason provided'} (Kicked by ${req.user.username})`);
    
    // Log the kick
    if (client.logs && !client.logs.kicks) {
      client.logs.kicks = [];
    }
    
    if (client.logs && client.logs.kicks) {
      client.logs.kicks.push({
        userId,
        userName: member.user.username,
        userDiscriminator: member.user.discriminator || '0000',
        userAvatar: member.user.displayAvatarURL({ dynamic: true }),
        executorId: req.user.id,
        executorName: req.user.username,
        executorDiscriminator: req.user.discriminator || '0000',
        executorAvatar: req.user.avatar || null,
        reason,
        timestamp: new Date().toISOString(),
        guildId: serverId
      });
    }
    
    res.json({
      success: true,
      message: 'User kicked successfully'
    });
  } catch (error) {
    console.error('Error kicking user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to kick user: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/timeouts
 * Timeout a user
 */
router.post('/servers/:serverId/timeouts', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId, duration, reason } = req.body;
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
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if the member exists
    const member = await guild.members.fetch(userId).catch(() => null);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in server'
      });
    }
    
    // Check if the bot has permission to timeout
    const botMember = guild.members.me;
    if (!botMember.permissions.has('ModerateMembers')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to timeout members'
      });
    }
    
    // Check if the member is moderatable
    if (!member.moderatable) {
      return res.status(403).json({
        success: false,
        message: 'Cannot timeout this member (higher role hierarchy or missing permissions)'
      });
    }
    
    // Convert duration to milliseconds
    const durationMs = (parseInt(duration) || 60) * 1000;
    
    // Maximum timeout duration is 28 days
    const maxTimeout = 28 * 24 * 60 * 60 * 1000;
    
    if (durationMs > maxTimeout) {
      return res.status(400).json({
        success: false,
        message: 'Timeout duration cannot exceed 28 days'
      });
    }
    
    // Timeout the member
    await member.timeout(durationMs, `${reason || 'No reason provided'} (Timed out by ${req.user.username})`);
    
    // Log the timeout
    if (client.logs && !client.logs.timeouts) {
      client.logs.timeouts = [];
    }
    
    if (client.logs && client.logs.timeouts) {
      client.logs.timeouts.push({
        userId,
        userName: member.user.username,
        userDiscriminator: member.user.discriminator || '0000',
        userAvatar: member.user.displayAvatarURL({ dynamic: true }),
        executorId: req.user.id,
        executorName: req.user.username,
        executorDiscriminator: req.user.discriminator || '0000',
        executorAvatar: req.user.avatar || null,
        reason,
        duration: parseInt(duration) || 60,
        timestamp: new Date().toISOString(),
        guildId: serverId
      });
    }
    
    res.json({
      success: true,
      message: 'User timed out successfully'
    });
  } catch (error) {
    console.error('Error timing out user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to timeout user: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/purge
 * Purge messages from a channel
 */
router.post('/servers/:serverId/purge', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { channelId, amount, reason, filters } = req.body;
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
    
    // Validate required fields
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'Channel ID is required'
      });
    }
    
    // Check if the channel exists
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    // Check if the channel is a text channel
    if (channel.type !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Channel must be a text channel'
      });
    }
    
    // Check if the bot has permission to manage messages
    const botMember = guild.members.me;
    if (!botMember.permissionsIn(channel).has('ManageMessages')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to manage messages in this channel'
      });
    }
    
    // Validate amount
    const purgeAmount = parseInt(amount) || 10;
    
    if (purgeAmount < 1 || purgeAmount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between 1 and 100'
      });
    }
    
    // Fetch messages
    const messages = await channel.messages.fetch({ limit: purgeAmount });
    
    // Apply filters if provided
    let filteredMessages = messages;
    
    if (filters) {
      if (filters.onlyUsers) {
        filteredMessages = filteredMessages.filter(message => !message.author.bot);
      }
      
      if (filters.withImages) {
        filteredMessages = filteredMessages.filter(message => 
          message.attachments.size > 0 || 
          message.embeds.some(embed => embed.image || embed.thumbnail)
        );
      }
      
      if (filters.withLinks) {
        const linkRegex = /(https?:\/\/[^\s]+)/gi;
        filteredMessages = filteredMessages.filter(message => 
          linkRegex.test(message.content)
        );
      }
    }
    
    // Check if any messages match filters
    if (filteredMessages.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'No messages match the specified filters'
      });
    }
    
    // Bulk delete messages (Discord only allows bulk delete for messages less than 2 weeks old)
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const recentMessages = filteredMessages.filter(message => message.createdTimestamp > twoWeeksAgo);
    
    let deletedCount = 0;
    
    if (recentMessages.size > 0) {
      await channel.bulkDelete(recentMessages);
      deletedCount = recentMessages.size;
    }
    
    // Delete older messages one by one
    const olderMessages = filteredMessages.filter(message => message.createdTimestamp <= twoWeeksAgo);
    
    for (const message of olderMessages.values()) {
      await message.delete().catch(() => {
        // Ignore errors for individual message deletions
      });
      deletedCount++;
    }
    
    // Log the purge
    if (client.logs && !client.logs.purges) {
      client.logs.purges = [];
    }
    
    if (client.logs && client.logs.purges) {
      client.logs.purges.push({
        channelId,
        channelName: channel.name,
        executorId: req.user.id,
        executorName: req.user.username,
        executorDiscriminator: req.user.discriminator || '0000',
        executorAvatar: req.user.avatar || null,
        reason,
        amount: deletedCount,
        timestamp: new Date().toISOString(),
        guildId: serverId
      });
    }
    
    res.json({
      success: true,
      message: `Purged ${deletedCount} message${deletedCount === 1 ? '' : 's'} successfully`,
      purgedCount: deletedCount
    });
  } catch (error) {
    console.error('Error purging messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purge messages: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/automod
 * Get auto-moderation settings for a server
 */
router.get('/servers/:serverId/automod', async (req, res) => {
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
    
    // Check if automod settings are available
    if (!client.discordDB) {
      return res.status(501).json({
        success: false,
        message: 'Auto-moderation system not available'
      });
    }
    
    // Get automod settings from database
    const settings = await client.discordDB.getAutoModSettings(serverId);
    
    if (!settings) {
      return res.json({
        success: false,
        message: 'No auto-moderation settings found',
        code: 'NO_SETTINGS'
      });
    }
    
    res.json({
      success: true,
      serverId,
      settings
    });
  } catch (error) {
    console.error('Error getting auto-moderation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-moderation settings: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/automod
 * Set auto-moderation settings for a server
 */
router.post('/servers/:serverId/automod', async (req, res) => {
  try {
    const { serverId } = req.params;
    const settings = req.body;
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
    
    // Check if automod settings are available
    if (!client.discordDB) {
      return res.status(501).json({
        success: false,
        message: 'Auto-moderation system not available'
      });
    }
    
    // Validate settings
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings are required'
      });
    }
    
    // Save settings to database
    const result = await client.discordDB.setAutoModSettings(serverId, settings);
    
    if (!result || !result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save auto-moderation settings'
      });
    }
    
    res.json({
      success: true,
      message: 'Auto-moderation settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Error setting auto-moderation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set auto-moderation settings: ' + error.message
    });
  }
});

module.exports = router;