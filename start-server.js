// Custom server startup script for SWOOSH Bot
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const flash = require('express-flash');
const expressLayouts = require('express-ejs-layouts');
const WebSocket = require('ws');
const http = require('http');
const os = require('os');
const osUtils = require('os-utils');
const config = require('./config');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'website', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'website', 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));
app.use('/transcripts', express.static(path.join(__dirname, 'transcripts')));

// Set up session
app.use(session({
  secret: config.website.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: config.website.sessionExpiry }
}));

// Set up flash messages
app.use(flash());

// Set up Passport
app.use(passport.initialize());
app.use(passport.session());

// Import authentication routes but don't use them in this simplified server
const authRoutes = require('./routes/auth');

// Serve the welcome page directly
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
    
    // Try the perfect welcome page
    res.render('admin/welcome-perfect', {
      title: 'Dashboard | SWOOSH Bot',
      greeting: `${greeting}`,
      user: { 
        username: 'Admin User',
        avatar: null
      },
      path: '/admin/welcome',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering welcome page:', error);
    res.status(500).send('An error occurred while rendering the welcome page.');
  }
});

// Serve static welcome page directly
app.get('/admin/welcome-perfect', (req, res) => {
  try {
    res.render('admin/welcome-perfect', {
      title: 'Dashboard | SWOOSH Bot',
      greeting: 'Good Day',
      user: { 
        username: 'Admin User',
        avatar: null
      },
      path: '/admin/welcome',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering welcome page:', error);
    res.status(500).send('An error occurred while rendering the welcome page.');
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
  
  // Send initial mock stats
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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SWOOSH Bot welcome page preview server running on port ${PORT}`);
});