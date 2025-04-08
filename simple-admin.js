// Simple admin router for debugging
const express = require('express');
const router = express.Router();

// Simple root route
router.get('/', (req, res) => {
  res.send('Admin home page');
});

// Simple settings route
router.get('/settings', (req, res) => {
  res.send('Admin settings page');
});

// Simple welcome route
router.get('/welcome', (req, res) => {
  res.send('Admin welcome page');
});

// Catch-all route should be LAST
router.get('*', (req, res) => {
  res.status(404).send('404 - Admin page not found');
});

module.exports = router;