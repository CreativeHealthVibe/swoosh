// setlogs.js - Command to set log channels instead of auto-creating them
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('Set up logging channels for the bot')
    .addSubcommand(subcommand =>
      subcommand
        .setName('general')
        .setDescription('Set the general logging channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for general logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('deleted')
        .setDescription('Set the deleted messages logging channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for deleted messages logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('transcripts')
        .setDescription('Set the ticket transcripts channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for ticket transcripts')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('commands')
        .setDescription('Set the command usage logging channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for command usage logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('bounty_submissions')
        .setDescription('Set the channel for bounty submissions from members')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel for admins to review bounty submissions')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Set the bot status updates channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for bot status updates')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('member')
        .setDescription('Set the member join/leave logging channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for member join/leave logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      // Only server administrators can use this command
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need Administrator permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();
      
      // Get subcommand and channel
      const subcommand = interaction.options.getSubcommand();
      const channel = interaction.options.getChannel('channel');
      
      // Channel type is already validated by the command restrictions
      // We're only accepting GuildText channels
      
      // Load current configuration
      const guildId = interaction.guild.id;
      let guildConfig = config.getGuildConfig(guildId) || {};
      
      // Initialize logging channels object if it doesn't exist
      if (!guildConfig.loggingChannels) {
        guildConfig.loggingChannels = {};
      }
      
      // Set the appropriate channel based on subcommand
      switch (subcommand) {
        case 'general':
          guildConfig.logChannelId = channel.id;
          break;
          
        case 'deleted':
          guildConfig.loggingChannels.deletedMessages = channel.id;
          break;
          
        case 'transcripts':
          guildConfig.loggingChannels.ticketTranscripts = channel.id;
          break;
          
        case 'commands':
          guildConfig.loggingChannels.commandUsage = channel.id;
          break;
          
        case 'status':
          guildConfig.loggingChannels.botStatus = channel.id;
          break;
          
        case 'member':
          guildConfig.loggingChannels.memberJoin = channel.id;
          break;

        case 'bounty_submissions':
          guildConfig.loggingChannels.bountySubmissions = channel.id;
          break;
      }
      
      // Save the updated configuration
      config.saveGuildConfig(guildId, guildConfig);
      
      // Reinitialize logging system to use the new channel
      try {
        const loggingSystem = require('../modules/logging');
        await loggingSystem.setup(interaction.client);
      } catch (error) {
        console.error('Error reinitializing logging system:', error);
      }
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('✅ Logging Channel Set')
        .setDescription(`Successfully set ${subcommand} logs to channel ${channel}`)
        .setColor('#00FF00')
        .addFields(
          { 
            name: 'Channel', 
            value: `<#${channel.id}>`, 
            inline: true 
          },
          { 
            name: 'Type', 
            value: subcommand.charAt(0).toUpperCase() + subcommand.slice(1), 
            inline: true 
          }
        )
        .setTimestamp();
      
      // Add tips based on the type of logging channel
      if (subcommand === 'general') {
        embed.setFooter({ 
          text: 'This channel will be used for all general bot logs.' 
        });
      } else if (subcommand === 'deleted') {
        embed.setFooter({ 
          text: 'This channel will receive logs when messages are deleted or edited.' 
        });
      } else if (subcommand === 'transcripts') {
        embed.setFooter({ 
          text: 'Ticket transcripts will be saved to this channel when tickets are closed.' 
        });
      } else if (subcommand === 'commands') {
        embed.setFooter({ 
          text: 'Command usage logs will be sent to this channel.' 
        });
      } else if (subcommand === 'status') {
        embed.setFooter({ 
          text: 'Bot status updates will be posted to this channel hourly.' 
        });
      } else if (subcommand === 'member') {
        embed.setFooter({ 
          text: 'Member join and leave events will be logged to this channel.' 
        });
      } else if (subcommand === 'bounty_submissions') {
        embed.setFooter({ 
          text: 'Bounty submissions from members will be sent to this channel for admin review.' 
        });
      }
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('SetLogs Command Error:', error);
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred while setting up logging channels.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred while setting up logging channels.',
          ephemeral: true
        });
      }
    }
  }
};