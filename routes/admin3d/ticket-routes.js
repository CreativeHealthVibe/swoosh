/**
 * Admin3D Ticket Routes
 * Handles routes for the ticket management interface
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');

// Middleware for all admin routes
router.use(isAdmin);

// Tickets overview page
router.get('/', async (req, res) => {
  const client = req.app.get('client');
  const ticketManager = req.app.get('ticketManager');
  
  // Get user's guilds from session
  const guilds = req.user.guilds || [];
  
  // Filter guilds where user has admin permissions
  // Uses the MANAGE_GUILD permission (0x20) as a proxy for admin
  const adminGuilds = guilds.filter(guild => (guild.permissions & 0x20) === 0x20);

  // Add member count to each guild if available
  if (client) {
    for (const guild of adminGuilds) {
      try {
        const discordGuild = client.guilds.cache.get(guild.id);
        if (discordGuild) {
          guild.memberCount = discordGuild.memberCount;
        }
      } catch (error) {
        console.error(`Error getting member count for guild ${guild.id}:`, error);
      }
    }
  }
  
  res.render('admin3d/tickets', {
    title: 'Ticket Management',
    user: req.user,
    guilds: adminGuilds,
    ticketManagerAvailable: !!ticketManager,
    customCss: 'admin3d-tickets.css',
    customJs: 'admin3d-tickets.js',
    customTheme: 'darkTheme' // Ensure consistent dark theme
  });
});

module.exports = router;