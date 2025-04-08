// webhookManager.js - Manages webhook creation and sending
const { WebhookClient, AttachmentBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  /**
   * Send a message through a webhook
   * @param {Object} channel - Discord channel
   * @param {Object} messageOptions - Message options
   * @returns {Object} - Result of webhook send
   */
  sendWebhookMessage: async (channel, messageOptions) => {
    try {
      // Find existing webhook
      const webhooks = await channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.name === config.webhooks.bountyName);
      
      // Create webhook if it doesn't exist
      if (!webhook) {
        webhook = await channel.createWebhook({
          name: config.webhooks.bountyName,
          avatar: config.webhooks.bountyAvatarUrl,
          reason: 'Created for posting bounties'
        });
      }
      
      // Create webhook client
      const webhookClient = new WebhookClient({ url: webhook.url });
      
      // Send message
      await webhookClient.send(messageOptions);
      
      return {
        success: true,
        message: "Message sent successfully via webhook."
      };
    } catch (error) {
      console.error('Webhook Send Error:', error);
      return {
        success: false,
        message: "Failed to send webhook message: " + error.message
      };
    }
  },
  
  /**
   * Create a webhook in a channel
   * @param {Object} channel - Discord channel
   * @param {string} name - Webhook name
   * @param {string} avatar - Webhook avatar URL
   * @returns {Object} - Created webhook or error
   */
  createWebhook: async (channel, name = config.webhooks.bountyName, avatar = config.webhooks.bountyAvatarUrl) => {
    try {
      console.log('DEBUG - Creating webhook:', { channelName: channel.name, name, avatarProvided: !!avatar });
      
      // Check if channel is valid
      if (!channel || !channel.fetchWebhooks) {
        console.error('Invalid channel provided');
        return {
          success: false,
          error: "Invalid channel provided"
        };
      }
      
      // Find existing webhook
      console.log('Fetching existing webhooks...');
      const webhooks = await channel.fetchWebhooks();
      console.log(`Found ${webhooks.size} webhooks in channel`);
      
      let webhook = webhooks.find(wh => wh.name === name);
      
      if (webhook) {
        console.log('Found existing webhook, editing it...');
        // Edit the existing webhook with new avatar
        try {
          webhook = await webhook.edit({
            name: name,
            avatar: avatar
          });
          console.log('Successfully edited webhook');
        } catch (editError) {
          console.error('Error editing webhook:', editError);
          // If edit fails, try to delete and recreate
          await webhook.delete('Recreating for SWOOSH Bot');
          webhook = null;
        }
      }
      
      // Create webhook if it doesn't exist or was deleted
      if (!webhook) {
        console.log('Creating new webhook...');
        try {
          webhook = await channel.createWebhook({
            name: name,
            avatar: avatar,
            reason: 'Created for SWOOSH Bot'
          });
          console.log('Successfully created webhook');
        } catch (createError) {
          console.error('Error creating webhook:', createError);
          return {
            success: false,
            error: "Failed to create webhook: " + createError.message
          };
        }
      }
      
      return {
        success: true,
        webhook: webhook
      };
    } catch (error) {
      console.error('Webhook Creation Error:', error);
      return {
        success: false,
        error: "Failed to create webhook: " + error.message
      };
    }
  },
  
  /**
   * Send a bounty announcement webhook
   * @param {Object} channel - Discord channel
   * @param {Object} bountyData - Bounty data
   * @param {Object} embedObject - Discord embed
   * @returns {Object} - Result of webhook send
   */
  sendBountyAnnouncement: async (channel, bountyData, embedObject) => {
    try {
      console.log('DEBUG - Bounty Data:', JSON.stringify({
        hasImage: !!bountyData.image,
        imageType: bountyData.image ? bountyData.image.contentType : 'none',
        imageUrl: bountyData.image ? bountyData.image.url : 'none',
        hasCustomAvatar: !!global.customBountyAvatarURL,
        defaultAvatarUrl: config.webhooks.bountyAvatarUrl
      }));
      
      // When image is provided in the setbounty command, use it as the webhook avatar
      let avatarURL;
      
      if (bountyData.image) {
        // Get the image URL directly from the attachment
        avatarURL = bountyData.image.url;
        console.log('Using attached image as webhook avatar:', avatarURL);
        
        // Try to download the image for direct use
        try {
          const https = require('https');
          const imageBuffer = await new Promise((resolve, reject) => {
            https.get(avatarURL, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
              }
              const chunks = [];
              response.on('data', (chunk) => chunks.push(chunk));
              response.on('end', () => resolve(Buffer.concat(chunks)));
              response.on('error', (error) => reject(error));
            }).on('error', (error) => reject(error));
          });
          
          // Convert image buffer to base64 data URI
          console.log('Successfully downloaded image, converting to data URI');
          const contentType = bountyData.image.contentType || 'image/png';
          avatarURL = `data:${contentType};base64,${imageBuffer.toString('base64')}`;
        } catch (imageError) {
          console.error('Error processing image, falling back to URL:', imageError);
          // Keep using the original URL if download fails
        }
      } else if (global.customBountyAvatarURL) {
        avatarURL = global.customBountyAvatarURL;
        console.log('Using custom bounty avatar URL from /image command');
        // Only clear it if we're actually using it
        global.customBountyAvatarURL = null;
      } else {
        avatarURL = config.webhooks.bountyAvatarUrl;
        console.log('Using default avatar URL');
      }
      
      // Create a webhook with the image
      console.log('Creating webhook with avatar URL:', avatarURL);
      const webhookResult = await module.exports.createWebhook(
        channel, 
        config.webhooks.bountyName, 
        avatarURL
      );
      
      if (!webhookResult.success) {
        throw new Error(webhookResult.error);
      }

      // Prepare webhook client
      const webhook = webhookResult.webhook;
      const webhookClient = new WebhookClient({ url: webhook.url });
      
      // Send the webhook message with the embed only (no files)
      await webhookClient.send({
        username: config.webhooks.bountyName,
        embeds: [embedObject]
        // No files attachment since image should only be used for the webhook icon
      });
      
      return {
        success: true,
        message: "Bounty announcement sent successfully!"
      };
    } catch (error) {
      console.error('Bounty Announcement Error:', error);
      return {
        success: false,
        message: "Failed to send bounty announcement: " + error.message
      };
    }
  }
};
