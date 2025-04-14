// template.js - Template command for standard responses
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Send a pre-defined template message')
    .addIntegerOption(option =>
      option.setName('template_id')
        .setDescription('Which template to send')
        .setRequired(true)
        .addChoices(
          { name: 'Bounty Request', value: 1 },
          { name: 'Bounty Confirmed', value: 2 }
        )),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      // Check if user has permissions to use this command
      if (!adminUtils.canManageTickets(interaction.member)) {
        return interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      // Get template ID
      const templateId = interaction.options.getInteger('template_id');
      let embed;

      // Create the appropriate embed based on template ID
      switch (templateId) {
        case 1: // Bounty Request
          embed = new EmbedBuilder()
            .setTitle('Bounty Request')
            .setDescription('You can use our bounty system in two ways:')
            .addFields(
              { 
                name: 'Option 1: Submit with the `.bounty` command', 
                value: 'Use `.bounty <roblox-id> <amount>` to submit a bounty directly.\nYour submission will be reviewed by admins before being posted.', 
                inline: false 
              },
              { 
                name: 'Option 2: Request admin assistance', 
                value: 'If you need help, please provide:', 
                inline: false 
              },
              { name: 'Roblox Username', value: 'Who is the bounty on?', inline: true },
              { name: 'Roblox ID', value: 'The numeric ID is required', inline: true },
              { name: 'Avatar Screenshot', value: 'For identification', inline: true },
              { name: 'Bounty Amount', value: 'How much are you offering?', inline: true },
              { name: 'Evidence Requirement', value: 'Do you need proof clip?', inline: true }
            )
            .setColor(config.embedColor)
            .setFooter({ text: 'An admin will review your request shortly.' });
          break;

        case 2: // Bounty Confirmed
          embed = new EmbedBuilder()
            .setTitle('Bounty Confirmed')
            .setDescription('You\'re all set! We will notify you when someone is willing to claim it. Thank you!')
            .setColor(config.embedColor)
            .setFooter({ text: '.gg/swoosh' });
          break;

        default:
          return interaction.editReply('❌ Invalid template ID.');
      }

      // Send the embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Template Command Error:', error);
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred while processing the command.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred while processing the command.',
          ephemeral: true
        });
      }
    }
  }
};