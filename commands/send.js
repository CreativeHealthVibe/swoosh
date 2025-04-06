const { SlashCommandBuilder } = require('discord.js');
const webhookManager = require('../handlers/webhookManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Send a message as the bot using webhook')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true))
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
      // Get the message content from options
      const message = interaction.options.getString('message');
      
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
      
      // Send the message via webhook
      await webhook.send({
        content: message,
        username: client.user.username,
        avatarURL: client.user.displayAvatarURL()
      });
      
      // Respond to the user
      return interaction.editReply({
        content: `✅ Message sent to ${targetChannel} using webhook!`,
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