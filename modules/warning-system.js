/**
 * Warning System for Discord Server Moderation
 * 
 * This module provides functionality for creating, managing, and tracking warnings for users
 * in Discord servers.
 */

const fs = require('fs');
const path = require('path');

// In-memory cache of warnings
let warningCache = new Map();
let isInitialized = false;

// File path for warnings storage
const warningsFilePath = path.join(__dirname, '..', 'data', 'warnings.json');

/**
 * Initialize the warning system
 */
async function initializeWarningSystem() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create warnings file if it doesn't exist
    if (!fs.existsSync(warningsFilePath)) {
      fs.writeFileSync(warningsFilePath, JSON.stringify({}));
    }
    
    // Load warnings into cache
    const warningsData = JSON.parse(fs.readFileSync(warningsFilePath, 'utf8'));
    
    // Convert to map for faster lookups
    warningCache.clear();
    for (const guildId in warningsData) {
      const guildWarnings = warningsData[guildId];
      warningCache.set(guildId, new Map());
      
      for (const userId in guildWarnings) {
        warningCache.get(guildId).set(userId, guildWarnings[userId]);
      }
    }
    
    isInitialized = true;
    console.log('✅ Warning system initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing warning system:', error);
    isInitialized = false;
    return false;
  }
}

/**
 * Save warnings to disk
 */
async function saveWarnings() {
  try {
    // Convert Map to object for JSON serialization
    const warningsData = {};
    for (const [guildId, guildWarnings] of warningCache.entries()) {
      warningsData[guildId] = {};
      
      for (const [userId, warnings] of guildWarnings.entries()) {
        warningsData[guildId][userId] = warnings;
      }
    }
    
    fs.writeFileSync(warningsFilePath, JSON.stringify(warningsData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving warnings:', error);
    return false;
  }
}

/**
 * Add a warning to a user
 * @param {Object} options - Warning options
 * @param {string} options.guildId - Discord server ID
 * @param {string} options.userId - User ID to warn
 * @param {string} options.moderatorId - Moderator ID who issued the warning
 * @param {string} options.reason - Reason for the warning
 * @param {string} options.username - Username (optional)
 * @param {string} options.moderatorName - Moderator name (optional)
 * @returns {Object} - The created warning
 */
async function addWarning(options) {
  if (!isInitialized) await initializeWarningSystem();
  
  const { guildId, userId, moderatorId, reason, username, moderatorName } = options;
  
  if (!guildId || !userId || !moderatorId || !reason) {
    throw new Error('Missing required fields for warning');
  }
  
  // Initialize guild warnings if not exists
  if (!warningCache.has(guildId)) {
    warningCache.set(guildId, new Map());
  }
  
  // Initialize user warnings if not exists
  if (!warningCache.get(guildId).has(userId)) {
    warningCache.get(guildId).set(userId, []);
  }
  
  // Create warning object
  const warning = {
    id: generateWarningId(),
    userId,
    username: username || 'Unknown User',
    guildId,
    moderatorId,
    moderatorName: moderatorName || 'Unknown Moderator',
    reason,
    timestamp: new Date().toISOString(),
    active: true
  };
  
  // Add warning to cache
  warningCache.get(guildId).get(userId).push(warning);
  
  // Save to disk
  await saveWarnings();
  
  return warning;
}

/**
 * Get all warnings for a user in a guild
 * @param {string} guildId - Discord server ID
 * @param {string} userId - User ID to get warnings for
 * @returns {Array} - Array of warnings
 */
function getUserWarnings(guildId, userId) {
  if (!isInitialized) throw new Error('Warning system not initialized');
  
  if (!warningCache.has(guildId) || !warningCache.get(guildId).has(userId)) {
    return [];
  }
  
  return warningCache.get(guildId).get(userId);
}

/**
 * Get all warnings for a guild
 * @param {string} guildId - Discord server ID
 * @returns {Array} - Array of warnings
 */
function getGuildWarnings(guildId) {
  if (!isInitialized) throw new Error('Warning system not initialized');
  
  if (!warningCache.has(guildId)) {
    return [];
  }
  
  const guildWarnings = [];
  for (const [userId, warnings] of warningCache.get(guildId).entries()) {
    guildWarnings.push(...warnings);
  }
  
  // Sort by timestamp, newest first
  return guildWarnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Remove a warning by ID
 * @param {string} guildId - Discord server ID
 * @param {string} warningId - Warning ID to remove
 * @returns {boolean} - Success
 */
async function removeWarning(guildId, warningId) {
  if (!isInitialized) await initializeWarningSystem();
  
  if (!warningCache.has(guildId)) {
    return false;
  }
  
  let found = false;
  
  // Search through all users for this warning
  for (const [userId, warnings] of warningCache.get(guildId).entries()) {
    const warningIndex = warnings.findIndex(warning => warning.id === warningId);
    
    if (warningIndex !== -1) {
      // Remove the warning
      warnings.splice(warningIndex, 1);
      found = true;
      break;
    }
  }
  
  if (found) {
    await saveWarnings();
  }
  
  return found;
}

/**
 * Update a warning's active status
 * @param {string} guildId - Discord server ID
 * @param {string} warningId - Warning ID to update
 * @param {boolean} active - New active status
 * @returns {boolean} - Success
 */
async function updateWarningStatus(guildId, warningId, active) {
  if (!isInitialized) await initializeWarningSystem();
  
  if (!warningCache.has(guildId)) {
    return false;
  }
  
  let found = false;
  
  // Search through all users for this warning
  for (const [userId, warnings] of warningCache.get(guildId).entries()) {
    const warning = warnings.find(w => w.id === warningId);
    
    if (warning) {
      warning.active = active;
      found = true;
      break;
    }
  }
  
  if (found) {
    await saveWarnings();
  }
  
  return found;
}

/**
 * Clear all warnings for a user
 * @param {string} guildId - Discord server ID
 * @param {string} userId - User ID to clear warnings for
 * @returns {boolean} - Success
 */
async function clearUserWarnings(guildId, userId) {
  if (!isInitialized) await initializeWarningSystem();
  
  if (!warningCache.has(guildId) || !warningCache.get(guildId).has(userId)) {
    return false;
  }
  
  warningCache.get(guildId).delete(userId);
  
  await saveWarnings();
  
  return true;
}

/**
 * Generate a unique warning ID
 * @returns {string} - Unique ID
 */
function generateWarningId() {
  return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get the active warning count for a user
 * @param {string} guildId - Discord server ID
 * @param {string} userId - User ID to get count for
 * @returns {number} - Count of active warnings
 */
function getUserActiveWarningCount(guildId, userId) {
  if (!isInitialized) throw new Error('Warning system not initialized');
  
  if (!warningCache.has(guildId) || !warningCache.get(guildId).has(userId)) {
    return 0;
  }
  
  return warningCache.get(guildId).get(userId).filter(warning => warning.active).length;
}

/**
 * Get the total warning count for a guild
 * @param {string} guildId - Discord server ID
 * @returns {number} - Count of all warnings
 */
function getGuildWarningCount(guildId) {
  if (!isInitialized) throw new Error('Warning system not initialized');
  
  if (!warningCache.has(guildId)) {
    return 0;
  }
  
  let count = 0;
  for (const [userId, warnings] of warningCache.get(guildId).entries()) {
    count += warnings.length;
  }
  
  return count;
}

// Export functions
module.exports = {
  initializeWarningSystem,
  addWarning,
  getUserWarnings,
  getGuildWarnings,
  removeWarning,
  updateWarningStatus,
  clearUserWarnings,
  getUserActiveWarningCount,
  getGuildWarningCount
};