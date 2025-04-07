// setbounty.js - Slash command to create a bounty
const { 
  SlashCommandBuilder, 
  ChannelType 
} = require('discord.js');
const bountyManager = require('../handlers/bountyManager');
const adminUtils = require('../utils/admin');
const validators = require('../utils/validators');
const logging = require('../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbounty')
    .setDescription('Create a new bounty on a Roblox player')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox username of the target')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('robloxid')
        .setDescription('Roblox User ID of the target')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Bounty amount (15-30000)')
        .setRequired(true)
        .setMinValue(15)
        .setMaxValue(30000)
    )
    .addBooleanOption(option =>
      option.setName('clip_required')
        .setDescription('Is a video clip required for proof?')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Image of the target (PNG/JPG only)')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to post the bounty in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  
  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  execute: async (interaction, client) => {
    await interaction.deferReply();
    
    try {
      // Check if user has permission
      if (!adminUtils.canCreateBounty(interaction.member)) {
        return interaction.editReply('❌ You need the Bounty Master or Admin role to create bounties!');
      }
      
      // Get command options
      const robloxUsername = interaction.options.getString('username');
      const robloxId = interaction.options.getString('robloxid');
      const amount = interaction.options.getInteger('amount');
      const clipRequired = interaction.options.getBoolean('clip_required');
      const image = interaction.options.getAttachment('image');
      const channel = interaction.options.getChannel('channel');
      
      // Validate Roblox ID
      if (!validators.validateRobloxID(robloxId)) {
        return interaction.editReply('❌ Invalid Roblox ID. Please provide a valid numeric ID.');
      }
      
      // Validate image if provided
      if (image && !validators.validateImage(image)) {
        return interaction.editReply('❌ Invalid image format. Only PNG and JPG are supported.');
      }
      
      // Create bounty
      const result = await bountyManager.createBounty(interaction, {
        robloxUsername,
        robloxId,
        amount,
        clipRequired,
        image,
        channel
      });
      
      if (result.success) {
        return interaction.editReply(`✅ Bounty created successfully! ${result.message || ''}`);
      } else {
        return interaction.editReply(`❌ Failed to create bounty: ${result.message}`);
      }
    } catch (error) {
      console.error('Setbounty Command Error:', error);
      interaction.editReply('❌ An error occurred while creating the bounty.');
      
      // Log error
      logging.logAction('Command Error', interaction.user, null, {
        command: 'setbounty',
        error: error.message
      });
    }
  }
};
