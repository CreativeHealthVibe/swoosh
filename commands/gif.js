/**
 * GIF Command
 * Simply converts the last image in the channel to a static GIF
 */
// Import required Discord.js components
// Some Discord.js versions use MessageAttachment, others use AttachmentBuilder
let MessageAttachment;
try {
  MessageAttachment = require('discord.js').AttachmentBuilder;
} catch (e) {
  MessageAttachment = require('discord.js').MessageAttachment;
}
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

module.exports = {
  name: 'gif',
  category: 'utility',
  description: 'Convert the last image in the channel to a GIF',
  usage: '.gif',
  examples: ['.gif'],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Send loading message
      const loadingMessage = await message.channel.send('🔍 Looking for the last image...');
      
      // Find the last image in the channel
      const messages = await message.channel.messages.fetch({ limit: 25 });
      const imageMessage = messages.find(msg => {
        // Check for attachments with images
        if (msg.attachments.size > 0) {
          const attachment = msg.attachments.first();
          return attachment.contentType && attachment.contentType.startsWith('image/') && 
                 !attachment.contentType.includes('gif'); // Skip existing GIFs
        }
        
        // Check for embeds with images
        if (msg.embeds.length > 0) {
          const embed = msg.embeds[0];
          return embed.image || (embed.thumbnail && embed.thumbnail.url);
        }
        
        return false;
      });
      
      if (!imageMessage) {
        await loadingMessage.edit('❌ No recent images found in this channel.');
        return;
      }
      
      // Get the image URL
      let imageUrl;
      if (imageMessage.attachments.size > 0) {
        imageUrl = imageMessage.attachments.first().url;
      } else if (imageMessage.embeds.length > 0) {
        const embed = imageMessage.embeds[0];
        imageUrl = embed.image ? embed.image.url : embed.thumbnail.url;
      }
      
      if (!imageUrl) {
        await loadingMessage.edit('❌ Failed to extract image URL.');
        return;
      }
      
      // Update loading message
      await loadingMessage.edit('⚙️ Converting image to GIF format...');
      
      // Create temporary directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      try {
        // Download the image
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        
        // Generate unique names for temporary files
        const timestamp = Date.now();
        const originalImagePath = path.join(tempDir, `original_${timestamp}.png`);
        const outputGifPath = path.join(tempDir, `converted_${timestamp}.gif`);
        
        // Save the original image
        fs.writeFileSync(originalImagePath, buffer);
        
        // Convert to GIF - using Sharp to process the image
        await sharp(originalImagePath)
          .gif() // Convert to GIF format
          .toFile(outputGifPath);
        
        // Send the GIF
        const attachment = new MessageAttachment(outputGifPath);
        await message.channel.send({
          content: '🎬 Here\'s your image converted to GIF format:',
          files: [attachment]
        });
        
        // Delete loading message
        await loadingMessage.delete();
        
        // Clean up the temporary files
        setTimeout(() => {
          try {
            fs.unlinkSync(originalImagePath);
            fs.unlinkSync(outputGifPath);
          } catch (err) {
            console.error('Error deleting temporary files:', err);
          }
        }, 10000);
        
      } catch (error) {
        console.error('Error processing image:', error);
        await loadingMessage.edit('❌ Error converting the image to GIF format.');
      }
    } catch (error) {
      console.error('Error in GIF command:', error);
      message.reply('❌ An error occurred while creating the GIF.');
    }
  }
};