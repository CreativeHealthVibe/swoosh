// Fixed version of index.js with corrected Express setup
require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const WebSocket = require('ws');
const http = require('http');
const os = require('os');
const osUtils = require('os-utils');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'website', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/admin');

// Middleware
app.use(express.static(path.join(__dirname, 'website', 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Create a mock user
const mockUser = {
  id: '123456789012345678',
  username: 'Admin',
  avatar: null
};

// Root route - redirect to welcome
app.get('/', (req, res) => {
  res.redirect('/admin/welcome');
});

// Serve the welcome page
app.get('/admin/welcome', (req, res) => {
  try {
    // Get time of day for greeting
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 18) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }
    
    res.render('admin/welcome-perfect', {
      title: 'Dashboard | SWOOSH Bot',
      greeting: `${greeting}`,
      user: mockUser,
      path: '/admin/welcome',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering welcome page:', error);
    res.status(500).send('An error occurred while rendering the welcome page: ' + error.message);
  }
});

// Add user management page
app.get('/admin/users', (req, res) => {
  try {
    res.render('admin/user-management-enhanced', {
      title: 'User Management | SWOOSH Bot',
      user: mockUser,
      path: '/admin/users',
      layout: 'layouts/admin',
      users: [
        { id: '123456789', username: 'User1', roles: ['Admin'], lastActive: '2 hours ago' },
        { id: '987654321', username: 'User2', roles: ['Moderator'], lastActive: '1 day ago' },
        { id: '456789123', username: 'User3', roles: ['Member'], lastActive: '5 minutes ago' }
      ]
    });
  } catch (error) {
    console.error('Error rendering users page:', error);
    res.status(500).send('An error occurred: ' + error.message);
  }
});

// Add logs page
app.get('/admin/logs', (req, res) => {
  try {
    res.render('admin/logs-enhanced', {
      title: 'Logs | SWOOSH Bot',
      user: mockUser,
      path: '/admin/logs',
      layout: 'layouts/admin',
      logs: [
        { timestamp: new Date(), level: 'info', message: 'Bot started successfully', user: 'System' },
        { timestamp: new Date(Date.now() - 3600000), level: 'warning', message: 'High memory usage detected', user: 'System' },
        { timestamp: new Date(Date.now() - 7200000), level: 'error', message: 'Failed to connect to Discord API', user: 'System' }
      ]
    });
  } catch (error) {
    console.error('Error rendering logs page:', error);
    res.status(500).send('An error occurred: ' + error.message);
  }
});

// Add settings page
app.get('/admin/settings', (req, res) => {
  try {
    res.render('admin/settings-enhanced', {
      title: 'Settings | SWOOSH Bot',
      user: mockUser,
      path: '/admin/settings',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering settings page:', error);
    res.status(500).send('An error occurred: ' + error.message);
  }
});

// Handle 404s
app.use((req, res) => {
  try {
    res.status(404).render('error/404-enhanced', { 
      title: '404 - Page Not Found | SWOOSH Bot',
      user: mockUser, 
      path: req.path,
      layout: 'layouts/admin' 
    });
  } catch (error) {
    res.status(404).send('404 - Page Not Found');
  }
});

// Create WebSocket server for realtime updates
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Welcome to SWOOSH Bot WebSocket server'
  }));
  
  // Send initial stats
  sendServerStats(ws);
  
  // Set up interval to send stats updates
  const statsInterval = setInterval(() => {
    sendServerStats(ws);
  }, 5000);
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: data.timestamp || new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(statsInterval);
  });
});

// Function to send server stats to WebSocket client
function sendServerStats(ws) {
  osUtils.cpuUsage((cpuPercent) => {
    const stats = {
      type: 'stats',
      servers: Math.floor(Math.random() * 100) + 500,
      users: Math.floor(Math.random() * 10000) + 50000,
      cpu: Math.round(cpuPercent * 100),
      memory: Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100),
      uptime: Math.floor(process.uptime()),
      
      // System information
      nodeVersion: process.version,
      discordVersion: '14.11.0',
      os: `${os.type()} ${os.release()}`,
      channels: Math.floor(Math.random() * 1000) + 3000,
      commands: 42,
      
      // Sample command usage data
      commandUsage: {
        'help': Math.floor(Math.random() * 100) + 200,
        'ban': Math.floor(Math.random() * 50) + 30,
        'kick': Math.floor(Math.random() * 40) + 20,
        'mute': Math.floor(Math.random() * 30) + 15,
        'purge': Math.floor(Math.random() * 20) + 40,
        'ticket': Math.floor(Math.random() * 60) + 100,
        'afk': Math.floor(Math.random() * 30) + 50
      },
      
      // Sample recent activity
      recentActivity: [
        {
          type: 'info',
          icon: 'info-circle',
          message: 'Bot started successfully',
          time: '2 minutes ago'
        },
        {
          type: 'green',
          icon: 'user-check',
          message: 'New user joined server',
          time: '5 minutes ago'
        },
        {
          type: 'amber',
          icon: 'exclamation-circle',
          message: 'Warning: High CPU usage detected',
          time: '10 minutes ago'
        },
        {
          type: 'red',
          icon: 'times-circle',
          message: 'Error connecting to Discord API',
          time: '15 minutes ago'
        },
        {
          type: 'info',
          icon: 'cog',
          message: 'Settings updated by admin',
          time: '20 minutes ago'
        }
      ]
    };
    
    ws.send(JSON.stringify(stats));
  });
}

// Function to get uptime in human-readable format
function getBotUptime() {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  let uptimeString = '';
  if (days > 0) uptimeString += `${days}d `;
  if (hours > 0) uptimeString += `${hours}h `;
  if (minutes > 0) uptimeString += `${minutes}m `;
  uptimeString += `${seconds}s`;
  
  return uptimeString;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SWOOSH Bot Admin Dashboard running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/admin/welcome`);
});