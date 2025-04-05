// bot.js - Main File
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const tickets = require('./tickets.js');
const logging = require('./logging.js');
const moderation = require('./moderation.js');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ]
});

// ======================
// BOT STARTUP
// ======================
client.once('ready', async () => {
  console.log(`🚀 ${client.user.tag} is online!`);
  
  // Initialize logging system
  try {
    await logging.setup(client);
    console.log('✅ Logging system initialized');
  } catch (error) {
    console.error('❌ Failed to setup logging:', error);
  }
});

// ======================
// SYSTEM INITIALIZATION
// ======================
tickets.init(client);
moderation.init(client);

// ======================
// ERROR HANDLING
// ======================
process.on('unhandledRejection', error => {
  console.error('‼️ Unhandled Rejection:', error);
  logging.logAction('Critical Error', null, null, {
    error: error.stack.substring(0, 1000)
  });
});

process.on('uncaughtException', error => {
  console.error('‼️ Uncaught Exception:', error);
  logging.logAction('Fatal Error', null, null, {
    error: error.stack.substring(0, 1000)
  });
  process.exit(1);
});

// ======================
// START BOT
// ======================
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Login Failed:', error);
  process.exit(1);
});