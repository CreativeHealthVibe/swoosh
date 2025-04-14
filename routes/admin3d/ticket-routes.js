/**
 * Admin3D Ticket Management Routes
 * Handles routes for the ticket management interface
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../middlewares/auth');

/**
 * GET /admin3d/tickets
 * Ticket management interface
 */
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  const client = req.app.get('client');
  
  // Check if ticket manager is available
  const ticketManagerAvailable = client && client.ticketManager;
  
  // Get guilds if client is available
  let guilds = [];
  if (client) {
    guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL({ format: 'png', dynamic: true, size: 128 }) || null
    }));
  }
  
  // Get the selected server ID from query params if any
  const selectedServer = req.query.server || '';
  
  // Render ticket management page
  res.render('admin3d/tickets', {
    title: 'Ticket Management | SWOOSH Bot',
    user: req.user,
    client,
    ticketManagerAvailable,
    guilds,
    selectedServer, // Pass selected server ID to template
    query: req.query, // Pass query parameters to the template
    layout: 'layouts/admin3d'
  });
});

module.exports = router;