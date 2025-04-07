// dm.js - Command to send a direct message to a user
const { 
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'dm',
  description: 'Send a direct message to a user',
  usage: '.dm <@user or userId> <message>',
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
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('You do not have permission to use this command.');
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Check for required args
      if (!args[0]) {
        return message.reply(`Please mention a user or provide their ID. Usage: ${this.usage}`);
      }
      
      if (!args[1]) {
        return message.reply(`Please provide a message to send. Usage: ${this.usage}`);
      }
      
      // Get user ID from mention or direct ID
      let targetId = args[0].replace(/[<@!>]/g, '');
      const dmMessage = args.slice(1).join(' ');
      
      // Validate that the ID looks like a Discord user ID
      if (!/^\d{17,19}$/.test(targetId)) {
        return message.reply('Invalid user mention or ID. Please provide a valid Discord user.');
      }
      
      try {
        // Try to fetch the user
        const targetUser = await client.users.fetch(targetId);
        
        if (!targetUser) {
          return message.reply('Could not find that user.');
        }
        
        // Create DM embed
        const dmEmbed = new EmbedBuilder()
          .setTitle(`Message from ${message.guild.name}`)
          .setDescription(dmMessage)
          .addFields(
            { name: 'Sent By', value: `${message.author.tag} (Staff Member)` }
          )
          .setColor(config.embedColor)
          .setTimestamp()
          .setFooter({ text: 'This is an official message from server staff' });
        
        // Send the DM
        await targetUser.send({ embeds: [dmEmbed] }).catch(error => {
          throw new Error(`Could not send DM to this user. They may have DMs disabled: ${error.message}`);
        });
        
        // Create confirmation embed
        const confirmEmbed = new EmbedBuilder()
          .setTitle('Direct Message Sent')
          .setDescription(`Successfully sent a DM to ${targetUser.tag}.`)
          .addFields(
            { name: 'Recipient', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: 'Sent By', value: message.author.toString(), inline: true },
            { name: 'Message', value: dmMessage }
          )
          .setColor(config.embedColor)
          .setTimestamp();
        
        await message.reply({ embeds: [confirmEmbed] });
        
        // Log action
        await logging.logAction('DM Sent', targetUser, message.author, {
          message: dmMessage
        });
        
      } catch (error) {
        console.error(`Error sending DM:`, error);
        message.reply(`Failed to send DM: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error executing dm command:', error);
      message.reply('An error occurred while executing this command.');
    }
  }
};