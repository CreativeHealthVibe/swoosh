// roblox-api.js - Provides utilities for interacting with Roblox API
const fetch = require('node-fetch');
const config = require('../config');

// API endpoints
const ENDPOINTS = {
  USER_INFO: 'https://users.roblox.com/v1/users/',
  USER_THUMBNAIL: 'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=',
  USER_AVATAR: 'https://thumbnails.roblox.com/v1/users/avatar?userIds=',
  USER_GROUPS: 'https://groups.roblox.com/v2/users/',
  PRESENCE: 'https://presence.roblox.com/v1/presence/users'
};

/**
 * Fetch user information from Roblox API
 * @param {string} userId - Roblox user ID
 * @returns {Promise<Object>} - User data
 */
async function getUserInfo(userId) {
  try {
    const response = await fetch(`${ENDPOINTS.USER_INFO}${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Roblox API Error (getUserInfo):', error);
    throw error;
  }
}

/**
 * Fetch user avatar thumbnail
 * @param {string} userId - Roblox user ID
 * @param {string} size - Thumbnail size (48x48, 150x150, etc.)
 * @returns {Promise<string>} - Thumbnail URL
 */
async function getUserThumbnail(userId, size = '150x150') {
  try {
    const response = await fetch(`${ENDPOINTS.USER_THUMBNAIL}${userId}&size=${size}&format=Png`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user thumbnail: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].imageUrl;
    }
    
    throw new Error('No thumbnail found');
  } catch (error) {
    console.error('Roblox API Error (getUserThumbnail):', error);
    return null; // Return null instead of throwing to prevent breaking the command
  }
}

/**
 * Fetch user avatar image
 * @param {string} userId - Roblox user ID
 * @param {string} size - Avatar size (150x150, 420x420, etc.)
 * @returns {Promise<string>} - Avatar URL
 */
async function getUserAvatar(userId, size = '420x420') {
  try {
    const response = await fetch(`${ENDPOINTS.USER_AVATAR}${userId}&size=${size}&format=Png`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user avatar: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].imageUrl;
    }
    
    throw new Error('No avatar found');
  } catch (error) {
    console.error('Roblox API Error (getUserAvatar):', error);
    return null; // Return null instead of throwing to prevent breaking the command
  }
}

/**
 * Check if user exists
 * @param {string} userId - Roblox user ID
 * @returns {Promise<boolean>} - Whether the user exists
 */
async function userExists(userId) {
  try {
    const userData = await getUserInfo(userId);
    return !!userData.id;
  } catch (error) {
    return false;
  }
}

/**
 * Get a complete user profile with all information
 * @param {string} userId - Roblox user ID
 * @returns {Promise<Object>} - Complete user profile
 */
async function getCompleteUserProfile(userId) {
  try {
    // Fetch basic user info
    const userInfo = await getUserInfo(userId);
    
    // Fetch avatar URL in parallel
    const avatarPromise = getUserAvatar(userId);
    const thumbnailPromise = getUserThumbnail(userId);
    
    // Wait for all promises to resolve
    const [avatar, thumbnail] = await Promise.all([avatarPromise, thumbnailPromise]);
    
    return {
      id: userInfo.id,
      username: userInfo.name,
      displayName: userInfo.displayName,
      description: userInfo.description,
      created: userInfo.created,
      avatarUrl: avatar,
      thumbnailUrl: thumbnail,
      isBanned: userInfo.isBanned || false,
      externalAppDisplayName: userInfo.externalAppDisplayName || null
    };
  } catch (error) {
    console.error('Roblox API Error (getCompleteUserProfile):', error);
    throw error;
  }
}

module.exports = {
  getUserInfo,
  getUserThumbnail,
  getUserAvatar,
  userExists,
  getCompleteUserProfile,
  ENDPOINTS
};