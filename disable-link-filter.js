/**
 * Disable Link Filter Script
 * This script disables the link filter for a specific server
 */

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Create a minimal Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// The server ID to modify
const serverId = '1319798865737809961'; // This is for Swoosh server based on logs

async function disableLinkFilter() {
  try {
    console.log('Starting auto-moderation settings update...');
    
    // Initialize Discord database from index.js
    const DiscordDatabaseManager = require('./handlers/discordDatabaseManager');
    client.discordDB = new DiscordDatabaseManager(client);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Discord database manager loaded, attempting to initialize...');
    
    // Initialize database
    await client.discordDB.init();
    console.log('Discord database initialized, checking for auto-mod settings...');
    
    // Find automod settings
    const settings = client.discordDB.findDocuments('automod-settings', (doc) => {
      return doc.serverId === serverId || doc.guildId === serverId;
    });
    
    console.log('Current settings:', settings);
    
    if (settings && settings.length > 0) {
      const automodSettings = settings[0];
      
      console.log('Found auto-moderation settings for server');
      
      // Update settings to disable link filter
      if (automodSettings.filters) {
        automodSettings.filters.links = false;
        console.log('Disabled links filter in settings');
      } else if (automodSettings.filterLinks !== undefined) {
        automodSettings.filterLinks = false;
        console.log('Disabled filterLinks setting');
      }
      
      // Update database
      await client.discordDB.setDocument('automod-settings', serverId, automodSettings);
      console.log('✅ Auto-moderation settings updated! Link filter has been disabled.');
    } else {
      // Create new settings with link filter disabled
      const newSettings = {
        serverId: serverId,
        guildId: serverId,
        enabled: true,
        logActions: true,
        filters: {
          profanity: true,
          links: false, // Disabled
          invites: true,
          massMentions: false,
          caps: false
        },
        mentionThreshold: 5,
        capsThreshold: 70,
        defaultAction: 'delete',
        muteTime: '10m',
        escalateRepeated: false,
        maxViolations: 7
      };
      
      // Save to database
      await client.discordDB.setDocument('automod-settings', serverId, newSettings);
      console.log('✅ Created new auto-moderation settings with link filter disabled');
    }
    
    console.log('Operation complete. Please restart the bot for changes to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating auto-moderation settings:', error);
    process.exit(1);
  }
}

// Login and disable link filter
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  disableLinkFilter();
});

// Login with token
client.login(process.env.TOKEN).catch(err => {
  console.error('Failed to login:', err);
  process.exit(1);
});