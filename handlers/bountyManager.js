// bountyManager.js - Handles bounty creation and management
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const validators = require('../utils/validators');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');
const webhookManager = require('./webhookManager');

// Storage for pending bounty submissions
const pendingBounties = new Map();

module.exports = {
  /**
   * Initialize bounty manager
   * @param {Object} client - Discord client
   */
  init: (client) => {
    // This function is called when the bot starts up
    console.log('Bounty manager initialized');
    this.client = client;
  },
  
  /**
   * Get all pending bounties
   * @returns {Array} - Array of pending bounties
   */
  getPendingBounties: () => {
    return Array.from(pendingBounties.values());
  },
  
  /**
   * Submit a new bounty for approval
   * @param {Object} interaction - Slash command interaction
   * @param {Object} bountyData - Bounty data
   * @returns {Object} - Result of bounty submission
   */
  submitBounty: async (interaction, bountyData) => {
    try {
      // Check if we need admin approval
      const requiresApproval = bountyData.requiresApproval !== false; // Default to true if not specified
      
      // If doesn't require approval AND user has permission, create bounty directly
      if (!requiresApproval && adminUtils.canCreateBounty(interaction.member)) {
        // Create the bounty directly if the user has permission
        return module.exports.createBounty(interaction, bountyData);
      }
      
      // Otherwise, create a submission for admin approval
      // Generate a unique ID for this submission
      const submissionId = Date.now().toString();
      
      // Store the submission with metadata
      pendingBounties.set(submissionId, {
        id: submissionId,
        submittedAt: new Date(),
        submittedBy: interaction.user,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        status: 'pending',
        ...bountyData
      });
      
      // Log the submission
      logging.logAction('Bounty Submitted', null, interaction.user, {
        submissionId,
        robloxId: bountyData.robloxId,
        amount: bountyData.amount,
        timestamp: new Date().toISOString()
      });
      
      // Get guild settings for the server
      const guildSettings = await logging.getGuildSettings(interaction.guild.id);
      const bountySubmissionChannel = interaction.client.channels.cache.get(guildSettings?.channels?.bountySubmissions);
      
      // If a bounty submission channel is configured, notify admins
      if (bountySubmissionChannel) {
        try {
          const { EmbedBuilder } = require('discord.js');
          const notificationEmbed = new EmbedBuilder()
            .setTitle('📋 New Bounty Submission')
            .setDescription(
              `A new bounty has been submitted and requires admin approval.\n\n` +
              `**Target:** ${bountyData.robloxUsername}\n` +
              `**Roblox ID:** ${bountyData.robloxId}\n` +
              `**Amount:** R$ ${bountyData.amount.toLocaleString()}\n` +
              `**Submitted By:** ${interaction.user.toString()}\n` +
              `${bountyData.reason ? `**Reason:** ${bountyData.reason}\n` : ''}\n` +
              `Use \`/log_bounty view id:${submissionId}\` to review this submission.`
            )
            .setColor('#000000')
            .setFooter({ 
              text: `SWOOSH Bounty System • Submission ID: ${submissionId}`,
              iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();
          
          // Add avatar if available
          if (bountyData.robloxAvatarUrl) {
            notificationEmbed.setThumbnail(bountyData.robloxAvatarUrl);
          }
          
          // Find the Bounty Master role ID
          let bountyMasterRoleId = config.roles.bountyMaster || '1054517788858503310'; // Use config or fallback
          
          // Try to find Bounty Master role in the guild
          const bountyMasterRole = interaction.guild.roles.cache.find(
            role => role.name.toLowerCase() === 'bounty master'
          );
          
          if (bountyMasterRole) {
            bountyMasterRoleId = bountyMasterRole.id;
          }
          
          await bountySubmissionChannel.send({ 
            content: `<@&${bountyMasterRoleId}>`, // Tag Bounty Masters with dynamically found role
            embeds: [notificationEmbed] 
          });
        } catch (error) {
          console.error('Error sending bounty submission notification:', error);
        }
      }
      
      return {
        success: true,
        submissionId,
        message: "Your bounty has been submitted for admin review."
      };
    } catch (error) {
      console.error('Bounty Submission Error:', error);
      return {
        success: false,
        message: "An error occurred while submitting the bounty: " + error.message
      };
    }
  },
  
  /**
   * Get a specific pending bounty by ID
   * @param {string} submissionId - Bounty submission ID
   * @returns {Object|null} - Bounty data or null if not found
   */
  getPendingBounty: (submissionId) => {
    return pendingBounties.get(submissionId) || null;
  },
  
  /**
   * Approve a pending bounty submission
   * @param {Object} interaction - Slash command interaction
   * @param {string} submissionId - Bounty submission ID
   * @param {Object} approvalData - Approval data including channel to post to
   * @returns {Object} - Result of bounty approval
   */
  approveBounty: async (interaction, submissionId, approvalData) => {
    try {
      // Get the pending bounty
      const pendingBounty = pendingBounties.get(submissionId);
      if (!pendingBounty) {
        return {
          success: false,
          message: "Bounty submission not found."
        };
      }
      
      // Create the bounty using the existing createBounty method
      const createResult = await module.exports.createBounty(interaction, {
        robloxUsername: pendingBounty.robloxUsername,
        robloxId: pendingBounty.robloxId,
        amount: pendingBounty.amount,
        reason: pendingBounty.reason,
        clipRequired: approvalData.clipRequired || false,
        channel: approvalData.channel,
        submittedBy: pendingBounty.submittedBy,
        approvedBy: interaction.user,
        logEvidence: approvalData.logEvidence,
        robloxAvatarUrl: pendingBounty.robloxAvatarUrl // Pass the avatar URL through
      });
      
      if (createResult.success) {
        // Update the pending bounty status
        pendingBounty.status = 'approved';
        pendingBounty.approvedBy = interaction.user;
        pendingBounty.approvedAt = new Date();
        pendingBounties.set(submissionId, pendingBounty);
        
        // Remove from pending after some time (e.g., 1 hour)
        setTimeout(() => {
          pendingBounties.delete(submissionId);
        }, 3600000);
        
        return {
          success: true,
          message: "Bounty approved and posted successfully."
        };
      } else {
        return createResult;
      }
    } catch (error) {
      console.error('Bounty Approval Error:', error);
      return {
        success: false,
        message: "An error occurred while approving the bounty: " + error.message
      };
    }
  },
  
  /**
   * Deny a pending bounty submission
   * @param {Object} interaction - Slash command interaction
   * @param {string} submissionId - Bounty submission ID
   * @param {string} reason - Reason for denial
   * @returns {Object} - Result of bounty denial
   */
  denyBounty: async (interaction, submissionId, reason) => {
    try {
      // Get the pending bounty
      const pendingBounty = pendingBounties.get(submissionId);
      if (!pendingBounty) {
        return {
          success: false,
          message: "Bounty submission not found."
        };
      }
      
      // Update the pending bounty status
      pendingBounty.status = 'denied';
      pendingBounty.deniedBy = interaction.user;
      pendingBounty.deniedAt = new Date();
      pendingBounty.denialReason = reason;
      pendingBounties.set(submissionId, pendingBounty);
      
      // Log the denial
      logging.logAction('Bounty Denied', null, interaction.user, {
        submissionId,
        robloxId: pendingBounty.robloxId,
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString()
      });
      
      // Remove from pending after some time (e.g., 1 hour)
      setTimeout(() => {
        pendingBounties.delete(submissionId);
      }, 3600000);
      
      return {
        success: true,
        message: "Bounty denied successfully."
      };
    } catch (error) {
      console.error('Bounty Denial Error:', error);
      return {
        success: false,
        message: "An error occurred while denying the bounty: " + error.message
      };
    }
  },
  
  /**
   * Create a new bounty
   * @param {Object} interaction - Slash command interaction
   * @param {Object} bountyData - Bounty data
   * @returns {Object} - Result of bounty creation
   */
  createBounty: async (interaction, bountyData) => {
    try {
      // Check if user has permission (admin or bounty master role)
      // Only for direct bounty creation (not coming from approval flow)
      if (!bountyData.approvedBy && !adminUtils.canCreateBounty(interaction.member)) {
        return {
          success: false,
          message: "You don't have permission to create bounties directly. Use the regular bounty command to submit for admin approval."
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
      
      // Using a clean, professional design regardless of template choice
      const templateTitle = `${targetEmoji} **SWOOSH BOUNTY: ${bountyData.robloxUsername}**`;
      const templateDescription = `**Target marked for elimination. Please see details below.**`;
      const templateColor = '#000000'; // Pure black for a clean look
      
      // Create priority-specific field styling
      const priorityDisplay = `${priority.icon} **${priority.name.toUpperCase()}**`;
      
      // Create a clean, professional bounty embed with larger text
      const bountyEmbed = new EmbedBuilder()
        .setTitle(`TARGET: ${bountyData.robloxUsername.toUpperCase()}`)
        .setDescription(
          `# REWARD: R$ ${formattedAmount}\n\n` +
          `**ID:** ${bountyData.robloxId}\n` +
          `**Submitted By:** ${bountyData.submittedBy ? bountyData.submittedBy.toString() : interaction.user.toString()}\n` +
          `**Approved By:** ${bountyData.approvedBy ? bountyData.approvedBy.toString() : interaction.user.toString()}`
        )
        .setColor(templateColor)
        .setFooter({ 
          text: `SWOOSH Bounty System • Open a ticket to claim this bounty`, 
          iconURL: config.webhooks.bountyAvatarUrl 
        });
        
      // Add reason if provided with clean formatting
      if (bountyData.reason) {
        bountyEmbed.addFields({ 
          name: 'Reason', 
          value: bountyData.reason, 
          inline: false 
        });
      }
      
      // Add timestamp
      bountyEmbed.setTimestamp();
      
      // Handle thumbnails - priority is: 
      // 1. Provided image attachment
      // 2. Roblox avatar URL from API 
      // 3. Default thumbnail
      if (bountyData.image) {
        bountyEmbed.setThumbnail(bountyData.image.url);
      } else if (bountyData.robloxAvatarUrl) {
        bountyEmbed.setThumbnail(bountyData.robloxAvatarUrl);
      } else if (config.webhooks.defaultThumbnailUrl) {
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
      
      // Log bounty creation with detailed information (only if log option is enabled)
      if (!bountyData.skipLogging) {
        logging.logAction('Bounty Created', null, interaction.user, {
          robloxUsername: bountyData.robloxUsername,
          robloxId: bountyData.robloxId,
          amount: bountyData.amount,
          clipRequired: bountyData.clipRequired,
          reason: bountyData.reason || 'No reason provided',
          template: template.name,
          channel: bountyData.channel?.name || 'No specific channel',
          submittedBy: bountyData.submittedBy ? bountyData.submittedBy.tag : interaction.user.tag,
          approvedBy: bountyData.approvedBy ? bountyData.approvedBy.tag : interaction.user.tag,
          timestamp: new Date().toISOString()
        });
      }
      
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
