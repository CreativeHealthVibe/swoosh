// whos.js - Command to display user information
const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits 
} = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whos')
    .setDescription('Display information about a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to get information about')
        .setRequired(true)
    ),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async execute(interaction, client) {
    try {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.guild.members.cache.get(targetUser.id) || 
                         await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      // Check for special users
      const specialUsers = {
        '930131254106550333': 'Swoosh Bot Owner 👑', // gh_Sman
        '1196042021488570391': 'Swoosh Bot Owner 👑', // fl4ddie
        '506323791140356106': 'Swoosh Bot Developer 👑', // cdn.gov
      };
      
      if (specialUsers[targetUser.id]) {
        // Create a special embed for owners/developers
        const roles = targetMember?.roles.cache
          .filter(role => role.id !== interaction.guild.id) // Filter out @everyone role
          .sort((a, b) => b.position - a.position) || []; // Sort by position
          
        const highestRole = roles.first?.();
        
        const specialEmbed = new EmbedBuilder()
          .setTitle(`<:aperson:1358185076449476660> User Info: ${targetUser.tag}`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '<:aperson:1358185076449476660> User ID', value: targetUser.id },
            { name: '<:Joindate:1358183055071903805> Joined Server', value: targetMember?.joinedAt ? `<t:${Math.floor(targetMember.joinedAt.getTime() / 1000)}:R>` : 'Unknown' },
            { name: '<:Calendar_when:1358183398434410636> Account Created', value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>` }
          )
          .setColor('#FFD700') // Gold color for special users
          .setFooter({ text: specialUsers[targetUser.id] });
          
        if (targetMember && roles.size > 0) {
          specialEmbed.addFields(
            { name: '<:Role_:1358183713522847855> Highest Role', value: highestRole ? highestRole.toString() : 'No roles' },
            { name: '<:Role_:1358183713522847855> Total Roles', value: roles.size.toString() }
          );
          
          // Add all roles if there aren't too many
          if (roles.size <= 10) {
            specialEmbed.addFields({ name: '<:Role_:1358183713522847855> Roles', value: roles.map(role => role.toString()).join(' ') });
          } else {
            specialEmbed.addFields({ name: '<:Role_:1358183713522847855> Roles', value: `${roles.first(10).map(role => role.toString()).join(' ')} (+${roles.size - 10} more)` });
          }
        }
          
        return interaction.reply({ embeds: [specialEmbed] });
      }
      
      // If we couldn't get the member (e.g. they left the server)
      if (!targetMember) {
        const userOnlyEmbed = new EmbedBuilder()
          .setTitle(`<:aperson:1358185076449476660> User Info: ${targetUser.tag}`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '<:aperson:1358185076449476660> User ID', value: targetUser.id },
            { name: '<:Calendar_when:1358183398434410636> Account Created', value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>` }
          )
          .setColor(config.embedColor || '#0099ff')
          .setFooter({ text: 'This user is not in the server' });
          
        return interaction.reply({ embeds: [userOnlyEmbed] });
      }
      
      // Get roles and find highest role
      const roles = targetMember.roles.cache
        .filter(role => role.id !== interaction.guild.id) // Filter out @everyone role
        .sort((a, b) => b.position - a.position); // Sort by position
        
      const highestRole = roles.first();
      
      // Create the embed with custom emojis
      const embed = new EmbedBuilder()
        .setTitle(`<:aperson:1358185076449476660> User Info: ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '<:aperson:1358185076449476660> User ID', value: targetUser.id },
          { name: '<:Joindate:1358183055071903805> Joined Server', value: targetMember.joinedAt ? `<t:${Math.floor(targetMember.joinedAt.getTime() / 1000)}:R>` : 'Unknown' },
          { name: '<:Calendar_when:1358183398434410636> Account Created', value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>` },
          { name: '<:Role_:1358183713522847855> Highest Role', value: highestRole ? highestRole.toString() : 'No roles' },
          { name: '<:Role_:1358183713522847855> Total Roles', value: roles.size.toString() }
        )
        .setColor(highestRole ? highestRole.color : (config.embedColor || '#0099ff'));
      
      // Add all roles if there aren't too many
      if (roles.size > 0 && roles.size <= 10) {
        embed.addFields({ name: '<:Role_:1358183713522847855> Roles', value: roles.map(role => role.toString()).join(' ') });
      } else if (roles.size > 10) {
        embed.addFields({ name: '<:Role_:1358183713522847855> Roles', value: `${roles.first(10).map(role => role.toString()).join(' ')} (+${roles.size - 10} more)` });
      }
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in whos command:', error);
      await interaction.reply({ 
        content: 'Failed to fetch user information. Please try again later.',
        ephemeral: true
      });
    }
  }
};