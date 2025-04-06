/**
 * API routes for the admin dashboard
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');

// API authentication middleware
router.use(isAdmin);

// Add a user to the blacklist
router.post('/blacklist/add', (req, res) => {
  const { userId, username, reason } = req.body;
  
  if (!userId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'User ID and reason are required'
    });
  }
  
  const result = blacklistManager.addToBlacklist(
    userId,
    username || 'Unknown User',
    reason,
    req.user.id,
    req.user.username
  );
  
  if (result.success) {
    return res.json({
      success: true,
      message: `User ${userId} has been added to the blacklist`,
      user: result.user
    });
  } else {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

// Remove a user from the blacklist
router.post('/blacklist/remove', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  const result = blacklistManager.removeFromBlacklist(userId);
  
  if (result.success) {
    return res.json({
      success: true,
      message: `User ${userId} has been removed from the blacklist`
    });
  } else {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

// Get the blacklist
router.get('/blacklist', (req, res) => {
  const blacklistedUsers = blacklistManager.getBlacklist();
  
  res.json({
    success: true,
    blacklist: blacklistedUsers
  });
});

// Log file operations
// Download a log file
router.get('/logs/download/:filename', (req, res) => {
  const { filename } = req.params;
  const logsDir = path.join(__dirname, '..', 'logs');
  const filePath = path.join(logsDir, filename);
  
  // Security check - prevent path traversal attacks
  if (!filename.match(/^[a-zA-Z0-9_.-]+\.log$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid log file name'
    });
  }
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Log file not found'
    });
  }
});

// Download all log files as a zip
router.get('/logs/download-all', (req, res) => {
  const logsDir = path.join(__dirname, '..', 'logs');
  const zipFilename = `swoosh-logs-${Date.now()}.zip`;
  
  if (!fs.existsSync(logsDir)) {
    return res.status(404).json({
      success: false,
      message: 'No log files found'
    });
  }
  
  // Set up zip file
  res.attachment(zipFilename);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  // Pipe archive to the response
  archive.pipe(res);
  
  // Add log files to the archive
  const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
  
  logFiles.forEach(file => {
    const filePath = path.join(logsDir, file);
    archive.file(filePath, { name: file });
  });
  
  archive.finalize();
});

// Bot control endpoints
router.post('/bot/restart', (req, res) => {
  const client = req.app.get('discordClient');
  
  if (!client) {
    return res.status(500).json({
      success: false,
      message: 'Bot client not available'
    });
  }
  
  try {
    // Implement restart logic here, or integrate with the desktop app's restart feature
    const electronWsServer = req.app.get('electronWsServer');
    
    if (electronWsServer) {
      electronWsServer.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({ action: 'restart-bot' }));
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Bot restart initiated'
    });
  } catch (error) {
    console.error('Error restarting bot:', error);
    res.status(500).json({
      success: false,
      message: `Failed to restart bot: ${error.message}`
    });
  }
});

router.post('/bot/stop', (req, res) => {
  const client = req.app.get('discordClient');
  
  if (!client) {
    return res.status(500).json({
      success: false,
      message: 'Bot client not available'
    });
  }
  
  try {
    // Implement stop logic here, or integrate with the desktop app's stop feature
    const electronWsServer = req.app.get('electronWsServer');
    
    if (electronWsServer) {
      electronWsServer.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({ action: 'stop-bot' }));
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Bot stop initiated'
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({
      success: false,
      message: `Failed to stop bot: ${error.message}`
    });
  }
});

module.exports = router;
