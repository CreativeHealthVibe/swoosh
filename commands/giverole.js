const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const logging = require('../modules/logging');

// Store special role IDs or create them if they don't exist
const SPECIAL_ROLES = {
  'bot owner': {
    name: 'SWOOSH Bot Owner',
    color: '#FF0000', // Red
    description: 'Official SWOOSH Bot Owner'
  },
  'bot tester': {
    name: 'SWOOSH Bot Tester',
    color: '#00FFFF', // Cyan
    description: 'Official SWOOSH Bot Tester'
  },
  'developer': {
    name: 'SWOOSH Developer',
    color: '#8A2BE2', // Blue Violet
    description: 'Official SWOOSH Developer'
  },
  'staff': {
    name: 'SWOOSH Staff',
    color: '#FFA500', // Orange
    description: 'Official SWOOSH Staff Member'
  }
};

// Store creator ID to restrict access
const BOT_CREATOR_ID = '930131254106550333';

module.exports = {
  name: 'giverole',
  description: 'Assign a special SWOOSH role to a user',
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
        content: `❌ Please provide a user and role type. Usage: \`${this.usage}\`\nAvailable roles: ${Object.keys(SPECIAL_ROLES).join(', ')}`,
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
      
      // Look for existing role or create a new one
      let role = message.guild.roles.cache.find(r => r.name === roleInfo.name);
      
      if (!role) {
        // Create the role if it doesn't exist
        role = await message.guild.roles.create({
          name: roleInfo.name,
          color: roleInfo.color,
          reason: `SWOOSH Special Role created by ${message.author.tag}`,
          hoist: true, // Show role separately in member list
          mentionable: true
        });
        
        console.log(`Created new role: ${roleInfo.name}`);
      }
      
      // Assign role to the user
      await targetUser.roles.add(role);
      
      // Create embed for confirmation
      const embed = new EmbedBuilder()
        .setTitle('🎭 Special Role Assigned')
        .setDescription(`${targetUser.toString()} has been given the **${roleInfo.name}** role.`)
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
          .setDescription(`You have been granted the **${roleInfo.name}** role in ${message.guild.name}!`)
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
        console.log(`Sent DM to ${targetUser.user.tag} about new role`);
      } catch (dmError) {
        console.error(`Could not send DM to ${targetUser.user.tag}:`, dmError);
        message.channel.send(`⚠️ Note: Couldn't send a DM to ${targetUser.toString()}, they might have DMs disabled.`);
      }
      
    } catch (error) {
      console.error('Error assigning special role:', error);
      message.reply('❌ An error occurred while assigning the role. Please check if I have the required permissions.');
    }
  }
};