// tempban.js - Command to temporarily ban a user
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'tempban',
  description: 'Temporarily ban a user for a specified duration',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check if user has permission to use this command
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('❌ You do not have permission to use this command.');
      }
      
      // Check if a user was mentioned
      const targetUser = message.mentions.members.first();
      if (!targetUser) {
        return message.reply('❌ Please mention a user to temporarily ban.');
      }
      
      // Check if the bot can ban the target user
      if (!targetUser.bannable) {
        return message.reply('❌ I cannot ban this user. They may have higher permissions than me.');
      }
      
      // Check if a duration was provided
      if (!args[1]) {
        return message.reply('❌ Please provide a duration for the temporary ban (e.g., 1h, 1d, 1w).');
      }
      
      // Parse the duration
      const durationMs = convertDurationToMs(args[1]);
      if (!durationMs) {
        return message.reply('❌ Invalid duration format. Please use formats like 1h, 1d, or 1w.');
      }
      
      // Get reason for ban (any remaining text)
      const reasonArray = args.slice(2);
      const reason = reasonArray.length > 0 ? reasonArray.join(' ') : 'No reason provided';
      
      // Calculate unban time
      const unbanTime = Date.now() + durationMs;
      const formattedDuration = formatDuration(durationMs);
      
      try {
        // Ban the user
        await targetUser.ban({ 
          reason: `[Temp Ban: ${formattedDuration}] ${reason} | Banned by ${message.author.tag}` 
        });
        
        // Store the tempban in database or other persistent storage
        // This is a simplified version; you would typically store this in a database
        if (!client.tempBans) client.tempBans = new Map();
        client.tempBans.set(targetUser.id, {
          userId: targetUser.id,
          guildId: message.guild.id,
          unbanTime: unbanTime,
          reason: reason,
          moderator: message.author.id
        });
        
        // Schedule unban (for demo purposes - in a real implementation this would be handled by a job system)
        setTimeout(async () => {
          try {
            await message.guild.members.unban(
              targetUser.id, 
              `Temporary ban expired. Original reason: ${reason}`
            );
            
            // Log the automatic unban
            logging.logAction('User Auto-Unbanned', targetUser.user, client.user, {
              reason: 'Temporary ban duration expired',
              originalReason: reason,
              bannedBy: message.author.tag
            });
            
            // Remove from tempban list
            if (client.tempBans) client.tempBans.delete(targetUser.id);
            
            // Notify in log channel if available
            const logChannel = message.guild.channels.cache.find(
              channel => channel.name === 'mod-logs' || channel.name === 'admin-logs'
            );
            
            if (logChannel) {
              const unbanEmbed = new EmbedBuilder()
                .setTitle('🔓 Automatic Unban')
                .setDescription(`${targetUser.user.username} has been automatically unbanned.`)
                .addFields(
                  { name: 'Original Ban Reason', value: reason, inline: false },
                  { name: 'Ban Duration', value: formattedDuration, inline: true },
                  { name: 'Originally Banned By', value: message.author.username, inline: true }
                )
                .setColor('#00FF00')
                .setTimestamp();
              
              logChannel.send({ embeds: [unbanEmbed] }).catch(() => {});
            }
          } catch (error) {
            console.error('Error during automatic unban:', error);
          }
        }, durationMs);
        
        // Format the current time
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `Today at ${hours}:${minutes}`;
        
        // Format the unban time
        const unbanDate = new Date(unbanTime);
        const unbanTimeString = `<t:${Math.floor(unbanTime / 1000)}:R>`;
        
        // Create success embed
        const successEmbed = new EmbedBuilder()
          .setTitle('🔨 User Temporarily Banned')
          .setDescription(`${targetUser.user.username} has been banned from the server.`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Duration', value: formattedDuration, inline: true },
            { name: 'Unbans', value: unbanTimeString, inline: true },
            { name: 'Banned by', value: message.author.username, inline: false }
          )
          .setFooter({ text: timeString })
          .setColor('#FF5500')
          .setTimestamp();
        
        await message.channel.send({ embeds: [successEmbed] });
        
        // Log the action
        logging.logAction('User Temp Banned', targetUser.user, message.author, {
          reason: reason,
          duration: formattedDuration,
          unbanTime: unbanTime
        });
      } catch (error) {
        console.error('Tempban execution error:', error);
        message.reply('❌ An error occurred while trying to temporarily ban the user.');
      }
    } catch (error) {
      console.error('Tempban Command Error:', error);
      message.reply('❌ An error occurred while executing the tempban command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'tempban',
        error: error.message
      });
    }
  }
};

/**
 * Convert duration string to milliseconds
 * @param {string} duration - Duration string (e.g., 1h, 1d, 1w)
 * @returns {number|null} - Duration in milliseconds or null if invalid
 */
function convertDurationToMs(duration) {
  const regex = /^(\d+)([hdwmy])$/;
  const match = duration.match(regex);
  
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'h': // hours
      return value * 60 * 60 * 1000;
    case 'd': // days
      return value * 24 * 60 * 60 * 1000;
    case 'w': // weeks
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'm': // months (approximate)
      return value * 30 * 24 * 60 * 60 * 1000;
    case 'y': // years (approximate)
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Format duration in human-readable form
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}