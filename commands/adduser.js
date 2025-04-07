// adduser.js - Command to add a user to a ticket
const ticketManager = require('../handlers/ticketManager');
const logging = require('../modules/logging');
const adminUtils = require('../utils/admin');

module.exports = {
  name: 'adduser',
  description: 'Add a user to the current ticket',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  execute: async (message, args, client) => {
    try {
      // Check if user has permissions to use this command
      if (!adminUtils.canManageTickets(message.member)) {
          return message.reply('❌ You do not have permission to use this command.');
      }
      
      // Check if message is in a ticket channel
      if (!message.channel.name.startsWith('ticket-')) {
        return message.reply('❌ This command can only be used in ticket channels!');
      }
      
      // Get mentioned user
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return message.reply('❌ Please mention a user to add to the ticket!');
      }
      
      // Prevent adding bots
      if (targetUser.bot) {
        return message.reply('❌ You cannot add bots to tickets!');
      }
      
      // Add user to ticket
      const result = await ticketManager.addUserToTicket(
        message.channel,
        targetUser,
        message.member
      );
      
      // Return result
      if (result.success) {
        return message.reply(result.message);
      } else {
        return message.reply(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('AddUser Command Error:', error);
      message.reply('❌ An error occurred while adding the user to the ticket.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'adduser',
        error: error.message
      });
    }
  }
};
