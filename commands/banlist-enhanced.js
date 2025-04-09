/**
 * Enhanced Ban List Command
 * Shows a paginated list of banned users with advanced filtering options
 */

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logParser = require('../modules/log-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'banlist-enhanced',
  aliases: ['banlist-e', 'bans-e'],
  description: 'Enhanced version of the ban list command with filtering options',
  usage: '[page] [--user=ID] [--reason=text] [--date=YYYY-MM-DD]',
  category: 'moderation',
  permissions: ['BAN_MEMBERS'],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    // Check if user has permission to see banned users
    if (!message.member.permissions.has('BAN_MEMBERS')) {
      return message.reply('You do not have permission to view the ban list.');
    }
    
    // Begin with loading state
    const loadingEmbed = new MessageEmbed()
      .setTitle('Ban List')
      .setDescription('Loading ban data...')
      .setColor('#ffcc00');
    
    const loadingMessage = await message.channel.send({ embeds: [loadingEmbed] });
    
    try {
      // Fetch ban list from Discord
      const banList = await message.guild.bans.fetch();
      
      if (banList.size === 0) {
        loadingEmbed.setDescription('No users are banned from this server.');
        loadingEmbed.setColor('#00cc00');
        return loadingMessage.edit({ embeds: [loadingEmbed] });
      }
      
      // Parse arguments for filters
      const { page, filters } = this.parseArgs(args);
      
      // Load ban log data if available to enhance ban information
      const enhancedBans = await this.enhanceBanData(banList, message.guild.id);
      
      // Apply filters if any
      const filteredBans = this.applyFilters(enhancedBans, filters);
      
      // Create pages from the filtered bans
      const pages = this.createPages(filteredBans, 10);
      
      if (pages.length === 0) {
        loadingEmbed.setDescription('No bans found matching your filters.');
        loadingEmbed.setColor('#ff9900');
        return loadingMessage.edit({ embeds: [loadingEmbed] });
      }
      
      // Ensure page is within bounds
      const pageIndex = Math.max(0, Math.min(page - 1, pages.length - 1));
      
      // Send the ban page
      await this.sendBanPage(message, pages, pageIndex, loadingMessage, filters);
    } catch (error) {
      console.error('Error retrieving ban list:', error);
      loadingEmbed.setDescription('An error occurred while fetching the ban list.');
      loadingEmbed.setColor('#ff0000');
      return loadingMessage.edit({ embeds: [loadingEmbed] });
    }
  },
  
  /**
   * Parse command arguments for page number and filters
   * @param {Array} args - Command arguments
   * @returns {Object} - Parsed arguments with page and filters
   */
  parseArgs(args) {
    let page = 1;
    const filters = {
      userId: null,
      reason: null,
      date: null
    };
    
    args.forEach(arg => {
      // Check if arg is a page number
      if (/^\d+$/.test(arg)) {
        page = parseInt(arg);
      }
      
      // Check for --user filter
      if (arg.startsWith('--user=')) {
        filters.userId = arg.substring(7);
      }
      
      // Check for --reason filter
      if (arg.startsWith('--reason=')) {
        filters.reason = arg.substring(9).toLowerCase();
      }
      
      // Check for --date filter
      if (arg.startsWith('--date=')) {
        filters.date = arg.substring(7);
      }
    });
    
    return { page, filters };
  },
  
  /**
   * Enhance ban data with information from logs
   * @param {Collection} banList - Discord ban list
   * @param {string} guildId - Guild ID
   * @returns {Array} - Enhanced ban data
   */
  async enhanceBanData(banList, guildId) {
    const enhancedBans = [];
    
    // Convert Discord ban collection to an array
    banList.forEach(ban => {
      enhancedBans.push({
        user: ban.user,
        reason: ban.reason || 'No reason provided',
        date: null,
        moderator: null,
        logData: null
      });
    });
    
    // Try to enhance with log data
    try {
      // Check if log file exists
      const logDirectory = path.join(__dirname, '../logs');
      const banLogPath = path.join(logDirectory, `ban-log-${guildId}.txt`);
      
      if (fs.existsSync(banLogPath)) {
        const banLogs = logParser.parseLogFile(banLogPath);
        const banEvents = logParser.extractBanEvents(banLogs);
        
        // Match logs with ban list entries
        enhancedBans.forEach(ban => {
          const logEntry = banEvents.find(event => event.userId === ban.user.id);
          if (logEntry) {
            ban.date = logEntry.date;
            ban.moderator = {
              id: logEntry.executorId,
              username: logEntry.executorName
            };
            ban.logData = logEntry;
          }
        });
      }
      
      // Check main log file as well
      const mainLogPath = path.join(logDirectory, 'bot-log.txt');
      if (fs.existsSync(mainLogPath)) {
        const mainLogs = logParser.parseLogFile(mainLogPath);
        const mainBanEvents = logParser.extractBanEvents(mainLogs);
        
        // Match logs with ban list entries that don't have data yet
        enhancedBans.forEach(ban => {
          if (!ban.date) {
            const logEntry = mainBanEvents.find(event => event.userId === ban.user.id);
            if (logEntry) {
              ban.date = logEntry.date;
              ban.moderator = {
                id: logEntry.executorId,
                username: logEntry.executorName
              };
              ban.logData = logEntry;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error enhancing ban data with logs:', error);
      // Continue without enhanced data if logs can't be read
    }
    
    return enhancedBans;
  },
  
  /**
   * Apply filters to ban list
   * @param {Array} bans - Ban list
   * @param {Object} filters - Filters to apply
   * @returns {Array} - Filtered ban list
   */
  applyFilters(bans, filters) {
    return bans.filter(ban => {
      // Filter by user ID
      if (filters.userId && !ban.user.id.includes(filters.userId)) {
        return false;
      }
      
      // Filter by reason
      if (filters.reason && !ban.reason.toLowerCase().includes(filters.reason)) {
        return false;
      }
      
      // Filter by date
      if (filters.date && ban.date) {
        const banDate = ban.date.toISOString().split('T')[0]; // YYYY-MM-DD
        if (banDate !== filters.date) {
          return false;
        }
      }
      
      return true;
    });
  },
  
  /**
   * Create pages from ban list
   * @param {Array} bans - Ban list
   * @param {number} itemsPerPage - Items per page
   * @returns {Array} - Array of ban pages
   */
  createPages(bans, itemsPerPage) {
    const pages = [];
    
    for (let i = 0; i < bans.length; i += itemsPerPage) {
      pages.push(bans.slice(i, i + itemsPerPage));
    }
    
    return pages;
  },
  
  /**
   * Send a page of the ban list
   * @param {Object} message - Discord message
   * @param {Array} pages - Array of ban pages
   * @param {number} pageIndex - Current page index
   * @param {Object} loadingMessage - Loading message to edit
   * @param {Object} filters - Applied filters
   */
  async sendBanPage(message, pages, pageIndex, loadingMessage, filters) {
    const currentPage = pages[pageIndex];
    const totalPages = pages.length;
    
    // Create the ban list embed
    const embed = new MessageEmbed()
      .setTitle(`Ban List (${pages.flat().length} total)`)
      .setColor('#ff5555')
      .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages} • Requested by ${message.author.tag}` })
      .setTimestamp();
    
    // Add filter information if filters are applied
    const filterTexts = [];
    if (filters.userId) filterTexts.push(`User ID: \`${filters.userId}\``);
    if (filters.reason) filterTexts.push(`Reason contains: \`${filters.reason}\``);
    if (filters.date) filterTexts.push(`Date: \`${filters.date}\``);
    
    if (filterTexts.length > 0) {
      embed.setAuthor({ name: 'Filtered by: ' + filterTexts.join(' | ') });
    }
    
    // Create the ban list description
    let description = '';
    
    currentPage.forEach((ban, index) => {
      const position = pageIndex * 10 + index + 1;
      const user = ban.user;
      const reason = ban.reason || 'No reason provided';
      
      // Format the ban entry
      let entry = `**${position}.** \`${user.tag}\` (${user.id})\n`;
      entry += `• Reason: ${reason}\n`;
      
      // Add enhanced data if available
      if (ban.date) {
        entry += `• Banned on: ${ban.date.toLocaleString()}\n`;
      }
      
      if (ban.moderator) {
        entry += `• Banned by: ${ban.moderator.username} (${ban.moderator.id})\n`;
      }
      
      description += entry + '\n';
    });
    
    embed.setDescription(description);
    
    // Create navigation buttons
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('first')
        .setLabel('First')
        .setStyle('PRIMARY')
        .setDisabled(pageIndex === 0),
      new MessageButton()
        .setCustomId('prev')
        .setLabel('Previous')
        .setStyle('PRIMARY')
        .setDisabled(pageIndex === 0),
      new MessageButton()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('PRIMARY')
        .setDisabled(pageIndex === totalPages - 1),
      new MessageButton()
        .setCustomId('last')
        .setLabel('Last')
        .setStyle('PRIMARY')
        .setDisabled(pageIndex === totalPages - 1)
    );
    
    // Edit the loading message with the ban page
    const banPageMessage = await loadingMessage.edit({
      embeds: [embed],
      components: [row]
    });
    
    // Create button collector
    const collector = banPageMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === message.author.id,
      time: 120000 // 2 minutes
    });
    
    // Handle button clicks
    collector.on('collect', async (interaction) => {
      let newPageIndex = pageIndex;
      
      // Update the page index based on the button clicked
      if (interaction.customId === 'first') {
        newPageIndex = 0;
      } else if (interaction.customId === 'last') {
        newPageIndex = totalPages - 1;
      } else if (interaction.customId === 'prev') {
        newPageIndex = Math.max(0, pageIndex - 1);
      } else if (interaction.customId === 'next') {
        newPageIndex = Math.min(totalPages - 1, pageIndex + 1);
      }
      
      // Update the embed and buttons if the page changed
      if (newPageIndex !== pageIndex) {
        await this.sendBanPage(message, pages, newPageIndex, banPageMessage, filters);
      } else {
        await interaction.deferUpdate();
      }
    });
    
    // Handle collector end
    collector.on('end', () => {
      // Remove buttons when collector ends
      banPageMessage.edit({
        embeds: [embed],
        components: []
      }).catch(console.error);
    });
  }
};