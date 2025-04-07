/**
 * Warn Command 
 * Issues a warning to a user
 */
const logging = require('../modules/logging');
const db = require('../utils/database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'warn',
  description: 'Warn a user',
  usage: 'warn <@user> <reason>',
  permissions: ['MODERATE_MEMBERS', 'BAN_MEMBERS', 'KICK_MEMBERS'],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    // Check for proper arguments
    if (!args.length || args.length < 2) {
      return message.channel.send(`⚠️ Usage: \`${this.usage}\``);
    }
    
    // Get the user
    const userMention = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ');
    
    if (!reason) {
      return message.channel.send('⚠️ You must provide a reason for the warning.');
    }
    
    try {
      // Try to get member from the guild
      let member;
      let user;
      
      try {
        member = await message.guild.members.fetch(userMention);
        user = member.user;
      } catch {
        // If not in guild, try to get from API
        try {
          user = await client.users.fetch(userMention);
        } catch {
          return message.channel.send('⚠️ Could not find that user.');
        }
      }
      
      // Don't allow warning bots or self
      if (user.bot) {
        return message.channel.send('❌ You cannot warn a bot.');
      }
      if (user.id === message.author.id) {
        return message.channel.send('❌ You cannot warn yourself.');
      }
      
      // If user is a member, check if they can be warned (hierarchy check)
      if (member) {
        // Get author as guild member to check roles
        const author = await message.guild.members.fetch(message.author.id);
        
        if (member.roles.highest.position >= author.roles.highest.position && author.id !== message.guild.ownerId) {
          return message.channel.send('❌ You cannot warn users with a higher or equal role position.');
        }
      }
      
      // Ensure warnings collection exists
      await ensureWarningsCollection();
      
      // Send DM to the user with the warning
      let dmSent = true;
      try {
        await user.send(
          `⚠️ **Warning from ${message.guild.name}**\nYou have been warned by ${message.author.username}.\nReason: ${reason}`
        );
      } catch (error) {
        dmSent = false;
        console.warn(`Failed to send warning DM to ${user.username} (${user.id}): ${error.message}`);
      }
      
      // Record the warning in the database
      const warningData = {
        userId: user.id,
        username: user.username,
        guildId: message.guild.id,
        guildName: message.guild.name,
        reason: reason,
        timestamp: new Date(),
        issuer: message.author.username,
        issuerId: message.author.id
      };
      
      await db.addToCollection('warnings', warningData);
      
      // Get total warning count for this user in this guild
      const warnings = await db.getFromCollection('warnings', { 
        userId: user.id,
        guildId: message.guild.id 
      });
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle('Warning Issued')
        .setDescription(`**${user.username}** has been warned.`)
        .addFields(
          { name: 'User', value: `<@${user.id}>`, inline: true },
          { name: 'Warned by', value: `<@${message.author.id}>`, inline: true },
          { name: 'Warning Count', value: warnings.length.toString(), inline: true },
          { name: 'Reason', value: reason }
        )
        .setFooter({ text: `ID: ${user.id}` })
        .setTimestamp();
      
      if (!dmSent) {
        embed.addFields({ name: 'Note', value: "⚠️ Could not send a DM to this user."});
      }
      
      // Send confirmation to channel (without pinging)
      await message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.info(`${message.author.username} warned ${user.username} (${user.id}) in ${message.guild.name}. Reason: ${reason}`);
      
      // Log action using the logging module
      logging.logAction('User Warned', user, message.author, {
        reason: reason,
        channel: message.channel
      });
      
    } catch (error) {
      console.error(`Error executing warn command: ${error.message}`);
      message.channel.send('❌ An error occurred while warning this user.');
    }
  }
};

/**
 * Create "warnings" collection if it doesn't exist
 */
async function ensureWarningsCollection() {
  try {
    const collections = await db.listCollections();
    if (!collections.includes('warnings')) {
      await db.createCollection('warnings');
      console.info('Created warnings collection');
    }
  } catch (error) {
    console.error(`Error ensuring warnings collection: ${error.message}`);
  }
}