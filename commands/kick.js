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
      
      // Create confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Kick Confirmation')
        .setDescription(`Are you sure you want to kick ${targetUser.toString()}?\nReason: ${reason}`)
        .setColor('#FFA500')
        .setFooter({ text: 'React ✅ to confirm or ❌ to cancel' });
      
      // Send confirmation message
      const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
      
      // Add reaction for confirmation
      await confirmMsg.react('✅');
      await confirmMsg.react('❌');
      
      // Create filter for reaction collector
      const filter = (reaction, user) => {
        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
      };
      
      // Create collector
      const collector = confirmMsg.createReactionCollector({ 
        filter, 
        time: 30000, // 30 seconds timeout
        max: 1 // Only collect one reaction
      });
      
      // Handle reactions
      collector.on('collect', async (reaction, user) => {
        if (reaction.emoji.name === '✅') {
          try {
            // Kick the user
            await targetUser.kick(`${reason} | Kicked by ${message.author.tag}`);
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
              .setTitle('✅ User Kicked')
              .setDescription(`${targetUser.user.tag} has been kicked from the server.`)
              .addFields(
                { name: 'Reason', value: reason },
                { name: 'Kicked by', value: message.author.toString() }
              )
              .setColor(config.embedColor)
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
        } else {
          // Kick cancelled
          const cancelEmbed = new EmbedBuilder()
            .setTitle('❌ Kick Cancelled')
            .setDescription('The kick action has been cancelled.')
            .setColor(config.embedColor);
          
          await message.channel.send({ embeds: [cancelEmbed] });
        }
      });
      
      // Handle collector end
      collector.on('end', collected => {
        if (collected.size === 0) {
          // No reaction, timeout
          message.channel.send('⏱️ Kick command timed out. Please try again if you still want to kick the user.');
        }
      });
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