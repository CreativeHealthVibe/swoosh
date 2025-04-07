const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Buffer } = require('buffer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('image')
    .setDescription('Set image for webhook avatar')
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('The image to use as webhook avatar')
        .setRequired(true)),

  /**
   * Execute the slash command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction, client) {
    try {
      // Check if user has permissions
      if (!adminUtils.isAdmin(interaction.member)) {
        return interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      // Get command options
      const attachment = interaction.options.getAttachment('image');
      
      // Validate image
      if (!attachment.contentType.startsWith('image/')) {
        return interaction.editReply('❌ The attached file must be an image.');
      }

      // Create images directory if it doesn't exist
      const imagesDir = path.join(__dirname, '../images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Download and save the image
      const imagePath = path.join(imagesDir, `webhook_avatar_${Date.now()}.png`);
      const imageUrl = attachment.url;

      // Download the image
      const imageBuffer = await downloadImage(imageUrl);
      fs.writeFileSync(imagePath, imageBuffer);

      // Convert to base64 for Discord API
      const base64Image = imageBuffer.toString('base64');
      const dataURI = `data:${attachment.contentType};base64,${base64Image}`;

      // Store the image URL globally for bounty announcements
      global.customBountyAvatarURL = dataURI;
      
      // Create response embed
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Webhook Avatar Image Set')
        .setDescription('This image will be used for the next webhook avatar.')
        .setColor(config.embedColor)
        .setThumbnail(attachment.url);
      
      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Image Command Error:', error);
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred while processing the image.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred while processing the image.',
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Download an image from a URL
 * @param {string} url - Image URL
 * @returns {Promise<Buffer>} - Image buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
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
}