// Debug file to help identify route issues
const express = require('express');
const router = express.Router();

// Test simple routes
router.get('/test', (req, res) => {
  res.send('Basic route test works');
});

// Export the router
module.exports = router;