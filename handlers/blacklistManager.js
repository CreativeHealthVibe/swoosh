// blacklistManager.js - Manages the blacklist system
const fs = require('fs');
const path = require('path');
const blacklistFile = path.join(__dirname, '../data/blacklist.json');

/**
 * Load blacklist data from file
 * @returns {Array} - Array of blacklisted users
 */
function loadBlacklist() {
  try {
    if (!fs.existsSync(blacklistFile)) {
      saveBlacklist([]); // Create the file if it doesn't exist
      return [];
    }
    
    const data = fs.readFileSync(blacklistFile, 'utf8');
    const blacklistData = JSON.parse(data);
    return blacklistData.blacklistedUsers || [];
  } catch (error) {
    console.error('Error loading blacklist data:', error);
    return [];
  }
}

/**
 * Save blacklist data to file
 * @param {Array} blacklistedUsers - Array of blacklisted users
 */
function saveBlacklist(blacklistedUsers) {
  try {
    // Ensure the data directory exists
    const dataDir = path.dirname(blacklistFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const blacklistData = { blacklistedUsers };
    fs.writeFileSync(blacklistFile, JSON.stringify(blacklistData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving blacklist data:', error);
  }
}

/**
 * Add a user to the blacklist
 * @param {string} userId - User ID to blacklist
 * @param {string} username - Username of the blacklisted user
 * @param {string} reason - Reason for blacklisting
 * @param {string} moderatorId - ID of the moderator who blacklisted the user
 * @param {string} moderatorTag - Tag of the moderator who blacklisted the user
 * @returns {Object} - Result of the operation
 */
function addToBlacklist(userId, username, reason, moderatorId, moderatorTag) {
  try {
    const blacklistedUsers = loadBlacklist();
    
    // Check if user is already blacklisted
    const existingIndex = blacklistedUsers.findIndex(user => user.userId === userId);
    
    if (existingIndex !== -1) {
      // Update existing entry
      blacklistedUsers[existingIndex] = {
        userId,
        username,
        reason,
        moderatorId,
        moderatorTag,
        timestamp: Date.now()
      };
    } else {
      // Add new entry
      blacklistedUsers.push({
        userId,
        username,
        reason,
        moderatorId,
        moderatorTag,
        timestamp: Date.now()
      });
    }
    
    saveBlacklist(blacklistedUsers);
    
    return {
      success: true,
      message: existingIndex !== -1 ? 'User blacklist updated.' : 'User added to blacklist.'
    };
  } catch (error) {
    console.error('Error adding user to blacklist:', error);
    return {
      success: false,
      message: `Failed to add user to blacklist: ${error.message}`
    };
  }
}

/**
 * Remove a user from the blacklist
 * @param {string} userId - User ID to remove from blacklist
 * @returns {Object} - Result of the operation
 */
function removeFromBlacklist(userId) {
  try {
    const blacklistedUsers = loadBlacklist();
    
    // Find the user
    const existingIndex = blacklistedUsers.findIndex(user => user.userId === userId);
    
    if (existingIndex === -1) {
      return {
        success: false,
        message: 'User not found in blacklist.'
      };
    }
    
    // Remove the user
    blacklistedUsers.splice(existingIndex, 1);
    saveBlacklist(blacklistedUsers);
    
    return {
      success: true,
      message: 'User removed from blacklist.'
    };
  } catch (error) {
    console.error('Error removing user from blacklist:', error);
    return {
      success: false,
      message: `Failed to remove user from blacklist: ${error.message}`
    };
  }
}

/**
 * Check if a user is blacklisted
 * @param {string} userId - User ID to check
 * @returns {Object|null} - Blacklist entry or null if not blacklisted
 */
function isBlacklisted(userId) {
  const blacklistedUsers = loadBlacklist();
  return blacklistedUsers.find(user => user.userId === userId) || null;
}

/**
 * Get the full blacklist
 * @returns {Array} - Array of blacklisted users
 */
function getBlacklist() {
  return loadBlacklist();
}

module.exports = {
  addToBlacklist,
  removeFromBlacklist,
  isBlacklisted,
  getBlacklist
};