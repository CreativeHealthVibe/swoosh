// softban.js - Command to softban a user (ban and then unban to delete messages)
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'softban',
  description: 'Softban a user (ban and then immediately unban to delete messages)',
  
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
        return message.reply('❌ Please mention a user to softban.');
      }
      
      // Check if the bot can ban the target user
      if (!targetUser.bannable) {
        return message.reply('❌ I cannot softban this user. They may have higher permissions than me.');
      }
      
      // Get deletion days (default to 7 if not specified)
      let deletionDays = 7;
      if (args[1] && !isNaN(args[1]) && args[1] >= 0 && args[1] <= 7) {
        deletionDays = parseInt(args[1]);
      }
      
      // Get reason for softban (any remaining text)
      const reasonArray = args.slice(isNaN(args[1]) ? 1 : 2);
      const reason = reasonArray.length > 0 ? reasonArray.join(' ') : 'No reason provided';
      
      try {
        // Execute the softban (ban and then immediate unban)
        await targetUser.ban({ 
          reason: `[Softban] ${reason} | Executed by ${message.author.tag}`,
          deleteMessageDays: deletionDays
        });
        
        // Immediately unban the user
        await message.guild.members.unban(
          targetUser.id, 
          `Softban complete - Original reason: ${reason}`
        );
        
        // Format the current time
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `Today at ${hours}:${minutes}`;
        
        // Create success embed
        const successEmbed = new EmbedBuilder()
          .setTitle('🔨 User Softbanned')
          .setDescription(`${targetUser.user.username} has been softbanned from the server.`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Messages Deleted', value: `Last ${deletionDays} day(s)`, inline: true },
            { name: 'Executed by', value: message.author.username, inline: true }
          )
          .setFooter({ text: timeString })
          .setColor('#FF9900')
          .setTimestamp();
        
        await message.channel.send({ embeds: [successEmbed] });
        
        // Log the action
        logging.logAction('User Softbanned', targetUser.user, message.author, {
          reason: reason,
          deletionDays: deletionDays
        });
      } catch (error) {
        console.error('Softban execution error:', error);
        message.reply('❌ An error occurred while trying to softban the user.');
      }
    } catch (error) {
      console.error('Softban Command Error:', error);
      message.reply('❌ An error occurred while executing the softban command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'softban',
        error: error.message
      });
    }
  }
};