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
      
      // Use the specific custom emojis provided
      // Custom emoji IDs directly from SWOOSH STUDIO server
      const moneyEmoji = '<:S__dollars:1359207557964759261>'; 
      const targetEmoji = '👤'; // Using default for target
      const idEmoji = '<:S__ID:1359205471633801457>';
      const rewardEmoji = '💵'; // Using default for reward
      const clipEmoji = '<:S__Clip:1359205711619555579>';
      const hostedEmoji = '<:S__Crown:1359205562201411584>';
      const timeEmoji = '<:S__Time:1359205638596464773>';
      
      // Create bounty embed with custom emojis and larger dollar sign emoji in title
      const bountyEmbed = new EmbedBuilder()
        .setTitle(`<:S__dollars:1359207557964759261> <:S__dollars:1359207557964759261> SWOOSH BOUNTY: ${bountyData.robloxUsername.toUpperCase()} <:S__dollars:1359207557964759261> <:S__dollars:1359207557964759261>`)
        .setDescription(`**A new bounty has been placed!** Eliminate the target to claim the reward.`)
        .addFields(
          { name: `${targetEmoji} Target`, value: `${bountyData.robloxUsername}`, inline: true },
          { name: `${idEmoji} Roblox ID`, value: `${bountyData.robloxId}`, inline: true },
          { name: `${rewardEmoji} Reward`, value: `R$${bountyData.amount.toLocaleString()}`, inline: true },
          { name: `${clipEmoji} Clip Required`, value: bountyData.clipRequired ? '✅ Yes' : '❌ No', inline: true },
          { name: `${hostedEmoji} Hosted By`, value: interaction.user.toString(), inline: true },
          { name: `${timeEmoji} Posted`, value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setColor(config.webhooks.bountyColor || config.embedColor)
        .setFooter({ 
          text: 'To claim this bounty, open a ticket and provide evidence.', 
          iconURL: config.webhooks.bountyAvatarUrl 
        });
      
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
      
      // Log bounty creation
      logging.logAction('Bounty Created', null, interaction.user, {
        robloxUsername: bountyData.robloxUsername,
        robloxId: bountyData.robloxId,
        amount: bountyData.amount,
        clipRequired: bountyData.clipRequired
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
