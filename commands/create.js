// create.js - Command for creating server elements like roles
const { 
  PermissionsBitField, 
  EmbedBuilder, 
  Colors 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

// Map of color names to Discord color constants
const COLORS = {
  'default': null,
  'white': Colors.White,
  'aqua': Colors.Aqua,
  'green': Colors.Green,
  'blue': Colors.Blue,
  'yellow': Colors.Yellow,
  'purple': Colors.Purple,
  'luminous_vivid_pink': Colors.LuminousVividPink,
  'fuchsia': Colors.Fuchsia,
  'gold': Colors.Gold,
  'orange': Colors.Orange,
  'red': Colors.Red,
  'grey': Colors.Grey,
  'navy': Colors.Navy,
  'dark_aqua': Colors.DarkAqua,
  'dark_green': Colors.DarkGreen,
  'dark_blue': Colors.DarkBlue,
  'dark_purple': Colors.DarkPurple,
  'dark_gold': Colors.DarkGold,
  'dark_orange': Colors.DarkOrange,
  'dark_red': Colors.DarkRed,
  'dark_grey': Colors.DarkGrey,
  'black': Colors.Black,
  'blurple': Colors.Blurple,
  'greyple': Colors.Greyple,
  'dark_but_not_black': Colors.DarkButNotBlack,
  'not_quite_black': Colors.NotQuiteBlack
};

// Simpler color mapping with common names
const SIMPLE_COLORS = {
  'red': Colors.Red,
  'blue': Colors.Blue,
  'green': Colors.Green,
  'yellow': Colors.Yellow,
  'purple': Colors.Purple,
  'pink': Colors.LuminousVividPink,
  'orange': Colors.Orange,
  'black': Colors.Black,
  'white': Colors.White,
  'grey': Colors.Grey,
  'gray': Colors.Grey,
  'gold': Colors.Gold,
  'brown': Colors.DarkGold,  // Approximating brown
  'cyan': Colors.Aqua,
  'magenta': Colors.Fuchsia,
  'lime': Colors.Green,
  'teal': Colors.DarkAqua,
  'indigo': Colors.DarkPurple,
  'violet': Colors.Purple,
  'maroon': Colors.DarkRed,
  'navy': Colors.Navy
};

module.exports = {
  name: 'create',
  description: 'Create server elements like roles',
  usage: '.create role <@mention or name> [colour: color_name] [mentionable: true/false] [separate: true/false]',
  adminOnly: true,
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check if user has admin permissions
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('You do not have permission to use this command.');
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Check for subcommand
      if (!args[0]) {
        return message.reply('Please specify what to create. Available options: `role`');
      }
      
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case 'role':
          return await createRole(message, args.slice(1));
        default:
          return message.reply(`Unknown subcommand: ${subcommand}. Available options: \`role\``);
      }
    } catch (error) {
      console.error('Error executing create command:', error);
      message.reply('An error occurred while executing this command.');
    }
  }
};

/**
 * Create a new role
 * @param {Object} message - Discord message
 * @param {Array} args - Command arguments
 */
async function createRole(message, args) {
  // Check if a role name/mention was provided
  if (!args[0]) {
    return message.reply('Please provide a role name or mention.');
  }
  
  // Get role name (handling mentions or plain text)
  const roleMention = args[0].match(/<@&(\d+)>/);
  let roleName;
  
  if (roleMention) {
    // Role was mentioned, get its name
    const existingRole = message.guild.roles.cache.get(roleMention[1]);
    if (!existingRole) {
      return message.reply('That role does not exist.');
    }
    roleName = existingRole.name;
  } else {
    // Role name was provided as text
    roleName = args[0];
  }
  
  // Parse options from remaining arguments
  const options = parseOptions(args.slice(1).join(' '));
  
  // Get color from options
  let roleColor = null;
  if (options.colour || options.color) {
    const colorName = (options.colour || options.color).toLowerCase();
    
    // Try to find the color in our simple mapping
    if (SIMPLE_COLORS[colorName]) {
      roleColor = SIMPLE_COLORS[colorName];
    } 
    // Check if it's a hex code
    else if (colorName.match(/^#?[0-9a-f]{6}$/i)) {
      roleColor = colorName.startsWith('#') ? colorName : `#${colorName}`;
    }
    // If not found, default to null (default color)
    else {
      return message.reply(`Unknown color: ${colorName}. Please use a color name like 'red', 'blue', etc. or a hex code.`);
    }
  }
  
  // Create role
  try {
    const newRole = await message.guild.roles.create({
      name: roleName,
      color: roleColor,
      mentionable: options.mentionable === 'true',
      hoist: options.separate === 'true' || options.hoist === 'true' // hoist means display separately
    });
    
    // Build success embed
    const embed = new EmbedBuilder()
      .setTitle('Role Created')
      .setDescription(`Successfully created role ${newRole}`)
      .addFields(
        { name: 'Name', value: newRole.name, inline: true },
        { name: 'Color', value: roleColor ? `${roleColor}` : 'Default', inline: true },
        { name: 'Mentionable', value: (options.mentionable === 'true').toString(), inline: true },
        { name: 'Displayed Separately', value: (options.separate === 'true' || options.hoist === 'true').toString(), inline: true }
      )
      .setColor(roleColor || config.embedColor)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    // Log action
    await logging.logAction('Role Created', message.author, message.author, {
      role: newRole.name,
      color: roleColor,
      mentionable: options.mentionable === 'true',
      separate: options.separate === 'true' || options.hoist === 'true'
    });
    
  } catch (error) {
    console.error('Error creating role:', error);
    message.reply(`Failed to create role: ${error.message}`);
  }
}

/**
 * Parse options from a string with format like "option1: value1 option2: value2"
 * @param {string} optionsString - The options string to parse
 * @returns {Object} - Parsed options
 */
function parseOptions(optionsString) {
  const options = {};
  
  // Match all "key: value" pairs
  const matches = optionsString.matchAll(/(\w+):\s*([^\s]+(?:\s+[^\s:]+)*?)(?=\s+\w+:|$)/g);
  
  for (const match of matches) {
    const [, key, value] = match;
    options[key.toLowerCase()] = value.trim();
  }
  
  return options;
}