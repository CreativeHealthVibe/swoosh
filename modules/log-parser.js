/**
 * Log Parser Module
 * Used to parse and analyze log files for easier viewing and searching
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse a log entry line into a structured object
 * @param {string} line - The log line to parse
 * @returns {Object|null} - Parsed log entry or null if invalid
 */
function parseLogLine(line) {
  try {
    // Regular expression to match the standard log format
    const regex = /\[(.*?)\] (.*?) \| User: (.*?) \| Executor: (.*?) \| Details: (.*)/;
    const match = line.match(regex);
    
    if (!match) return null;
    
    const [_, timestamp, eventType, user, executor, detailsStr] = match;
    
    // Parse the details JSON if possible
    let details = {};
    try {
      details = JSON.parse(detailsStr);
    } catch (e) {
      details = { raw: detailsStr };
    }
    
    // Parse user and executor information
    const userInfo = parseUserInfo(user);
    const executorInfo = parseUserInfo(executor);
    
    return {
      timestamp,
      date: new Date(timestamp),
      eventType,
      user: userInfo,
      executor: executorInfo,
      details
    };
  } catch (error) {
    console.error('Error parsing log line:', error);
    console.error('Line:', line);
    return null;
  }
}

/**
 * Parse user information from log string
 * @param {string} userString - The user string to parse (e.g., "username#1234 (12345678901234567)")
 * @returns {Object} - Parsed user info
 */
function parseUserInfo(userString) {
  if (userString === 'N/A' || userString === 'System') {
    return { 
      isSystem: true, 
      name: userString 
    };
  }
  
  // Try to match username#discriminator (id) pattern
  const userRegex = /(.*?)(?:#(\d+))? \((\d+)\)/;
  const match = userString.match(userRegex);
  
  if (match) {
    const [_, username, discriminator, id] = match;
    return {
      username,
      discriminator: discriminator || '0',
      id
    };
  }
  
  // If no match, just return the raw string
  return {
    raw: userString
  };
}

/**
 * Parse an entire log file
 * @param {string} filePath - Path to the log file
 * @returns {Array} - Array of parsed log entries
 */
function parseLogFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map(line => parseLogLine(line)).filter(entry => entry !== null);
  } catch (error) {
    console.error('Error reading log file:', error);
    return [];
  }
}

/**
 * Filter log entries by type
 * @param {Array} entries - Array of log entries
 * @param {string} type - Event type to filter for
 * @returns {Array} - Filtered log entries
 */
function filterByType(entries, type) {
  return entries.filter(entry => entry.eventType === type);
}

/**
 * Filter log entries by user ID
 * @param {Array} entries - Array of log entries
 * @param {string} userId - User ID to filter for
 * @returns {Array} - Filtered log entries
 */
function filterByUserId(entries, userId) {
  return entries.filter(entry => 
    (entry.user && entry.user.id === userId) || 
    (entry.executor && entry.executor.id === userId)
  );
}

/**
 * Filter log entries by date range
 * @param {Array} entries - Array of log entries
 * @param {Date} startDate - Start date of range
 * @param {Date} endDate - End date of range
 * @returns {Array} - Filtered log entries
 */
function filterByDateRange(entries, startDate, endDate) {
  return entries.filter(entry => {
    const entryDate = entry.date;
    return entryDate >= startDate && entryDate <= endDate;
  });
}

/**
 * Extract ban events from logs
 * @param {Array} entries - Array of log entries
 * @returns {Array} - Ban events
 */
/**
 * Extract ban and unban events from log entries
 * @param {Array} entries - Array of log entries
 * @returns {Array} - Extracted ban and unban events
 */
function extractBanEvents(entries) {
  return entries.filter(entry => 
    entry.eventType === 'User Banned' || entry.eventType === 'User Unbanned'
  ).map(entry => {
    // Skip if user data is missing
    if (!entry.user || !entry.user.id) {
      return null;
    }
    
    // Skip if executor data is missing
    if (!entry.executor) {
      entry.executor = { id: 'unknown', username: 'Unknown' };
    }
    
    return {
      timestamp: entry.timestamp,
      date: entry.date,
      eventType: entry.eventType === 'User Banned' ? 'ban' : 'unban',
      userId: entry.user.id,
      userName: entry.user.username || entry.user.name || 'Unknown User',
      executorId: entry.executor.id,
      executorName: entry.executor.username || entry.executor.name || 'Unknown',
      details: entry.details || {},
      reason: entry.details && entry.details.reason ? entry.details.reason : 'No reason provided'
    };
  }).filter(event => event !== null); // Remove any null events from missing data
}

/**
 * Extract user moderation events (bans, kicks, mutes, etc.)
 * @param {Array} entries - Array of log entries
 * @param {string} userId - User ID to filter for
 * @returns {Array} - Moderation events for user
 */
function extractUserModerationEvents(entries, userId) {
  const moderationTypes = ['User Banned', 'User Unbanned', 'User Kicked', 'User Muted', 'User Warned'];
  
  return entries
    .filter(entry => 
      moderationTypes.includes(entry.eventType) && 
      entry.user && 
      entry.user.id === userId
    )
    .map(entry => {
      return {
        timestamp: entry.timestamp,
        date: entry.date,
        eventType: entry.eventType,
        executorId: entry.executor.id,
        executorName: entry.executor.username || entry.executor.name,
        details: entry.details
      };
    });
}

/**
 * Format logs nicely for Discord message embedding
 * @param {Array} entries - Array of log entries
 * @param {number} maxLength - Maximum length of output
 * @returns {string} - Formatted log output
 */
function formatForDiscord(entries, maxLength = 1000) {
  let output = '';
  
  for (const entry of entries) {
    const date = new Date(entry.timestamp).toLocaleString();
    const user = entry.user.username || entry.user.name || 'Unknown';
    const executor = entry.executor.username || entry.executor.name || 'Unknown';
    const details = typeof entry.details === 'string' 
      ? entry.details 
      : JSON.stringify(entry.details);
    
    const line = `[${date}] ${entry.eventType} | ${user} by ${executor} | ${details}\n`;
    
    // Check if adding this line would exceed max length
    if (output.length + line.length > maxLength) {
      output += '... (and more)';
      break;
    }
    
    output += line;
  }
  
  return output;
}

module.exports = {
  parseLogLine,
  parseLogFile,
  filterByType,
  filterByUserId,
  filterByDateRange,
  extractBanEvents,
  extractUserModerationEvents,
  formatForDiscord
};