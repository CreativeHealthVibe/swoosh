/**
 * Test script for the moderation API routes
 * This will test the parsing and processing of ban logs
 */

const banLogger = require('./modules/ban-logger');
const logParser = require('./modules/log-parser');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Ban Logger Module ===');

// Get ban logs for a specific guild
const guildId = '1184995000564600862';
console.log(`\nRetrieving ban logs for guild ${guildId}...`);
const banLogs = banLogger.getBanLogs(guildId);

if (banLogs && banLogs.length > 0) {
  console.log(`Found ${banLogs.length} ban log entries`);
  console.log('Sample entry:');
  console.log(JSON.stringify(banLogs[0], null, 2));
  
  // Extract ban events
  const banEvents = logParser.extractBanEvents(banLogs);
  console.log(`\nExtracted ${banEvents.length} ban events:`);
  console.log(JSON.stringify(banEvents, null, 2));
} else {
  console.log('No ban logs found for this guild');
}

// Get moderation events for a specific user
const userId = '12345678901234567'; // From sample data
console.log(`\nRetrieving moderation events for user ${userId}...`);
const userLogs = banLogger.getUserModLogs(userId);

if (userLogs && userLogs.length > 0) {
  console.log(`Found ${userLogs.length} moderation events for this user`);
  console.log('Sample entry:');
  console.log(JSON.stringify(userLogs[0], null, 2));
} else {
  console.log('No moderation logs found for this user');
}

// Simulate what the API would return for ban data
console.log('\n=== Simulating Ban List API Response ===');
function simulateBanListApi() {
  // Sample ban list (what would come from Discord API)
  const sampleBans = [
    {
      user: {
        id: '12345678901234567',
        username: 'troubleuser',
        discriminator: '1234',
        tag: 'troubleuser#1234',
        avatar: 'https://cdn.discordapp.com/avatars/12345678901234567/abc123.png'
      },
      reason: 'No reason provided',
      date: null,
      executor: null
    },
    {
      user: {
        id: '34567890123456789',
        username: 'spambot',
        discriminator: '5678',
        tag: 'spambot#5678',
        avatar: 'https://cdn.discordapp.com/avatars/34567890123456789/def456.png'
      },
      reason: 'No reason provided',
      date: null,
      executor: null
    }
  ];
  
  // Enhance with log data if available
  const logData = banLogger.getBanLogs(guildId);
  if (logData && logData.length > 0) {
    // Find and match log entries with ban entries
    sampleBans.forEach(ban => {
      const logEntry = logData.find(entry => 
        entry.eventType === 'User Banned' && 
        entry.user && 
        entry.user.id === ban.user.id
      );
      
      if (logEntry) {
        ban.date = logEntry.date;
        if (logEntry.executor) {
          ban.executor = {
            id: logEntry.executor.id,
            username: logEntry.executor.username || logEntry.executor.name,
            discriminator: logEntry.executor.discriminator
          };
        }
        if (logEntry.details && logEntry.details.reason) {
          ban.reason = logEntry.details.reason;
        }
      }
    });
  }
  
  // Sort bans by date (newest first)
  sampleBans.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date - a.date;
  });
  
  return sampleBans;
}

const banListResponse = simulateBanListApi();
console.log(JSON.stringify(banListResponse, null, 2));

console.log('\nAll tests completed!');