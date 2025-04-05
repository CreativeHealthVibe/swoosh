// unban.js - Command to unban a user by their ID
const { 
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'unban',
  description: 'Unban a user from the server by their ID',
  usage: '.unban <userId> [reason]',
  adminOnly: true,
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check if user has required permissions
      if (!adminUtils.isAdmin(message.member) && 
          !message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('You do not have permission to unban users.');
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Check for required args
      if (!args[0]) {
        return message.reply(`Please provide the ID of the user to unban. Usage: ${this.usage}`);
      }
      
      const userId = args[0];
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      // Validate that the ID looks like a Discord user ID
      if (!/^\d{17,19}$/.test(userId)) {
        return message.reply('Invalid user ID. Please provide a valid Discord user ID.');
      }
      
      try {
        // Check if the user is actually banned
        const banInfo = await message.guild.bans.fetch(userId).catch(() => null);
        
        if (!banInfo) {
          return message.reply('That user is not banned or the ID is incorrect.');
        }
        
        // Unban the user
        await message.guild.members.unban(userId, `Unbanned by ${message.author.tag} | Reason: ${reason}`);
        
        // Create embed response
        const embed = new EmbedBuilder()
          .setTitle('User Unbanned')
          .setDescription(`<@${userId}> has been unbanned.`)
          .addFields(
            { name: 'User ID', value: userId, inline: true },
            { name: 'Unbanned By', value: message.author.toString(), inline: true },
            { name: 'Reason', value: reason }
          )
          .setColor(config.embedColor)
          .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Log action
        await logging.logAction('User Unbanned', { id: userId, tag: banInfo.user.tag }, message.author, {
          reason: reason
        });
        
      } catch (error) {
        console.error(`Error unbanning user ${userId}:`, error);
        message.reply(`Failed to unban user: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error executing unban command:', error);
      message.reply('An error occurred while executing this command.');
    }
  }
};