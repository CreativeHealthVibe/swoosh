// Admin utilities
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Get system statistics for admin dashboard
 * @returns {Object} System statistics
 */
function getSystemStats() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    cpuUsage: getCpuUsage(),
    memoryUsage: {
      total: formatBytes(totalMemory),
      used: formatBytes(usedMemory),
      free: formatBytes(freeMemory),
      percentage: Math.round((usedMemory / totalMemory) * 100)
    },
    uptime: formatUptime(os.uptime()),
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname()
  };
}

/**
 * Get CPU usage percentage
 * @returns {Number} CPU usage percentage
 */
function getCpuUsage() {
  try {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    return Math.round(100 - (totalIdle / totalTick * 100));
  } catch (error) {
    console.error('Error getting CPU usage:', error);
    return 0;
  }
}

/**
 * Format bytes to human-readable string
 * @param {Number} bytes Number of bytes
 * @returns {String} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime in seconds to human-readable string
 * @param {Number} seconds Uptime in seconds
 * @returns {String} Formatted string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

/**
 * Get Discord bot statistics
 * @param {Object} client Discord client
 * @returns {Object} Bot statistics
 */
function getBotStats(client) {
  if (!client) {
    return {
      guilds: 0,
      users: 0,
      channels: 0,
      commands: 0
    };
  }
  
  return {
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    channels: client.channels.cache.size,
    commands: getCommandCount()
  };
}

/**
 * Get the number of available commands
 * @returns {Number} Command count
 */
function getCommandCount() {
  try {
    const commandsPath = path.join(__dirname, '..', 'commands');
    return fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')).length;
  } catch (error) {
    console.error('Error counting commands:', error);
    return 0;
  }
}

/**
 * Get log file information
 * @returns {Array} Array of log file objects
 */
function getLogFiles() {
  try {
    const logsPath = path.join(__dirname, '..', 'logs');
    
    if (!fs.existsSync(logsPath)) {
      return [];
    }
    
    return fs.readdirSync(logsPath)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsPath, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          size: formatBytes(stats.size),
          sizeBytes: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.modified - a.modified);
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