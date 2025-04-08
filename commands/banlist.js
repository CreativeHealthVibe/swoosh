// banlist.js - Command to list banned users
const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder 
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const logging = require('../modules/logging');

module.exports = {
  name: 'banlist',
  description: 'List all banned users in the server',
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check if user has permission to use this command
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('❌ You do not have permission to use this command.');
      }
      
      try {
        // Fetch ban list from the guild
        const guild = message.guild;
        const bans = await guild.bans.fetch();
        
        if (bans.size === 0) {
          return message.reply('✅ There are no banned users in this server.');
        }
        
        // Create pages of 10 bans each
        const bansArray = [...bans.values()];
        const pages = [];
        
        for (let i = 0; i < bansArray.length; i += 10) {
          const page = bansArray.slice(i, i + 10);
          pages.push(page);
        }
        
        // Send the first page
        let currentPage = 0;
        await sendBanPage(message, pages, currentPage);
        
        // Log the action
        logging.logAction('Ban List Requested', null, message.author, {
          count: bans.size,
          requestedBy: message.author.tag
        });
      } catch (error) {
        console.error('Ban list error:', error);
        message.reply('❌ An error occurred while trying to fetch the ban list.');
      }
    } catch (error) {
      console.error('Ban List Command Error:', error);
      message.reply('❌ An error occurred while executing the ban list command.');
      
      // Log error
      logging.logAction('Command Error', message.author, null, {
        command: 'banlist',
        error: error.message
      });
    }
  }
};

/**
 * Send a page of the ban list
 * @param {Object} message - Discord message
 * @param {Array} pages - Array of ban pages
 * @param {number} pageIndex - Current page index
 */
async function sendBanPage(message, pages, pageIndex) {
  const currentPage = pages[pageIndex];
  
  // Create description with ban entries
  let description = '';
  currentPage.forEach((ban, index) => {
    const reason = ban.reason ? ban.reason.substring(0, 30) + (ban.reason.length > 30 ? '...' : '') : 'No reason provided';
    description += `**${pageIndex * 10 + index + 1}.** ${ban.user.username} (${ban.user.id})\n`;
    description += `└ Reason: ${reason}\n`;
  });
  
  // Create embed for ban list
  const banListEmbed = new EmbedBuilder()
    .setTitle('🔨 Server Ban List')
    .setDescription(description)
    .setColor('#FF0000')
    .setFooter({ text: `Page ${pageIndex + 1}/${pages.length} • Total Bans: ${pages.reduce((count, page) => count + page.length, 0)}` })
    .setTimestamp();
  
  // Create navigation buttons if multiple pages
  let components = [];
  
  if (pages.length > 1) {
    const prevButton = new ButtonBuilder()
      .setCustomId('banlist_prev')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === 0);
      
    const nextButton = new ButtonBuilder()
      .setCustomId('banlist_next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === pages.length - 1);
      
    const row = new ActionRowBuilder().addComponents(prevButton, nextButton);
    components = [row];
  }
  
  // Send or edit message
  const reply = await message.channel.send({ 
    embeds: [banListEmbed],
    components: components
  });
  
  // Only add collector if there are multiple pages
  if (pages.length > 1) {
    const filter = (interaction) => {
      return interaction.user.id === message.author.id && 
        ['banlist_prev', 'banlist_next'].includes(interaction.customId);
    };
    
    const collector = reply.createMessageComponentCollector({ 
      filter,
      time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'banlist_prev') {
        if (pageIndex > 0) pageIndex--;
      } else if (interaction.customId === 'banlist_next') {
        if (pageIndex < pages.length - 1) pageIndex++;
      }
      
      // Update embed with new page
      const newPage = pages[pageIndex];
      let newDescription = '';
      
      newPage.forEach((ban, index) => {
        const reason = ban.reason ? ban.reason.substring(0, 30) + (ban.reason.length > 30 ? '...' : '') : 'No reason provided';
        newDescription += `**${pageIndex * 10 + index + 1}.** ${ban.user.username} (${ban.user.id})\n`;
        newDescription += `└ Reason: ${reason}\n`;
      });
      
      banListEmbed
        .setDescription(newDescription)
        .setFooter({ text: `Page ${pageIndex + 1}/${pages.length} • Total Bans: ${pages.reduce((count, page) => count + page.length, 0)}` });
      
      // Update button states
      const prevButton = ActionRowBuilder.from(reply.components[0]).components[0]
        .setDisabled(pageIndex === 0);
      
      const nextButton = ActionRowBuilder.from(reply.components[0]).components[1]
        .setDisabled(pageIndex === pages.length - 1);
      
      const newRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
      
      // Update message
      await interaction.update({ 
        embeds: [banListEmbed],
        components: [newRow]
      });
    });
    
    collector.on('end', () => {
      // Disable buttons when collector ends
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('banlist_prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('banlist_next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      
      reply.edit({ components: [disabledRow] }).catch(() => {});
    });
  }
}