/**
 * Auto-Moderation Module
 * 
 * Handles all automatic moderation features for messages including:
 * - Profanity filtering
 * - Link filtering
 * - Discord invite blocking
 * - Spam detection
 * - Raid detection
 */

const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logging = require('./logging');

// Cache for stored settings
const settingsCache = new Map();

// Cache to track user message counts for spam detection
const userMessageTracker = new Map();

// Cache to track recent joins for raid detection
const recentJoins = new Map();

// Common invite link patterns
const INVITE_REGEX = /(discord\.(gg|io|me|li)|discord(app)?\.com\/invite)\/[\w-]{2,}/i;

// Default profanity word lists based on severity
const profanityLists = {
  low: ['fuck', 'shit', 'bitch', 'dick', 'asshole', 'cunt', 'bastard'],
  medium: ['fuck', 'shit', 'bitch', 'dick', 'asshole', 'cunt', 'bastard', 'pussy', 'cock', 'slut', 'whore', 'nigga'],
  high: ['fuck', 'shit', 'bitch', 'dick', 'ass', 'asshole', 'cunt', 'bastard', 'pussy', 'cock', 'slut', 'whore', 'nigga', 'nigger', 'faggot', 'retard']
};

/**
 * Initialize auto-moderation module
 * @param {Discord.Client} client - Discord client
 */
function initialize(client) {
  console.log('Initializing Auto-Moderation System...');
  
  // Add event listeners to client
  client.on('messageCreate', async (message) => {
    // Skip bot messages and DMs
    if (message.author.bot || !message.guild) return;
    
    // Process message for moderation
    await processMessage(message, client);
  });
  
  // Add guild member add listeners for raid detection
  client.on('guildMemberAdd', (member) => {
    // Track join for raid detection
    trackGuildJoin(member.guild.id);
    
    // Check for raid conditions
    checkRaidStatus(member.guild, client);
  });
  
  console.log('✅ Auto-Moderation System initialized');
}

/**
 * Track guild join for raid detection
 * @param {string} guildId - Guild ID
 */
function trackGuildJoin(guildId) {
  const now = Date.now();
  
  if (!recentJoins.has(guildId)) {
    recentJoins.set(guildId, []);
  }
  
  const joinList = recentJoins.get(guildId);
  
  // Add the current join timestamp
  joinList.push(now);
  
  // Remove joins older than 10 minutes
  const cutoff = now - 10 * 60 * 1000;
  const newList = joinList.filter(timestamp => timestamp >= cutoff);
  
  recentJoins.set(guildId, newList);
}

/**
 * Check for raid conditions
 * @param {Discord.Guild} guild - Discord guild
 * @param {Discord.Client} client - Discord client
 */
async function checkRaidStatus(guild, client) {
  // Get settings
  const settings = await getSettings(guild.id, client);
  
  // Skip if anti-raid is not enabled
  if (!settings || !settings.antiRaid) return;
  
  const joinList = recentJoins.get(guild.id) || [];
  const joinCount = joinList.length;
  
  // If join count exceeds threshold, trigger raid action
  if (joinCount >= settings.raidThreshold) {
    console.log(`⚠️ RAID DETECTED in ${guild.name} - ${joinCount} joins in the last 10 minutes`);
    
    // Get action to take
    const action = settings.raidAction || 'lockdown';
    
    // Execute action based on configuration
    switch (action) {
      case 'lockdown':
        await lockdownServer(guild, settings.raidDuration || '30m');
        break;
        
      case 'alert':
        await alertAdmins(guild, joinCount);
        break;
        
      default:
        console.log(`Unknown raid action: ${action}`);
    }
    
    // Log the raid detection
    logging.logAction('Raid Detected', client.user, guild, {
      count: joinCount,
      action: action,
      threshold: settings.raidThreshold
    });
    
    // Clear the join list after taking action
    recentJoins.set(guild.id, []);
  }
}

