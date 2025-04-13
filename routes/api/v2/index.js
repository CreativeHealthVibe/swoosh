/**
 * API v2 Routes Index
 * Central file for registering all API v2 routes
 */
const express = require('express');
const router = express.Router();
const { isAdmin, isAuthenticated } = require('../../../middlewares/auth');

// Import route handlers
const serverRoutes = require('./servers');
const ticketRoutes = require('./ticket-routes');

// Middleware for all API routes
router.use(isAuthenticated);

// Register routes
router.use('/servers', serverRoutes);
router.use('/', ticketRoutes);

// API Status check
router.get('/status', (req, res) => {
  const ticketManager = req.app.get('ticketManager');
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    ticketManagerAvailable: !!ticketManager
  });
});

module.exports = router;