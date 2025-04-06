// Admin routes
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');
const adminUtils = require('../utils/admin');

// Apply admin middleware to all routes
router.use(isAdmin);

// Admin dashboard
router.get('/dashboard', (req, res) => {
  try {
    const client = req.app.locals.client;
    
    // Get system and bot stats
    const systemStats = adminUtils.getSystemStats();
    const botStats = adminUtils.getBotStats(client);
    const logFiles = adminUtils.getLogFiles().slice(0, 5); // Get latest 5 logs
    
    // Render the admin dashboard
    res.render('admin/dashboard', {
      title: 'SWOOSH Bot - Admin Dashboard',
      user: req.user,
      systemStats,
      botStats,
      logFiles,
      activeNav: 'admin-dashboard'
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while loading the admin dashboard.'
    });
  }
});

// Blacklist management
router.get('/blacklist', (req, res) => {
  try {
    const blacklistedUsers = blacklistManager.getBlacklist();
    
    res.render('admin/blacklist', {
      title: 'SWOOSH Bot - Blacklist Management',
      user: req.user,
      blacklistedUsers,
      activeNav: 'admin-blacklist'
    });
  } catch (error) {
    console.error('Admin blacklist error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while loading the blacklist.'
    });
  }
});

// Settings management
router.get('/settings', (req, res) => {
  try {
    const client = req.app.locals.client;
    
    res.render('admin/settings', {
      title: 'SWOOSH Bot - Settings',
      user: req.user,
      activeNav: 'admin-settings'
    });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while loading the settings.'
    });
  }
});

// Bot statistics
router.get('/stats', (req, res) => {
  try {
    const client = req.app.locals.client;
    
    res.render('admin/stats', {
      title: 'SWOOSH Bot - Statistics',
      user: req.user,
      client: client,
      activeNav: 'admin-stats'
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while loading the statistics.'
    });
  }
});

// Log viewer
router.get('/logs', (req, res) => {
  try {
    const logFiles = adminUtils.getLogFiles();
    
    res.render('admin/logs', {
      title: 'SWOOSH Bot - Logs',
      user: req.user,
      logFiles,
      activeNav: 'admin-logs'
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while loading the logs.'
    });
  }
});

// View specific log file
router.get('/logs/view/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const logsDir = path.join(__dirname, '..', 'logs');
    const filePath = path.join(logsDir, filename);
    
    // Security check: ensure the file exists and is a .log file
    if (!fs.existsSync(filePath) || !filename.endsWith('.log')) {
      return res.status(404).render('errors/404', {
        title: 'File Not Found',
        message: 'The requested log file does not exist.'
      });
    }
    
    // Read log content
    const logContent = fs.readFileSync(filePath, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim() !== '');
    
    res.render('admin/logs-view', {
      title: `SWOOSH Bot - Logs - ${filename}`,
      user: req.user,
      filename,
      logLines,
      activeNav: 'admin-logs'
    });
  } catch (error) {
    console.error('Admin log view error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An error occurred while loading the log file.'
    });
  }
});

module.exports = router;