const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'deleteroles',
  description: 'Delete all roles below the bot\'s highest role',
  usage: 'deleteroles [--force]',
  permissions: ['ADMINISTRATOR', 'MANAGE_ROLES'],
  category: 'Moderation',
  aliases: ['purgeroles', 'clearroles'],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    // Check permissions
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return message.reply('You need Administrator permission to use this command.');
    }
    
    // Check if the bot has permission to manage roles
    if (!message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      return message.reply('I do not have permission to manage roles.');
    }
    
    // Check if --force flag is provided
    const forceMode = args.includes('--force');
    
    if (!forceMode) {
      // Send confirmation message
      const confirmEmbed = new MessageEmbed()
        .setColor('#ff9900')
        .setTitle('⚠️ Delete All Roles - Confirmation')
        .setDescription(
          'This command will delete **all roles** below my highest role. This action cannot be undone!\n\n' +
          'To confirm, run the command again with the `--force` flag:\n' +
          `\`${client.config.prefix}deleteroles --force\``
        )
        .addField('Excluded Roles', 'The following will NOT be deleted:\n- @everyone role\n- Roles positioned above my highest role')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      return message.channel.send({ embeds: [confirmEmbed] });
    }
    
    // Get all roles in the guild
    const allRoles = message.guild.roles.cache;
    
    // Get the bot's highest role position
    const botMember = message.guild.me;
    const botHighestRole = botMember.roles.highest;
    
    // Filter roles that we can delete (below the bot's highest role and not @everyone)
    const deletableRoles = allRoles.filter(role => 
      role.position < botHighestRole.position && !role.managed && role.id !== message.guild.id
    );
    
    if (deletableRoles.size === 0) {
      return message.reply('There are no roles that I can delete.');
    }
    
    // Send processing message
    const processingEmbed = new MessageEmbed()
      .setColor('#ff9900')
      .setTitle('⚠️ Deleting Roles')
      .setDescription(`Processing deletion of ${deletableRoles.size} roles...`)
      .setTimestamp();
    
    const processingMsg = await message.channel.send({ embeds: [processingEmbed] });
    
    // Log action
    const logPath = path.join(__dirname, '../logs/actions.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - [DELETEROLES] ${message.author.tag} (${message.author.id}) deleted ${deletableRoles.size} roles in ${message.guild.name} (${message.guild.id})\n`);
    
    // Delete roles and track results
    const results = {
      success: [],
      failed: []
    };
    
    for (const [id, role] of deletableRoles) {
      try {
        const roleName = role.name;
        await role.delete(`Requested by ${message.author.tag}`);
        results.success.push({ id, name: roleName });
      } catch (error) {
        console.error(`Error deleting role ${role.name} (${role.id}):`, error);
        results.failed.push({ id, name: role.name, error: error.message });
      }
    }
    
    // Create results embed
    const resultsEmbed = new MessageEmbed()
      .setColor('#ff9900')
      .setTitle('🗑️ Role Deletion Results')
      .setDescription(`Deleted ${results.success.length} out of ${deletableRoles.size} roles`)
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();
    
    if (results.success.length > 0) {
      const successText = results.success.map(role => `\`${role.name}\``).join(', ');
      resultsEmbed.addField(`✅ Successfully Deleted (${results.success.length})`, 
        successText.length > 1024 ? `${successText.substring(0, 1020)}...` : successText);
    }
    
    if (results.failed.length > 0) {
      const failedText = results.failed.map(role => `\`${role.name}\`: ${role.error}`).join('\n');
      resultsEmbed.addField(`❌ Failed to Delete (${results.failed.length})`, 
        failedText.length > 1024 ? `${failedText.substring(0, 1020)}...` : failedText);
    }
    
    // Update the processing message with results
    processingMsg.edit({ embeds: [resultsEmbed] });
  }
};