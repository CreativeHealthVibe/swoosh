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
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    const websiteUrl = process.env.WEBSITE_URL || 'https://swoosh-discord-bot.repl.co';
    const leaderboardUrl = `${websiteUrl}/leaderboard`;
    
    await interaction.reply({
      content: `**📊 SWOOSH Server Leaderboard**\n\nCheck out the top servers using SWOOSH Bot:\n${leaderboardUrl}\n\nSee where your server ranks among the community!`,
      ephemeral: false
    });
  }
};