// ban.js - Command to ban a user from the server
const { 
  EmbedBuilder,
  MessageActionRow,
  MessageButton 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');
const banLogger = require('../modules/ban-logger');

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

      try {
        // Create a confirmation message with buttons
        const confirmEmbed = new EmbedBuilder()
          .setTitle('⚠️ Confirm Ban')
          .setDescription(`Are you sure you want to ban ${targetUser.user.tag}?`)
          .addFields(
            { name: 'User', value: `${targetUser.user.tag} (${targetUser.id})`, inline: false },
            { name: 'Reason', value: reason, inline: false }
          )
          .setColor('#FFCC00')
          .setTimestamp();
        
        // Create action row with buttons
        const row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('confirm-ban')
            .setLabel('Confirm Ban')
            .setStyle('DANGER'),
          new MessageButton()
            .setCustomId('cancel-ban')
            .setLabel('Cancel')
            .setStyle('SECONDARY')
        );
        
        // Send confirmation message with buttons
        const confirmMessage = await message.channel.send({
          embeds: [confirmEmbed],
          components: [row]
        });
        
        // Create collector for button interactions
        const collector = confirmMessage.createMessageComponentCollector({
          filter: i => i.user.id === message.author.id,
          time: 30000 // 30 seconds timeout
        });
        
        // Handle button interactions
        collector.on('collect', async interaction => {
          if (interaction.customId === 'confirm-ban') {
            try {
              // Proceed with ban
              await targetUser.ban({ reason: `${reason} | Banned by ${message.author.tag}` });
              
              // Log the ban to our specialized ban log for enhanced tracking
              banLogger.logBan(
                { 
                  user: targetUser.user, 
                  reason 
                }, 
                message.author, 
                message.guild.id
              );
              
              // Format the current time
              const now = new Date();
              const hours = now.getHours().toString().padStart(2, '0');
              const minutes = now.getMinutes().toString().padStart(2, '0');
              const timeString = `Today at ${hours}:${minutes}`;
              
              // Create success embed
              const successEmbed = new EmbedBuilder()
                .setTitle('🔨 User Banned')
                .setDescription(`${targetUser.user.username} has been banned from the server.`)
                .addFields(
                  { name: 'Reason', value: reason, inline: false },
                  { name: 'Banned by', value: message.author.username, inline: false }
                )
                .setFooter({ text: timeString })
                .setColor('#FF0000')
                .setTimestamp();
              
              await interaction.update({ 
                embeds: [successEmbed], 
                components: [] 
              });
              
              // Log the action to the general logging system
              logging.logAction('User Banned', targetUser.user, message.author, {
                reason: reason
              });
            } catch (error) {
              console.error('Ban execution error:', error);
              await interaction.update({ 
                content: '❌ An error occurred while trying to ban the user.', 
                embeds: [], 
                components: [] 
              });
            }
          } else if (interaction.customId === 'cancel-ban') {
            // Cancel the ban
            const cancelEmbed = new EmbedBuilder()
              .setTitle('❌ Ban Cancelled')
              .setDescription(`Ban for ${targetUser.user.tag} has been cancelled.`)
              .setColor('#00CC00')
              .setTimestamp();
              
            await interaction.update({ 
              embeds: [cancelEmbed], 
              components: [] 
            });
          }
        });
        
        // Handle collector timeout
        collector.on('end', collected => {
          if (collected.size === 0) {
            const timeoutEmbed = new EmbedBuilder()
              .setTitle('⏱️ Ban Timed Out')
              .setDescription('Ban confirmation timed out.')
              .setColor('#999999')
              .setTimestamp();
              
            confirmMessage.edit({
              embeds: [timeoutEmbed],
              components: []
            }).catch(console.error);
          }
        });
      } catch (error) {
        console.error('Ban execution error:', error);
        message.reply('❌ An error occurred while trying to ban the user.');
      }
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