/**
 * Direct Auto-Moderation Database Fix
 * This script directly modifies the database to disable link filtering
 */
const fs = require('fs');
require('dotenv').config();

// Direct write to the database file, bypassing the running instance
async function disableLinkFiltering() {
  try {
    // Find the automod-settings directory or file
    const databaseFiles = [
      './data/automod-settings.json',
      './data/database/automod-settings.json',
      './database/automod-settings.json',
    ];
    
    let foundSettingsFile = null;
    
    for (const file of databaseFiles) {
      if (fs.existsSync(file)) {
        foundSettingsFile = file;
        break;
      }
    }
    
    if (!foundSettingsFile) {
      console.error('Could not find automod-settings file');
      
      // Try to find any JSON files that might contain the settings
      const jsonFiles = findJsonFiles('./');
      console.log('Found JSON files that might contain settings:', jsonFiles);
      
      return;
    }
    
    console.log(`Found settings file: ${foundSettingsFile}`);
    
    // Read the settings
    const settingsData = JSON.parse(fs.readFileSync(foundSettingsFile, 'utf8'));
    console.log('Current settings data:', settingsData);
    
    // Update the settings for the specified server
    const serverId = '1319798865737809961'; // Swoosh server based on logs
    
    if (settingsData[serverId]) {
      console.log(`Found settings for server ${serverId}`);
      
      // Update the settings to disable link filtering
      if (settingsData[serverId].filters) {
        settingsData[serverId].filters.links = false;
      } else {
        settingsData[serverId].filters = { links: false };
      }
      
      // Write the updated settings back to the file
      fs.writeFileSync(foundSettingsFile, JSON.stringify(settingsData, null, 2));
      console.log('✅ Settings updated successfully');
    } else {
      console.log(`No settings found for server ${serverId}`);
    }
    
  } catch (error) {
    console.error('Error updating settings:', error);
  }
}

// Helper function to find JSON files
function findJsonFiles(startPath) {
  const jsonFiles = [];
  
  if (!fs.existsSync(startPath)) {
    return jsonFiles;
  }
  
  try {
    const files = fs.readdirSync(startPath);
    
    for (const file of files) {
      const filename = `${startPath}/${file}`;
      const stat = fs.lstatSync(filename);
      
      if (stat.isDirectory() && file !== 'node_modules') {
        // Recursively search directories
        jsonFiles.push(...findJsonFiles(filename));
      } else if (filename.endsWith('.json')) {
        jsonFiles.push(filename);
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${startPath}:`, error);
  }
  
  return jsonFiles;
}

// Run the function
disableLinkFiltering();