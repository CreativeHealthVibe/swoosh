/**
 * API v2 Routes
 * API endpoints for the version 2 of the SWOOSH Bot API
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../middlewares/auth');

// Import route modules
const ticketRoutes = require('./ticket-routes');

// Apply basic authentication middleware to all routes
router.use(isAuthenticated);

// Use ticket routes
router.use('/', ticketRoutes);

// GET /api/v2/info
// Basic API info
router.get('/info', (req, res) => {
  res.json({
    success: true,
    api: {
      name: 'SWOOSH Bot API',
      version: 'v2',
      status: 'active'
    }
  });
});

module.exports = router;