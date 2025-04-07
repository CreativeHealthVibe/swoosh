// kick.js - Command to kick a user from the server
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'kick',
  description: 'Kick a user from the server',
  
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
        return message.reply('❌ Please mention a user to kick.');
      }
      
      // Check if the bot can kick the target user
      if (!targetUser.kickable) {
        return message.reply('❌ I cannot kick this user. They may have higher permissions than me.');
      }
      
      // Get reason for kick (any text after the mention)
      const reasonArray = args.slice(1);
      const reason = reasonArray.length > 0 ? reasonArray.join(' ') : 'No reason provided';
      
      try {
        // Kick the user immediately without confirmation
        await targetUser.kick(`${reason} | Kicked by ${message.author.tag}`);
        
        // Format the current time
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `Today at ${hours}:${minutes}`;
        
        // Create success embed with the requested format
        const successEmbed = new EmbedBuilder()
          .setTitle('👢 User Kicked')
          .setDescription(`${targetUser.user.username} has been kicked from the server.`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Kicked by', value: message.author.username, inline: false }
          )
          .setFooter({ text: timeString })
          .setColor('#FFA500')
          .setTimestamp();
        
        await message.channel.send({ embeds: [successEmbed] });
        
        // Log the action
        logging.logAction('User Kicked', targetUser.user, message.author, {
          reason: reason
        });
      } catch (error) {
        console.error('Kick execution error:', error);
        message.reply('❌ An error occurred while trying to kick the user.');
      }
    } catch (error) {
      console.error('Kick Command Error:', error);
      message.reply('❌ An error occurred while executing the kick command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'kick',
        error: error.message
      });
    }
  }
};