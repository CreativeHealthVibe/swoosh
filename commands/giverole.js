const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const logging = require('../modules/logging');
const fs = require('fs');
const path = require('path');

// Store special role types with their display names and icons
const SPECIAL_ROLES = {
  'bot owner': {
    name: 'Swoosh Bot Owner 👑',
    color: '#FF0000', // Red
    description: 'Official SWOOSH Bot Owner'
  },
  'bot tester': {
    name: 'Swoosh Bot Tester 🧪',
    color: '#00FFFF', // Cyan
    description: 'Official SWOOSH Bot Tester'
  },
  'developer': {
    name: 'Swoosh Bot Developer 💻',
    color: '#8A2BE2', // Blue Violet
    description: 'Official SWOOSH Developer'
  },
  'staff': {
    name: 'Swoosh Bot Staff 🛡️',
    color: '#FFA500', // Orange
    description: 'Official SWOOSH Staff Member'
  },
  'partner': {
    name: 'Swoosh Bot Partner 🤝',
    color: '#00FF00', // Green
    description: 'Official SWOOSH Bot Partner'
  }
};

// Store creator ID to restrict access
const BOT_CREATOR_ID = '930131254106550333';

// Path to the whos.js file where we need to update the special users
const WHOS_FILE_PATH = path.join(process.cwd(), 'commands', 'whos.js');

module.exports = {
  name: 'giverole',
  description: 'Assign a special SWOOSH role title to a user',
  usage: '.giverole @user <role-type>',
  aliases: ['give', 'specialrole'],
  async execute(message, args, client) {
    // Log command usage
    logging.logCommandUsage(message.author, this.name, args);

    // Check if the command is used by the bot creator
    if (message.author.id !== BOT_CREATOR_ID) {
      return message.reply({
        content: '❌ This command can only be used by the bot creator.',
        ephemeral: true
      });
    }

    // Check if the command has the required arguments
    if (args.length < 2) {
      return message.reply({
        content: `❌ Please provide a user and role type. Usage: \`${this.usage}\`\nAvailable roles: ${Object.keys(SPECIAL_ROLES).join(', ')}\nOr use \`.giverole @user custom:Role Name:emoji\` to create a custom role`,
        ephemeral: true
      });
    }

    // Get the user to give the role to
    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      return message.reply({
        content: '❌ Please mention a valid user.',
        ephemeral: true
      });
    }

    // Remove the user mention from args and get the role type
    args.shift();
    const roleType = args.join(' ').toLowerCase();

    // Check if the role type is valid
    if (!Object.keys(SPECIAL_ROLES).includes(roleType)) {
      return message.reply({
        content: `❌ Invalid role type. Available roles: ${Object.keys(SPECIAL_ROLES).join(', ')}`,
        ephemeral: true
      });
    }

    try {
      // Get role info
      const roleInfo = SPECIAL_ROLES[roleType];
      
      // Update whos.js to include this special user
      const success = await updateSpecialUsers(targetUser.id, roleInfo.name);
      
      if (!success) {
        return message.reply({
          content: '❌ Failed to update special users in whos.js. Please check the console for errors.',
          ephemeral: true
        });
      }
      
      // Create embed for confirmation
      const embed = new EmbedBuilder()
        .setTitle('🎭 Special Role Title Assigned')
        .setDescription(`${targetUser.toString()} has been given the **${roleInfo.name}** title.`)
        .addFields({
          name: 'Role Description',
          value: roleInfo.description
        })
        .setColor(roleInfo.color)
        .setTimestamp();
      
      // Send confirmation
      await message.reply({ embeds: [embed] });
      
      // Send DM to the user
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎉 Congratulations!')
          .setDescription(`You have been granted the **${roleInfo.name}** title in ${message.guild.name}!`)
          .addFields({
            name: 'Role Description',
            value: roleInfo.description
          }, {
            name: 'Assigned By',
            value: message.author.tag
          })
          .setColor(roleInfo.color)
          .setTimestamp()
          .setFooter({
            text: 'SWOOSH Bot • Special Role System',
            iconURL: client.user.displayAvatarURL()
          });
        
        await targetUser.send({ embeds: [dmEmbed] });
        console.log(`Sent DM to ${targetUser.user.tag} about new special role title`);
      } catch (dmError) {
        console.error(`Could not send DM to ${targetUser.user.tag}:`, dmError);
        message.channel.send(`⚠️ Note: Couldn't send a DM to ${targetUser.toString()}, they might have DMs disabled.`);
      }
      
    } catch (error) {
      console.error('Error assigning special role title:', error);
      message.reply('❌ An error occurred while assigning the role title.');
    }
  }
};

/**
 * Update the specialUsers object in whos.js
 * @param {string} userId - The user ID to add
 * @param {string} roleTitle - The role title to assign
 * @returns {boolean} - Whether the update was successful
 */
async function updateSpecialUsers(userId, roleTitle) {
  try {
    // Read the whos.js file
    const whosContent = fs.readFileSync(WHOS_FILE_PATH, 'utf8');
    
    // Define the pattern to match the specialUsers object
    const specialUsersRegex = /(const specialUsers = \{[^}]*\})/s;
    
    // Extract the specialUsers object
    const match = whosContent.match(specialUsersRegex);
    if (!match) {
      console.error('Could not find specialUsers object in whos.js');
      return false;
    }
    
    // Parse the specialUsers object to extract its content
    const specialUsersObj = match[1];
    
    // Check if user ID already exists in the object
    const userIdPattern = new RegExp(`'${userId}':\\s*'[^']*'`);
    if (specialUsersObj.match(userIdPattern)) {
      // User ID exists, update the role title
      const updatedSpecialUsers = specialUsersObj.replace(
        userIdPattern,
        `'${userId}': '${roleTitle}'`
      );
      
      // Update the file
      const updatedWhosContent = whosContent.replace(specialUsersRegex, updatedSpecialUsers);
      fs.writeFileSync(WHOS_FILE_PATH, updatedWhosContent, 'utf8');
    } else {
      // User ID doesn't exist, add it to the object
      const lastBrace = specialUsersObj.lastIndexOf('}');
      const specialUsersPrefix = specialUsersObj.substring(0, lastBrace);
      const updatedSpecialUsers = specialUsersPrefix + 
        (specialUsersPrefix.endsWith(',') || specialUsersPrefix.endsWith('{') ? '' : ',') + 
        `\n        '${userId}': '${roleTitle}'` + 
        specialUsersObj.substring(lastBrace);
      
      // Update the file
      const updatedWhosContent = whosContent.replace(specialUsersRegex, updatedSpecialUsers);
      fs.writeFileSync(WHOS_FILE_PATH, updatedWhosContent, 'utf8');
    }
    
    console.log(`Updated special users in whos.js - added/updated ${userId} with title: ${roleTitle}`);
    return true;
  } catch (error) {
    console.error('Error updating special users in whos.js:', error);
    return false;
  }
}