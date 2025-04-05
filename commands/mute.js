// mute.js - Command to mute a user in the server
const { 
  EmbedBuilder, 
  PermissionFlagsBits 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'mute',
  description: 'Mute a user in the server',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  execute: async (message, args, client) => {
    try {
      // Check if user has permission to use this command
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('❌ You do not have permission to use this command.');
      }
      
      // Check if a user was mentioned
      const targetUser = message.mentions.members.first();
      if (!targetUser) {
        return message.reply('❌ Please mention a user to mute.');
      }
      
      // Check for self-mute or bot mute
      if (targetUser.id === message.author.id) {
        return message.reply('❌ You cannot mute yourself.');
      }
      
      if (targetUser.id === client.user.id) {
        return message.reply('❌ I cannot mute myself.');
      }
      
      // Check if the target user has higher permissions
      if (
        targetUser.permissions.has(PermissionFlagsBits.Administrator) ||
        (targetUser.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id)
      ) {
        return message.reply('❌ You cannot mute this user as they have higher or equal permissions to you.');
      }
      
      // Find or create muted role
      let mutedRole = message.guild.roles.cache.find(role => role.name === 'Muted');
      
      if (!mutedRole) {
        try {
          // Create a new muted role
          mutedRole = await message.guild.roles.create({
            name: 'Muted',
            color: '#808080',
            reason: 'For muting users'
          });
          
          // Set permissions for the role
          // This loop might take some time for servers with many channels
          await message.reply('⏳ Creating muted role and setting permissions. This may take a moment...');
          
          // Update channel permissions for all channels
          await Promise.all(message.guild.channels.cache.map(async (channel) => {
            await channel.permissionOverwrites.edit(mutedRole, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
              Stream: false
            });
          }));
          
          await message.channel.send('✅ Muted role created with appropriate permissions.');
        } catch (error) {
          console.error('Error creating muted role:', error);
          return message.reply('❌ Failed to create muted role. Please check my permissions and try again.');
        }
      }
      
      // Get reason and duration for mute
      let duration = null;
      let reason = 'No reason provided';
      
      // Process arguments to extract potential duration and reason
      if (args.length > 1) {
        const possibleDuration = args[1];
        
        // Simple duration parsing (e.g., 1h, 30m, 1d)
        if (/^\d+[smhd]$/.test(possibleDuration)) {
          duration = possibleDuration;
          reason = args.slice(2).join(' ') || reason;
        } else {
          reason = args.slice(1).join(' ');
        }
      }
      
      // Apply the muted role
      try {
        await targetUser.roles.add(mutedRole, `Muted by ${message.author.tag} | ${reason}`);
        
        // Create success embed
        const successEmbed = new EmbedBuilder()
          .setTitle('🔇 User Muted')
          .setDescription(`${targetUser.toString()} has been muted.`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Duration', value: duration || 'Indefinite' },
            { name: 'Muted by', value: message.author.toString() }
          )
          .setColor(config.embedColor)
          .setTimestamp();
        
        await message.channel.send({ embeds: [successEmbed] });
        
        // Log the action
        logging.logAction('User Muted', targetUser.user, message.author, {
          reason: reason,
          duration: duration || 'Indefinite'
        });
        
        // If duration is specified, set up timeout to unmute
        if (duration) {
          // Convert duration string to milliseconds
          const durationMs = convertDurationToMs(duration);
          
          if (durationMs) {
            setTimeout(async () => {
              try {
                // Check if user still has role before removing
                if (targetUser.roles.cache.has(mutedRole.id)) {
                  await targetUser.roles.remove(mutedRole, 'Automatic unmute after timed mute');
                  
                  // Create unmute embed
                  const unmuteEmbed = new EmbedBuilder()
                    .setTitle('🔊 User Unmuted')
                    .setDescription(`${targetUser.toString()} has been automatically unmuted.`)
                    .setColor(config.embedColor)
                    .setTimestamp();
                  
                  // Send to log channel if available, otherwise send to the current channel
                  if (config.logChannelId) {
                    const logChannel = client.channels.cache.get(config.logChannelId);
                    if (logChannel) {
                      await logChannel.send({ embeds: [unmuteEmbed] });
                    }
                  } else {
                    await message.channel.send({ embeds: [unmuteEmbed] });
                  }
                  
                  // Log the action
                  logging.logAction('User Unmuted', targetUser.user, client.user, {
                    reason: 'Automatic unmute after timed mute',
                    duration: duration
                  });
                }
              } catch (error) {
                console.error('Error unmuting user after timeout:', error);
              }
            }, durationMs);
          }
        }
      } catch (error) {
        console.error('Error applying muted role:', error);
        message.reply('❌ Failed to mute the user. Please check my permissions and try again.');
      }
    } catch (error) {
      console.error('Mute Command Error:', error);
      message.reply('❌ An error occurred while executing the mute command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'mute',
        error: error.message
      });
    }
  }
};

/**
 * Convert duration string to milliseconds
 * @param {string} duration - Duration string (e.g., 1h, 30m, 1d)
 * @returns {number|null} - Duration in milliseconds or null if invalid
 */
function convertDurationToMs(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000; // seconds
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return null;
  }
}