// setup-tickets.js - Command to set up the ticket system
const { 
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const adminUtils = require('../utils/admin');
const ticketManager = require('../handlers/ticketManager');
const logging = require('../modules/logging');
const config = require('../config');

module.exports = {
  name: 'setup-tickets',
  description: 'Set up the ticket system in a channel',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  execute: async (message, args, client) => {
    try {
      // Check if user has permission
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('❌ You need Administrator permissions to use this command!');
      }
      
      // Get target channel
      let targetChannel = message.mentions.channels.first();
      
      // If no channel is mentioned, use the current channel
      if (!targetChannel) {
        targetChannel = message.channel;
      } else {
        // Validate channel type
        if (targetChannel.type !== ChannelType.GuildText) {
          return message.reply('❌ You can only set up tickets in a text channel!');
        }
      }
      
      // Check bot permissions in the channel
      const permissions = targetChannel.permissionsFor(client.user);
      if (!permissions.has(PermissionFlagsBits.SendMessages) || 
          !permissions.has(PermissionFlagsBits.EmbedLinks) ||
          !permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply(`❌ I need SendMessages, EmbedLinks, and ManageMessages permissions in ${targetChannel}!`);
      }
      
      // Set up ticket panel
      const success = await ticketManager.setupTicketPanel(targetChannel, message.author);
      
      if (success) {
        return message.reply(`✅ Ticket system has been set up in ${targetChannel}!`);
      } else {
        return message.reply('❌ Failed to set up the ticket system. Check the logs for more information.');
      }
    } catch (error) {
      console.error('Setup Tickets Command Error:', error);
      message.reply('❌ An error occurred while setting up the ticket system.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'setup-tickets',
        error: error.message
      });
    }
  }
};
