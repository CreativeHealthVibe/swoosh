const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const webhookManager = require('../handlers/webhookManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Send a message as an embed using webhook')
    .addStringOption(option => 
      option.setName('title')
        .setDescription('The title of the embed')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('The description/content of the embed')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('color')
        .setDescription('The color of the embed (hex code or common color name)')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('footer')
        .setDescription('Custom footer text (leave empty for default)')
        .setRequired(false))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the message to (defaults to current channel)')
        .setRequired(false)),
  
  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Get the embed content from options
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      let color = interaction.options.getString('color') || config.embedColor;
      const footer = interaction.options.getString('footer');
      
      // Validate color - if invalid, use default
      try {
        // Test if it's a valid hex color by checking if it starts with #
        if (color && !color.startsWith('#')) {
          // If it's a named color, convert common colors to hex
          const colorMap = {
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#00FF00',
            'yellow': '#FFFF00',
            'purple': '#800080',
            'orange': '#FFA500',
            'black': '#000000',
            'white': '#FFFFFF',
            'gray': '#808080',
            'pink': '#FFC0CB',
            'gold': '#FFD700',
            'silver': '#C0C0C0'
          };
          
          color = colorMap[color.toLowerCase()] || config.embedColor;
        }
      } catch (colorError) {
        console.error('Color validation error:', colorError);
        color = config.embedColor;
      }
      
      // Get the target channel (default to current channel if not specified)
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      
      // Check if we have permission to manage webhooks in the target channel
      const permissions = targetChannel.permissionsFor(interaction.guild.members.me);
      if (!permissions.has('ManageWebhooks')) {
        return interaction.editReply({
          content: '❌ I don\'t have permission to manage webhooks in that channel!',
          ephemeral: true
        });
      }
      
      // Create a webhook using our existing webhook manager
      const webhookResult = await webhookManager.createWebhook(
        targetChannel,
        client.user.username, // Use bot's name
        client.user.displayAvatarURL() // Use bot's avatar
      );
      
      if (!webhookResult.success) {
        return interaction.editReply({
          content: `❌ Failed to create webhook: ${webhookResult.error}`,
          ephemeral: true
        });
      }
      
      // Get the webhook
      const webhook = webhookResult.webhook;
      
      // Create the embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
      
      // Set custom footer if provided, otherwise use default
      if (footer) {
        embed.setFooter({ 
          text: footer,
          iconURL: client.user.displayAvatarURL()
        });
      } else {
        embed.setFooter({ 
          text: `Sent by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      }
      
      // Send the message via webhook
      await webhook.send({
        username: client.user.username,
        avatarURL: client.user.displayAvatarURL(),
        embeds: [embed]
      });
      
      // Respond to the user
      return interaction.editReply({
        content: `✅ Embed message sent to ${targetChannel} using webhook!`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error sending webhook message:', error);
      return interaction.editReply({
        content: `❌ Error sending message: ${error.message}`,
        ephemeral: true
      });
    }
  }
};