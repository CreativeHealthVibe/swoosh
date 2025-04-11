/**
 * Ban Logger Module
 * Logs ban events to files for later retrieval by ban list commands
 */

const fs = require('fs');
const path = require('path');

class BanLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure the logs directory exists
   * @private
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      try {
        fs.mkdirSync(this.logsDir, { recursive: true });
        console.log('✅ Created logs directory');
      } catch (error) {
        console.error('Error creating logs directory', error);
      }
    }
  }

  /**
   * Log a ban event
   * This function handles both direct calls from Discord events and API calls.
   * 
   * @param {Object} banData - Ban information (supports multiple formats)
   * @param {Object} [banData.user] - The banned user (from Discord events)
   * @param {string} [banData.user.id] - User ID
   * @param {string} [banData.user.tag] - User tag (username#discriminator)
   * @param {string} [banData.reason] - Reason for ban
   * @param {string} [banData.userId] - User ID (alternative format from API)
   * @param {string} [banData.serverId] - Guild ID (from API calls)
   * @param {Object} [banData.executor] - Executor info (alternative format from API)
   * @param {Object} [executor] - The user who performed the ban (from Discord events)
   * @param {string} [executor.id] - Executor ID
   * @param {string} [executor.tag] - Executor tag
   * @param {string} [guildId] - Guild ID where ban occurred (from Discord events)
   */
  logBan(banData, executor, guildId) {
    try {
      const timestamp = new Date().toISOString();
      
      // Handle various parameter formats
      // First, determine the actual user data
      let userStr = 'Unknown User';
      if (banData.user && banData.user.id) {
        // Discord event format
        userStr = `${banData.user.tag || 'unknown'} (${banData.user.id})`;
      } else if (banData.userId) {
        // API call format
        userStr = `${banData.username || 'unknown'} (${banData.userId})`;
      }
      
      // Next, determine the executor data
      let executorStr = 'System';
      if (executor && executor.id) {
        // Discord event format
        executorStr = `${executor.tag || 'unknown'} (${executor.id})`;
      } else if (banData.executor) {
        // API call format
        executorStr = `${banData.executor.name || 'unknown'} (${banData.executor.id || 'SYSTEM'})`;
      }
      
      // Determine ban reason
      const reason = banData.reason || 'No reason provided';
      
      // Prepare additional details
      const details = JSON.stringify({
        reason: reason,
        duration: banData.duration || null
      });
      
      // Create log entry
      const logEntry = `[${timestamp}] User Banned | User: ${userStr} | Executor: ${executorStr} | Details: ${details}\n`;
      
      // Determine server ID
      const serverIdToUse = guildId || banData.serverId || banData.guildId || 'unknown';
      
      // Log to server-specific ban log
      this.appendToLog(`ban-log-${serverIdToUse}.txt`, logEntry);
      
      // Also log to main bot log
      this.appendToLog('bot-log.txt', logEntry);
      
      console.log(`✅ Logged ban event for ${userStr}`);
    } catch (error) {
      console.error('Error logging ban event:', error);
    }
  }

  /**
   * Log an unban event
   * @param {Object} user - The unbanned user
   * @param {Object} executor - The user who performed the unban
   * @param {string} reason - Reason for unban
   * @param {string} guildId - Guild ID where unban occurred
   */
  logUnban(user, executor, reason, guildId) {
    const timestamp = new Date().toISOString();
    const userStr = user ? `${user.tag} (${user.id})` : 'Unknown User';
    const executorStr = executor ? `${executor.tag} (${executor.id})` : 'System';
    const details = JSON.stringify({
      reason: reason || 'No reason provided'
    });
    
    const logEntry = `[${timestamp}] User Unbanned | User: ${userStr} | Executor: ${executorStr} | Details: ${details}\n`;
    
    // Log to server-specific ban log
    this.appendToLog(`ban-log-${guildId}.txt`, logEntry);
    
    // Also log to main bot log
    this.appendToLog('bot-log.txt', logEntry);
    
    console.log(`✅ Logged unban event for ${userStr}`);
  }

  /**
   * Log a kick event
   * @param {Object} user - The kicked user
   * @param {Object} executor - The user who performed the kick
   * @param {string} reason - Reason for kick
   * @param {string} guildId - Guild ID where kick occurred
   */
  logKick(user, executor, reason, guildId) {
    const timestamp = new Date().toISOString();
    const userStr = user ? `${user.tag} (${user.id})` : 'Unknown User';
    const executorStr = executor ? `${executor.tag} (${executor.id})` : 'System';
    const details = JSON.stringify({
      reason: reason || 'No reason provided'
    });
    
    const logEntry = `[${timestamp}] User Kicked | User: ${userStr} | Executor: ${executorStr} | Details: ${details}\n`;
    
    // Log to server-specific mod log
    this.appendToLog(`mod-log-${guildId}.txt`, logEntry);
    
    // Also log to main bot log
    this.appendToLog('bot-log.txt', logEntry);
    
    console.log(`✅ Logged kick event for ${userStr}`);
  }

  /**
   * Log a mute event
   * @param {Object} user - The muted user
   * @param {Object} executor - The user who performed the mute
   * @param {string} reason - Reason for mute
   * @param {string|null} duration - Duration of mute, if applicable
   * @param {string} guildId - Guild ID where mute occurred
   */
  logMute(user, executor, reason, duration, guildId) {
    const timestamp = new Date().toISOString();
    const userStr = user ? `${user.tag} (${user.id})` : 'Unknown User';
    const executorStr = executor ? `${executor.tag} (${executor.id})` : 'System';
    const details = JSON.stringify({
      reason: reason || 'No reason provided',
      duration: duration || 'Indefinite',
      method: 'Muted Role'
    });
    
    const logEntry = `[${timestamp}] User Muted | User: ${userStr} | Executor: ${executorStr} | Details: ${details}\n`;
    
    // Log to server-specific mod log
    this.appendToLog(`mod-log-${guildId}.txt`, logEntry);
    
    // Also log to main bot log
    this.appendToLog('bot-log.txt', logEntry);
    
    console.log(`✅ Logged mute event for ${userStr}`);
  }

  /**
   * Append log entry to a log file
   * @private
   * @param {string} filename - Log filename
   * @param {string} logEntry - The log entry to append
   */
  appendToLog(filename, logEntry) {
    try {
      const filePath = path.join(this.logsDir, filename);
      fs.appendFileSync(filePath, logEntry);
    } catch (error) {
      console.error(`Error writing to log file ${filename}:`, error);
    }
  }

  /**
   * Get ban logs for a specific guild
   * @param {string} guildId - Guild ID to get logs for
   * @returns {Array} - Array of parsed ban log entries
   */
  getBanLogs(guildId) {
    try {
      const logParser = require('./log-parser');
      const filePath = path.join(this.logsDir, `ban-log-${guildId}.txt`);
      
      // Make sure the logs directory exists
      this.ensureLogDirectory();
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        try {
          console.log(`Reading ban logs from ${filePath}`);
          const logs = logParser.parseLogFile(filePath);
          console.log(`Successfully parsed ${logs.length} ban log entries`);
          return logs;
        } catch (parseError) {
          console.error(`Error parsing log file ${filePath}:`, parseError);
          return []; // Return empty array on parse error
        }
      } else {
        console.log(`No ban log file exists for guild ${guildId}`);
        return []; // Return empty array if file doesn't exist
      }
    } catch (error) {
      console.error('Error reading ban logs:', error);
      return []; // Return empty array on any error
    }
  }

  /**
   * Get moderation logs for a specific user
   * @param {string} userId - User ID to get logs for
   * @returns {Array} - Array of parsed moderation log entries for the user
   */
  getUserModLogs(userId) {
    try {
      const logParser = require('./log-parser');
      const mainLogPath = path.join(this.logsDir, 'bot-log.txt');
      
      if (fs.existsSync(mainLogPath)) {
        const logs = logParser.parseLogFile(mainLogPath);
        return logParser.filterByUserId(logs, userId);
      }
    } catch (error) {
      console.error('Error reading user mod logs:', error);
    }
    
    return [];
  }
}

module.exports = new BanLogger();