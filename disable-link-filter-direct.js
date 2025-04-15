/**
 * Disable Link Filter Script - Direct Modification
 * This script directly modifies the auto-moderation settings in the database
 */

// Check if auto-moderation module is available in the current runtime
try {
  const autoMod = require('./modules/auto-moderation').getInstance();
  
  if (!autoMod) {
    console.error('Auto-moderation module is not initialized');
    process.exit(1);
  }
  
  console.log('✅ Found auto-moderation module');
  
  // The server ID to modify (Swoosh server based on logs)
  const serverId = '1319798865737809961';
  
  // Get current settings
  const currentSettings = autoMod.getServerSettings(serverId);
  console.log('Current auto-moderation settings:', JSON.stringify(currentSettings, null, 2));
  
  // Update settings to disable link filtering
  if (currentSettings.filters) {
    currentSettings.filters.links = false;
  }
  
  // Save updated settings
  autoMod.saveServerSettings(serverId, currentSettings)
    .then(() => {
      console.log('✅ Successfully disabled link filtering for server:', serverId);
      console.log('New settings:', JSON.stringify(autoMod.getServerSettings(serverId), null, 2));
    })
    .catch(error => {
      console.error('Error saving settings:', error);
    });
  
} catch (error) {
  console.error('Error accessing auto-moderation module:', error);
}