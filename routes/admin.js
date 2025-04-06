/**
 * Admin dashboard routes
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const fs = require('fs');
const path = require('path');
const adminUtils = require('../utils/admin');
const blacklistManager = require('../handlers/blacklistManager');

// Apply admin auth middleware to all routes in this router
router.use(isAdmin);

// Admin dashboard home
router.get('/dashboard', (req, res) => {
  const systemStats = adminUtils.getSystemStats();
  const botStats = adminUtils.getBotStats(req.app.get('discordClient'));
  const logFiles = adminUtils.getLogFiles();
  
  res.render('admin/dashboard', {
    title: 'Admin Dashboard - SWOOSH Bot',
    systemStats,
    botStats,
    logFiles: logFiles.slice(0, 5) // Only send the 5 most recent log files
  });
});

// Blacklist management
router.get('/blacklist', (req, res) => {
  const blacklistedUsers = blacklistManager.getBlacklist();
  
  res.render('admin/blacklist', {
    title: 'Blacklist Management - SWOOSH Bot',
    blacklistedUsers
  });
});

// Log files
router.get('/logs', (req, res) => {
  const logFiles = adminUtils.getLogFiles();
  
  res.render('admin/logs', {
    title: 'Log Files - SWOOSH Bot',
    logFiles
  });
});

// View specific log file
router.get('/logs/view/:filename', (req, res) => {
  const { filename } = req.params;
  const logsDir = path.join(__dirname, '..', 'logs');
  const filePath = path.join(logsDir, filename);
  
  // Security check - prevent path traversal attacks
  if (!filename.match(/^[a-zA-Z0-9_.-]+\.log$/)) {
    return res.status(400).render('errors/404', {
      title: 'File Not Found',
      message: 'Invalid log file name'
    });
  }
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const logLines = fileContent.split('\n').filter(line => line.trim());
      
      res.render('admin/logs-view', {
        title: `Log: ${filename} - SWOOSH Bot`,
        filename,
        logLines
      });
    } else {
      res.status(404).render('errors/404', {
        title: 'File Not Found',
        message: 'The requested log file does not exist'
      });
    }
  } catch (error) {
    console.error(`Error reading log file: ${error.message}`);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while reading the log file'
    });
  }
});

// Add more admin routes as needed (settings, statistics, etc.)
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    title: 'Bot Settings - SWOOSH Bot'
  });
});

router.get('/stats', (req, res) => {
  res.render('admin/stats', {
    title: 'Statistics - SWOOSH Bot'
  });
});

module.exports = router;
