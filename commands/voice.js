/**
 * Voice Channel Command
 * Allows the bot to join, stay in, and leave voice channels
 */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

// Store voice connections
const activeConnections = new Map();

module.exports = {
  // Command metadata
  name: 'voice',
  description: 'Voice channel commands',
  category: 'Utility',
  usage: 'voice <join|leave|status>',
  
  // Slash command definition
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Voice channel commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('join')
        .setDescription('Join your current voice channel'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('leave')
        .setDescription('Leave the voice channel'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check voice connection status')),
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    // Check if user has permission to use this command
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return message.reply('You need the **Mute Members** permission to use voice commands');
    }
    
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand || !['join', 'leave', 'status'].includes(subCommand)) {
      return message.reply('Please use a valid subcommand: `join`, `leave`, or `status`');
    }
    
    if (subCommand === 'join') {
      return this.handleJoin(message, client);
    } else if (subCommand === 'leave') {
      return this.handleLeave(message, client);
    } else if (subCommand === 'status') {
      return this.handleStatus(message, client);
    }
  },
  
  /**
   * Handle slash command interactions
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async executeInteraction(interaction, client) {
    const subCommand = interaction.options.getSubcommand();
    
    if (subCommand === 'join') {
      await interaction.deferReply();
      return this.handleJoinInteraction(interaction, client);
    } else if (subCommand === 'leave') {
      await interaction.deferReply();
      return this.handleLeaveInteraction(interaction, client);
    } else if (subCommand === 'status') {
      await interaction.deferReply();
      return this.handleStatusInteraction(interaction, client);
    }
  },
  
  /**
   * Handle the join command
   * @param {Object} message - Discord message
   * @param {Object} client - Discord client
   */
  async handleJoin(message, client) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel first!');
    }
    
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });
      
      // Store the connection
      activeConnections.set(voiceChannel.guild.id, {
        connection,
        channelId: voiceChannel.id,
        joinTime: Date.now()
      });
      
      // Set up connection event listeners
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting - don't destroy
        } catch (error) {
          // Disconnection appears to be permanent
          connection.destroy();
          activeConnections.delete(voiceChannel.guild.id);
        }
      });
      
      return message.reply(`✅ Joined voice channel: **${voiceChannel.name}**`);
    } catch (error) {
      console.error('Error joining voice channel:', error);
      return message.reply(`Error joining voice channel: ${error.message}`);
    }
  },
  
  /**
   * Handle the join interaction
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async handleJoinInteraction(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.editReply('You need to be in a voice channel first!');
    }
    
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });
      
      // Store the connection
      activeConnections.set(voiceChannel.guild.id, {
        connection,
        channelId: voiceChannel.id,
        joinTime: Date.now()
      });
      
      // Set up connection event listeners
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting - don't destroy
        } catch (error) {
          // Disconnection appears to be permanent
          connection.destroy();
          activeConnections.delete(voiceChannel.guild.id);
        }
      });
      
      return interaction.editReply(`✅ Joined voice channel: **${voiceChannel.name}**`);
    } catch (error) {
      console.error('Error joining voice channel:', error);
      return interaction.editReply(`Error joining voice channel: ${error.message}`);
    }
  },
  
  /**
   * Handle the leave command
   * @param {Object} message - Discord message
   * @param {Object} client - Discord client
   */
  async handleLeave(message, client) {
    const guildId = message.guild.id;
    const voiceData = activeConnections.get(guildId);
    
    if (!voiceData) {
      return message.reply('I\'m not in a voice channel on this server.');
    }
    
    try {
      voiceData.connection.destroy();
      activeConnections.delete(guildId);
      return message.reply('✅ Left the voice channel');
    } catch (error) {
      console.error('Error leaving voice channel:', error);
      return message.reply(`Error leaving voice channel: ${error.message}`);
    }
  },
  
  /**
   * Handle the leave interaction
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async handleLeaveInteraction(interaction, client) {
    const guildId = interaction.guild.id;
    const voiceData = activeConnections.get(guildId);
    
    if (!voiceData) {
      return interaction.editReply('I\'m not in a voice channel on this server.');
    }
    
    try {
      voiceData.connection.destroy();
      activeConnections.delete(guildId);
      return interaction.editReply('✅ Left the voice channel');
    } catch (error) {
      console.error('Error leaving voice channel:', error);
      return interaction.editReply(`Error leaving voice channel: ${error.message}`);
    }
  },
  
  /**
   * Handle the status command
   * @param {Object} message - Discord message
   * @param {Object} client - Discord client
   */
  async handleStatus(message, client) {
    const guildId = message.guild.id;
    const voiceData = activeConnections.get(guildId);
    
    if (!voiceData) {
      return message.reply('I\'m not connected to any voice channels on this server.');
    }
    
    const channel = message.guild.channels.cache.get(voiceData.channelId);
    const channelName = channel ? channel.name : 'Unknown channel';
    const uptime = formatDuration(Date.now() - voiceData.joinTime);
    
    return message.reply(`🎙️ **Voice Status**\n` +
      `Channel: **${channelName}**\n` +
      `Connected for: **${uptime}**`);
  },
  
  /**
   * Handle the status interaction
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async handleStatusInteraction(interaction, client) {
    const guildId = interaction.guild.id;
    const voiceData = activeConnections.get(guildId);
    
    if (!voiceData) {
      return interaction.editReply('I\'m not connected to any voice channels on this server.');
    }
    
    const channel = interaction.guild.channels.cache.get(voiceData.channelId);
    const channelName = channel ? channel.name : 'Unknown channel';
    const uptime = formatDuration(Date.now() - voiceData.joinTime);
    
    return interaction.editReply(`🎙️ **Voice Status**\n` +
      `Channel: **${channelName}**\n` +
      `Connected for: **${uptime}**`);
  }
};

/**
 * Format duration in a human-readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 1000 / 60) % 60;
  const hours = Math.floor(ms / 1000 / 60 / 60);
  
  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}