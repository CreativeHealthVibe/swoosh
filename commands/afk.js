// afk.js - Command for setting AFK status
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const logging = require('../modules/logging');

// Store AFK users with timestamps and reason
const afkUsers = new Map();

module.exports = {
  name: 'afk',
  description: 'Set your AFK status with an optional reason',
  usage: '.afk [reason]',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Get AFK reason
      const reason = args.length > 0 
        ? args.join(' ') 
        : 'No reason provided';
      
      // Set user as AFK
      afkUsers.set(message.author.id, {
        timestamp: Date.now(),
        reason,
        originalNickname: message.member.nickname || message.author.username
      });
      
      // Update nickname to show AFK status
      try {
        if (message.member.manageable) {
          const newNickname = `[AFK] ${message.member.nickname || message.author.username}`;
          // Only update if new nickname is different and doesn't exceed 32 chars
          if (message.member.nickname !== newNickname && newNickname.length <= 32) {
            await message.member.setNickname(newNickname);
          }
        }
      } catch (e) {
        console.error('Could not update nickname for AFK status:', e);
      }
      
      // Create embed response
      const embed = new EmbedBuilder()
        .setTitle('AFK Status Set')
        .setDescription(`${message.author.toString()} is now AFK`)
        .addFields({ name: 'Reason', value: reason })
        .setColor(config.embedColor)
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing afk command:', error);
      message.reply('An error occurred while setting your AFK status.');
    }
  },
  
  /**
   * Handle a message from an AFK user
   * @param {Object} message - Discord message
   * @returns {boolean} - Whether the user was AFK
   */
  handleReturnFromAfk: async (message) => {
    // Check if user is in AFK list
    if (afkUsers.has(message.author.id)) {
      const { timestamp, originalNickname } = afkUsers.get(message.author.id);
      
      // Calculate AFK duration
      const duration = Date.now() - timestamp;
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      let durationStr;
      if (hours > 0) {
        durationStr = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        durationStr = `${minutes}m ${seconds % 60}s`;
      } else {
        durationStr = `${seconds}s`;
      }
      
      // Remove from AFK list
      afkUsers.delete(message.author.id);
      
      // Reset nickname if it was changed
      try {
        if (message.member.manageable && message.member.nickname && message.member.nickname.startsWith('[AFK]')) {
          await message.member.setNickname(originalNickname === message.author.username ? null : originalNickname);
        }
      } catch (e) {
        console.error('Could not reset nickname from AFK status:', e);
      }
      
      // Notify user they are no longer AFK
      const embed = new EmbedBuilder()
        .setTitle('AFK Status Removed')
        .setDescription(`Welcome back ${message.author.toString()}! You are no longer AFK.`)
        .addFields({ name: 'AFK Duration', value: durationStr })
        .setColor(config.embedColor)
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
      return true;
    }
    
    return false;
  },
  
  /**
   * Handle mentions of AFK users
   * @param {Object} message - Discord message
   * @returns {boolean} - Whether an AFK user was mentioned
   */
  handleAfkMention: async (message) => {
    // Skip if message author is a bot
    if (message.author.bot) return false;
    
    // Check if message mentions any AFK users
    const mentionedUsers = message.mentions.users;
    if (mentionedUsers.size === 0) return false;
    
    // Filter out mentioned users who are AFK
    const mentionedAfkUsers = mentionedUsers.filter(user => afkUsers.has(user.id));
    if (mentionedAfkUsers.size === 0) return false;
    
    // Create notification about AFK users
    const afkNotifications = [];
    
    for (const [userId, user] of mentionedAfkUsers) {
      const { timestamp, reason } = afkUsers.get(userId);
      const afkDuration = Math.floor((Date.now() - timestamp) / 60000); // in minutes
      
      let timeAgo;
      if (afkDuration < 1) {
        timeAgo = 'just now';
      } else if (afkDuration < 60) {
        timeAgo = `${afkDuration} minute${afkDuration === 1 ? '' : 's'} ago`;
      } else {
        const hours = Math.floor(afkDuration / 60);
        timeAgo = `${hours} hour${hours === 1 ? '' : 's'} ago`;
      }
      
      afkNotifications.push(`${user.toString()} is AFK: ${reason} (${timeAgo})`);
    }
    
    if (afkNotifications.length > 0) {
      const embed = new EmbedBuilder()
        .setTitle('AFK Notification')
        .setDescription(afkNotifications.join('\n'))
        .setColor(config.embedColor)
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
      return true;
    }
    
    return false;
  },
  
  /**
   * Get all currently AFK users
   * @returns {Map} - Map of AFK users
   */
  getAfkUsers: () => {
    return afkUsers;
  }
};