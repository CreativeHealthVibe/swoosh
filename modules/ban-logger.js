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
   * @param {Object} ban - Ban information
   * @param {Object} ban.user - The banned user
   * @param {string} ban.user.id - User ID
   * @param {string} ban.user.tag - User tag (username#discriminator)
   * @param {string} ban.reason - Reason for ban
   * @param {Object} executor - The user who performed the ban
   * @param {string} executor.id - Executor ID
   * @param {string} executor.tag - Executor tag
   * @param {string} guildId - Guild ID where ban occurred
   */
  logBan(ban, executor, guildId) {
    const timestamp = new Date().toISOString();
    const userStr = ban.user ? `${ban.user.tag} (${ban.user.id})` : 'Unknown User';
    const executorStr = executor ? `${executor.tag} (${executor.id})` : 'System';
    const details = JSON.stringify({
      reason: ban.reason || 'No reason provided'
    });
    
    const logEntry = `[${timestamp}] User Banned | User: ${userStr} | Executor: ${executorStr} | Details: ${details}\n`;
    
    // Log to server-specific ban log
    this.appendToLog(`ban-log-${guildId}.txt`, logEntry);
    
    // Also log to main bot log
    this.appendToLog('bot-log.txt', logEntry);
    
    console.log(`✅ Logged ban event for ${userStr}`);
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
      
      if (fs.existsSync(filePath)) {
        return logParser.parseLogFile(filePath);
      }
    } catch (error) {
      console.error('Error reading ban logs:', error);
    }
    
    return [];
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