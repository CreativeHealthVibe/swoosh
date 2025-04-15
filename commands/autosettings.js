/**
 * Auto-Moderation Settings Command
 * Allows updating auto-moderation settings directly
 */

const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'autosettings',
  description: 'Configure auto-moderation settings directly',
  aliases: ['automod-settings', 'autosettings'],
  category: 'admin',
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.SendMessages],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check permissions
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('⛔ You need Administrator permission to use this command.');
      }
      
      // Load auto-moderation module
      const autoMod = require('../modules/auto-moderation').getInstance();
      
      if (!autoMod) {
        return message.reply('❌ Auto-moderation system is not initialized.');
      }
      
      // Handle subcommands
      const subCommand = args[0]?.toLowerCase();
      
      switch (subCommand) {
        case 'disable-links':
          await disableLinks(message, autoMod);
          break;
          
        case 'enable-links':
          await enableLinks(message, autoMod);
          break;
          
        case 'disable':
          await disableAutomod(message, autoMod);
          break;
          
        case 'enable':
          await enableAutomod(message, autoMod);
          break;
          
        case 'status':
          await showStatus(message, autoMod);
          break;
          
        default:
          showHelp(message);
          break;
      }
    } catch (error) {
      console.error('Error in autosettings command:', error);
      message.reply('❌ An error occurred while processing the command.');
    }
  }
};

/**
 * Disable link filtering
 */
async function disableLinks(message, autoMod) {
  try {
    const serverId = message.guild.id;
    const settings = autoMod.getServerSettings(serverId);
    
    // Make sure the filters object exists
    if (!settings.filters) settings.filters = {};
    
    // Disable link filtering
    settings.filters.links = false;
    
    // Save settings
    await autoMod.saveServerSettings(serverId, settings);
    
    message.reply('✅ Link filtering has been **disabled** for this server.');
  } catch (error) {
    console.error('Error disabling link filter:', error);
    message.reply('❌ Failed to disable link filtering.');
  }
}

/**
 * Enable link filtering
 */
async function enableLinks(message, autoMod) {
  try {
    const serverId = message.guild.id;
    const settings = autoMod.getServerSettings(serverId);
    
    // Make sure the filters object exists
    if (!settings.filters) settings.filters = {};
    
    // Enable link filtering
    settings.filters.links = true;
    
    // Save settings
    await autoMod.saveServerSettings(serverId, settings);
    
    message.reply('✅ Link filtering has been **enabled** for this server.');
  } catch (error) {
    console.error('Error enabling link filter:', error);
    message.reply('❌ Failed to enable link filtering.');
  }
}

/**
 * Disable auto-moderation completely
 */
async function disableAutomod(message, autoMod) {
  try {
    const serverId = message.guild.id;
    const settings = autoMod.getServerSettings(serverId);
    
    // Disable auto-moderation
    settings.enabled = false;
    
    // Save settings
    await autoMod.saveServerSettings(serverId, settings);
    
    message.reply('✅ Auto-moderation has been **disabled** for this server.');
  } catch (error) {
    console.error('Error disabling automod:', error);
    message.reply('❌ Failed to disable auto-moderation.');
  }
}

/**
 * Enable auto-moderation
 */
async function enableAutomod(message, autoMod) {
  try {
    const serverId = message.guild.id;
    const settings = autoMod.getServerSettings(serverId);
    
    // Enable auto-moderation
    settings.enabled = true;
    
    // Save settings
    await autoMod.saveServerSettings(serverId, settings);
    
    message.reply('✅ Auto-moderation has been **enabled** for this server.');
  } catch (error) {
    console.error('Error enabling automod:', error);
    message.reply('❌ Failed to enable auto-moderation.');
  }
}

/**
 * Show current auto-moderation status
 */
async function showStatus(message, autoMod) {
  try {
    const serverId = message.guild.id;
    const settings = autoMod.getServerSettings(serverId);
    
    const status = [
      `🔍 **Auto-Moderation Status for ${message.guild.name}**`,
      `• Enabled: ${settings.enabled ? '✅' : '❌'}`,
      `• Log Actions: ${settings.logActions ? '✅' : '❌'}`
    ];
    
    if (settings.filters) {
      status.push('**Filters:**');
      status.push(`• Links: ${settings.filters.links ? '✅' : '❌'}`);
      status.push(`• Profanity: ${settings.filters.profanity ? '✅' : '❌'}`);
      status.push(`• Invites: ${settings.filters.invites ? '✅' : '❌'}`);
      status.push(`• Mass Mentions: ${settings.filters.massMentions ? '✅' : '❌'}`);
      status.push(`• Excessive Caps: ${settings.filters.caps ? '✅' : '❌'}`);
    }
    
    message.reply(status.join('\n'));
  } catch (error) {
    console.error('Error showing automod status:', error);
    message.reply('❌ Failed to fetch auto-moderation status.');
  }
}

/**
 * Show help message
 */
function showHelp(message) {
  const helpText = [
    '🔍 **Auto-Moderation Settings Help**',
    'Commands:',
    '`!autosettings disable-links` - Disable link filtering',
    '`!autosettings enable-links` - Enable link filtering',
    '`!autosettings disable` - Disable auto-moderation completely',
    '`!autosettings enable` - Enable auto-moderation',
    '`!autosettings status` - Show current settings'
  ];
  
  message.reply(helpText.join('\n'));
}