/**
 * Direct Auto-Moderation Settings Update
 * This script directly modifies the auto-moderation settings in the running bot
 */

// The server ID to modify (Swoosh server based on logs)
const serverId = '1319798865737809961';

try {
  // Access the global Discord client instance
  const client = global.client || global.bot || global.discordClient;
  
  if (!client) {
    console.error('Failed to access Discord client');
    process.exit(1);
  }
  
  // Access the auto-moderation system
  const autoMod = client.autoMod || 
                  (client.modules && client.modules.autoMod) || 
                  require('./modules/auto-moderation').getInstance();
  
  if (!autoMod) {
    console.error('Failed to access auto-moderation system');
    process.exit(1);
  }
  
  // Get current settings
  const settings = autoMod.getServerSettings(serverId);
  console.log(`Current settings for server ${serverId}:`, settings);
  
  // Update settings
  if (settings.filters) {
    settings.filters.links = false;
    console.log('Disabling link filtering in .filters.links');
  } else {
    settings.filters = { links: false };
    console.log('Created filters object with links disabled');
  }
  
  // Save settings
  autoMod.saveServerSettings(serverId, settings)
    .then(() => {
      console.log('Settings updated successfully');
      
      // Verify the change
      const newSettings = autoMod.getServerSettings(serverId);
      console.log('New settings:', newSettings);
      
      // Check if the setting was applied
      const linkFilterDisabled = 
        newSettings.filters && newSettings.filters.links === false;
      
      console.log(`Link filtering is now ${linkFilterDisabled ? 'DISABLED' : 'ENABLED'}`);
    })
    .catch(err => {
      console.error('Error saving settings:', err);
    });
  
} catch (error) {
  console.error('Error updating auto-moderation settings:', error);
}