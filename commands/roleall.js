// roleall.js - Add a role to all server members
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const adminUtils = require('../utils/admin');
const config = require('../config');
const logging = require('../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Add a role to all server members')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to assign to all members')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('bots')
        .setDescription('Whether to include bots (default: false)')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('humans')
        .setDescription('Whether to include humans (default: true)')
        .setRequired(false))
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      // Check if user has administrator permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need Administrator permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      // Get command options
      const role = interaction.options.getRole('role');
      const includeBots = interaction.options.getBoolean('bots') ?? false;
      const includeHumans = interaction.options.getBoolean('humans') ?? true;

      // Check if the role is manageable by the bot
      // Get bot's highest role
      const botMember = interaction.guild.members.me;
      const botHighestRole = botMember.roles.highest;
        
      // Compare role positions (higher roles have lower position numbers)
      if (role.position >= botHighestRole.position) {
        return interaction.editReply(`❌ I cannot assign the role \`${role.name}\` as it's higher than or equal to my highest role \`${botHighestRole.name}\`. Please move my role above this role in the server settings.`);
      }

      // Check if bot has permission to manage roles
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.editReply('❌ I don\'t have permission to manage roles.');
      }

      // Initial progress message
      const progressEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📝 Adding Role to All Members')
        .setDescription(`Starting to add \`${role.name}\` to all members...`)
        .setFooter({ text: 'This may take some time depending on server size.' });
      
      await interaction.editReply({ embeds: [progressEmbed] });

      // Fetch all guild members (this can take time for large guilds)
      const members = await interaction.guild.members.fetch();
      
      // Filter members based on options
      const filteredMembers = members.filter(member => {
        if (member.user.bot) return includeBots;
        return includeHumans;
      });

      // Skip members that already have the role
      const membersToUpdate = filteredMembers.filter(member => !member.roles.cache.has(role.id));
      const totalToUpdate = membersToUpdate.size;
      
      // Update progress message
      progressEmbed.setDescription(`Adding \`${role.name}\` to ${totalToUpdate} members...`);
      await interaction.editReply({ embeds: [progressEmbed] });

      // Add role to members in batches to avoid rate limiting
      let successCount = 0;
      let errorCount = 0;
      const BATCH_SIZE = 10; // Process 10 members at a time
      
      const memberArray = [...membersToUpdate.values()];
      
      for (let i = 0; i < memberArray.length; i += BATCH_SIZE) {
        const batch = memberArray.slice(i, i + BATCH_SIZE);
        
        // Update progress every few batches
        if (i % 50 === 0 && i > 0) {
          progressEmbed.setDescription(`Progress: ${i}/${totalToUpdate} members processed...`);
          await interaction.editReply({ embeds: [progressEmbed] });
        }
        
        // Process each member in the batch
        await Promise.all(batch.map(async (member) => {
          try {
            await member.roles.add(role);
            successCount++;
          } catch (error) {
            console.error(`Error adding role to ${member.user.tag}:`, error);
            errorCount++;
          }
        }));
        
        // Small delay between batches to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Create final results embed
      const resultsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('✅ Role Assignment Complete')
        .setDescription(`Role \`${role.name}\` has been processed for all members.`)
        .addFields(
          { name: 'Total Members Processed', value: totalToUpdate.toString(), inline: true },
          { name: 'Successfully Added', value: successCount.toString(), inline: true },
          { name: 'Errors', value: errorCount.toString(), inline: true }
        )
        .setTimestamp();

      // Log the action
      logging.logAction('Mass Role Assignment', null, interaction.user, {
        role: role.name,
        membersCount: totalToUpdate,
        successCount: successCount,
        errorCount: errorCount
      });

      return interaction.editReply({ embeds: [resultsEmbed] });
    } catch (error) {
      console.error('Role All Command Error:', error);
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