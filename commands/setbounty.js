// setbounty.js - Ultra Premium Slash command to create bounties on targets
const { 
  SlashCommandBuilder, 
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const bountyManager = require('../handlers/bountyManager');
const adminUtils = require('../utils/admin');
const validators = require('../utils/validators');
const config = require('../config');
const logging = require('../modules/logging');

// Predefined templates for bounty creation - these will be shown in the UI
const BOUNTY_TEMPLATES = [
  { 
    id: 'standard', 
    name: 'Standard Bounty',
    description: 'Regular bounty announcement',
    color: '#FF0000', 
    icon: '🎯'
  },
  { 
    id: 'premium', 
    name: 'Premium Bounty',
    description: 'Enhanced high-visibility announcement',
    color: '#FFD700', 
    icon: '💰'
  },
  { 
    id: 'critical', 
    name: 'Critical Target',
    description: 'Urgent high-priority target announcement',
    color: '#8B0000', 
    icon: '⚠️'
  },
  { 
    id: 'stealth', 
    name: 'Stealth Bounty',
    description: 'Minimalist low-key announcement',
    color: '#708090', 
    icon: '🕵️'
  }
];

// Predefined priority levels for bounties
const PRIORITY_LEVELS = [
  {
    id: 'low',
    name: 'Low Priority',
    description: 'Standard target, no urgency',
    color: '#00FF00',
    icon: '🟢'
  },
  {
    id: 'medium',
    name: 'Medium Priority',
    description: 'Important target, moderate urgency',
    color: '#FFFF00',
    icon: '🟡'
  },
  {
    id: 'high',
    name: 'High Priority',
    description: 'Critical target, high urgency',
    color: '#FF0000',
    icon: '🔴'
  },
  {
    id: 'top',
    name: 'TOP PRIORITY',
    description: 'Most wanted target, maximum urgency',
    color: '#8B0000',
    icon: '⭐'
  }
];

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
    .addStringOption(option =>
      option.setName('priority')
        .setDescription('Priority level of this bounty')
        .setRequired(false)
        .addChoices(
          { name: '🟢 Low Priority', value: 'low' },
          { name: '🟡 Medium Priority', value: 'medium' },
          { name: '🔴 High Priority', value: 'high' },
          { name: '⭐ TOP PRIORITY', value: 'top' }
        )
    )
    .addStringOption(option =>
      option.setName('template')
        .setDescription('Visual style for the bounty announcement')
        .setRequired(false)
        .addChoices(
          { name: '🎯 Standard', value: 'standard' },
          { name: '💰 Premium', value: 'premium' },
          { name: '⚠️ Critical', value: 'critical' },
          { name: '🕵️ Stealth', value: 'stealth' }
        )
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
      const priority = interaction.options.getString('priority') || 'medium'; // default to medium priority
      const template = interaction.options.getString('template') || 'standard'; // default to standard template
      const image = interaction.options.getAttachment('image');
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      
      // Get template and priority details
      const selectedTemplate = BOUNTY_TEMPLATES.find(t => t.id === template) || BOUNTY_TEMPLATES[0];
      const selectedPriority = PRIORITY_LEVELS.find(p => p.id === priority) || PRIORITY_LEVELS[1];
      
      // Show a confirmation dialog with bounty details
      const confirmEmbed = new EmbedBuilder()
        .setTitle(`${selectedTemplate.icon} Confirm Bounty Creation`)
        .setDescription(`**Please review your ${selectedTemplate.name.toLowerCase()} details before confirming:**`)
        .addFields(
          { name: 'Target', value: `\`${robloxUsername}\``, inline: true },
          { name: 'Roblox ID', value: `\`${robloxId}\``, inline: true },
          { name: 'Reward', value: `\`R$ ${amount.toLocaleString()}\``, inline: true },
          { name: 'Evidence Required', value: clipRequired ? '`Video Clip Required`' : '`No Clip Needed`', inline: true },
          { name: 'Target Image', value: image ? '`Provided ✓`' : '`Not Provided ✗`', inline: true },
          { name: 'Post Channel', value: `${channel}`, inline: true },
          { name: `${selectedPriority.icon} Priority Level`, value: `\`${selectedPriority.name}\``, inline: true },
          { name: `${selectedTemplate.icon} Template`, value: `\`${selectedTemplate.name}\``, inline: true }
        )
        .setColor(selectedTemplate.color)
        .setFooter({ text: `SWOOSH Bounty System • Ultra Premium Edition • ${selectedPriority.name}` });
        
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
          // Update message to show processing with template styling
          await buttonInteraction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${selectedTemplate.icon} Processing ${selectedTemplate.name}...`)
                .setDescription(`**Creating your ${selectedPriority.name.toLowerCase()} bounty, please wait...**\n\n*Target: ${robloxUsername}*`)
                .setColor(selectedTemplate.color)
                .setFooter({ text: `SWOOSH Bounty System • Ultra Premium Edition • ${selectedPriority.name}` })
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
            // Success message with eye-catching design and enhanced styling
            const successEmbed = new EmbedBuilder()
              .setTitle(`${selectedTemplate.icon} ${selectedTemplate.name} Created Successfully`)
              .setDescription(
                `**TARGET DETAILS:**\n` +
                `${selectedPriority.icon} **Priority:** \`${selectedPriority.name}\`\n` +
                `👤 **Username:** \`${robloxUsername}\`\n` +
                `🆔 **Roblox ID:** \`${robloxId}\`\n` +
                `💰 **Reward:** \`R$ ${amount.toLocaleString()}\`\n` +
                `🎬 **Evidence:** ${clipRequired ? '`Video Clip Required`' : '`No Clip Needed`'}\n` +
                `${reason ? `📝 **Reason:** \`${reason}\`\n` : ''}` +
                `\n**BOUNTY STATUS:**\n` +
                `✅ Successfully created and posted to ${channel}\n` +
                `${result.message ? `\n${result.message}` : ''}`
              )
              .setColor(selectedTemplate.color)
              .setFooter({ 
                text: `SWOOSH Bounty System • Ultra Premium Edition • ${new Date().toLocaleString()}`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
              })
              .setTimestamp();
            
            // Add thumbnail if provided
            if (image) {
              successEmbed.setThumbnail(image.url);
            }
            
            return buttonInteraction.editReply({ embeds: [successEmbed], components: [] });
          } else {
            // Failure message with detailed explanation and better visuals
            const failureEmbed = new EmbedBuilder()
              .setTitle(`❌ ${selectedTemplate.name} Creation Failed`)
              .setDescription(
                `**We encountered an error while creating your bounty:**\n\n` +
                `\`\`\`\n${result.message || 'Unknown error occurred'}\n\`\`\`\n\n` +
                `**Attempted Target:** \`${robloxUsername}\`\n` +
                `**Roblox ID:** \`${robloxId}\`\n` +
                `**Reward Amount:** \`R$ ${amount.toLocaleString()}\`\n\n` +
                `Please check the error details above and try again, or contact an administrator if the issue persists.`
              )
              .setColor('#FF0000')
              .setFooter({ 
                text: 'SWOOSH Bounty System • Error Report',
                iconURL: interaction.guild.iconURL({ dynamic: true })
              })
              .setTimestamp();
            
            return buttonInteraction.editReply({ embeds: [failureEmbed], components: [] });
          }
        } else if (buttonInteraction.customId === 'cancel-bounty') {
          // Enhanced cancel message with template styling
          const cancelEmbed = new EmbedBuilder()
            .setTitle(`${selectedTemplate.icon} ${selectedTemplate.name} Cancelled`)
            .setDescription(
              `**Operation Cancelled**\n\n` +
              `The bounty creation process for \`${robloxUsername}\` has been cancelled.\n\n` +
              `*No bounty information has been saved or posted.*`
            )
            .setColor('#36393F') // Discord dark theme color for a professional look
            .setFooter({ 
              text: `SWOOSH Bounty System • Ultra Premium Edition • Action Cancelled`,
              iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();
          
          return buttonInteraction.update({ embeds: [cancelEmbed], components: [] });
        }
      } catch (timeoutError) {
        // Enhanced timeout message with better styling
        const timeoutEmbed = new EmbedBuilder()
          .setTitle(`⏰ Session Expired`)
          .setDescription(
            `**Your bounty creation session has expired**\n\n` +
            `The bounty configuration for \`${robloxUsername}\` was not completed within the time limit.\n\n` +
            `*Please run the command again to restart the process.*`
          )
          .setColor('#36393F')
          .setFooter({ 
            text: `SWOOSH Bounty System • Ultra Premium Edition • Session Timeout`,
            iconURL: interaction.guild.iconURL({ dynamic: true }) 
          })
          .setTimestamp();
        
        return interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    } catch (error) {
      console.error('Setbounty Command Error:', error);
      
      // Create an enhanced error embed for better user experience
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ Bounty System Error')
        .setDescription(
          `**An unexpected error occurred while processing your bounty request**\n\n` +
          `\`\`\`js\n${error.message || 'Unknown error'}\n\`\`\`\n\n` +
          `This error has been logged and will be reviewed by our development team.\n` +
          `Please try again later or contact an administrator if the issue persists.`
        )
        .setColor('#FF0000')
        .setFooter({ 
          text: `SWOOSH Bounty System • Ultra Premium Edition • Error Report`,
          iconURL: interaction.guild?.iconURL({ dynamic: true }) || null
        })
        .setTimestamp();
      
      // Add a button to report the issue
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Try Again')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('retry-bounty')
            .setEmoji('🔄'),
          new ButtonBuilder()
            .setLabel('View Documentation')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/swoosh')
            .setEmoji('📖')
        );
      
      await interaction.editReply({ 
        embeds: [errorEmbed], 
        components: [actionRow] 
      });
      
      // Log detailed error information
      logging.logAction('Command Error', interaction.user, null, {
        command: 'setbounty',
        error: error.message,
        stack: error.stack,
        options: {
          username: interaction.options.getString('username'),
          robloxId: interaction.options.getString('robloxid'),
          amount: interaction.options.getInteger('amount'),
          priority: interaction.options.getString('priority') || 'medium',
          template: interaction.options.getString('template') || 'standard'
        }
      });
    }
  }
};
