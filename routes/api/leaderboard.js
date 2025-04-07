/**
 * Leaderboard API Routes
 * Handles leaderboard data for top servers
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');

/**
 * GET /api/leaderboard/top-servers
 * Get top 5 servers by member count
 */
router.get('/top-servers', async (req, res) => {
  try {
    const client = req.app.get('client');
    
    if (!client || !client.guilds) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    // Get all guilds that the bot is in
    const guilds = Array.from(client.guilds.cache.values());
    
    // Filter out any guilds that might promote NSFW or prohibited content
    // For example: Check for specific keywords in their name or description
    const filteredGuilds = guilds.filter(guild => {
      const name = guild.name.toLowerCase();
      // Filter out servers with NSFW indicators in their names
      const nsfwKeywords = ['nsfw', 'adult', '18+', 'xxx', 'porn'];
      return !nsfwKeywords.some(keyword => name.includes(keyword));
    });
    
    // Sort by member count (descending order)
    const sortedGuilds = filteredGuilds.sort((a, b) => 
      b.memberCount - a.memberCount
    );
    
    // Get top 5 guilds
    const topGuilds = sortedGuilds.slice(0, 5);
    
    // Format the server data for the leaderboard
    const servers = topGuilds.map(guild => {
      // Format guild icon URL or use null if no icon is available
      let iconUrl = null;
      if (guild.icon) {
        iconUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
      }
      
      return {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        icon: iconUrl,
        // Don't include invite links for security and privacy
        // Users should get invites directly from the server owners
      };
    });
    
    // Return the server data
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      servers
    });
  } catch (error) {
    console.error('Error fetching top servers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch server data'
    });
  }
});

module.exports = router;