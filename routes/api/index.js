/**
 * API Routes Index
 * Main entry point for all API routes
 */
const express = require('express');
const router = express.Router();

// Import API versions
const apiV2 = require('./v2/index');

// Use API routes with versioning
router.use('/v2', apiV2);

// API root - show versions and status
router.get('/', (req, res) => {
  res.json({
    name: 'SWOOSH Bot API',
    versions: {
      v2: {
        status: 'active',
        url: '/api/v2'
      }
    }
  });
});

module.exports = router;