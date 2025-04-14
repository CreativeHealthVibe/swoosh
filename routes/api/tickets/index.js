/**
 * Ticket API Routes
 * Main router for ticket-related API endpoints
 */

const express = require('express');
const router = express.Router();

// Import ticket route modules
const setupRouter = require('./setup');

// Register ticket routes
router.use('/setup', setupRouter);

module.exports = router;