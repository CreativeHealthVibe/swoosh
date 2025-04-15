/**
 * SWOOSH Bot Audio Player
 * Handles audio playback for the Discord bot with Spotify integration
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
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  // We're using client credentials flow, so redirect URI is not actually used
  // But using HTTPS is more secure
  redirectUri: 'https://swoosh-bot.replit.app/spotify/callback'
});

// Track when we need to refresh Spotify token
let spotifyTokenExpiration = 0;

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

/**
 * Ensure we have a valid Spotify access token
 * @returns {Promise<void>} - Resolves when token is valid
 */
async function ensureSpotifyToken() {
  const now = Date.now();
  
  // If token is expired or will expire in the next minute, refresh it
  if (now >= spotifyTokenExpiration - 60000) {
    try {
      console.log('Getting new Spotify access token...');
      const data = await spotifyApi.clientCredentialsGrant();
      const accessToken = data.body['access_token'];
      const expiresIn = data.body['expires_in'];
      
      // Set the access token
      spotifyApi.setAccessToken(accessToken);
      
      // Calculate when the token will expire (current time + expires_in seconds - 1 minute buffer)
      spotifyTokenExpiration = now + (expiresIn * 1000) - 60000;
      
      console.log('Spotify access token refreshed, expires in', expiresIn, 'seconds');
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw new Error(`Error authenticating with Spotify: ${error.message}`);
    }
  }
}

/**
 * Search for tracks on Spotify
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Track information
 */
async function searchSpotify(query) {
  await ensureSpotifyToken();
  
  try {
    // Check if it's a Spotify URL/URI
    if (query.includes('spotify.com/track/') || query.includes('spotify:track:')) {
      // Extract track ID from URL or URI
      let trackId;
      if (query.includes('spotify.com/track/')) {
        trackId = query.split('spotify.com/track/')[1].split('?')[0];
      } else {
        trackId = query.split('spotify:track:')[1];
      }
      
      // Get track details
      const data = await spotifyApi.getTrack(trackId);
      return data.body;
    } else {
      // Perform a search
      const data = await spotifyApi.searchTracks(query, { limit: 1 });
      if (data.body.tracks.items.length === 0) {
        throw new Error('No tracks found matching your query');
      }
      return data.body.tracks.items[0];
    }
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw new Error(`Error searching Spotify: ${error.message}`);
  }
}

/**
 * Play a Spotify track in a voice connection
 * @param {Object} connection - Discord voice connection
 * @param {string} query - Spotify track URL, URI, or search query
 * @returns {Promise<Object>} - Player and track details
 */
async function playSpotify(connection, query) {
  // Wait for libsodium to be ready (required for voice)
  await libsodium.ready;
  
  try {
    // Search for the track on Spotify
    const trackInfo = await searchSpotify(query);
    
    // Use track name and artist to search on play-dl (since we still need to get the actual audio)
    const searchQuery = `${trackInfo.name} ${trackInfo.artists.map(a => a.name).join(' ')}`;
    console.log(`Searching for: ${searchQuery}`);
    
    // Search for the track on YouTube to get the actual audio
    const searchResults = await play.search(searchQuery, { limit: 1 });
    if (!searchResults || searchResults.length === 0) {
      throw new Error('Could not find audio for this track');
    }
    
    // Get video stream
    const stream = await play.stream(searchResults[0].url);
    
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
    
    // Pipe the audio stream to FFmpeg
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
        title: trackInfo.name,
        url: trackInfo.external_urls.spotify,
        thumbnail: trackInfo.album.images.length > 0 ? trackInfo.album.images[0].url : null,
        duration: Math.floor(trackInfo.duration_ms / 1000),
        artist: trackInfo.artists.map(a => a.name).join(', '),
        album: trackInfo.album.name
      }
    };
  } catch (error) {
    console.error('Error playing Spotify track:', error);
    throw new Error(`Error playing Spotify track: ${error.message}`);
  }
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
  playSpotify,
  formatDuration
};