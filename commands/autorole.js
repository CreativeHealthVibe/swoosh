// autorole.js - Auto role assignment command
const { EmbedBuilder } = require('discord.js');
const adminUtils = require('../utils/admin');
const config = require('../config');
const logging = require('../modules/logging');
const fs = require('fs');
const path = require('path');

// Path to store autorole configuration
const autrolesConfigPath = path.join(__dirname, '../data/autoroles.json');

// Make sure the data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

// Get the shared autoroles reference from the main file if it exists
// or create a new one if it doesn't
let autoroles = global.sharedAutoroles || {};

// If global autoroles isn't populated yet, load from file
if (Object.keys(autoroles).length === 0) {
  try {
    if (fs.existsSync(autrolesConfigPath)) {
      autoroles = JSON.parse(fs.readFileSync(autrolesConfigPath, 'utf8'));
      console.log(`[Autorole Command] Loaded autoroles from file: ${Object.keys(autoroles).length} servers`);
    } else {
      fs.writeFileSync(autrolesConfigPath, JSON.stringify(autoroles, null, 2));
      console.log('[Autorole Command] Created empty autoroles configuration file');
    }
  } catch (error) {
    console.error('[Autorole Command] Error loading autoroles configuration:', error);
  }
  
  // Store in global for sharing with other modules
  global.sharedAutoroles = autoroles;
}

// Save autoroles configuration
function saveAutoroles() {
  try {
    fs.writeFileSync(autrolesConfigPath, JSON.stringify(autoroles, null, 2));
    console.log(`[Autorole Command] Saved autoroles configuration for ${Object.keys(autoroles).length} servers`);
    
    // Ensure the global reference is updated
    global.sharedAutoroles = autoroles;
    
    return true;
  } catch (error) {
    console.error('[Autorole Command] Error saving autoroles configuration:', error);
    return false;
  }
}

module.exports = {
  name: 'autorole',
  description: 'Configure auto role assignment for new members',
  usage: '.autorole add @role | .autorole remove @role | .autorole list | .autorole clean',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check if user has permissions to use this command
      if (!adminUtils.canManageTickets(message.member)) {
        return message.reply('❌ You do not have permission to use this command.');
      }
      
      // Get server ID
      const guildId = message.guild.id;
      
      // Initialize guild configuration if it doesn't exist
      if (!autoroles[guildId]) {
        autoroles[guildId] = [];
      }
      
      // No arguments - show help
      if (!args.length) {
        const embed = new EmbedBuilder()
          .setTitle('Autorole Command Help')
          .setDescription('Configure roles that will be automatically assigned to new members.')
          .addFields(
            { name: 'Add a role', value: '`.autorole add @role`', inline: false },
            { name: 'Remove a role', value: '`.autorole remove @role`', inline: false },
            { name: 'List configured roles', value: '`.autorole list`', inline: false },
            { name: 'Clean invalid roles', value: '`.autorole clean`', inline: false }
          )
          .setColor(config.embedColor)
          .setFooter({ text: 'Only staff members can configure autoroles' });
          
        return message.reply({ embeds: [embed] });
      }
      
      const action = args[0].toLowerCase();
      
      // List configured autoroles
      if (action === 'list') {
        if (!autoroles[guildId].length) {
          return message.reply('No autoroles have been configured for this server.');
        }
        
        const validRoles = [];
        const invalidRoles = [];
        
        const embed = new EmbedBuilder()
          .setTitle('Configured Autoroles')
          .setColor(config.embedColor);
          
        // Check if bot has MANAGE_ROLES permission
        const hasManageRoles = message.guild.members.me.permissions.has('ManageRoles');
        
        let description = '';
        
        // Add warning about permission if needed
        if (!hasManageRoles) {
          description = `⚠️ **WARNING:** Bot does not have MANAGE_ROLES permission in this server. No roles can be assigned.\n\n`;
        }
        
        // Check each configured role
        for (const roleId of autoroles[guildId]) {
          const role = message.guild.roles.cache.get(roleId);
          if (!role) {
            invalidRoles.push(`Unknown role (${roleId})`);
          } else {
            // If the bot has permission, all roles should be valid
            validRoles.push(role.name);
          }
        }
        
        if (validRoles.length > 0) {
          description += `**Valid roles that will be assigned:**\n- ${validRoles.join('\n- ')}\n\n`;
        } else {
          description += '**No valid roles configured.**\n\n';
        }
        
        if (invalidRoles.length > 0) {
          description += `**Invalid roles that cannot be assigned:**\n- ${invalidRoles.join('\n- ')}\n\n`;
          description += '_Use `.autorole clean` to remove invalid roles._';
        }
        
        embed.setDescription(description);
        return message.reply({ embeds: [embed] });
      }
      
      // Clean up invalid autoroles
      if (action === 'clean') {
        if (!autoroles[guildId] || !autoroles[guildId].length) {
          return message.reply('No autoroles have been configured for this server.');
        }
        
        const originalLength = autoroles[guildId].length;
        const cleanedRoles = [];
        
        // Filter out deleted roles only
        autoroles[guildId] = autoroles[guildId].filter(roleId => {
          const role = message.guild.roles.cache.get(roleId);
          if (!role) {
            cleanedRoles.push(roleId);
            return false;
          }
          return true;
        });
        
        // Save changes if any roles were removed
        if (cleanedRoles.length > 0) {
          saveAutoroles();
          
          // Log the action
          logging.logAction('Autoroles Cleaned', null, message.author, {
            removedCount: cleanedRoles.length
          });
          
          return message.reply(`✅ Cleaned up ${cleanedRoles.length} invalid autoroles. Use \`.autorole list\` to see the current configuration.`);
        } else {
          return message.reply('No invalid autoroles found. All configured roles are valid and can be assigned by the bot.');
        }
      }
      
      // Add or remove autorole
      if (action === 'add' || action === 'remove') {
        // Check if a role was mentioned
        if (!message.mentions.roles.size) {
          return message.reply('Please mention a role to add or remove.');
        }
        
        const role = message.mentions.roles.first();
        
        // Add role to autoroles
        if (action === 'add') {
          // Check if bot has MANAGE_ROLES permission
          if (!message.guild.members.me.permissions.has('ManageRoles')) {
            return message.reply(`❌ Cannot add role ${role.name} because the bot doesn't have the MANAGE_ROLES permission in this server.`);
          }
          
          if (autoroles[guildId].includes(role.id)) {
            return message.reply(`The role ${role.name} is already configured as an autorole.`);
          }
          
          autoroles[guildId].push(role.id);
          saveAutoroles();
          
          // Log the action
          logging.logAction('Autorole Added', null, message.author, {
            role: role.name
          });
          
          return message.reply(`✅ The role ${role.name} will now be automatically assigned to new members.`);
        }
        
        // Remove role from autoroles
        if (action === 'remove') {
          if (!autoroles[guildId].includes(role.id)) {
            return message.reply(`The role ${role.name} is not configured as an autorole.`);
          }
          
          autoroles[guildId] = autoroles[guildId].filter(id => id !== role.id);
          saveAutoroles();
          
          // Log the action
          logging.logAction('Autorole Removed', null, message.author, {
            role: role.name
          });
          
          return message.reply(`✅ The role ${role.name} will no longer be automatically assigned to new members.`);
        }
      }
      
      // Invalid action
      return message.reply('Invalid action. Use `.autorole add @role`, `.autorole remove @role`, `.autorole list`, or `.autorole clean`.');
    } catch (error) {
      console.error('Autorole Command Error:', error);
      message.reply('❌ An error occurred while processing the command.');
    }
  }
};