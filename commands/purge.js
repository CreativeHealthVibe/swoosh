// purge.js - Command to bulk delete messages in a channel
const { 
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'purge',
  description: 'Bulk delete a specified number of recent messages in a channel',
  usage: '.purge <amount> [reason]',
  adminOnly: true,
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Delete the command message
      message.delete().catch(error => console.error('Error deleting command message:', error));
      
      // Check if user has required permissions
      if (!adminUtils.isAdmin(message.member) && 
          !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.channel.send('You do not have permission to delete messages.')
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Check for required args
      if (!args[0]) {
        return message.channel.send(`Please specify the number of messages to delete. Usage: ${this.usage}`)
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }
      
      // Parse the message count
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.channel.send('Please provide a number between 1 and 100.')
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }
      
      // Get the reason if provided
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      try {
        // Fetch and delete messages
        const messages = await message.channel.messages.fetch({ limit: amount });
        
        // Filter out messages older than 14 days (Discord API limitation)
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const recentMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
        
        if (recentMessages.size === 0) {
          return message.channel.send('No messages found that can be deleted (messages must be less than 14 days old).')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        }
        
        // Bulk delete messages
        const deleted = await message.channel.bulkDelete(recentMessages, true);
        
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Messages Purged')
          .setDescription(`Successfully deleted ${deleted.size} messages.`)
          .addFields(
            { name: 'Channel', value: message.channel.toString(), inline: true },
            { name: 'Moderator', value: message.author.toString(), inline: true },
            { name: 'Reason', value: reason }
          )
          .setColor(config.embedColor)
          .setTimestamp();
        
        // Send temporary success message
        const successMsg = await message.channel.send({ embeds: [embed] });
        setTimeout(() => successMsg.delete().catch(() => {}), 5000);
        
        // Log action
        await logging.logAction('Messages Purged', null, message.author, {
          channel: message.channel.name,
          amount: deleted.size,
          reason: reason
        });
        
      } catch (error) {
        console.error(`Error purging messages:`, error);
        
        // Send a user-friendly error message
        let errorMsg = 'Failed to delete messages.';
        
        if (error.code === 50034) {
          errorMsg = 'Cannot delete messages older than 14 days due to Discord limitations.';
        } else if (error.message.includes('rate limit')) {
          errorMsg = 'Rate limited by Discord. Please try again in a few moments.';
        }
        
        message.channel.send(errorMsg)
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }
      
    } catch (error) {
      console.error('Error executing purge command:', error);
      message.channel.send('An error occurred while executing this command.')
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    }
  }
};