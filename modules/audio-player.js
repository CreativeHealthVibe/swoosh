/**
 * SWOOSH Bot Audio Player
 * Handles audio playback for the Discord bot
 */

const { 
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior 
} = require('@discordjs/voice');
const play = require('play-dl');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const libsodium = require('libsodium-wrappers');

/**
 * Create a new audio player
 * @returns {Object} - An audio player
 */
function createPlayer() {
  return createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });
}

// Track when the last YouTube request was made to avoid rate limiting
let lastYouTubeRequestTime = 0;
const YOUTUBE_REQUEST_RATE_LIMIT = 3000; // 3 seconds between requests

/**
 * Make a rate-limited YouTube API request
 * @param {Function} requestFn - Function that makes the actual API request
 * @returns {Promise<any>} - The API response
 */
async function rateLimitedYouTubeRequest(requestFn) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastYouTubeRequestTime;
  
  // If we've made a request too recently, wait before making another
  if (timeSinceLastRequest < YOUTUBE_REQUEST_RATE_LIMIT) {
    const waitTime = YOUTUBE_REQUEST_RATE_LIMIT - timeSinceLastRequest;
    console.log(`Rate limiting YouTube request, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    // Update the last request time
    lastYouTubeRequestTime = Date.now();
    return await requestFn();
  } catch (error) {
    // Special handling for rate limit errors
    if (error.message && error.message.includes('429')) {
      console.warn('YouTube rate limit hit, need to wait longer between requests');
      lastYouTubeRequestTime = Date.now() + 30000; // Force a 30 second cooldown
      throw new Error('YouTube is rate limiting our requests. Please try again in 30 seconds.');
    }
    throw error;
  }
}

/**
 * Play a YouTube video in a voice connection
 * @param {Object} connection - Discord voice connection
 * @param {string} url - YouTube URL or search query
 * @returns {Promise<Object>} - Details about the playing track
 */
async function playYouTube(connection, url) {
  // Wait for libsodium to be ready (required for voice)
  await libsodium.ready;
  
  // Get the video info
  let videoInfo = null;
  
  try {
    // If it's a YouTube URL, get the video info directly
    if (url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/)) {
      videoInfo = await rateLimitedYouTubeRequest(() => play.video_info(url));
    } else {
      // Otherwise, search for the video
      const searchResults = await rateLimitedYouTubeRequest(() => play.search(url, { limit: 1 }));
      if (!searchResults || searchResults.length === 0) {
        throw new Error('No results found for your query!');
      }
      videoInfo = await rateLimitedYouTubeRequest(() => play.video_info(searchResults[0].url));
    }
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw new Error(`Error fetching video info: ${error.message}`);
  }
  
  if (!videoInfo || !videoInfo.video_details) {
    throw new Error('Could not get video information!');
  }
  
  // Get the video details
  const videoDetails = videoInfo.video_details;
  
  // Create an audio stream with rate limiting
  const stream = await rateLimitedYouTubeRequest(() => play.stream(videoDetails.url));
  
  // Create an FFmpeg process that converts the stream
  const ffmpeg = spawn(ffmpegPath, [
    '-i', '-',          // Input from stdin
    '-analyzeduration', '0',
    '-loglevel', '0',   // Suppress logs
    '-f', 's16le',      // Output format
    '-ar', '48000',     // Output sample rate
    '-ac', '2',         // Stereo output
    '-af', 'volume=0.5', // Set volume
    'pipe:1'            // Output to stdout
  ], { stdio: ['pipe', 'pipe', 'ignore'] });
  
  // Pipe the YouTube stream to FFmpeg
  stream.stream.pipe(ffmpeg.stdin);
  
  // Create an audio resource from the FFmpeg process output
  const resource = createAudioResource(ffmpeg.stdout, {
    inputType: 'StreamType',
    inlineVolume: true
  });
  
  // Create an audio player
  const player = createPlayer();
  
  // Play the track
  player.play(resource);
  
  // Connect the player to the voice connection
  connection.subscribe(player);
  
  // Return track details
  return {
    player,
    details: {
      title: videoDetails.title,
      url: videoDetails.url,
      thumbnail: videoDetails.thumbnails ? videoDetails.thumbnails[0]?.url : null,
      duration: videoDetails.durationInSec
    }
  };
}

/**
 * Format duration in a human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
  const sec = Math.floor(seconds % 60);
  const min = Math.floor(seconds / 60) % 60;
  const hrs = Math.floor(seconds / 3600);
  
  let parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (min > 0) parts.push(`${min}m`);
  parts.push(`${sec}s`);
  
  return parts.join(' ');
}

module.exports = {
  createPlayer,
  playYouTube,
  formatDuration
};