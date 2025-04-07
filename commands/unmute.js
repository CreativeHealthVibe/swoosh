// unmute.js - Command to unmute a previously muted user
const { 
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'unmute',
  description: 'Unmute a previously muted user',
  usage: '.unmute <@user or userId> [reason]',
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
          !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('You do not have permission to unmute users.');
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Check for required args
      if (!args[0]) {
        return message.reply(`Please mention a user or provide their ID to unmute. Usage: ${this.usage}`);
      }
      
      // Get user ID from mention or direct ID
      let targetId = args[0].replace(/[<@!>]/g, '');
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      // Validate that the ID looks like a Discord user ID
      if (!/^\d{17,19}$/.test(targetId)) {
        return message.reply('Invalid user mention or ID. Please provide a valid Discord user.');
      }
      
      try {
        // Try to fetch the member
        const targetMember = await message.guild.members.fetch(targetId);
        
        if (!targetMember) {
          return message.reply('Could not find that user in this server.');
        }
        
        // Check if the user is actually timed out (muted)
        if (!targetMember.communicationDisabledUntil) {
          return message.reply('That user is not muted.');
        }
        
        // Unmute the user by setting timeout to null
        await targetMember.timeout(null, `Unmuted by ${message.author.tag} | Reason: ${reason}`);
        
        // Format the current time
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `Today at ${hours}:${minutes}`;
        
        // Create embed response without pinging users
        const embed = new EmbedBuilder()
          .setTitle('🔊 User Unmuted')
          .setDescription(`${targetMember.user.username} has been unmuted.`)
          .addFields(
            { name: 'User', value: `${targetMember.user.username} (${targetMember.id})`, inline: false },
            { name: 'Unmuted By', value: message.author.username, inline: false },
            { name: 'Reason', value: reason, inline: false }
          )
          .setFooter({ text: timeString })
          .setColor('#43b581')
          .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Log action
        await logging.logAction('User Unmuted', targetMember.user, message.author, {
          reason: reason
        });
        
      } catch (error) {
        console.error(`Error unmuting user:`, error);
        message.reply(`Failed to unmute user: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error executing unmute command:', error);
      message.reply('An error occurred while executing this command.');
    }
  }
};