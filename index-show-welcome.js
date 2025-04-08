// Dedicated script to show the welcome page
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

// Serve static files
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
    
    res.render('admin/welcome-perfect', {
      title: 'Dashboard | SWOOSH Bot',
      greeting: `${greeting}`,
      user: mockUser,
      path: '/admin/welcome',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Error rendering perfect welcome page:', error);
    
    // Try the backup versions
    try {
      console.log('Trying final-fix version...');
      res.render('admin/welcome-final-fix', {
        title: 'Dashboard | SWOOSH Bot',
        greeting: `${greeting}`,
        user: mockUser,
        path: '/admin/welcome',
        layout: 'layouts/admin'
      });
    } catch (fixError) {
      console.error('Error rendering final-fix welcome page:', fixError);
      res.status(500).send('Failed to render welcome page. Error: ' + error.message);
    }
  }
});

// Handle 404s
app.use((req, res) => {
  try {
    res.status(404).render('error/404-enhanced', { 
      user: mockUser, 
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
  console.log(`=== SWOOSH Bot Welcome Page Preview ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Open in your browser at http://localhost:${PORT}/admin/welcome`);
  console.log(`=======================================`);
});