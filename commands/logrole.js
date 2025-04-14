// logrole.js - Command to set roles that users get when performing loggable actions
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logrole')
    .setDescription('Configure roles that get added to users when they perform loggable actions')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a role for a specific log action')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('The log action to assign a role for')
            .setRequired(true)
            .addChoices(
              { name: 'Message Deleted', value: 'messageDeleted' },
              { name: 'Message Edited', value: 'messageEdited' },
              { name: 'User Banned', value: 'userBanned' },
              { name: 'User Kicked', value: 'userKicked' },
              { name: 'User Warned', value: 'userWarned' },
              { name: 'Command Used', value: 'commandUsed' },
              { name: 'Any Action', value: 'anyAction' }
            ))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to assign (leave blank to clear)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all roles that get assigned for log actions'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable or disable automatic role assignment for logs')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Whether role assignment is enabled')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      // Only server administrators can use this command
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need Administrator permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();
      
      // Get subcommand
      const subcommand = interaction.options.getSubcommand();
      
      // Load current configuration
      const guildId = interaction.guild.id;
      let guildConfig = config.getGuildConfig(guildId) || {};
      
      // Initialize log roles configuration if it doesn't exist
      if (!guildConfig.actionRoles) {
        guildConfig.actionRoles = {
          enabled: false,
          roles: {}
        };
      }
      
      // Handle each subcommand
      switch (subcommand) {
        case 'set':
          await handleSetRole(interaction, guildConfig);
          break;
          
        case 'list':
          await handleListRoles(interaction, guildConfig);
          break;
          
        case 'enable':
          await handleEnableRoles(interaction, guildConfig);
          break;
      }
      
    } catch (error) {
      console.error('LogRole Command Error:', error);
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred while managing log action roles.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred while managing log action roles.',
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Handle setting a role for a log action
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleSetRole(interaction, guildConfig) {
  const action = interaction.options.getString('action');
  const role = interaction.options.getRole('role');
  
  // Ensure roles object exists
  if (!guildConfig.actionRoles.roles) {
    guildConfig.actionRoles.roles = {};
  }
  
  // If no role provided, remove the configuration for this action
  if (!role) {
    delete guildConfig.actionRoles.roles[action];
    config.saveGuildConfig(interaction.guild.id, guildConfig);
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Log Action Role Removed')
      .setDescription(`Successfully removed role assignment for the \`${formatActionName(action)}\` action`)
      .setColor('#FF9900')
      .setFooter({ text: 'Users will no longer receive a role for this action' })
      .setTimestamp();
    
    return interaction.editReply({ embeds: [embed] });
  }
  
  // Set role for action
  guildConfig.actionRoles.roles[action] = role.id;
  config.saveGuildConfig(interaction.guild.id, guildConfig);
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setTitle('✅ Log Action Role Set')
    .setDescription(`Users will now receive the ${role.name} role when they perform: \`${formatActionName(action)}\``)
    .setColor('#00FF00')
    .addFields(
      { 
        name: 'Role', 
        value: `<@&${role.id}>`, 
        inline: true 
      },
      { 
        name: 'Action', 
        value: formatActionName(action), 
        inline: true 
      },
      {
        name: 'Status',
        value: guildConfig.actionRoles.enabled ? '✅ Enabled' : '❌ Disabled',
        inline: true
      }
    )
    .setFooter({ 
      text: guildConfig.actionRoles.enabled ? 
        'Role assignment is currently enabled' : 
        'Role assignment is currently disabled. Use /logrole enable true to enable it'
    })
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle listing all roles for log actions
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleListRoles(interaction, guildConfig) {
  // Create embed for response
  const embed = new EmbedBuilder()
    .setTitle('Log Action Roles')
    .setColor('#3498DB')
    .setTimestamp();
    
  // Add status field
  embed.addFields({
    name: 'Status',
    value: guildConfig.actionRoles.enabled ? '✅ Enabled' : '❌ Disabled'
  });
  
  // Check if any roles are configured
  if (!guildConfig.actionRoles.roles || Object.keys(guildConfig.actionRoles.roles).length === 0) {
    embed.setDescription('No roles have been configured for log actions.');
    embed.setFooter({ text: 'Use /logrole set to configure roles for specific actions' });
    return interaction.editReply({ embeds: [embed] });
  }
  
  // Add each configured role to the embed
  for (const [action, roleId] of Object.entries(guildConfig.actionRoles.roles)) {
    const role = interaction.guild.roles.cache.get(roleId);
    const roleValue = role ? `<@&${roleId}>` : `Unknown role (${roleId})`;
    
    embed.addFields({ 
      name: formatActionName(action), 
      value: roleValue
    });
  }
  
  embed.setFooter({ 
    text: guildConfig.actionRoles.enabled ? 
      'Users will receive these roles when performing the associated actions' : 
      'Role assignment is currently disabled. Use /logrole enable true to enable it'
  });
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle enabling/disabling role assignment
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleEnableRoles(interaction, guildConfig) {
  const enabled = interaction.options.getBoolean('enabled');
  
  // Update configuration
  guildConfig.actionRoles.enabled = enabled;
  config.saveGuildConfig(interaction.guild.id, guildConfig);
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setTitle(`${enabled ? '✅ Enabled' : '❌ Disabled'} Log Action Roles`)
    .setDescription(`Successfully ${enabled ? 'enabled' : 'disabled'} automatic role assignment for log actions`)
    .setColor(enabled ? '#00FF00' : '#FF9900')
    .setTimestamp();
  
  // Check if any roles are configured
  if (!guildConfig.actionRoles.roles || Object.keys(guildConfig.actionRoles.roles).length === 0) {
    embed.setFooter({ text: 'No roles have been configured yet. Use /logrole set to configure roles for specific actions' });
  } else {
    const configuredRoles = Object.keys(guildConfig.actionRoles.roles).length;
    embed.setFooter({ text: `You have ${configuredRoles} configured action roles` });
  }
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Format action name for display
 * @param {string} action - The action identifier
 * @returns {string} - Formatted action name
 */
function formatActionName(action) {
  switch (action) {
    case 'messageDeleted':
      return 'Message Deleted';
    case 'messageEdited':
      return 'Message Edited';
    case 'userBanned':
      return 'User Banned';
    case 'userKicked':
      return 'User Kicked';
    case 'userWarned':
      return 'User Warned';
    case 'commandUsed':
      return 'Command Used';
    case 'anyAction':
      return 'Any Loggable Action';
    default:
      return action;
  }
}