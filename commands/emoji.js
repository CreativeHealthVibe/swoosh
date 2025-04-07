// emoji.js - Command to convert PNG images to emoji format and upload to server
const { 
  SlashCommandBuilder, 
  EmbedBuilder,
  AttachmentBuilder,
  PermissionFlagsBits
} = require('discord.js');
const sharp = require('sharp');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const adminUtils = require('../utils/admin');
const validators = require('../utils/validators');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Convert an image to emoji format and upload it to the server')
    .addAttachmentOption(option => 
      option.setName('image')
        .setDescription('The image to convert to emoji format')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('url')
        .setDescription('URL of the image to convert')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('name')
        .setDescription('Name for the emoji (no spaces, 2-32 characters)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      
      // Check if the bot has permission to manage emojis
      const botMember = interaction.guild.members.cache.get(client.user.id);
      if (!botMember.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
        return interaction.editReply({
          content: 'I don\'t have permission to manage emojis in this server. Please give me the "Manage Emojis and Stickers" permission.',
          ephemeral: true
        });
      }
      
      // Get image from attachment or URL
      const attachment = interaction.options.getAttachment('image');
      const imageUrl = interaction.options.getString('url');
      let emojiName = interaction.options.getString('name');
      
      // Validate that at least one option was provided
      if (!attachment && !imageUrl) {
        return interaction.editReply({
          content: 'Please provide either an image attachment or an image URL.',
          ephemeral: true
        });
      }
      
      // Use attachment if provided, otherwise use URL
      const url = attachment ? attachment.url : imageUrl;
      
      // Generate a default name if not provided
      if (!emojiName) {
        emojiName = attachment ? 
          attachment.name.split('.')[0].replace(/[^a-z0-9]/gi, '') : 
          `emoji_${Date.now()}`;
      }
      
      // Sanitize emoji name
      emojiName = emojiName.replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
      
      // Validate emoji name length (Discord requires 2-32 characters)
      if (emojiName.length < 2) {
        emojiName = `emoji_${emojiName}`;
      } else if (emojiName.length > 32) {
        emojiName = emojiName.substring(0, 32);
      }
      
      // Validate that the image is a valid format
      if (attachment && !validators.isValidImage(attachment)) {
        return interaction.editReply({
          content: 'The uploaded file is not a valid image. Please upload a PNG, JPEG, or GIF file.',
          ephemeral: true
        });
      }
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Generate file paths
      const originalPath = path.join(tempDir, `original_${Date.now()}.png`);
      const emojiPath = path.join(tempDir, `emoji_${Date.now()}.png`);
      
      try {
        // Download the image
        await downloadImage(url, originalPath);
        
        // Convert the image to emoji format
        await convertToEmoji(originalPath, emojiPath);
        
        // Create attachment from processed file for display
        const emojiAttachment = new AttachmentBuilder(emojiPath, { name: 'emoji.png' });
        
        // Read the emoji file for upload
        const emojiData = fs.readFileSync(emojiPath);
        
        // Upload the emoji to the server
        const newEmoji = await interaction.guild.emojis.create({
          attachment: emojiData,
          name: emojiName
        });
        
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Emoji Created Successfully!')
          .setDescription(`Emoji ${newEmoji} has been added to the server with name: \`:${emojiName}:\``)
          .setColor(config.embedColor || '#0099ff')
          .setImage('attachment://emoji.png')
          .setFooter({ text: `Created by: ${interaction.user.tag}` });
        
        // Send the response with the attachment
        await interaction.editReply({ 
          embeds: [embed],
          files: [emojiAttachment]
        });
        
        // Clean up temp files after a delay
        setTimeout(() => {
          try {
            if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
            if (fs.existsSync(emojiPath)) fs.unlinkSync(emojiPath);
          } catch (cleanupError) {
            console.error('Error cleaning up temporary files:', cleanupError);
          }
        }, 10000); // Clean up after 10 seconds
        
      } catch (processingError) {
        console.error('Image processing/upload error:', processingError);
        
        // Clean up any temp files that might have been created
        try {
          if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
          if (fs.existsSync(emojiPath)) fs.unlinkSync(emojiPath);
        } catch (cleanupError) {
          console.error('Error cleaning up temporary files:', cleanupError);
        }
        
        // Provide more detailed error message
        let errorMessage = 'Failed to process or upload the emoji.';
        
        if (processingError.message.includes('400 Bad Request')) {
          errorMessage = 'The image file is too large. Discord emojis must be under 256KB.';
        } else if (processingError.message.includes('Maximum number of emojis reached')) {
          errorMessage = 'This server has reached the maximum number of emojis allowed.';
        }
        
        return interaction.editReply({
          content: `${errorMessage} Error details: ${processingError.message}`,
          ephemeral: true
        });
      }
      
    } catch (error) {
      console.error('Emoji command error:', error);
      
      // Handle reply based on whether the interaction was already deferred
      if (interaction.deferred) {
        await interaction.editReply({ 
          content: 'There was an error processing your request. Please try again later.',
          ephemeral: true
        });
      } else {
        await interaction.reply({ 
          content: 'There was an error processing your request. Please try again later.',
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Download an image from a URL
 * @param {string} url - The URL of the image
 * @param {string} destination - Where to save the image
 * @returns {Promise} - A promise that resolves when the download is complete
 */
function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      // Check if response is an image
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        file.close();
        fs.unlinkSync(destination);
        return reject(new Error('URL does not point to a valid image'));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', err => {
        fs.unlinkSync(destination);
        reject(err);
      });
    }).on('error', err => {
      fs.unlinkSync(destination);
      reject(err);
    });
  });
}

/**
 * Convert an image to emoji format (128x128, PNG)
 * @param {string} inputPath - Path to the input image
 * @param {string} outputPath - Path to save the output image
 * @returns {Promise} - A promise that resolves when the conversion is complete
 */
async function convertToEmoji(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png()
      .toFile(outputPath);
      
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to convert image: ${error.message}`);
  }
}