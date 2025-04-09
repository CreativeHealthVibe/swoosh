/**
 * API Routes for Moderation Tools
 * Provides API endpoints for accessing moderation tools and logs
 */

const express = require('express');
const router = express.Router();
const banLogger = require('../modules/ban-logger');
const logParser = require('../modules/log-parser');
const { isAuthenticated } = require('../middlewares/auth');
const { client } = require('../index');

// Get bans for a specific guild/server
router.get('/bans/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Check if user has access to this guild
    if (!req.user || !req.user.guilds) {
      return res.status(403).json({ error: 'Unauthorized: You do not have access to this guild' });
    }
    
    // Find the guild in user's guilds
    const userGuild = req.user.guilds.find(g => g.id === guildId);
    if (!userGuild) {
      return res.status(403).json({ error: 'Unauthorized: Guild not found in your server list' });
    }
    
    // Check if user has admin or manager permissions in the guild
    const hasPermission = (parseInt(userGuild.permissions) & 0x8) === 0x8 || // ADMINISTRATOR
                          (parseInt(userGuild.permissions) & 0x4) === 0x4;  // BAN_MEMBERS
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Unauthorized: Insufficient permissions to view bans' });
    }
    
    // Get ban data from Discord API
    let bans = [];
    try {
      // Check if bot has access to this guild
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found. Bot may not be in this server.' });
      }
      
      // Fetch bans from the Discord API
      const banList = await guild.bans.fetch();
      
      // Convert ban collection to array
      banList.forEach(ban => {
        bans.push({
          user: {
            id: ban.user.id,
            username: ban.user.username,
            discriminator: ban.user.discriminator,
            tag: ban.user.tag,
            avatar: ban.user.displayAvatarURL({ dynamic: true })
          },
          reason: ban.reason || 'No reason provided',
          date: null,
          executor: null
        });
      });
      
      // Enhance with log data if available
      const logData = banLogger.getBanLogs(guildId);
      if (logData && logData.length > 0) {
        // Find and match log entries with ban entries
        bans.forEach(ban => {
          const logEntry = logData.find(entry => 
            entry.eventType === 'User Banned' && 
            entry.user && 
            entry.user.id === ban.user.id
          );
          
          if (logEntry) {
            ban.date = logEntry.date;
            if (logEntry.executor) {
              ban.executor = {
                id: logEntry.executor.id,
                username: logEntry.executor.username || logEntry.executor.name,
                discriminator: logEntry.executor.discriminator
              };
            }
            if (logEntry.details && logEntry.details.reason) {
              ban.reason = logEntry.details.reason;
            }
          }
        });
      }
      
      // Sort bans by date (newest first)
      bans.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
      });
      
    } catch (error) {
      console.error('Error fetching bans from Discord API:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch ban list from Discord',
        message: error.message
      });
    }
    
    res.json({ bans });
    
  } catch (error) {
    console.error('API Error - Get Bans:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get moderation actions for a specific user
router.get('/user-logs/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user has appropriate permissions
    if (!req.user || !req.user.guilds) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get moderation logs for user
    const userLogs = banLogger.getUserModLogs(userId);
    
    // Format the logs for API response
    const formattedLogs = userLogs.map(log => {
      return {
        timestamp: log.timestamp,
        date: log.date,
        type: log.eventType,
        executor: log.executor ? {
          id: log.executor.id,
          username: log.executor.username || log.executor.name,
          discriminator: log.executor.discriminator
        } : null,
        details: log.details
      };
    });
    
    res.json({ logs: formattedLogs });
    
  } catch (error) {
    console.error('API Error - Get User Logs:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get all moderation logs for a specific guild
router.get('/mod-logs/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Check if user has access to this guild
    if (!req.user || !req.user.guilds) {
      return res.status(403).json({ error: 'Unauthorized: You do not have access to this guild' });
    }
    
    // Find the guild in user's guilds
    const userGuild = req.user.guilds.find(g => g.id === guildId);
    if (!userGuild) {
      return res.status(403).json({ error: 'Unauthorized: Guild not found in your server list' });
    }
    
    // Check if user has admin permissions in the guild
    const hasPermission = (parseInt(userGuild.permissions) & 0x8) === 0x8; // ADMINISTRATOR
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Unauthorized: Admin permissions required to view mod logs' });
    }
    
    // Get and format logs
    let logs = [];
    
    try {
      // Check for guild-specific log file
      const fs = require('fs');
      const path = require('path');
      const modLogPath = path.join(__dirname, '../logs', `mod-log-${guildId}.txt`);
      const banLogPath = path.join(__dirname, '../logs', `ban-log-${guildId}.txt`);
      
      // Process guild-specific mod log
      if (fs.existsSync(modLogPath)) {
        const modLogs = logParser.parseLogFile(modLogPath);
        logs = [...logs, ...modLogs];
      }
      
      // Process guild-specific ban log
      if (fs.existsSync(banLogPath)) {
        const banLogs = logParser.parseLogFile(banLogPath);
        logs = [...logs, ...banLogs];
      }
      
      // Sort logs by date (newest first)
      logs.sort((a, b) => b.date - a.date);
      
    } catch (error) {
      console.error('Error reading log files:', error);
      return res.status(500).json({ 
        error: 'Failed to process log files',
        message: error.message
      });
    }
    
    // Format the logs for API response
    const formattedLogs = logs.map(log => {
      return {
        timestamp: log.timestamp,
        date: log.date,
        type: log.eventType,
        user: log.user && log.user.id ? {
          id: log.user.id,
          username: log.user.username || log.user.name,
          discriminator: log.user.discriminator
        } : null,
        executor: log.executor && log.executor.id ? {
          id: log.executor.id,
          username: log.executor.username || log.executor.name,
          discriminator: log.executor.discriminator
        } : null,
        details: log.details
      };
    });
    
    res.json({ logs: formattedLogs });
    
  } catch (error) {
    console.error('API Error - Get Mod Logs:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;