/**
 * Lockdown server (restrict permissions)
 * @param {Discord.Guild} guild - Discord guild
 * @param {string} duration - Lockdown duration
 */
async function lockdownServer(guild, duration) {
  try {
    console.log(`🔒 Locking down server: ${guild.name} for ${duration}`);
    
    // Get the default role (@everyone)
    const everyoneRole = guild.roles.everyone;
    
    // Save current permissions before modifying
    const oldPerms = everyoneRole.permissions.toArray();
    
    // Store the old perms for later restoration
    guild.client.discordDB?.insertDocument('configs', {
      id: `lockdown-${guild.id}-${Date.now()}`,
      guildId: guild.id,
      type: 'lockdown',
      oldPermissions: oldPerms,
      timestamp: new Date().toISOString(),
      duration: duration,
      endTime: calculateEndTime(duration)
    });
    
    // Remove send messages permission
    await everyoneRole.setPermissions(
      everyoneRole.permissions.remove([
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.CreatePublicThreads,
        PermissionsBitField.Flags.CreatePrivateThreads
      ])
    );
    
    // Create announcement in system channel if available
    const systemChannel = guild.systemChannel;
    if (systemChannel && systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      const embed = new EmbedBuilder()
        .setTitle('🔒 Server Lockdown')
        .setDescription(`This server has been automatically locked down due to raid detection.\nNormal permissions will be restored ${duration ? `in ${duration}` : 'soon'}.`)
        .setColor('#FF0000')
        .setTimestamp();
      
      await systemChannel.send({ embeds: [embed] });
    }
    
    // Set a timer to unlock if duration is provided
    if (duration) {
      const ms = parseDuration(duration);
      if (ms) {
        setTimeout(() => unlockServer(guild), ms);
      }
    }
  } catch (error) {
    console.error('Error during server lockdown:', error);
  }
}

/**
 * Unlock server after lockdown
 * @param {Discord.Guild} guild - Discord guild
 */
async function unlockServer(guild) {
  try {
    console.log(`🔓 Unlocking server: ${guild.name}`);
    
    // Find the lockdown record
    const lockdownRecord = guild.client.discordDB?.findDocuments('configs', (doc) => {
      return doc.guildId === guild.id && doc.type === 'lockdown';
    });
    
    if (lockdownRecord && lockdownRecord.length > 0) {
      const record = lockdownRecord[0];
      const oldPerms = record.oldPermissions;
      
      // Get the default role (@everyone)
      const everyoneRole = guild.roles.everyone;
      
      // Restore original permissions
      if (Array.isArray(oldPerms)) {
        await everyoneRole.setPermissions(oldPerms);
      }
      
      // Remove the lockdown record
      guild.client.discordDB?.deleteDocument('configs', record.id);
      
      // Announce in system channel
      const systemChannel = guild.systemChannel;
      if (systemChannel && systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
        const embed = new EmbedBuilder()
          .setTitle('🔓 Lockdown Lifted')
          .setDescription('The server lockdown has been lifted. Normal permissions have been restored.')
          .setColor('#00FF00')
          .setTimestamp();
          
        await systemChannel.send({ embeds: [embed] });
      }
    } else {
      // If no record found, just restore send messages permission
      const everyoneRole = guild.roles.everyone;
      await everyoneRole.setPermissions(
        everyoneRole.permissions.add([
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.CreatePublicThreads,
          PermissionsBitField.Flags.CreatePrivateThreads
        ])
      );
    }
    
    // Log unlock action
    logging.logAction('Lockdown Ended', guild.client.user, guild, {
      status: 'automatic'
    });
  } catch (error) {
    console.error('Error during server unlock:', error);
  }
}

/**
 * Alert admins about potential raid
 * @param {Discord.Guild} guild - Discord guild
 * @param {number} joinCount - Number of recent joins
 */
