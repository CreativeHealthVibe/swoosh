// transcript.js - Command to generate transcript
const { 
  createTranscript 
} = require('discord-html-transcripts');
const logging = require('../modules/logging');
const config = require('../config');
const adminUtils = require('../utils/admin');

module.exports = {
  name: 'transcript',
  description: 'Generate a transcript of the current ticket',
  
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
      
      // Check if channel is a ticket
      if (!message.channel.name.startsWith('ticket-')) {
        return message.reply('❌ This command can only be used in ticket channels!');
      }
      
      // Create transcript
      const transcript = await createTranscript(message.channel, {
        limit: -1,
        fileName: `${message.channel.name}-transcript.html`
      });
      
      // Save transcript
      logging.saveTranscript(transcript, message.channel.name);
      
      // Send transcript in channel
      await message.reply({
        content: '✅ Transcript generated successfully!',
        files: [transcript]
      });
      
      // Log action
      logging.logAction('Transcript Generated', message.author, message.author, {
        channel: message.channel
      });
    } catch (error) {
      console.error('Transcript Command Error:', error);
      message.reply('❌ An error occurred while generating the transcript.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'transcript',
        error: error.message
      });
    }
  }
};
