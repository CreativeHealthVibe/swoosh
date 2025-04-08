// baninfo.js - Command to get information about a banned user
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'baninfo',
  description: 'Get information about a banned user',
  
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
      
      // Check if a user ID was provided
      if (!args[0]) {
        return message.reply('❌ Please provide a user ID to get ban information.');
      }
      
      const userId = args[0];
      
      try {
        // Fetch ban information from the guild
        const guild = message.guild;
        const ban = await guild.bans.fetch(userId).catch(() => null);
        
        if (!ban) {
          return message.reply(`❌ No ban found for user with ID: ${userId}`);
        }
        
        // Create an embed with ban information
        const banInfoEmbed = new EmbedBuilder()
          .setTitle('🔨 Ban Information')
          .setColor('#FF0000')
          .addFields(
            { name: 'User', value: `${ban.user.username} (${ban.user.id})`, inline: false },
            { name: 'Reason', value: ban.reason || 'No reason provided', inline: false },
            { name: 'Account Created', value: `<t:${Math.floor(ban.user.createdTimestamp / 1000)}:F>`, inline: true }
          )
          .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        
        await message.channel.send({ embeds: [banInfoEmbed] });
        
        // Log the action
        logging.logAction('Ban Info Requested', ban.user, message.author, {
          requestedBy: message.author.tag
        });
      } catch (error) {
        console.error('Ban info error:', error);
        message.reply('❌ An error occurred while trying to fetch ban information.');
      }
    } catch (error) {
      console.error('Ban Info Command Error:', error);
      message.reply('❌ An error occurred while executing the ban info command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'baninfo',
        error: error.message
      });
    }
  }
};