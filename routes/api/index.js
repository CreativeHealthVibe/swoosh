/**
 * API Routes Index
 * Central file for registering all API routes
 */
const express = require('express');
const router = express.Router();
const { isAdmin, isAuthenticated } = require('../../middlewares/auth');

// Import route handlers
const blacklistRoutes = require('./blacklist');
const rolesRoutes = require('./roles');

// Middleware for all API routes
router.use(isAuthenticated);

// Register routes
router.use('/blacklist', blacklistRoutes);
router.use('/', rolesRoutes); // Roles routes use server paths like /servers/:serverId/roles

// API Status check
router.get('/status', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Server Statistics
router.get('/stats', isAdmin, (req, res) => {
  const client = req.app.get('client');
  const os = require('os');
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  // Calculate uptime
  const uptime = process.uptime();
  const uptimeData = {
    total: uptime,
    days: Math.floor(uptime / 86400),
    hours: Math.floor((uptime % 86400) / 3600),
    minutes: Math.floor((uptime % 3600) / 60),
    seconds: Math.floor(uptime % 60)
  };
  
  // Get server stats
  const stats = {
    servers: client.guilds.cache.size,
    users: 0,
    channels: 0,
    commands: client.commands.size + client.slashCommands.size
  };
  
  // Calculate total users and channels
  client.guilds.cache.forEach(guild => {
    stats.users += guild.memberCount;
    stats.channels += guild.channels.cache.size;
  });
  
  // System stats
  const systemStats = {
    platform: os.platform(),
    arch: os.arch(),
    cpuCount: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    memoryUsage: process.memoryUsage()
  };
  
  res.json({
    success: true,
    uptime: uptimeData,
    system: systemStats,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Server list
router.get('/servers', isAdmin, (req, res) => {
  const client = req.app.get('client');
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  const servers = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    memberCount: guild.memberCount,
    icon: guild.iconURL({ dynamic: true }),
    owner: guild.ownerId,
    joined: guild.joinedAt
  }));
  
  res.json({
    success: true,
    count: servers.length,
    servers: servers
  });
});

// Get channels for a specific server
router.get('/servers/:serverId/channels', isAdmin, (req, res) => {
  const client = req.app.get('client');
  const { serverId } = req.params;
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Discord client not available'
    });
  }
  
  const guild = client.guilds.cache.get(serverId);
  
  if (!guild) {
    return res.status(404).json({
      success: false,
      message: 'Server not found'
    });
  }
  
  // Get text channels
  const textChannels = guild.channels.cache
    .filter(channel => channel.type === 0) // TextChannel type
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      type: 'text',
      parentId: channel.parentId,
      position: channel.position
    }));
  
  // Get categories
  const categories = guild.channels.cache
    .filter(channel => channel.type === 4) // CategoryChannel type
    .map(category => ({
      id: category.id,
      name: category.name,
      type: 'category',
      position: category.position
    }));
  
  res.json({
    success: true,
    serverId: serverId,
    serverName: guild.name,
    categories: categories,
    channels: textChannels
  });
});

module.exports = router;