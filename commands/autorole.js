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

// Load or create autoroles configuration
let autoroles = {};
try {
  if (fs.existsSync(autrolesConfigPath)) {
    autoroles = JSON.parse(fs.readFileSync(autrolesConfigPath, 'utf8'));
  } else {
    fs.writeFileSync(autrolesConfigPath, JSON.stringify(autoroles, null, 2));
  }
} catch (error) {
  console.error('Error loading autoroles configuration:', error);
}

// Save autoroles configuration
function saveAutoroles() {
  try {
    fs.writeFileSync(autrolesConfigPath, JSON.stringify(autoroles, null, 2));
  } catch (error) {
    console.error('Error saving autoroles configuration:', error);
  }
}

module.exports = {
  name: 'autorole',
  description: 'Configure auto role assignment for new members',
  usage: '.autorole add @role | .autorole remove @role | .autorole list',
  
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
            { name: 'List configured roles', value: '`.autorole list`', inline: false }
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
        
        const roleList = autoroles[guildId].map(roleId => {
          const role = message.guild.roles.cache.get(roleId);
          return role ? role.name : `Unknown role (${roleId})`;
        }).join('\n- ');
        
        const embed = new EmbedBuilder()
          .setTitle('Configured Autoroles')
          .setDescription(`The following roles will be automatically assigned to new members:\n\n- ${roleList}`)
          .setColor(config.embedColor);
          
        return message.reply({ embeds: [embed] });
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
      return message.reply('Invalid action. Use `.autorole add @role`, `.autorole remove @role`, or `.autorole list`.');
    } catch (error) {
      console.error('Autorole Command Error:', error);
      message.reply('❌ An error occurred while processing the command.');
    }
  }
};