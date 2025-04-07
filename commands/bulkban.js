const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'bulkban',
  description: 'Ban multiple users at once by ID',
  usage: 'bulkban <userIds> [reason]',
  permissions: ['BAN_MEMBERS'],
  category: 'Moderation',
  aliases: ['massban', 'multiban'],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    // Check permissions
    if (!message.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
      return message.reply('You do not have permission to ban members.');
    }
    
    // Check if the bot has permission to ban
    if (!message.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
      return message.reply('I do not have permission to ban members.');
    }
    
    // Check for arguments
    if (!args.length) {
      return message.reply('Please provide user IDs to ban, separated by spaces.');
    }
    
    // Parse user IDs and reason from the arguments
    let userIds = [];
    let reason = 'No reason provided';
    
    // First, try to find all IDs (18-digit numbers)
    args.forEach(arg => {
      if (/^\d{17,19}$/.test(arg)) {
        userIds.push(arg);
      }
    });
    
    // Next, check if there's a reason after the IDs
    if (args.length > userIds.length) {
      const reasonStart = args.findIndex(arg => !/^\d{17,19}$/.test(arg));
      if (reasonStart !== -1) {
        reason = args.slice(reasonStart).join(' ');
      }
    }
    
    if (userIds.length === 0) {
      return message.reply('No valid user IDs provided. Please provide valid Discord user IDs.');
    }
    
    // Log action
    const logPath = path.join(__dirname, '../logs/actions.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - [BULKBAN] ${message.author.tag} (${message.author.id}) bulk banned ${userIds.length} users: ${userIds.join(', ')} with reason: ${reason}\n`);
    
    // Send a message that we're processing the bans
    const responseEmbed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle('⚠️ Bulk Ban Processing')
      .setDescription(`Processing bans for ${userIds.length} users...`)
      .setTimestamp();
    
    const responseMsg = await message.channel.send({ embeds: [responseEmbed] });
    
    // Process the bans
    const results = {
      success: [],
      failed: []
    };
    
    for (const userId of userIds) {
      try {
        // Fetch the user to get their username if possible
        let user;
        try {
          user = await client.users.fetch(userId);
        } catch (error) {
          // User not found, but we can still ban the ID
          user = { id: userId, tag: `Unknown User (${userId})` };
        }
        
        // Attempt to ban
        await message.guild.members.ban(userId, { reason: `${reason} (Banned by ${message.author.tag})` });
        
        // If successful, add to success list
        results.success.push(user);
      } catch (error) {
        // If failed, add to failed list
        console.error(`Error banning user ${userId}:`, error);
        results.failed.push({ id: userId, error: error.message });
      }
    }
    
    // Create a results embed
    const resultsEmbed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle('🔨 Bulk Ban Results')
      .setDescription(`Banned ${results.success.length} out of ${userIds.length} users`)
      .addField('Reason', reason)
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();
    
    if (results.success.length > 0) {
      const successText = results.success.map(user => `\`${user.tag || user.id}\``).join(', ');
      resultsEmbed.addField(`✅ Successfully Banned (${results.success.length})`, 
        successText.length > 1024 ? `${successText.substring(0, 1020)}...` : successText);
    }
    
    if (results.failed.length > 0) {
      const failedText = results.failed.map(user => `\`${user.id}\`: ${user.error}`).join('\n');
      resultsEmbed.addField(`❌ Failed to Ban (${results.failed.length})`, 
        failedText.length > 1024 ? `${failedText.substring(0, 1020)}...` : failedText);
    }
    
    // Update the response message with the results
    responseMsg.edit({ embeds: [resultsEmbed] });
  }
};