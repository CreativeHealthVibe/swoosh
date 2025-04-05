// ban.js - Command to ban a user from the server
const { 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'ban',
  description: 'Ban a user from the server',
  
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
        return message.reply('❌ Please mention a user to ban.');
      }
      
      // Check if the bot can ban the target user
      if (!targetUser.bannable) {
        return message.reply('❌ I cannot ban this user. They may have higher permissions than me.');
      }
      
      // Get reason for ban (any text after the mention)
      const reasonArray = args.slice(1);
      const reason = reasonArray.length > 0 ? reasonArray.join(' ') : 'No reason provided';
      
      // Create confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Ban Confirmation')
        .setDescription(`Are you sure you want to ban ${targetUser.toString()}?\nReason: ${reason}`)
        .setColor('#FF0000')
        .setFooter({ text: 'This action is irreversible' });
      
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
            // Ban the user
            await targetUser.ban({ reason: `${reason} | Banned by ${message.author.tag}` });
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
              .setTitle('✅ User Banned')
              .setDescription(`${targetUser.user.tag} has been banned from the server.`)
              .addFields(
                { name: 'Reason', value: reason },
                { name: 'Banned by', value: message.author.toString() }
              )
              .setColor(config.embedColor)
              .setTimestamp();
            
            await message.channel.send({ embeds: [successEmbed] });
            
            // Log the action
            logging.logAction('User Banned', targetUser.user, message.author, {
              reason: reason
            });
          } catch (error) {
            console.error('Ban execution error:', error);
            message.reply('❌ An error occurred while trying to ban the user.');
          }
        } else {
          // Ban cancelled
          const cancelEmbed = new EmbedBuilder()
            .setTitle('❌ Ban Cancelled')
            .setDescription('The ban action has been cancelled.')
            .setColor(config.embedColor);
          
          await message.channel.send({ embeds: [cancelEmbed] });
        }
      });
      
      // Handle collector end
      collector.on('end', collected => {
        if (collected.size === 0) {
          // No reaction, timeout
          message.channel.send('⏱️ Ban command timed out. Please try again if you still want to ban the user.');
        }
      });
    } catch (error) {
      console.error('Ban Command Error:', error);
      message.reply('❌ An error occurred while executing the ban command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'ban',
        error: error.message
      });
    }
  }
};