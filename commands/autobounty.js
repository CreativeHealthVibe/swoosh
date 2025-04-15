// autobounty.js - Auto-generates bounty details from Roblox ID
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
const robloxAPI = require('../utils/roblox-api');

// Predefined templates for bounty creation
const BOUNTY_TEMPLATES = [
  { 
    id: 'standard', 
    name: 'Standard Bounty',
    description: 'Regular bounty announcement',
    color: '#000000', 
    icon: '🎯'
  },
  { 
    id: 'premium', 
    name: 'Premium Bounty',
    description: 'Enhanced high-visibility announcement',
    color: '#000000', 
    icon: '💰'
  },
  { 
    id: 'critical', 
    name: 'Critical Target',
    description: 'Urgent high-priority target announcement',
    color: '#000000', 
    icon: '⚠️'
  }
];

// Predefined priority levels for bounties
const PRIORITY_LEVELS = [
  {
    id: 'low',
    name: 'Low Priority',
    description: 'Standard target, no urgency',
    color: '#000000',
    icon: '🟢'
  },
  {
    id: 'medium',
    name: 'Medium Priority',
    description: 'Important target, moderate urgency',
    color: '#000000',
    icon: '🟡'
  },
  {
    id: 'high',
    name: 'High Priority',
    description: 'Critical target, high urgency',
    color: '#000000',
    icon: '🔴'
  },
  {
    id: 'top',
    name: 'TOP PRIORITY',
    description: 'Most wanted target, maximum urgency',
    color: '#000000',
    icon: '⭐'
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autobounty')
    .setDescription('Auto-create a bounty using just a Roblox ID')
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
    ),
  
  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  execute: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true }); // Start with ephemeral reply for better UX
    
    try {
      // All members can use this command for bounty submissions
      // No permission check needed
      
      // Get command options
      const robloxId = interaction.options.getString('robloxid');
      const amount = interaction.options.getInteger('amount');
      const reason = null;
      const priority = 'medium'; // default to medium priority
      const channel = interaction.channel;
      const submittedBy = interaction.user;
      const approvedBy = interaction.user;
      const logEvidence = true; // Default to true
      
      // Validate Roblox ID 
      if (!validators.validateRobloxID(robloxId)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Validation Error')
              .setDescription('Invalid Roblox ID. Please provide a valid numeric ID.')
              .setColor('#FF0000')
          ]
        });
      }
      
      // Show processing message
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Processing...')
            .setDescription('Fetching Roblox user information...')
            .setColor('#000000')
        ]
      });
      
      // Fetch user information from Roblox API
      let userProfile;
      try {
        userProfile = await robloxAPI.getCompleteUserProfile(robloxId);
        
        if (!userProfile || !userProfile.username) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Failed to fetch user data from Roblox. Please check the Roblox ID and try again.')
                .setColor('#FF0000')
            ]
          });
        }
      } catch (error) {
        console.error('Roblox API Error:', error);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Error')
              .setDescription('Failed to fetch user data from Roblox. Please check the Roblox ID and try again.')
              .setColor('#FF0000')
          ]
        });
      }
      
      // Get template and priority details
      const selectedPriority = PRIORITY_LEVELS.find(p => p.id === priority) || PRIORITY_LEVELS[1];
      const selectedTemplate = BOUNTY_TEMPLATES[0]; // Default to standard template
      
      // Get Roblox avatar as attachment
      const avatarUrl = userProfile.avatarUrl || userProfile.thumbnailUrl;
      
      // Create confirmation embed with fetched information
      const confirmEmbed = new EmbedBuilder()
        .setTitle(`Confirm Bounty Creation`)
        .setDescription(
          `**Target Information (Auto-Generated):**\n\n` +
          `**Username: ${userProfile.username}**\n` +
          `**Display Name: ${userProfile.displayName || 'None'}**\n` +
          `**Roblox ID: ${userProfile.id}**\n\n` +
          `**Reward: R$ ${amount.toLocaleString()}**\n\n` +
          `Please confirm you want to create this bounty.`
        )
        .setColor('#000000')
        .setFooter({ text: `SWOOSH Bounty System • Auto Bounty` });
      
      // Add avatar if available
      if (avatarUrl) {
        confirmEmbed.setThumbnail(avatarUrl);
      }
      
      // Create confirm/cancel buttons
      const confirmButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('confirm-autobounty')
            .setLabel('Create Bounty')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('cancel-autobounty')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
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
        if (buttonInteraction.customId === 'confirm-autobounty') {
          // Update message to show processing
          await buttonInteraction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle('Processing Bounty...')
                .setDescription(`Creating bounty for ${userProfile.username}, please wait...`)
                .setColor('#000000')
            ],
            components: []
          });
          
          // Create bounty with fetched information
          const result = await bountyManager.createBounty(interaction, {
            robloxUsername: userProfile.username,
            robloxId: userProfile.id,
            amount,
            clipRequired: true, // Always true as requested
            reason,
            channel,
            priority: selectedPriority,
            template: selectedTemplate,
            robloxAvatarUrl: avatarUrl,
            submittedBy: submittedBy,
            approvedBy: approvedBy,
            skipLogging: !logEvidence // Skip logging if logEvidence is false
          });
          
          if (result.success) {
            // Success message with bigger text and clean design
            const successEmbed = new EmbedBuilder()
              .setTitle(`BOUNTY CREATED`)
              .setDescription(
                `## Target: ${userProfile.username}\n\n` +
                `**Roblox ID:** ${userProfile.id}\n` +
                `**Reward:** R$ ${amount.toLocaleString()}\n\n` +
                `The bounty has been posted to ${channel}.`
              )
              .setColor('#000000')
              .setFooter({ 
                text: `SWOOSH Bounty System`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
              })
              .setTimestamp();
            
            // Add avatar if available
            if (avatarUrl) {
              successEmbed.setThumbnail(avatarUrl);
            }
            
            return buttonInteraction.editReply({ embeds: [successEmbed], components: [] });
          } else {
            // Clean, professional error message
            const failureEmbed = new EmbedBuilder()
              .setTitle(`Bounty Creation Failed`)
              .setDescription(
                `Error: ${result.message || 'Unknown error occurred'}\n\n` +
                `Username: ${userProfile.username}\n` +
                `Roblox ID: ${userProfile.id}\n` +
                `Reward: R$ ${amount.toLocaleString()}\n\n` +
                `Please check the error details above and try again.`
              )
              .setColor('#FF0000')
              .setFooter({ 
                text: 'SWOOSH Bounty System • Error Report',
                iconURL: interaction.guild.iconURL({ dynamic: true })
              })
              .setTimestamp();
            
            return buttonInteraction.editReply({ embeds: [failureEmbed], components: [] });
          }
        } else if (buttonInteraction.customId === 'cancel-autobounty') {
          // Cancel message
          const cancelEmbed = new EmbedBuilder()
            .setTitle(`Bounty Creation Cancelled`)
            .setDescription(`The bounty creation process has been cancelled.`)
            .setColor('#000000')
            .setFooter({ 
              text: `SWOOSH Bounty System • Cancelled`,
              iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();
          
          return buttonInteraction.update({ embeds: [cancelEmbed], components: [] });
        }
      } catch (timeoutError) {
        // Timeout message
        const timeoutEmbed = new EmbedBuilder()
          .setTitle(`Session Expired`)
          .setDescription(`Your bounty creation session has expired. Please run the command again.`)
          .setColor('#000000')
          .setFooter({ 
            text: `SWOOSH Bounty System • Timed Out`,
            iconURL: interaction.guild.iconURL({ dynamic: true }) 
          })
          .setTimestamp();
        
        return interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    } catch (error) {
      console.error('Autobounty Command Error:', error);
      
      // Error message
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(`An error occurred: ${error.message || 'Unknown error'}`)
        .setColor('#FF0000')
        .setFooter({ 
          text: `SWOOSH Bounty System • Error Report`,
          iconURL: interaction.guild?.iconURL({ dynamic: true }) || null
        })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
      
      // Log error
      logging.logAction('Command Error', interaction.user, null, {
        command: 'autobounty',
        error: error.message,
        stack: error.stack
      });
    }
  }
};