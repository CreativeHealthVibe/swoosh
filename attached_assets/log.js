const fs = require('fs');

module.exports = (client, message) => {
  const logEntry = `[${new Date().toISOString()}] ${message}\n`;
  
  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
  fs.appendFileSync('./logs/bot.log', logEntry);
  console.log(message);
};