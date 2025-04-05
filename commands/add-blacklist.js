// add-blacklist.js - Command to add a user to the blacklist
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const blacklistManager = require('../handlers/blacklistManager');
const logging = require('../modules/logging');

module.exports = {
  name: 'add',
  description: 'Add a user to the blacklist',
  usage: '.add blacklist ID: [User ID] User: [@Username] Reason: [Reason]',
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
      
      // Check if first argument is 'blacklist'
      if (!args[0] || args[0].toLowerCase() !== 'blacklist') {
        return;
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, 'add blacklist', args);
      
      // Get the full content after the command
      const content = message.content.slice(message.content.indexOf('blacklist') + 'blacklist'.length).trim();
      
      // Parse the blacklist parameters
      const params = parseBlacklistParameters(content);
      
      if (!params.userId) {
        return message.reply('Please provide a valid user ID. Usage: ' + this.usage);
      }
      
      if (!params.username) {
        return message.reply('Please provide a username. Usage: ' + this.usage);
      }
      
      if (!params.reason) {
        return message.reply('Please provide a reason for blacklisting. Usage: ' + this.usage);
      }
      
      // Add the user to the blacklist
      const result = blacklistManager.addToBlacklist(
        params.userId,
        params.username,
        params.reason,
        message.author.id,
        message.author.tag
      );
      
      if (!result.success) {
        return message.reply(`Failed to add user to blacklist: ${result.message}`);
      }
      
      // Create the embed response
      const embed = new EmbedBuilder()
        .setTitle('User Added to Blacklist')
        .setDescription(`Successfully added <@${params.userId}> to the blacklist.`)
        .addFields(
          { name: 'User ID', value: params.userId, inline: true },
          { name: 'Username', value: params.username, inline: true },
          { name: 'Added By', value: message.author.toString(), inline: true },
          { name: 'Reason', value: params.reason }
        )
        .setColor(config.embedColor)
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      
      // Log action
      await logging.logAction('User Blacklisted', { id: params.userId, tag: params.username }, message.author, {
        reason: params.reason
      });
      
    } catch (error) {
      console.error('Error executing add blacklist command:', error);
      message.reply('An error occurred while executing this command.');
    }
  }
};

/**
 * Parse the blacklist parameters from message content
 * @param {string} content - The message content
 * @returns {Object} - The parsed parameters
 */
function parseBlacklistParameters(content) {
  const params = {
    userId: null,
    username: null,
    reason: null
  };
  
  // Parse User ID
  const idMatch = content.match(/ID:\s*([0-9]+)/i);
  if (idMatch && idMatch[1]) {
    params.userId = idMatch[1];
  }
  
  // Parse Username
  const userMatch = content.match(/User:\s*(@[^\s]+|@.+?)(?=\s+Reason:|$)/i);
  if (userMatch && userMatch[1]) {
    params.username = userMatch[1].trim();
  }
  
  // Parse Reason
  const reasonMatch = content.match(/Reason:\s*(.+)$/i);
  if (reasonMatch && reasonMatch[1]) {
    params.reason = reasonMatch[1].trim();
  }
  
  return params;
}