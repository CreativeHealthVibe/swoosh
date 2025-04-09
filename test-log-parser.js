/**
 * Test Script for Log Parser Module
 * Test the functionality of the log parser with sample data
 */

const logParser = require('./modules/log-parser');
const fs = require('fs');
const path = require('path');

// Sample log entry for testing
const sampleLogLine = '[2025-04-07T21:28:49.514Z] User Banned | User: troubleuser#1234 (12345678901234567) | Executor: admin#5678 (98765432109876543) | Details: {"reason":"Repeated violations of server rules"}';

// Test parsing a single log line
console.log('Testing parseLogLine()...');
const parsedLine = logParser.parseLogLine(sampleLogLine);
console.log(JSON.stringify(parsedLine, null, 2));

// Testing with attached sample file 
// First create a temporary log file from the attachment
const sampleLogPath = path.join(__dirname, 'temp', 'sample-log.txt');
const attachmentPath = path.join(__dirname, 'attached_assets', 'Pasted--2025-04-07T21-28-49-514Z-User-Banned-User-troubleuser-1234-12345678901234567-Executor-admi-1744147438751.txt');

// Make sure temp directory exists
if (!fs.existsSync(path.join(__dirname, 'temp'))) {
  fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });
}

// Get a sample of the attachment content (first 20 lines)
const attachmentContent = fs.readFileSync(attachmentPath, 'utf8');
const logLines = attachmentContent.split('\n').slice(0, 20).join('\n');
fs.writeFileSync(sampleLogPath, logLines);

// Parse the sample log file
console.log('\nTesting parseLogFile()...');
const parsedLogs = logParser.parseLogFile(sampleLogPath);
console.log(`Parsed ${parsedLogs.length} log entries`);

// Extract ban events
console.log('\nTesting extractBanEvents()...');
const banEvents = logParser.extractBanEvents(parsedLogs);
console.log(`Found ${banEvents.length} ban events:`);
console.log(JSON.stringify(banEvents, null, 2));

// Get moderation events for a specific user
const testUserId = '12345678901234567'; // User from our sample
console.log(`\nTesting extractUserModerationEvents() for user ID ${testUserId}...`);
const userModEvents = logParser.extractUserModerationEvents(parsedLogs, testUserId);
console.log(`Found ${userModEvents.length} moderation events for this user:`);
console.log(JSON.stringify(userModEvents, null, 2));

// Format some logs for Discord
console.log('\nTesting formatForDiscord()...');
const formattedLogs = logParser.formatForDiscord(parsedLogs.slice(0, 5), 1000);
console.log(formattedLogs);

console.log('\nAll tests completed!');