/**
 * Leaderboard Routes
 * Handles the leaderboard page for top Discord servers
 */

const express = require('express');
const router = express.Router();

/**
 * GET /leaderboard
 * Display the server leaderboard page
 */
router.get('/', (req, res) => {
  res.render('leaderboard', {
    title: 'Server Leaderboard | SWOOSH Bot',
    description: 'Check out the top Discord servers using SWOOSH Bot, ranked by member count.',
    user: req.user || null
  });
});

module.exports = router;