// Admin utilities for the dashboard
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Get system statistics for admin dashboard
 * @returns {Object} System statistics
 */
function getSystemStats() {
  const cpuUsage = getCpuUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
  
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cpuUsage: cpuUsage,
    uptime: formatUptime(os.uptime()),
    memoryUsage: {
      total: formatBytes(totalMemory),
      used: formatBytes(usedMemory),
      free: formatBytes(freeMemory),
      percentage: memoryPercentage
    }
  };
}

/**
 * Get CPU usage percentage
 * @returns {Number} CPU usage percentage
 */
function getCpuUsage() {
  // This is a simplified version since getting real-time CPU usage requires sampling over time
  // For a real implementation, consider using the 'os-utils' package
  const cpus = os.cpus();
  const usages = cpus.map(cpu => {
    const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
    const idle = cpu.times.idle;
    return 100 - (idle / total * 100);
  });
  
  // Average CPU usage across all cores
  return Math.round(usages.reduce((acc, usage) => acc + usage, 0) / cpus.length);
}

/**
 * Format bytes to human-readable string
 * @param {Number} bytes Number of bytes
 * @returns {String} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime in seconds to human-readable string
 * @param {Number} seconds Uptime in seconds
 * @returns {String} Formatted string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (secs > 0) result += `${secs}s`;
  
  return result.trim();
}

/**
 * Get Discord bot statistics
 * @param {Object} client Discord client
 * @returns {Object} Bot statistics
 */
function getBotStats(client) {
  if (!client) {
    return {
      status: 'Offline',
      ping: 0,
      guilds: 0,
      users: 0,
      channels: 0,
      commands: 0,
      uptime: '0s'
    };
  }
  
  return {
    status: client.user?.presence?.status || 'Offline',
    ping: client.ws?.ping || 0,
    guilds: client.guilds?.cache?.size || 0,
    users: client.users?.cache?.size || 0,
    channels: client.channels?.cache?.size || 0,
    commands: getCommandCount(),
    uptime: formatUptime(client.uptime ? client.uptime / 1000 : 0)
  };
}

/**
 * Get the number of available commands
 * @returns {Number} Command count
 */
function getCommandCount() {
  try {
    const commandsDir = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    return commandFiles.length;
  } catch (error) {
    console.error('Error getting command count:', error);
    return 0;
  }
}

/**
 * Get log file information
 * @returns {Array} Array of log file objects
 */
function getLogFiles() {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      return []; // Return empty array since we just created the directory
    }
    
    const files = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
    
    const logFiles = files.map(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: filePath,
        size: formatBytes(stats.size),
        created: stats.birthtime,
        modified: stats.mtime,
        sizeBytes: stats.size
      };
    });
    
    // Sort by modification date (newest first)
    return logFiles.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    console.error('Error getting log files:', error);
    return [];
  }
}

module.exports = {
  getSystemStats,
  getBotStats,
  getLogFiles,
  formatBytes,
  formatUptime
};