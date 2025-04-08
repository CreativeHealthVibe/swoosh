/**
 * Voice Channel Command
 * Allows the bot to join, stay in, leave voice channels, and play music
 */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
  NoSubscriberBehavior
} = require('@discordjs/voice');
const play = require('play-dl');
const path = require('path');
const fs = require('fs');

// Store voice connections and music info
const activeConnections = new Map();
const musicQueues = new Map();

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
        .setDescription('Check voice connection status'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('play')
        .setDescription('Play a YouTube video in the voice channel')
        .addStringOption(option =>
          option.setName('url')
            .setDescription('YouTube URL or search query')
            .setRequired(true))),
  
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
    
    if (!subCommand || !['join', 'leave', 'status', 'play'].includes(subCommand)) {
      return message.reply('Please use a valid subcommand: `join`, `leave`, `status`, or `play`');
    }
    
    if (subCommand === 'join') {
      return this.handleJoin(message, client);
    } else if (subCommand === 'leave') {
      return this.handleLeave(message, client);
    } else if (subCommand === 'status') {
      return this.handleStatus(message, client);
    } else if (subCommand === 'play') {
      // Get the URL or search query
      const query = args.slice(1).join(' ');
      if (!query) {
        return message.reply('Please provide a YouTube URL or search query to play');
      }
      return this.handlePlay(message, query, client);
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
    } else if (subCommand === 'play') {
      await interaction.deferReply();
      const query = interaction.options.getString('url');
      return this.handlePlayInteraction(interaction, query, client);
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
  },
  
  /**
   * Handle the play command for text commands
   * @param {Object} message - Discord message
   * @param {string} query - YouTube URL or search query
   * @param {Object} client - Discord client
   */
  async handlePlay(message, query, client) {
    // Check if user is in a voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel to play music!');
    }
    
    // Check if the bot is already connected to a voice channel
    let voiceConnection = activeConnections.get(message.guild.id);
    
    // If not connected, join the user's voice channel
    if (!voiceConnection) {
      try {
        await this.handleJoin(message, client);
        voiceConnection = activeConnections.get(message.guild.id);
      } catch (error) {
        return message.reply(`Error joining voice channel: ${error.message}`);
      }
    }
    
    try {
      const loadingMessage = await message.reply(`🔍 Searching for: **${query}**...`);
      
      // Check if it's a valid YouTube URL or a search query
      let videoInfo = null;
      
      try {
        // If it's a YouTube URL, get the video info directly
        if (query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/)) {
          videoInfo = await play.video_info(query);
        } else {
          // Otherwise, search for the video
          const searchResults = await play.search(query, { limit: 1 });
          if (!searchResults || searchResults.length === 0) {
            return loadingMessage.edit('❌ No results found for your query!');
          }
          videoInfo = await play.video_info(searchResults[0].url);
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
        return loadingMessage.edit(`❌ Error fetching video info: ${error.message}`);
      }
      
      if (!videoInfo || !videoInfo.video_details) {
        return loadingMessage.edit('❌ Could not get video information!');
      }
      
      // Get the video details
      const videoDetails = videoInfo.video_details;
      
      // Create an audio stream
      const stream = await play.stream(videoDetails.url);
      
      // Create an audio resource from the stream
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });
      
      // Set a reasonable volume
      if (resource.volume) {
        resource.volume.setVolume(0.5);
      }
      
      // Create an audio player
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });
      
      // Play the track
      player.play(resource);
      
      // Connect the player to the voice connection
      voiceConnection.connection.subscribe(player);
      
      // Update the voice connection with the player
      activeConnections.set(message.guild.id, {
        ...voiceConnection,
        player,
        currentTrack: {
          title: videoDetails.title,
          url: videoDetails.url,
          thumbnail: videoDetails.thumbnails ? videoDetails.thumbnails[0]?.url : null,
          duration: videoDetails.durationInSec,
          requestedBy: message.author.tag
        }
      });
      
      // Create a nice embed
      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('▶️ Now Playing')
        .setDescription(`[${videoDetails.title}](${videoDetails.url})`)
        .setThumbnail(videoDetails.thumbnails ? videoDetails.thumbnails[0]?.url : null)
        .addFields(
          { name: 'Duration', value: formatDuration(videoDetails.durationInSec * 1000), inline: true },
          { name: 'Requested By', value: message.author.tag, inline: true }
        )
        .setFooter({ text: 'SWOOSH Bot Music' });
      
      // Set up audio player events
      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Track ended.');
        // Here you could add queue functionality
      });
      
      player.on('error', error => {
        console.error('Audio player error:', error);
        message.channel.send(`❌ Error while playing track: ${error.message}`);
      });
      
      // Edit the loading message with the now playing embed
      return loadingMessage.edit({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Error playing YouTube video:', error);
      return message.reply(`❌ Error playing music: ${error.message}`);
    }
  },
  
  /**
   * Handle the play command for slash commands
   * @param {Object} interaction - Discord interaction
   * @param {string} query - YouTube URL or search query
   * @param {Object} client - Discord client
   */
  async handlePlayInteraction(interaction, query, client) {
    // Check if user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.editReply('You need to be in a voice channel to play music!');
    }
    
    // Check if the bot is already connected to a voice channel
    let voiceConnection = activeConnections.get(interaction.guild.id);
    
    // If not connected, join the user's voice channel
    if (!voiceConnection) {
      try {
        await this.handleJoinInteraction(interaction, client);
        voiceConnection = activeConnections.get(interaction.guild.id);
      } catch (error) {
        return interaction.editReply(`Error joining voice channel: ${error.message}`);
      }
    }
    
    try {
      await interaction.editReply(`🔍 Searching for: **${query}**...`);
      
      // Check if it's a valid YouTube URL or a search query
      let videoInfo = null;
      
      try {
        // If it's a YouTube URL, get the video info directly
        if (query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/)) {
          videoInfo = await play.video_info(query);
        } else {
          // Otherwise, search for the video
          const searchResults = await play.search(query, { limit: 1 });
          if (!searchResults || searchResults.length === 0) {
            return interaction.editReply('❌ No results found for your query!');
          }
          videoInfo = await play.video_info(searchResults[0].url);
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
        return interaction.editReply(`❌ Error fetching video info: ${error.message}`);
      }
      
      if (!videoInfo || !videoInfo.video_details) {
        return interaction.editReply('❌ Could not get video information!');
      }
      
      // Get the video details
      const videoDetails = videoInfo.video_details;
      
      // Create an audio stream
      const stream = await play.stream(videoDetails.url);
      
      // Create an audio resource from the stream
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });
      
      // Set a reasonable volume
      if (resource.volume) {
        resource.volume.setVolume(0.5);
      }
      
      // Create an audio player
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });
      
      // Play the track
      player.play(resource);
      
      // Connect the player to the voice connection
      voiceConnection.connection.subscribe(player);
      
      // Update the voice connection with the player
      activeConnections.set(interaction.guild.id, {
        ...voiceConnection,
        player,
        currentTrack: {
          title: videoDetails.title,
          url: videoDetails.url,
          thumbnail: videoDetails.thumbnails ? videoDetails.thumbnails[0]?.url : null,
          duration: videoDetails.durationInSec,
          requestedBy: interaction.user.tag
        }
      });
      
      // Create a nice embed
      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('▶️ Now Playing')
        .setDescription(`[${videoDetails.title}](${videoDetails.url})`)
        .setThumbnail(videoDetails.thumbnails ? videoDetails.thumbnails[0]?.url : null)
        .addFields(
          { name: 'Duration', value: formatDuration(videoDetails.durationInSec * 1000), inline: true },
          { name: 'Requested By', value: interaction.user.tag, inline: true }
        )
        .setFooter({ text: 'SWOOSH Bot Music' });
      
      // Set up audio player events
      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Track ended.');
        // Here you could add queue functionality
      });
      
      player.on('error', error => {
        console.error('Audio player error:', error);
        interaction.channel.send(`❌ Error while playing track: ${error.message}`);
      });
      
      // Edit the reply with the now playing embed
      return interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Error playing YouTube video:', error);
      return interaction.editReply(`❌ Error playing music: ${error.message}`);
    }
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