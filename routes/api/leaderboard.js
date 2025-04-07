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
    // Also filter out specific server names that should be excluded
    const filteredGuilds = guilds.filter(guild => {
      const name = guild.name.toLowerCase();
      
      // Filter out servers with NSFW indicators in their names
      const nsfwKeywords = ['nsfw', 'adult', '18+', 'xxx', 'porn'];
      
      // Exclude specific servers by name
      const excludedServers = ['SWOOSH BOT CONFI', '/least'];
      
      // Return true only if the server doesn't have NSFW keywords and is not in excluded list
      return !nsfwKeywords.some(keyword => name.includes(keyword)) && 
             !excludedServers.includes(guild.name);
    });
    
    // Sort by member count (descending order)
    const sortedGuilds = filteredGuilds.sort((a, b) => 
      b.memberCount - a.memberCount
    );
    
    // Get top 5 guilds
    const topGuilds = sortedGuilds.slice(0, 5);
    
    // Format the server data for the leaderboard
    const servers = await Promise.all(topGuilds.map(async guild => {
      // Format guild icon URL or use null if no icon is available
      let iconUrl = null;
      if (guild.icon) {
        iconUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
      }
      
      // Try to get an invite for the guild
      let inviteUrl = null;
      try {
        // Try to find the system or general channel first
        let channel = guild.channels.cache.find(
          c => c.name.toLowerCase().includes('general') && 
               c.type === 0 && // 0 is text channel
               c.permissionsFor(client.user).has(["CreateInstantInvite"])
        );
        
        // If no general channel, try any text channel
        if (!channel) {
          channel = guild.channels.cache.find(
            c => c.type === 0 && 
                 c.permissionsFor(client.user).has(["CreateInstantInvite"])
          );
        }
        
        // If we found a suitable channel, create an invite
        if (channel) {
          const invite = await channel.createInvite({
            maxAge: 86400, // 24 hours
            maxUses: 0, // unlimited uses
            unique: false
          });
          inviteUrl = invite.url;
        }
      } catch (error) {
        console.error(`Could not create invite for ${guild.name}:`, error);
        // Don't throw error, just continue without an invite
      }
      
      return {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        icon: iconUrl,
        inviteUrl: inviteUrl
      };
    }));
    
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