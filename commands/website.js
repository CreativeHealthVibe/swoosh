// website.js - Command to display website information
const { 
  SlashCommandBuilder, 
  EmbedBuilder 
} = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('website')
    .setDescription('Get a link to the bot website'),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('<:Role_:1358183713522847855> SWOOSH Bot Website')
        .setDescription('Visit our website for documentation, commands list, and more information about SWOOSH Bot.')
        .addFields(
          { name: '<:aperson:1358185076449476660> Website URL', value: 'https://swooshfinal.onrender.com' },
          { name: '<:Calendar_when:1358183398434410636> Features', value: '• Complete command documentation\n• Bot status and uptime\n• Admin dashboard\n• Support information' }
        )
        .setColor('#0099ff')
        .setFooter({ text: 'SWOOSH Bot | Powerful Discord Moderation' });
        
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in website command:', error);
      await interaction.reply({ 
        content: 'Failed to process the command. Please try again later.',
        ephemeral: true
      });
    }
  }
};