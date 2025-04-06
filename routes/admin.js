const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const blacklistManager = require('../handlers/blacklistManager');

// Helper function to get appropriate greeting based on time of day
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

// Protect all admin routes with isAdmin middleware
router.use(isAdmin);

/**
 * GET /admin
 * Root admin route - redirects to welcome page
 */
router.get('/', (req, res) => {
  res.redirect('/admin/welcome');
});

/**
 * GET /admin/dashboard
 * Admin dashboard home
 */
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard | SWOOSH Bot',
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/blacklist
 * Blacklist management
 */
router.get('/blacklist', (req, res) => {
  const blacklistedUsers = blacklistManager.getBlacklist();
  
  res.render('admin/blacklist', {
    title: 'Blacklist Management | SWOOSH Bot',
    blacklistedUsers,
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * POST /admin/blacklist/add
 * Add a user to blacklist
 */
router.post('/blacklist/add', (req, res) => {
  const { userId, username, reason } = req.body;
  
  if (!userId || !username || !reason) {
    req.flash('error', 'User ID, username, and reason are required');
    return res.redirect('/admin/blacklist');
  }
  
  const result = blacklistManager.addToBlacklist(
    userId,
    username,
    reason,
    req.user.id,
    req.user.username
  );
  
  if (result.success) {
    req.flash('success', `User ${username} has been blacklisted`);
  } else {
    req.flash('error', result.message || 'Failed to blacklist user');
  }
  
  res.redirect('/admin/blacklist');
});

/**
 * POST /admin/blacklist/remove
 * Remove a user from blacklist
 */
router.post('/blacklist/remove', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    req.flash('error', 'User ID is required');
    return res.redirect('/admin/blacklist');
  }
  
  const result = blacklistManager.removeFromBlacklist(userId);
  
  if (result.success) {
    req.flash('success', 'User has been removed from blacklist');
  } else {
    req.flash('error', result.message || 'Failed to remove user from blacklist');
  }
  
  res.redirect('/admin/blacklist');
});

/**
 * GET /admin/settings
 * Bot settings
 */
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    title: 'Bot Settings | SWOOSH Bot',
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/logs
 * View bot logs
 */
router.get('/logs', (req, res) => {
  const logsDir = path.join(__dirname, '../logs');
  
  // Get list of log files
  let logFiles = [];
  try {
    logFiles = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: `/admin/logs/${file}`,
        size: fs.statSync(path.join(logsDir, file)).size,
        mtime: fs.statSync(path.join(logsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
  } catch (error) {
    console.error('Error reading log directory:', error);
  }
  
  res.render('admin/logs', {
    title: 'Bot Logs | SWOOSH Bot',
    logFiles,
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/logs/:filename
 * View specific log file
 */
router.get('/logs/:filename', (req, res) => {
  const filename = req.params.filename;
  const logPath = path.join(__dirname, '../logs', filename);
  
  if (!filename.endsWith('.log')) {
    req.flash('error', 'Invalid log file');
    return res.redirect('/admin/logs');
  }
  
  // Check if file exists
  if (!fs.existsSync(logPath)) {
    req.flash('error', 'Log file not found');
    return res.redirect('/admin/logs');
  }
  
  // Read log file
  let logContent = '';
  try {
    logContent = fs.readFileSync(logPath, 'utf8');
    
    // Format log entries
    logContent = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          const parts = line.split(' - ');
          if (parts.length >= 3) {
            const timestamp = parts[0];
            const level = parts[1];
            const message = parts.slice(2).join(' - ');
            
            let levelClass = '';
            switch (level.trim()) {
              case 'ERROR':
                levelClass = 'log-error';
                break;
              case 'WARN':
                levelClass = 'log-warn';
                break;
              case 'INFO':
                levelClass = 'log-info';
                break;
              case 'DEBUG':
                levelClass = 'log-debug';
                break;
              default:
                levelClass = '';
            }
            
            return {
              timestamp,
              level,
              message,
              levelClass
            };
          }
          return { raw: line };
        } catch (e) {
          return { raw: line };
        }
      });
  } catch (error) {
    console.error('Error reading log file:', error);
    req.flash('error', 'Failed to read log file');
    return res.redirect('/admin/logs');
  }
  
  res.render('admin/log-viewer', {
    title: `${filename} | SWOOSH Bot Logs`,
    filename,
    logContent,
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/stats
 * Detailed statistics
 */
router.get('/stats', (req, res) => {
  res.render('admin/stats', {
    title: 'Statistics | SWOOSH Bot',
    user: req.user,
    layout: 'layouts/admin'
  });
});

/**
 * GET /admin/welcome
 * Welcome page with time-based greeting
 */
router.get('/welcome', (req, res) => {
  const greeting = getTimeBasedGreeting();
  const username = req.user.username || 'Admin';
  
  res.render('admin/welcome', {
    title: 'Welcome | SWOOSH Bot',
    greeting: `${greeting}`,
    user: req.user,
    layout: 'layouts/admin'
  });
});

module.exports = router;