async function alertAdmins(guild, joinCount) {
  try {
    console.log(`⚠️ Alerting admins in ${guild.name} about potential raid`);
    
    // Find admin users to alert
    const adminRoles = guild.roles.cache.filter(role => 
      role.permissions.has(PermissionsBitField.Flags.Administrator) || 
      role.permissions.has(PermissionsBitField.Flags.ManageGuild)
    );
    
    // Create a notification embed
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Raid Alert')
      .setDescription(`Potential raid detected! ${joinCount} users joined in the last 10 minutes.`)
      .setColor('#FF0000')
      .addFields({
        name: 'Options',
        value: 'React with 🔒 to lock down the server\nReact with 🔄 to dismiss this alert'
      })
      .setTimestamp();
    
    // Send alert to system channel or first available channel
    const systemChannel = guild.systemChannel;
    if (systemChannel && systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      const message = await systemChannel.send({ 
        content: adminRoles.size > 0 ? 
          `Alert! ${adminRoles.map(r => '<@&' + r.id + '>').join(' ')}` : 
          'Alert! @Administrators',
        embeds: [embed] 
      });
      
      // Add reaction options
      await message.react('🔒');
      await message.react('🔄');
      
      // Create a collector for reactions
      const filter = (reaction, user) => {
        return ['🔒', '🔄'].includes(reaction.emoji.name) && !user.bot;
      };
      
      const collector = message.createReactionCollector({ filter, time: 60000 });
      
      collector.on('collect', async (reaction, user) => {
        // Check if user has admin permissions
        const member = await guild.members.fetch(user.id);
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
          return;
        }
        
        if (reaction.emoji.name === '🔒') {
          // Lockdown the server
          await lockdownServer(guild, '2h');
          message.edit({ 
            content: `Lockdown initiated by <@${user.id}>`,
            embeds: [embed]
          });
          collector.stop();
        } else if (reaction.emoji.name === '🔄') {
          // Dismiss alert
          message.edit({ 
            content: `Alert dismissed by <@${user.id}>`,
            embeds: [embed]
          });
          collector.stop();
        }
      });
    }
  } catch (error) {
    console.error('Error alerting admins:', error);
  }
}

/**
 * Process a message for auto-moderation
 * @param {Discord.Message} message - Discord message
 * @param {Discord.Client} client - Discord client
 */
async function processMessage(message, client) {
  try {
    // Get server ID
    const serverId = message.guild.id;
    
    // Check permissions - don't moderate admins/mods
    if (message.member && (
      message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    )) {
      return;
    }
    
    // Get auto-moderation settings
    const settings = await getSettings(serverId, client);
    
    // If no settings or auto-mod is not enabled, return
    if (!settings) return;
    
    // Track message for spam detection
    trackUserMessage(message.author.id, message.guild.id);
    
    // Check for various violations
    const violations = [];
    
    // Check for profanity if enabled
    if (settings.filterProfanity) {
      if (containsProfanity(message.content, settings.profanityThreshold)) {
        violations.push('profanity');
      }
    }
    
    // Check for discord invites if enabled
    if (settings.filterInvites) {
      if (containsDiscordInvite(message.content)) {
        violations.push('invite');
      }
    }
    
    // Check for spam if enabled
    if (settings.filterSpam) {
      if (isSpamming(message.author.id, message.guild.id, settings.spamThreshold || 5)) {
        violations.push('spam');
      }
    }
    
    // If violations were found, take action
    if (violations.length > 0) {
      // First delete the message (if bot has permissions)
      try {
        await message.delete();
        console.log(`🧹 Deleted message from ${message.author.tag} in ${message.guild.name} for violations: ${violations.join(', ')}`);
      } catch (error) {
        console.error(`Error deleting message: ${error.message}`);
      }
      
      // For spam, determine the action to take
      if (violations.includes('spam')) {
        const action = settings.spamAction || 'mute';
        
        switch (action) {
          case 'warn':
            await warnUser(message, 'spam');
            break;
            
          case 'mute':
            await timeoutUser(message, settings.muteDuration || '30m', 'spam');
            break;
            
          case 'kick':
            await kickUser(message, 'spam');
            break;
            
          case 'ban':
            await banUser(message, 'spam');
            break;
            
          default:
            // Just delete by default
            break;
        }
      }
      // For profanity or invites, take the configured content violation action
      else {
        const action = settings.profanityAction || 'delete';
        
        switch (action) {
          case 'warn':
            await warnUser(message, violations[0]);
            break;
            
          case 'mute':
            await timeoutUser(message, settings.muteDuration || '30m', violations[0]);
            break;
            
          case 'kick':
            await kickUser(message, violations[0]);
            break;
            
          case 'ban':
            await banUser(message, violations[0]);
            break;
            
          default:
            // Just delete by default
            break;
        }
      }
      
      // Log the moderation action
      logging.logAction('Auto-Moderation', message.client.user, message.guild, {
        user: message.author.tag,
        userId: message.author.id,
        violations: violations,
        channel: message.channel.name,
        messageContent: message.content.substring(0, 1000) // Limit content length
      });
    }
  } catch (error) {
    console.error('Error in auto-moderation:', error);
  }
}

