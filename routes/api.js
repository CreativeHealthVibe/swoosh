// API routes for admin dashboard
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');
const adminUtils = require('../utils/admin');
const config = require('../config');

// Apply admin middleware to all routes
router.use(isAdmin);

// Middleware to parse JSON body
router.use(express.json());

// Get server statistics
router.get('/stats', (req, res) => {
  try {
    const client = req.app.locals.client;
    const systemStats = adminUtils.getSystemStats();
    const botStats = adminUtils.getBotStats(client);
    
    res.json({
      success: true,
      system: systemStats,
      bot: botStats
    });
  } catch (error) {
    console.error('API stats error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching statistics'
    });
  }
});

// Blacklist management
router.post('/blacklist/add', (req, res) => {
  try {
    const { userId, username, reason } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID and reason are required'
      });
    }
    
    const result = blacklistManager.addToBlacklist(
      userId,
      username || 'Unknown',
      reason,
      req.user.id,
      req.user.username + '#' + (req.user.discriminator || '0000')
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User added to blacklist successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('API blacklist/add error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding user to blacklist'
    });
  }
});

router.post('/blacklist/remove', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = blacklistManager.removeFromBlacklist(userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User removed from blacklist successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('API blacklist/remove error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while removing user from blacklist'
    });
  }
});

// Settings management
router.post('/settings/:section', (req, res) => {
  try {
    const { section } = req.params;
    const settingsData = req.body;
    
    // Validate section
    const validSections = ['general', 'ticket', 'logging', 'admin'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }
    
    // TODO: Update config file or database with new settings
    // For now, just return success
    
    res.json({
      success: true,
      message: `${section} settings updated successfully`
    });
  } catch (error) {
    console.error(`API settings/${req.params.section} error:`, error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating settings'
    });
  }
});

// Log files management
router.get('/logs', (req, res) => {
  try {
    const logFiles = adminUtils.getLogFiles();
    
    res.json({
      success: true,
      logs: logFiles
    });
  } catch (error) {
    console.error('API logs error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching log files'
    });
  }
});

router.get('/logs/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const logsDir = path.join(__dirname, '..', 'logs');
    const filePath = path.join(logsDir, filename);
    
    // Security check: ensure the file exists and is a .log file
    if (!fs.existsSync(filePath) || !filename.endsWith('.log')) {
      return res.status(404).json({
        success: false,
        message: 'Log file not found'
      });
    }
    
    // Send the file for download
    res.download(filePath, filename);
  } catch (error) {
    console.error('API logs/download error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while downloading the log file'
    });
  }
});

router.get('/logs/download-all', (req, res) => {
  try {
    // TODO: Create zip archive of all logs and send for download
    // For now, just return a message
    
    res.json({
      success: false,
      message: 'Bulk download not implemented yet'
    });
  } catch (error) {
    console.error('API logs/download-all error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the logs archive'
    });
  }
});

module.exports = router;