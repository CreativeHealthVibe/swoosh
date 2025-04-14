/**
 * Leaderboard Command
 * Shows a link to the server leaderboard page
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'leaderboard',
  description: 'Get a link to the server leaderboard',
  category: 'Information',
  
  // Define slash command
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows the top Discord servers using SWOOSH Bot'),
  
  /**
   * Execute the command for message-based invocation
   * @param {Object} message - Discord message
   */
  async execute(message) {
    const websiteUrl = process.env.WEBSITE_URL || 'https://swooshfinal.onrender.com';
    const leaderboardUrl = `${websiteUrl}/leaderboard`;
    
    await message.reply({
      content: `**📊 SWOOSH Server Leaderboard**\n\nCheck out the top servers using SWOOSH Bot:\n${leaderboardUrl}\n\nSee where your server ranks among the community!`
    });
  },
  
  /**
   * Execute the command for interaction/slash command
   * @param {Object} interaction - Discord interaction
   */
  async executeInteraction(interaction) {
    const websiteUrl = process.env.WEBSITE_URL || 'https://swooshfinal.onrender.com';
    const leaderboardUrl = `${websiteUrl}/leaderboard`;
    
    await interaction.reply({
      content: `**📊 SWOOSH Server Leaderboard**\n\nCheck out the top servers using SWOOSH Bot:\n${leaderboardUrl}\n\nSee where your server ranks among the community!`,
      ephemeral: false
    });
  }
};