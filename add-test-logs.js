// Script to add test logs for the recent activity display
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Sample log actions
const sampleLogs = [
  {
    action: 'User Banned',
    user: { tag: 'troubleuser#1234', id: '12345678901234567' },
    executor: { tag: 'admin#5678', id: '98765432109876543' },
    details: { reason: 'Repeated violations of server rules' }
  },
  {
    action: 'Ticket Closed',
    user: { tag: 'customer#4321', id: '45678901234567890' },
    executor: { tag: 'support#9012', id: '10987654321098765' },
    details: { ticketId: 'T-12345', reason: 'Issue resolved' }
  },
  {
    action: 'Command Used',
    user: { tag: 'member#6789', id: '67890123456789012' },
    executor: null,
    details: { command: 'help', args: [] }
  },
  {
    action: 'Role Created',
    user: null,
    executor: { tag: 'admin#5678', id: '98765432109876543' },
    details: { roleName: 'VIP Member', color: '#FF9900' }
  },
  {
    action: 'Server Setting Updated',
    user: null,
    executor: { tag: 'owner#0000', id: '23456789012345678' },
    details: { setting: 'Welcome Message', newValue: 'Welcome to our amazing server!' }
  },
  {
    action: 'Channel Created',
    user: null,
    executor: { tag: 'mod#3456', id: '34567890123456789' },
    details: { channelName: 'announcements', type: 'text' }
  },
  {
    action: 'Message Purged',
    user: { tag: 'spammer#7890', id: '78901234567890123' },
    executor: { tag: 'mod#3456', id: '34567890123456789' },
    details: { amount: 15, channel: 'general', reason: 'Spam' }
  },
  {
    action: 'User Muted',
    user: { tag: 'louduser#2345', id: '89012345678901234' },
    executor: { tag: 'mod#3456', id: '34567890123456789' },
    details: { duration: '1h', reason: 'Excessive noise in voice channel' }
  },
  {
    action: 'Blacklist Added',
    user: { tag: 'badactor#3456', id: '90123456789012345' },
    executor: { tag: 'admin#5678', id: '98765432109876543' },
    details: { reason: 'Known scammer', scope: 'global' }
  },
  {
    action: 'Error Occurred',
    user: null,
    executor: null,
    details: { error: 'Failed to process command: TypeError: Cannot read properties of undefined' }
  }
];

// Write logs with varying timestamps
const logPath = path.join(logDir, 'actions.log');

// Clear existing file
fs.writeFileSync(logPath, '');

// Add logs with timestamps spaced out
let timestamp = new Date();
sampleLogs.forEach((log, index) => {
  // Space logs out by varying minutes
  timestamp = new Date(timestamp.getTime() - (Math.random() * 15 + 5) * 60000);
  
  const logMessage = `[${timestamp.toISOString()}] ${log.action} | ` +
                     `User: ${log.user ? `${log.user.tag} (${log.user.id})` : 'N/A'} | ` +
                     `Executor: ${log.executor ? `${log.executor.tag} (${log.executor.id})` : 'System'} | ` +
                     `Details: ${JSON.stringify(log.details)}`;
  
  fs.appendFileSync(logPath, logMessage + '\n');
});

console.log(`✅ Added ${sampleLogs.length} test log entries to ${logPath}`);