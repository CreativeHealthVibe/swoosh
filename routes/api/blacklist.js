/**
 * Blacklist API Routes
 * Handles blacklist operations from the 3D admin panel
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const blacklistManager = require('../../handlers/blacklistManager');

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * GET /api/blacklist
 * Get all blacklisted users
 */
router.get('/', async (req, res) => {
  try {
    // Get blacklist entries from blacklistManager
    const blacklist = blacklistManager.getBlacklist();
    
    // Convert to array format for the frontend
    const entries = Object.entries(blacklist).map(([userId, entry]) => {
      return {
        userId,
        ...entry
      };
    });
    
    res.json({
      success: true,
      blacklist: entries
    });
  } catch (error) {
    console.error('Error getting blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blacklist: ' + error.message
    });
  }
});

/**
 * POST /api/blacklist
 * Add a user to the blacklist
 */
router.post('/', async (req, res) => {
  try {
    const { userId, reason, duration, level } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID and reason are required'
      });
    }
    
    // Convert duration string to milliseconds if not permanent
    let durationMs = null;
    if (duration && duration !== 'permanent') {
      durationMs = parseDuration(duration);
    }
    
    // Add to blacklist
    const result = blacklistManager.addToBlacklist(
      userId,
      req.user.id, // Admin ID
      reason,
      durationMs,
      level || 'commands'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User added to blacklist successfully',
        entry: result.entry
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to add user to blacklist'
      });
    }
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to blacklist: ' + error.message
    });
  }
});

/**
 * PUT /api/blacklist/:userId
 * Update a blacklist entry
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration, level } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    // Convert duration string to milliseconds if not permanent
    let durationMs = null;
    if (duration && duration !== 'permanent') {
      durationMs = parseDuration(duration);
    }
    
    // Update blacklist entry
    const result = blacklistManager.updateBlacklistEntry(
      userId,
      req.user.id, // Admin ID
      reason,
      durationMs,
      level || 'commands'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Blacklist entry updated successfully',
        entry: result.entry
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to update blacklist entry'
      });
    }
  } catch (error) {
    console.error('Error updating blacklist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blacklist entry: ' + error.message
    });
  }
});

/**
 * DELETE /api/blacklist/:userId
 * Remove a user from the blacklist
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Remove from blacklist
    const result = blacklistManager.removeFromBlacklist(
      userId,
      req.user.id, // Admin ID
      req.body.reason || 'Removed by admin'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User removed from blacklist successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to remove user from blacklist'
      });
    }
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from blacklist: ' + error.message
    });
  }
});

/**
 * GET /api/blacklist/history
 * Get blacklist history/logs
 */
router.get('/history', async (req, res) => {
  try {
    // Try to get history from blacklistManager
    const history = blacklistManager.getBlacklistHistory ? 
      blacklistManager.getBlacklistHistory() : 
      [];
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting blacklist history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blacklist history: ' + error.message
    });
  }
});

/**
 * Parse duration string to milliseconds
 * @param {string} duration - Duration string (e.g., "1h", "1d", "7d")
 * @returns {number} - Duration in milliseconds
 */
function parseDuration(duration) {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1));
  
  switch (unit) {
    case 'h': // Hours
      return value * 60 * 60 * 1000;
    case 'd': // Days
      return value * 24 * 60 * 60 * 1000;
    case 'w': // Weeks
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return 0; // Invalid unit
  }
}

module.exports = router;