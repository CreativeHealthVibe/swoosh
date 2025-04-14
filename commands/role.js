// role.js - Legacy command for role management
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const adminUtils = require('../utils/admin');
const config = require('../config');
const logging = require('../modules/logging');

module.exports = {
  name: 'role',
  description: 'Role management command',
  usage: '.role all <@role> [--bots] [--no-humans]',
  category: 'admin',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check permissions
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ You need Administrator permission to use this command.');
      }
      
      // Check for arguments
      if (args.length < 2) {
        return message.reply(`❌ Invalid usage. Try: \`${this.usage}\``);
      }
      
      const subcommand = args[0].toLowerCase();
      
      if (subcommand === 'all') {
        // Mass role assignment with .role all
        return handleRoleAll(message, args.slice(1), client);
      } else {
        return message.reply(`❌ Invalid subcommand. Available subcommands: \`all\`. Try: \`${this.usage}\``);
      }
      
    } catch (error) {
      console.error('Role Command Error:', error);
      message.reply('❌ An error occurred while executing the command.');
    }
  }
};

/**
 * Handle the role all subcommand
 * @param {Object} message - Discord message
 * @param {Array} args - Command arguments after the subcommand
 * @param {Object} client - Discord client
 */
async function handleRoleAll(message, args, client) {
  try {
    // Options parsing
    let includeBots = false;
    let includeHumans = true;
    let role = null;
    
    // Parse arguments
    for (const arg of args) {
      if (arg === '--bots') {
        includeBots = true;
        continue;
      }
      if (arg === '--no-humans') {
        includeHumans = false;
        continue;
      }
      
      // Try to extract role from mention
      if (arg.startsWith('<@&') && arg.endsWith('>')) {
        const roleId = arg.slice(3, -1);
        role = message.guild.roles.cache.get(roleId);
      }
    }
    
    // Make sure a role was mentioned
    if (!role) {
      return message.reply('❌ Please mention a role to assign. Example: `.role all @Role`');
    }
    
    // Check if the role is manageable by the bot
    // Get bot's highest role
    const botMember = message.guild.members.me;
    const botHighestRole = botMember.roles.highest;
    
    // Compare role positions (higher roles have lower position numbers)
    if (role.position >= botHighestRole.position) {
      return message.reply(`❌ I cannot assign the role \`${role.name}\` as it's higher than or equal to my highest role \`${botHighestRole.name}\`. Please move my role above this role in the server settings.`);
    }
    
    // Check if bot has permission to manage roles
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('❌ I don\'t have permission to manage roles.');
    }
    
    // Initial progress message
    const progressEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📝 Adding Role to All Members')
      .setDescription(`Starting to add \`${role.name}\` to all members...`)
      .setFooter({ text: 'This may take some time depending on server size.' });
    
    const progressMessage = await message.reply({ embeds: [progressEmbed] });
    
    // Fetch all guild members (this can take time for large guilds)
    const members = await message.guild.members.fetch();
    
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
    await progressMessage.edit({ embeds: [progressEmbed] });
    
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
        await progressMessage.edit({ embeds: [progressEmbed] });
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
    logging.logAction('Mass Role Assignment', null, message.author, {
      role: role.name,
      membersCount: totalToUpdate,
      successCount: successCount,
      errorCount: errorCount
    });
    
    return progressMessage.edit({ embeds: [resultsEmbed] });
  } catch (error) {
    console.error('Role All Command Error:', error);
    message.reply('❌ An error occurred while processing the command.');
  }
}