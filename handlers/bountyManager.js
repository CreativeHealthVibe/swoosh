// bountyManager.js - Handles bounty creation and management
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const validators = require('../utils/validators');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');
const webhookManager = require('./webhookManager');

module.exports = {
  /**
   * Initialize bounty manager
   * @param {Object} client - Discord client
   */
  init: (client) => {
    // This function is called when the bot starts up
    console.log('Bounty manager initialized');
  },
  
  /**
   * Create a new bounty
   * @param {Object} interaction - Slash command interaction
   * @param {Object} bountyData - Bounty data
   * @returns {Object} - Result of bounty creation
   */
  createBounty: async (interaction, bountyData) => {
    try {
      // Validate user has permission to create bounties
      if (!adminUtils.canCreateBounty(interaction.member)) {
        return {
          success: false,
          message: "You don't have permission to set bounties."
        };
      }
      
      // Validate Roblox ID
      if (!validators.validateRobloxID(bountyData.robloxId)) {
        return {
          success: false,
          message: "Invalid Roblox ID. Please provide a valid numeric ID."
        };
      }
      
      // Validate bounty amount
      if (!validators.validateBountyAmount(bountyData.amount)) {
        return {
          success: false,
          message: `Bounty amount must be between ${config.validation.bountyMin} and ${config.validation.bountyMax}.`
        };
      }
      
      // Validate image if provided
      if (bountyData.image && !validators.validateImage(bountyData.image)) {
        return {
          success: false,
          message: "Invalid image format. Only PNG and JPG are supported."
        };
      }
      
      // Premium emojis for a more luxurious feel
      const moneyEmoji = '<:S__dollars:1359207557964759261>'; 
      const targetEmoji = '🎯'; // Better target icon
      const idEmoji = '<:S__ID:1359205471633801457>';
      const rewardEmoji = '💰'; // Better reward icon
      const clipEmoji = '<:S__Clip:1359205711619555579>';
      const hostedEmoji = '<:S__Crown:1359205562201411584>';
      const timeEmoji = '<:S__Time:1359205638596464773>';
      
      // Get current timestamp for relative time
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Formatter for the bounty amount with commas
      const formattedAmount = bountyData.amount.toLocaleString();
      
      // Get template and priority info from bountyData if provided
      const template = bountyData.template || { 
        id: 'standard', 
        name: 'Standard Bounty',
        description: 'Regular bounty announcement',
        color: '#FF0000', 
        icon: '🎯'
      };
      
      const priority = bountyData.priority || {
        id: 'medium',
        name: 'Medium Priority',
        description: 'Important target, moderate urgency',
        color: '#FFFF00',
        icon: '🟡'
      };
      
      // Create template-specific title and description based on the selected template
      let templateTitle, templateDescription, templateColor;
      
      switch(template.id) {
        case 'premium':
          templateTitle = `${moneyEmoji} **PREMIUM BOUNTY: ${bountyData.robloxUsername.toUpperCase()}** ${moneyEmoji}`;
          templateDescription = `**⚠️ HIGH-VALUE TARGET IDENTIFIED ⚠️**\n\n**Eliminate this premium target and claim your substantial reward!**\n\n*This premium bounty was personally authorized by SWOOSH command.*`;
          templateColor = template.color;
          break;
        case 'critical':
          templateTitle = `${template.icon} **CRITICAL TARGET: ${bountyData.robloxUsername.toUpperCase()}** ${template.icon}`;
          templateDescription = `**⚠️ URGENT ELIMINATION REQUIRED ⚠️**\n\n**This target has been designated for immediate removal.**\n\n*This critical bounty carries MAXIMUM priority and authorization.*`;
          templateColor = template.color;
          break;
        case 'stealth':
          templateTitle = `${template.icon} **DISCRETE CONTRACT: ${bountyData.robloxUsername}** ${template.icon}`;
          templateDescription = `**Target designated for quiet removal.**\n\n**Complete this contract with minimal visibility for full reward.**\n\n*Authorized through secure channels.*`;
          templateColor = template.color;
          break;
        default: // standard
          templateTitle = `${targetEmoji} **SWOOSH BOUNTY: ${bountyData.robloxUsername.toUpperCase()}** ${targetEmoji}`;
          templateDescription = `**⚠️ A HIGH-VALUE TARGET HAS BEEN MARKED ⚠️**\n\n**Eliminate this target and claim your reward!**\n\n*This bounty was authorized by the SWOOSH administration.*`;
          templateColor = template.color || '#FF0000';
      }
      
      // Create priority-specific field styling
      const priorityDisplay = `${priority.icon} **${priority.name.toUpperCase()}**`;
      
      // Create a visually striking bounty embed with custom styling based on template
      const bountyEmbed = new EmbedBuilder()
        .setTitle(templateTitle)
        .setDescription(templateDescription)
        .addFields(
          { name: `${priority.icon} **PRIORITY LEVEL**`, value: `\`${priority.name.toUpperCase()}\``, inline: true },
          { name: `${targetEmoji} **TARGET IDENTIFIED**`, value: `\`${bountyData.robloxUsername}\``, inline: true },
          { name: `${idEmoji} **ROBLOX ID**`, value: `\`${bountyData.robloxId}\``, inline: true },
          { name: `${rewardEmoji} **REWARD AMOUNT**`, value: `\`R$ ${formattedAmount}\``, inline: true },
          { name: `${clipEmoji} **EVIDENCE REQUIREMENTS**`, value: bountyData.clipRequired ? '`✅ VIDEO CLIP REQUIRED`' : '`❌ NO CLIP NEEDED`', inline: true },
          { name: `${hostedEmoji} **AUTHORIZED BY**`, value: interaction.user.toString(), inline: true },
          { name: `${timeEmoji} **POSTED**`, value: `<t:${timestamp}:R>`, inline: true }
        )
        .setColor(templateColor)
        .setFooter({ 
          text: `💀 ${template.name} • ${priority.name} • Open a ticket to claim this bounty 💀`, 
          iconURL: config.webhooks.bountyAvatarUrl 
        });
        
      // Add reason if provided
      if (bountyData.reason) {
        bountyEmbed.addFields({ 
          name: '📝 **ELIMINATION REASON**', 
          value: `\`${bountyData.reason}\``, 
          inline: false 
        });
      }
      
      // Add timestamp
      bountyEmbed.setTimestamp();
      
      // Set a thumbnail if image is provided or use default SWOOSH logo
      if (!bountyData.image && config.webhooks.defaultThumbnailUrl) {
        bountyEmbed.setThumbnail(config.webhooks.defaultThumbnailUrl);
      }
      
      // Send to webhook channel if specified
      let result;
      if (bountyData.channel) {
        // Process the image for webhook if available
        // Make sure we pass the attachment through properly
        const bountyDataWithProcessedImage = {
          ...bountyData,
          // Ensure the image is properly formatted for the webhook
          image: bountyData.image 
        };
        
        // Use the sendBountyAnnouncement method
        result = await webhookManager.sendBountyAnnouncement(
          bountyData.channel,
          bountyDataWithProcessedImage,
          bountyEmbed
        );
      } else {
        result = {
          success: true,
          message: "Bounty created successfully! (No channel specified for webhook)"
        };
      }
      
      // Log bounty creation with detailed information
      logging.logAction('Bounty Created', null, interaction.user, {
        robloxUsername: bountyData.robloxUsername,
        robloxId: bountyData.robloxId,
        amount: bountyData.amount,
        clipRequired: bountyData.clipRequired,
        reason: bountyData.reason || 'No reason provided',
        template: template.name,
        priority: priority.name,
        channel: bountyData.channel?.name || 'No specific channel',
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Bounty Creation Error:', error);
      return {
        success: false,
        message: "An error occurred while creating the bounty: " + error.message
      };
    }
  },
  
  /**
   * Validate bounty claim
   * @param {Object} interaction - Discord interaction
   * @param {Object} claimData - Claim data
   * @returns {Object} - Result of claim validation
   */
  validateBountyClaim: async (interaction, claimData) => {
    try {
      // This would typically validate proof submitted for a bounty claim
      // For now, we'll just return a success message
      return {
        success: true,
        message: "Your claim submission has been received and will be reviewed by staff."
      };
    } catch (error) {
      console.error('Bounty Claim Error:', error);
      return {
        success: false,
        message: "An error occurred while processing your claim."
      };
    }
  }
};
