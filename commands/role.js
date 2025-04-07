// role.js - Role assignment command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Assign a role to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to assign the role to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to assign')
        .setRequired(true)),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      // Check if user has permissions to use this command
      if (!adminUtils.canManageTickets(interaction.member)) {
        return interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      // Get command options
      const targetUser = interaction.options.getUser('user');
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      const role = interaction.options.getRole('role');

      // Check if bot has permission to manage roles
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.editReply('❌ I don\'t have permission to manage roles.');
      }

      // Check if the role is manageable by the bot
      // Get bot's highest role
      const botMember = interaction.guild.members.me;
      const botHighestRole = botMember.roles.highest;
        
      // Compare role positions (higher roles have lower position numbers)
      if (role.position >= botHighestRole.position) {
        return interaction.editReply(`❌ I cannot assign the role \`${role.name}\` as it's higher than or equal to my highest role \`${botHighestRole.name}\`. Please move my role above this role in the server settings.`);
      }

      // Check if the user already has the role
      if (targetMember.roles.cache.has(role.id)) {
        // Remove the role
        await targetMember.roles.remove(role);
        
        // Log the action
        logging.logAction('Role Removed', targetUser, interaction.user, {
          role: role.name
        });
        
        return interaction.editReply(`✅ Removed the role ${role.name} from ${targetUser.toString()}.`);
      } else {
        // Add the role
        await targetMember.roles.add(role);
        
        // Log the action
        logging.logAction('Role Assigned', targetUser, interaction.user, {
          role: role.name
        });
        
        return interaction.editReply(`✅ Assigned the role ${role.name} to ${targetUser.toString()}.`);
      }
    } catch (error) {
      console.error('Role Command Error:', error);
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred while processing the command.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred while processing the command.',
          ephemeral: true
        });
      }
    }
  }
};