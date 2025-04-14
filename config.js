// config.js - Bot configuration
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Guild configuration cache and utility functions
const guildConfigs = new Map();
const configDir = path.join(__dirname, 'data', 'configs');

// Ensure configs directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Utility functions for guild configuration
const getGuildConfig = (guildId) => {
  // Check cache first
  if (guildConfigs.has(guildId)) {
    return guildConfigs.get(guildId);
  }
  
  // Try to load from file
  const configPath = path.join(configDir, `${guildId}.json`);
  if (fs.existsSync(configPath)) {
    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      guildConfigs.set(guildId, configData);
      return configData;
    } catch (error) {
      console.error(`Error loading config for guild ${guildId}:`, error);
    }
  }
  
  return null;
};

const saveGuildConfig = (guildId, configData) => {
  // Update cache
  guildConfigs.set(guildId, configData);
  
  // Save to file
  const configPath = path.join(configDir, `${guildId}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving config for guild ${guildId}:`, error);
    return false;
  }
};

module.exports = {
  // Guild configuration utility functions
  getGuildConfig,
  saveGuildConfig,
  prefix: ".",
  embedColor: "#0099ff",
  ticketCategory: "SWOOSH | Tickets",
  logChannelId: "undefined",
  
  // Website and session settings
  website: {
    sessionSecret: process.env.SESSION_SECRET || 'swoosh-admin-dashboard-secret',
    sessionExpiry: 86400000, // 24 hours in milliseconds
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/swoosh',
    port: process.env.PORT || 3000,
    url: process.env.WEBSITE_URL || 'https://swooshfinal.onrender.com'
  },
  
  // Discord OAuth settings
  oauth: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'https://swooshfinal.onrender.com/auth/discord/callback',
    scopes: ['identify', 'email', 'guilds', 'connections', 'guilds.join']
  },
  
  // Specific logging channels
  loggingChannels: {
    deletedMessages: "1357714564946464808",
    ticketTranscripts: "1357714658248622192",
    commandUsage: "1357715073073938532",
    botStatus: "1357715278003441686"
  },
  
  // Admin User IDs with full system access
  adminUserIds: ["930131254106550333","1196042021488570391","506323791140356106"],
  
  // Ticket types and their configurations
  ticketTypes: {
  "CLAIM_BOUNTY": {
    "id": "claim_bounty",
    "label": "Claim Bounty",
    "emoji": "💰",
    "description": "Submit evidence to claim a bounty",
    "initialMessage": "Please provide a link to your evidence and the bounty you wish to claim."
  },
  "SET_BOUNTY": {
    "id": "set_bounty",
    "label": "Set Bounty",
    "emoji": "🎯",
    "description": "Set a new bounty on a player",
    "initialMessage": "Please use the /setbounty command to create a new bounty."
  },
  "CLAIM_XP_ROLE": {
    "id": "claim_xp_role",
    "label": "Claim XP",
    "emoji": "⭐",
    "description": "Discuss your XP and claim your role",
    "initialMessage": "Please provide details about your XP level and what you would like to discuss. Include any relevant screenshots if needed."
  },
  "GENERAL_SUPPORT": {
    "id": "general_support",
    "label": "General Support",
    "emoji": "❓",
    "description": "Get help with general inquiries",
    "initialMessage": "How can we assist you today? Please describe your issue in detail."
  },
  "STAFF_APPLY": {
    "id": "staff_apply",
    "label": "Staff Application",
    "emoji": "📝",
    "description": "Apply to join our staff team",
    "initialMessage": "Thank you for your interest in joining our staff team. Please answer the following questions:\n\n1. What's your Discord username?\n2. How old are you?\n3. What's your timezone?\n4. Do you have any moderation experience?\n5. Why do you want to join our staff team?"
  }
},
  
  // Role IDs that can access tickets (will be overridden by database settings)
  staffRoles: ["Admin","Moderator","Staff","Bounty Master"],
  
  // Validation limits
  validation: {
    bountyMin: 15,
    bountyMax: 30000,
    allowedImageTypes: ["image/png","image/jpeg","image/jpg"]
  },
  
  // Webhook settings
  webhooks: {
    bountyAvatarUrl: 'https://i.imgur.com/YzOA3Rb.png',
    bountyName: 'huh',
    bountyColor: '#9b59b6', // Purple color for bounty embeds
    defaultThumbnailUrl: 'https://i.imgur.com/YzOA3Rb.png', // Default thumbnail for bounty embeds
  }
};
