// setbounty.js - Premium Slash command to create bounties on targets
const { 
  SlashCommandBuilder, 
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const bountyManager = require('../handlers/bountyManager');
const adminUtils = require('../utils/admin');
const validators = require('../utils/validators');
const config = require('../config');
const logging = require('../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbounty')
    .setDescription('Create a new bounty on a Roblox player')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox username of the target')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('robloxid')
        .setDescription('Roblox User ID of the target')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Bounty amount (15-30000)')
        .setRequired(true)
        .setMinValue(15)
        .setMaxValue(30000)
    )
    .addBooleanOption(option =>
      option.setName('clip_required')
        .setDescription('Is a video clip required for proof?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the bounty (optional)')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Image of the target (PNG/JPG only)')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to post the bounty in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  
  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  execute: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true }); // Start with ephemeral reply for better UX
    
    try {
      // Check if user has permission with a more detailed error message
      if (!adminUtils.canCreateBounty(interaction.member)) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('⛔ Permission Denied')
          .setDescription('You need the **Bounty Master** or **Admin** role to create bounties.')
          .setColor('#FF0000')
          .setFooter({ text: 'SWOOSH Bounty System' });
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }
      
      // Get command options
      const robloxUsername = interaction.options.getString('username');
      const robloxId = interaction.options.getString('robloxid');
      const amount = interaction.options.getInteger('amount');
      const clipRequired = interaction.options.getBoolean('clip_required');
      const reason = interaction.options.getString('reason') || null;
      const image = interaction.options.getAttachment('image');
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      
      // Show a confirmation dialog with bounty details
      const confirmEmbed = new EmbedBuilder()
        .setTitle('🎯 Confirm Bounty Creation')
        .setDescription('Please review the bounty details before confirming:')
        .addFields(
          { name: 'Target', value: `\`${robloxUsername}\``, inline: true },
          { name: 'Roblox ID', value: `\`${robloxId}\``, inline: true },
          { name: 'Reward', value: `\`R$ ${amount.toLocaleString()}\``, inline: true },
          { name: 'Evidence Required', value: clipRequired ? '`Video Clip Required`' : '`No Clip Needed`', inline: true },
          { name: 'Target Image', value: image ? '`Provided ✓`' : '`Not Provided ✗`', inline: true },
          { name: 'Post Channel', value: `${channel}`, inline: true }
        )
        .setColor('#FFD700')
        .setFooter({ text: 'SWOOSH Bounty System • Premium Edition' });
        
      // Add reason field if provided
      if (reason) {
        confirmEmbed.addFields({ name: '📝 Reason', value: `\`${reason}\``, inline: false });
      }
      
      if (image) {
        confirmEmbed.setThumbnail(image.url);
      }
      
      // Create confirm/cancel buttons
      const confirmButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('confirm-bounty')
            .setLabel('Confirm Bounty')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('cancel-bounty')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );
      
      // Send the confirmation message
      const confirmMessage = await interaction.editReply({
        embeds: [confirmEmbed],
        components: [confirmButtons]
      });
      
      try {
        // Wait for button interaction
        const buttonInteraction = await confirmMessage.awaitMessageComponent({
          filter: i => i.user.id === interaction.user.id,
          time: 60000, // 1 minute timeout
          componentType: ComponentType.Button
        });
        
        // Handle button press
        if (buttonInteraction.customId === 'confirm-bounty') {
          // Update message to show processing
          await buttonInteraction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle('⏳ Processing Bounty...')
                .setDescription('Creating your bounty, please wait...')
                .setColor('#FFD700')
            ],
            components: []
          });
          
          // Validate Roblox ID
          if (!validators.validateRobloxID(robloxId)) {
            return buttonInteraction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle('❌ Validation Error')
                  .setDescription('Invalid Roblox ID. Please provide a valid numeric ID.')
                  .setColor('#FF0000')
              ],
              components: []
            });
          }
          
          // Validate image if provided
          if (image && !validators.validateImage(image)) {
            return buttonInteraction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle('❌ Validation Error')
                  .setDescription('Invalid image format. Only PNG and JPG are supported.')
                  .setColor('#FF0000')
              ],
              components: []
            });
          }
          
          // Create bounty
          const result = await bountyManager.createBounty(interaction, {
            robloxUsername,
            robloxId,
            amount,
            clipRequired,
            reason,
            image,
            channel
          });
          
          if (result.success) {
            // Success message with eye-catching design
            const successEmbed = new EmbedBuilder()
              .setTitle('🎯 Bounty Created Successfully')
              .setDescription(`**Target:** \`${robloxUsername}\`\n**Reward:** \`R$ ${amount.toLocaleString()}\`${reason ? `\n**Reason:** \`${reason}\`` : ''}\n\n${result.message || 'The bounty has been posted to the specified channel.'}`)
              .setColor('#00FF00')
              .setFooter({ text: 'SWOOSH Bounty System • Premium Edition' })
              .setTimestamp();
            
            return buttonInteraction.editReply({ embeds: [successEmbed], components: [] });
          } else {
            // Failure message with detailed explanation
            const failureEmbed = new EmbedBuilder()
              .setTitle('❌ Bounty Creation Failed')
              .setDescription(`**Error:** ${result.message || 'Unknown error occurred'}`)
              .setColor('#FF0000')
              .setFooter({ text: 'Please try again or contact an administrator' });
            
            return buttonInteraction.editReply({ embeds: [failureEmbed], components: [] });
          }
        } else if (buttonInteraction.customId === 'cancel-bounty') {
          // Cancel message
          const cancelEmbed = new EmbedBuilder()
            .setTitle('🚫 Bounty Cancelled')
            .setDescription('The bounty creation has been cancelled.')
            .setColor('#808080')
            .setFooter({ text: 'SWOOSH Bounty System' });
          
          return buttonInteraction.update({ embeds: [cancelEmbed], components: [] });
        }
      } catch (timeoutError) {
        // Timeout - update the message to show it expired
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⏰ Time Expired')
          .setDescription('Bounty creation cancelled due to timeout. Please try again.')
          .setColor('#808080');
        
        return interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    } catch (error) {
      console.error('Setbounty Command Error:', error);
      
      // Create an error embed for better user experience
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(`An error occurred while creating the bounty:\n\`${error.message || 'Unknown error'}\``)
        .setColor('#FF0000')
        .setFooter({ text: 'Please try again or contact an administrator' });
      
      interaction.editReply({ embeds: [errorEmbed], components: [] });
      
      // Log error
      logging.logAction('Command Error', interaction.user, null, {
        command: 'setbounty',
        error: error.message
      });
    }
  }
};
