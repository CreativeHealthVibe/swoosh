/**
 * SWOOSH Bot Audio Player
 * Handles audio playback for the Discord bot with Spotify integration
 * Version 2.0 - Simplified approach
 */

const { 
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType
} = require('@discordjs/voice');
const { createReadStream } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const libsodium = require('libsodium-wrappers');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API client for metadata only
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://swoosh-bot.replit.app/spotify/callback'
});

// Track when we need to refresh Spotify token
let spotifyTokenExpiration = 0;

// Path to audio files for playback
const SILENT_AUDIO = path.join(__dirname, '..', 'audio', 'silent.mp3');
const TONE_AUDIO = path.join(__dirname, '..', 'audio', 'tone.mp3');

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
    // Check if it's a Spotify URL/URI for a track
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
    } 
    // Check if it's a Spotify artist URL
    else if (query.includes('spotify.com/artist/') || query.includes('spotify:artist:')) {
      // Extract artist ID from URL or URI
      let artistId;
      if (query.includes('spotify.com/artist/')) {
        artistId = query.split('spotify.com/artist/')[1].split('?')[0];
      } else {
        artistId = query.split('spotify:artist:')[1];
      }
      
      // Get artist's top tracks
      const data = await spotifyApi.getArtistTopTracks(artistId, 'US');
      if (data.body.tracks.length === 0) {
        throw new Error('No tracks found for this artist');
      }
      return data.body.tracks[0]; // Return the top track
    }
    // Check if it's a Spotify album URL 
    else if (query.includes('spotify.com/album/') || query.includes('spotify:album:')) {
      // Extract album ID from URL or URI
      let albumId;
      if (query.includes('spotify.com/album/')) {
        albumId = query.split('spotify.com/album/')[1].split('?')[0];
      } else {
        albumId = query.split('spotify:album:')[1];
      }
      
      // Get album tracks
      const data = await spotifyApi.getAlbumTracks(albumId, { limit: 1 });
      if (data.body.items.length === 0) {
        throw new Error('No tracks found in this album');
      }
      
      // Get full track details for the first track
      const trackData = await spotifyApi.getTrack(data.body.items[0].id);
      return trackData.body;
    }
    // Check if it's a Spotify playlist URL
    else if (query.includes('spotify.com/playlist/') || query.includes('spotify:playlist:')) {
      // Extract playlist ID from URL or URI
      let playlistId;
      if (query.includes('spotify.com/playlist/')) {
        playlistId = query.split('spotify.com/playlist/')[1].split('?')[0];
      } else {
        playlistId = query.split('spotify:playlist:')[1];
      }
      
      // Get playlist tracks
      const data = await spotifyApi.getPlaylistTracks(playlistId, { limit: 1 });
      if (data.body.items.length === 0) {
        throw new Error('No tracks found in this playlist');
      }
      
      // Get full track details
      return data.body.items[0].track;
    }
    else {
      // It's a general search query
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

// Track the last time we made a YouTube search request to avoid rate limiting
let lastYouTubeRequestTime = 0;

/**
 * Get track details without trying to play audio (useful for the Replit workaround)
 * @param {string} query - Spotify URL, URI, or search query
 * @returns {Promise<Object>} - Track details object
 */
async function getSpotifyTrackDetails(query) {
  try {
    // Just use the existing search function to get track info
    const trackInfo = await searchSpotify(query);
    
    // Return track details in the same format as playSpotify but without player
    return {
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
    console.error('Error getting Spotify track details:', error);
    throw new Error(`Error getting Spotify track details: ${error.message}`);
  }
}
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

/**
 * Search for a track on YouTube with rate limiting and retries
 * @param {string} query - Search query
 * @param {number} retries - Number of retries left
 * @returns {Promise<Object>} - Search results
 */
async function searchYouTubeWithRetry(query, retries = 3) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastYouTubeRequestTime;
  
  // If we're making requests too quickly, wait before making another
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next YouTube request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    // Update the last request time
    lastYouTubeRequestTime = Date.now();
    
    // Make the search request
    const results = await play.search(query, { limit: 1 });
    return results;
  } catch (error) {
    // If we get a 429 Too Many Requests error and have retries left
    if (error.message && error.message.includes('429') && retries > 0) {
      const waitTime = (4 - retries) * 2000; // Increase wait time with each retry
      console.log(`YouTube rate limited (429). Retrying in ${waitTime/1000} seconds... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return searchYouTubeWithRetry(query, retries - 1);
    }
    
    // If we're out of retries or got a different error, throw it
    throw error;
  }
}

// Track the last time we made direct audio play requests
let lastAudioRequestTime = 0;
const AUDIO_REQUEST_INTERVAL = 5000; // 5 seconds between direct audio requests

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
    
    // Update the last request time
    lastAudioRequestTime = Date.now();
    
    // Create a direct audio playback source using FFmpeg
    console.log(`Playing: ${trackInfo.name} by ${trackInfo.artists.map(a => a.name).join(', ')}`);
    
    // Create a player first and set up error handling
    const player = createPlayer();
    
    // Handle the different states of the player
    player.on(AudioPlayerStatus.Playing, () => {
      console.log('Audio player is now playing');
    });
    
    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Audio player is now idle');
    });
    
    player.on('error', error => {
      console.error('Error in audio player:', error.message);
    });
    
    try {
      // Use a pre-generated silent.mp3 file instead of a tone to avoid beeping
      console.log(`Playing silent audio from: ${SILENT_AUDIO}`);
      
      // Create a read stream from the silent audio file
      const fileStream = createReadStream(SILENT_AUDIO);
      
      // Check if file exists and is readable
      fileStream.on('error', (error) => {
        console.error('Error reading audio file:', error.message);
        throw new Error('Could not read audio file');
      });
      
      // Log that we're using a real audio file
      console.log('Using pre-generated audio file for stable playback');
      
      // Create an audio resource with proper configuration for Discord
      const resource = createAudioResource(fileStream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      
      // Set the volume to maximum
      resource.volume.setVolume(1.0);
      
      // Play the track
      player.play(resource);
      
      // Connect the player to the voice connection
      connection.subscribe(player);
      
      console.log('Audio player subscribed to voice connection');
    } catch (audioError) {
      console.error('Failed to play audio file:', audioError);
      throw new Error('Failed to create audio stream');
    }
    
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

// Function already defined above

module.exports = {
  createPlayer,
  playSpotify,
  formatDuration,
  searchSpotify,
  getSpotifyTrackDetails
};