// setlogroles.js - Command to set which roles can access log channels
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogroles')
    .setDescription('Set which roles have access to log channels')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to log channels access')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to give access to log channels')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from log channels access')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove access from log channels')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all roles with access to log channels'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('sync')
        .setDescription('Sync permissions for all log channels'))
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
      
      // Initialize log roles array if it doesn't exist
      if (!guildConfig.logRoles) {
        guildConfig.logRoles = [];
      }
      
      // Handle each subcommand
      switch (subcommand) {
        case 'add':
          await handleAddRole(interaction, guildConfig);
          break;
          
        case 'remove':
          await handleRemoveRole(interaction, guildConfig);
          break;
          
        case 'list':
          await handleListRoles(interaction, guildConfig);
          break;
          
        case 'sync':
          await handleSyncPermissions(interaction, guildConfig);
          break;
      }
      
    } catch (error) {
      console.error('SetLogRoles Command Error:', error);
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred while managing log roles.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred while managing log roles.',
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Handle adding a role to log channel access
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleAddRole(interaction, guildConfig) {
  const role = interaction.options.getRole('role');
  
  // Check if role is already in the list
  if (guildConfig.logRoles.includes(role.id)) {
    return interaction.editReply({
      content: `⚠️ The role ${role.name} already has access to log channels.`,
      ephemeral: true
    });
  }
  
  // Add role to list
  guildConfig.logRoles.push(role.id);
  
  // Save configuration
  config.saveGuildConfig(interaction.guild.id, guildConfig);
  
  // Apply permissions to all log channels
  const updatedChannels = await syncLogChannelPermissions(interaction.guild, guildConfig);
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setTitle('✅ Log Role Added')
    .setDescription(`Successfully added ${role.name} to log channels access`)
    .setColor('#00FF00')
    .addFields(
      { 
        name: 'Role', 
        value: `<@&${role.id}>`, 
        inline: true 
      },
      { 
        name: 'Channels Updated', 
        value: updatedChannels > 0 ? `${updatedChannels} channels` : 'No log channels configured', 
        inline: true 
      }
    )
    .setFooter({ 
      text: 'Use /setlogroles sync to manually update permissions if needed' 
    })
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle removing a role from log channel access
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleRemoveRole(interaction, guildConfig) {
  const role = interaction.options.getRole('role');
  
  // Check if role is in the list
  if (!guildConfig.logRoles.includes(role.id)) {
    return interaction.editReply({
      content: `⚠️ The role ${role.name} doesn't have special access to log channels.`,
      ephemeral: true
    });
  }
  
  // Remove role from list
  guildConfig.logRoles = guildConfig.logRoles.filter(id => id !== role.id);
  
  // Save configuration
  config.saveGuildConfig(interaction.guild.id, guildConfig);
  
  // Apply permissions to all log channels
  const updatedChannels = await syncLogChannelPermissions(interaction.guild, guildConfig);
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setTitle('✅ Log Role Removed')
    .setDescription(`Successfully removed ${role.name} from log channels access`)
    .setColor('#FF9900')
    .addFields(
      { 
        name: 'Role', 
        value: `<@&${role.id}>`, 
        inline: true 
      },
      { 
        name: 'Channels Updated', 
        value: updatedChannels > 0 ? `${updatedChannels} channels` : 'No log channels configured', 
        inline: true 
      }
    )
    .setFooter({ 
      text: 'This role will now follow server-wide permission settings for log channels' 
    })
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle listing all roles with log channel access
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleListRoles(interaction, guildConfig) {
  // Get all configured log channels
  const logChannels = getConfiguredLogChannels(guildConfig);
  
  // Create embed for response
  const embed = new EmbedBuilder()
    .setTitle('Log Channel Access Roles')
    .setColor('#3498DB')
    .setTimestamp();
    
  // Add roles to embed
  if (guildConfig.logRoles && guildConfig.logRoles.length > 0) {
    const roleList = guildConfig.logRoles.map(roleId => {
      const role = interaction.guild.roles.cache.get(roleId);
      return role ? `<@&${roleId}>` : `Unknown role (${roleId})`;
    }).join('\n');
    
    embed.addFields({ 
      name: 'Roles with Access', 
      value: roleList
    });
  } else {
    embed.setDescription('No special roles have been configured for log channel access.');
  }
  
  // Add log channels field
  if (logChannels.length > 0) {
    const channelList = logChannels.map(channelId => {
      return `<#${channelId}>`;
    }).join('\n');
    
    embed.addFields({ 
      name: 'Configured Log Channels', 
      value: channelList
    });
  } else {
    embed.setFooter({
      text: 'No log channels are currently configured. Use /setlogs to set them up.'
    });
  }
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle syncing permissions for all log channels
 * @param {Object} interaction - Discord interaction
 * @param {Object} guildConfig - Guild configuration object
 */
async function handleSyncPermissions(interaction, guildConfig) {
  // Apply permissions to all log channels
  const updatedChannels = await syncLogChannelPermissions(interaction.guild, guildConfig);
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setTitle('✅ Log Channel Permissions Synced')
    .setDescription('Successfully updated permissions for all log channels')
    .setColor('#00FF00')
    .addFields({
      name: 'Channels Updated', 
      value: updatedChannels > 0 ? `${updatedChannels} channels` : 'No log channels configured'
    })
    .setTimestamp();
  
  if (guildConfig.logRoles && guildConfig.logRoles.length > 0) {
    const roleList = guildConfig.logRoles.map(roleId => {
      const role = interaction.guild.roles.cache.get(roleId);
      return role ? `<@&${roleId}>` : `Unknown role (${roleId})`;
    }).join('\n');
    
    embed.addFields({ 
      name: 'Roles with Access', 
      value: roleList
    });
  } else {
    embed.setFooter({
      text: 'No special roles are configured for log access. Use /setlogroles add to configure them.'
    });
  }
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Apply permissions to all log channels
 * @param {Object} guild - Discord guild
 * @param {Object} guildConfig - Guild configuration
 * @returns {Number} - Number of updated channels
 */
async function syncLogChannelPermissions(guild, guildConfig) {
  // Get all configured log channels
  const logChannelIds = getConfiguredLogChannels(guildConfig);
  let updatedCount = 0;
  
  // Nothing to do if no log channels or no log roles
  if (logChannelIds.length === 0 || !guildConfig.logRoles || guildConfig.logRoles.length === 0) {
    return updatedCount;
  }
  
  // Update permissions for each log channel
  for (const channelId of logChannelIds) {
    try {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;
      
      // Hide channel from everyone except those with special access
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: false
      });
      
      // Add permission for each role
      for (const roleId of guildConfig.logRoles) {
        const role = guild.roles.cache.get(roleId);
        if (!role) continue;
        
        await channel.permissionOverwrites.edit(role, {
          ViewChannel: true,
          ReadMessageHistory: true
        });
      }
      
      updatedCount++;
    } catch (error) {
      console.error(`Error updating permissions for channel ${channelId}:`, error);
    }
  }
  
  return updatedCount;
}

/**
 * Get all configured log channel IDs
 * @param {Object} guildConfig - Guild configuration
 * @returns {Array} - Array of channel IDs
 */
function getConfiguredLogChannels(guildConfig) {
  const channels = [];
  
  // Add general log channel if configured
  if (guildConfig.logChannelId) {
    channels.push(guildConfig.logChannelId);
  }
  
  // Add specific log channels if configured
  if (guildConfig.loggingChannels) {
    for (const key in guildConfig.loggingChannels) {
      if (guildConfig.loggingChannels[key] && !channels.includes(guildConfig.loggingChannels[key])) {
        channels.push(guildConfig.loggingChannels[key]);
      }
    }
  }
  
  return channels;
}