/**
 * Get auto-moderation settings for a server
 * @param {string} serverId - Discord server ID
 * @param {Discord.Client} client - Discord client
 * @returns {Object} - Settings object
 */
async function getSettings(serverId, client) {
  // Check cache first
  if (settingsCache.has(serverId)) {
    return settingsCache.get(serverId);
  }
  
  // If no cached settings, try to fetch from database
  if (client.discordDB && client.discordDB.initialized) {
    const settings = client.discordDB.findDocuments('configs', (doc) => {
      return doc.guildId === serverId && doc.type === 'automod';
    });
    
    if (settings && settings.length > 0) {
      // Cache settings for future use
      settingsCache.set(serverId, settings[0]);
      return settings[0];
    }
  }
  
  // Return null if no settings found
  return null;
}

/**
 * Clear settings cache for a specific server or all servers
 * @param {string} serverId - Discord server ID (optional)
 */
function clearSettingsCache(serverId = null) {
  if (serverId) {
    settingsCache.delete(serverId);
  } else {
    settingsCache.clear();
  }
}

/**
 * Update settings for a server
 * @param {string} serverId - Discord server ID
 * @param {Object} settings - New settings
 */
function updateSettings(serverId, settings) {
  // Update cache
  settingsCache.set(serverId, settings);
}

/**
 * Track a message from a user for spam detection
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 */
function trackUserMessage(userId, guildId) {
  const key = `${userId}-${guildId}`;
  const now = Date.now();
  
  if (!userMessageTracker.has(key)) {
    userMessageTracker.set(key, []);
  }
  
  const messageList = userMessageTracker.get(key);
  
  // Add current message timestamp
  messageList.push(now);
  
  // Remove messages older than the time window (5 seconds)
  const timeWindow = 5000; // 5 seconds
  const cutoff = now - timeWindow;
  const newList = messageList.filter(timestamp => timestamp >= cutoff);
  
  userMessageTracker.set(key, newList);
}

/**
 * Check if a user is spamming
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} threshold - Spam threshold (default: 5)
 * @returns {boolean} - True if user is spamming
 */
function isSpamming(userId, guildId, threshold = 5) {
  const key = `${userId}-${guildId}`;
  
  if (!userMessageTracker.has(key)) {
    return false;
  }
  
  const messageList = userMessageTracker.get(key);
  return messageList.length >= threshold;
}

/**
 * Check if content contains profanity
 * @param {string} content - Message content
 * @param {string} level - Filtering level (low, medium, high, custom)
 * @returns {boolean} - True if profanity found
 */
