// blacklists.js - Command to display all blacklisted users
const { 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');
const blacklistManager = require('../handlers/blacklistManager');
const logging = require('../modules/logging');

module.exports = {
  name: 'blacklists',
  description: 'Display all blacklisted users',
  usage: '.blacklists',
  adminOnly: true,
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Check if user has required permissions
      if (!adminUtils.isAdmin(message.member)) {
        return message.reply('You do not have permission to use this command.');
      }
      
      // Log command usage
      logging.logCommandUsage(message.author, this.name, args);
      
      // Get the blacklist
      const blacklist = blacklistManager.getBlacklist();
      
      if (blacklist.length === 0) {
        return message.reply('The blacklist is currently empty.');
      }
      
      // Sort by timestamp (newest first)
      blacklist.sort((a, b) => b.timestamp - a.timestamp);
      
      // Create pages with 5 entries per page
      const itemsPerPage = 5;
      const pages = [];
      
      for (let i = 0; i < blacklist.length; i += itemsPerPage) {
        pages.push(blacklist.slice(i, i + itemsPerPage));
      }
      
      let currentPage = 0;
      await sendBlacklistPage(message, pages, currentPage);
      
    } catch (error) {
      console.error('Error executing blacklists command:', error);
      message.reply('An error occurred while executing this command.');
    }
  }
};

/**
 * Send a page of the blacklist
 * @param {Object} message - Discord message
 * @param {Array} pages - Array of blacklist pages
 * @param {number} pageIndex - Current page index
 */
async function sendBlacklistPage(message, pages, pageIndex) {
  const currentPage = pages[pageIndex];
  const totalPages = pages.length;
  
  // Create the embed
  const embed = new EmbedBuilder()
    .setTitle('Blacklisted Users')
    .setDescription('List of all users who have been blacklisted from the server.')
    .setColor(config.embedColor)
    .setFooter({ text: `Page ${pageIndex + 1}/${totalPages}` })
    .setTimestamp();
  
  // Add each blacklisted user to the embed
  currentPage.forEach((user, index) => {
    // Format the date
    const date = new Date(user.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    embed.addFields({
      name: `${index + 1 + (pageIndex * 5)}. ${user.username}`,
      value: `**ID:** ${user.userId}\n**Reason:** ${user.reason}\n**Blacklisted By:** ${user.moderatorTag}\n**Date:** ${date}`
    });
  });
  
  // Create navigation buttons if there are multiple pages
  let components = [];
  
  if (totalPages > 1) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === totalPages - 1)
      );
    
    components.push(row);
  }
  
  const reply = await message.reply({
    embeds: [embed],
    components: components
  });
  
  // If there's only one page, no need for a collector
  if (totalPages <= 1) return;
  
  // Create button collector
  const filter = i => 
    i.customId === 'prev_page' || 
    i.customId === 'next_page';
  
  const collector = reply.createMessageComponentCollector({
    filter,
    time: 60000 // 1 minute
  });
  
  collector.on('collect', async interaction => {
    // Only allow the command user to interact with buttons
    if (interaction.user.id !== message.author.id) {
      return interaction.reply({
        content: 'You cannot use these buttons as you did not run the command.',
        ephemeral: true
      });
    }
    
    // Update the current page based on button pressed
    if (interaction.customId === 'prev_page') {
      pageIndex = Math.max(0, pageIndex - 1);
    } else if (interaction.customId === 'next_page') {
      pageIndex = Math.min(totalPages - 1, pageIndex + 1);
    }
    
    // Create updated embed for the new page
    const newEmbed = new EmbedBuilder()
      .setTitle('Blacklisted Users')
      .setDescription('List of all users who have been blacklisted from the server.')
      .setColor(config.embedColor)
      .setFooter({ text: `Page ${pageIndex + 1}/${totalPages}` })
      .setTimestamp();
    
    // Add each blacklisted user to the embed
    pages[pageIndex].forEach((user, index) => {
      // Format the date
      const date = new Date(user.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      newEmbed.addFields({
        name: `${index + 1 + (pageIndex * 5)}. ${user.username}`,
        value: `**ID:** ${user.userId}\n**Reason:** ${user.reason}\n**Blacklisted By:** ${user.moderatorTag}\n**Date:** ${date}`
      });
    });
    
    // Update navigation buttons
    const newRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === totalPages - 1)
      );
    
    // Update the message with the new page
    await interaction.update({
      embeds: [newEmbed],
      components: [newRow]
    });
  });
  
  collector.on('end', async () => {
    // Remove buttons when collector expires
    try {
      await reply.edit({
        embeds: [embed],
        components: []
      });
    } catch (error) {
      console.error('Error removing buttons:', error);
    }
  });
}