function containsProfanity(content, level = 'medium') {
  // Normalize content for checking
  const normalizedContent = content.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalizedContent.split(/\s+/);
  
  // Get the word list based on level
  const wordList = profanityLists[level] || profanityLists.medium;
  
  // Check each word against the profanity list
  for (const word of words) {
    if (wordList.includes(word)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if content contains Discord invite links
 * @param {string} content - Message content
 * @returns {boolean} - True if invite found
 */
function containsDiscordInvite(content) {
  return INVITE_REGEX.test(content);
}

/**
 * Warn a user for auto-moderation violation
 * @param {Discord.Message} message - Discord message
 * @param {string} violationType - Type of violation
 */
async function warnUser(message, violationType) {
  try {
    // Get reason based on violation
    const reasons = {
      'profanity': 'Using inappropriate language',
      'invite': 'Posting Discord invite links',
      'spam': 'Spamming messages in a short time'
    };
    
    const reason = reasons[violationType] || 'Auto-moderation violation';
    
    // Check if user can be warned (via warnings collection)
    if (message.client.discordDB && message.client.discordDB.initialized) {
      // Create warning document
      const warning = {
        id: `warn-${message.author.id}-${Date.now()}`,
        userId: message.author.id,
        guildId: message.guild.id,
        reason: reason,
        issuedBy: message.client.user.id,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        automated: true,
        violationType: violationType
      };
      
      // Add warning to database
      message.client.discordDB.insertDocument('warnings', warning);
      
      console.log(`⚠️ Auto-warned user ${message.author.tag} for ${violationType}`);
      
      // If DM notifications are enabled, notify the user
      try {
        const settings = await getSettings(message.guild.id, message.client);
        if (settings && settings.notifyUsers !== false) {
          const embed = new EmbedBuilder()
            .setTitle('⚠️ Warning Issued')
            .setDescription(`You have received an automatic warning in **${message.guild.name}**`)
            .addFields({
              name: 'Reason',
              value: reason
            })
            .setColor('#FFA500')
            .setTimestamp();
            
          await message.author.send({ embeds: [embed] });
        }
      } catch (dmError) {
        // Ignore errors sending DMs (user might have DMs disabled)
        console.log(`Could not send warning DM to ${message.author.tag}: ${dmError.message}`);
      }
    }
  } catch (error) {
    console.error('Error warning user:', error);
  }
}

/**
 * Timeout/mute a user for auto-moderation violation
 * @param {Discord.Message} message - Discord message
 * @param {string} duration - Timeout duration (e.g., '30m', '1h')
 * @param {string} violationType - Type of violation
 */
async function timeoutUser(message, duration = '30m', violationType) {
  try {
    // Get reason based on violation
    const reasons = {
      'profanity': 'Using inappropriate language',
      'invite': 'Posting Discord invite links',
      'spam': 'Spamming messages in a short time'
    };
    
    const reason = reasons[violationType] || 'Auto-moderation violation';
    
    // Convert duration string to milliseconds
    const durationMs = parseDuration(duration);
    
    if (!durationMs) {
      console.error(`Invalid timeout duration: ${duration}`);
      return;
    }
    
    // Apply timeout
    await message.member.timeout(durationMs, reason);
    
    console.log(`🔇 Auto-muted user ${message.author.tag} for ${duration} due to ${violationType}`);
    
    // If DM notifications are enabled, notify the user
    try {
      const settings = await getSettings(message.guild.id, message.client);
      if (settings && settings.notifyUsers !== false) {
        const embed = new EmbedBuilder()
          .setTitle('🔇 Timeout Applied')
          .setDescription(`You have been automatically timed out in **${message.guild.name}**`)
          .addFields(
            {
              name: 'Reason',
              value: reason
            },
            {
              name: 'Duration',
              value: duration
            }
          )
          .setColor('#FF0000')
          .setTimestamp();
          
        await message.author.send({ embeds: [embed] });
      }
    } catch (dmError) {
      // Ignore errors sending DMs (user might have DMs disabled)
      console.log(`Could not send timeout DM to ${message.author.tag}: ${dmError.message}`);
    }
  } catch (error) {
    console.error('Error timing out user:', error);
  }
}

/**
 * Kick a user for auto-moderation violation
 * @param {Discord.Message} message - Discord message
 * @param {string} violationType - Type of violation
 */
async function kickUser(message, violationType) {
  try {
    // Get reason based on violation
    const reasons = {
      'profanity': 'Using inappropriate language',
      'invite': 'Posting Discord invite links',
      'spam': 'Spamming messages in a short time'
    };
    
    const reason = reasons[violationType] || 'Auto-moderation violation';
    
    // If DM notifications are enabled, notify the user before kicking
    try {
      const settings = await getSettings(message.guild.id, message.client);
      if (settings && settings.notifyUsers !== false) {
        const embed = new EmbedBuilder()
          .setTitle('👢 Kicked from Server')
          .setDescription(`You have been automatically kicked from **${message.guild.name}**`)
          .addFields({
            name: 'Reason',
            value: reason
          })
          .setColor('#FF0000')
          .setTimestamp();
          
        await message.author.send({ embeds: [embed] });
      }
    } catch (dmError) {
      // Ignore errors sending DMs (user might have DMs disabled)
      console.log(`Could not send kick DM to ${message.author.tag}: ${dmError.message}`);
    }
    
    // Kick the user
    await message.member.kick(reason);
    
    console.log(`👢 Auto-kicked user ${message.author.tag} for ${violationType}`);
  } catch (error) {
    console.error('Error kicking user:', error);
  }
}

/**
 * Ban a user for auto-moderation violation
 * @param {Discord.Message} message - Discord message
 * @param {string} violationType - Type of violation
 */
async function banUser(message, violationType) {
  try {
    // Get reason based on violation
    const reasons = {
      'profanity': 'Using inappropriate language',
      'invite': 'Posting Discord invite links',
      'spam': 'Spamming messages in a short time'
    };
    
    const reason = reasons[violationType] || 'Auto-moderation violation';
    
    // If DM notifications are enabled, notify the user before banning
    try {
      const settings = await getSettings(message.guild.id, message.client);
      if (settings && settings.notifyUsers !== false) {
        const embed = new EmbedBuilder()
          .setTitle('🔨 Banned from Server')
          .setDescription(`You have been automatically banned from **${message.guild.name}**`)
          .addFields({
            name: 'Reason',
            value: reason
          })
          .setColor('#FF0000')
          .setTimestamp();
          
        await message.author.send({ embeds: [embed] });
      }
    } catch (dmError) {
      // Ignore errors sending DMs (user might have DMs disabled)
      console.log(`Could not send ban DM to ${message.author.tag}: ${dmError.message}`);
    }
    
    // Ban the user
    await message.guild.members.ban(message.author, {
      reason: reason,
      deleteMessageSeconds: 60 * 60 // Delete 1 hour of messages
    });
    
    console.log(`🔨 Auto-banned user ${message.author.tag} for ${violationType}`);
  } catch (error) {
    console.error('Error banning user:', error);
  }
}

/**
 * Parse duration string into milliseconds
 * @param {string} duration - Duration string (e.g., '30m', '1h', '1d')
 * @returns {number} - Duration in milliseconds
 */
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Calculate end time based on duration string
 * @param {string} duration - Duration string (e.g., '30m', '1h', '1d')
 * @returns {string} - ISO string of end time
 */
function calculateEndTime(duration) {
  const ms = parseDuration(duration);
  if (!ms) return null;
  
  const endTime = new Date(Date.now() + ms);
  return endTime.toISOString();
}

module.exports = {
  initialize,
  processMessage,
  getSettings,
  clearSettingsCache,
  updateSettings
};