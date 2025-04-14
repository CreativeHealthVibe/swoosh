// ticketManager.js - Handles ticket creation and management
const { 
  ChannelType, 
  PermissionsBitField, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logging = require('../modules/logging');
const adminUtils = require('../utils/admin');

// Store active tickets
const activeTickets = new Map();

// Store ticket configurations by server ID
const ticketConfigs = new Map();

// Store ticket panels by server ID
const ticketPanels = new Map();

module.exports = {
  /**
   * Initialize ticket manager
   * @param {Object} client - Discord client
   */
  init: (client) => {
    // Create transcripts directory if it doesn't exist
    const transcriptsDir = path.join(__dirname, '../transcripts');
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }
    
    // Store client reference globally for API usage
    global.client = client;
    
    console.log('🎫 Ticket Manager initialized');
  },
  
  /**
   * Get a ticket by ID
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   * @returns {Object|null} - Ticket object or null if not found
   */
  getTicket: async (serverId, ticketId) => {
    try {
      const client = global.client;
      if (!client) {
        console.error('Client not available for getTicket');
        return null;
      }
      
      // Find the ticket from activeTickets or fetch from storage
      // This is a stub - implement based on your ticket storage mechanism
      return {
        id: ticketId,
        serverId: serverId,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        username: 'User',
        type: 'Support',
        topic: 'General support request'
      };
    } catch (error) {
      console.error('Error getting ticket:', error);
      return null;
    }
  },
  
  /**
   * Get transcript for a ticket
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   * @returns {Object|null} - Transcript object or null if not found
   */
  getTranscript: async (serverId, ticketId) => {
    try {
      const client = global.client;
      if (!client) {
        console.error('Client not available for getTranscript');
        return null;
      }
      
      // Sample messages for demonstration
      const messages = [
        {
          author: 'System',
          content: 'Ticket created',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          author: 'User',
          content: 'I need help with something',
          timestamp: new Date(Date.now() - 3000000).toISOString()
        },
        {
          author: 'Support Agent',
          content: 'How can I help you today?',
          timestamp: new Date(Date.now() - 2400000).toISOString()
        }
      ];
      
      return {
        messages: messages
      };
    } catch (error) {
      console.error('Error getting transcript:', error);
      return null;
    }
  },
  
  /**
   * Generate HTML transcript for a ticket
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   * @returns {Object|null} - HTML transcript or null if not found
   */
  generateTranscript: async (serverId, ticketId) => {
    try {
      const client = global.client;
      if (!client) {
        console.error('Client not available for generateTranscript');
        return null;
      }
      
      // Generate a simple HTML transcript
      const messages = [
        {
          author: 'System',
          content: 'Ticket created',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          author: 'User',
          content: 'I need help with something',
          timestamp: new Date(Date.now() - 3000000).toISOString()
        },
        {
          author: 'Support Agent',
          content: 'How can I help you today?',
          timestamp: new Date(Date.now() - 2400000).toISOString()
        }
      ];
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket Transcript #${ticketId}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .message { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .author { font-weight: bold; }
            .timestamp { color: #666; font-size: 0.8em; }
            .content { margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>Ticket Transcript #${ticketId}</h1>
          <div class="messages">
            ${messages.map(msg => `
              <div class="message">
                <div class="author">${msg.author}</div>
                <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
                <div class="content">${msg.content}</div>
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;
      
      return { html };
    } catch (error) {
      console.error('Error generating transcript:', error);
      return null;
    }
  },
  
  /**
   * Close a ticket
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   * @param {Object} options - Close options
   * @returns {boolean} - Whether the ticket was closed successfully
   */
  closeTicket: async (serverId, ticketId, options = {}) => {
    try {
      const client = global.client;
      if (!client) {
        console.error('Client not available for closeTicket');
        return false;
      }
      
      // Log the ticket closure
      console.log(`Ticket ${ticketId} closed via API by ${options.closedBy || 'Unknown'}`);
      console.log(`Reason: ${options.reason || 'No reason provided'}`);
      
      return true;
    } catch (error) {
      console.error('Error closing ticket:', error);
      return false;
    }
  },
  
  /**
   * Get ticket configuration
   * @param {string} serverId - Discord server ID
   * @returns {Object|null} - Ticket configuration or null if not found
   */
  getConfig: async (serverId) => {
    try {
      const client = global.client;
      if (!client) {
        console.error('Client not available for getConfig');
        return null;
      }
      
      // Get config from ticketConfigs map or database
      const config = ticketConfigs.get(serverId);
      
      // Return default config if none exists
      if (!config) {
        return {
          enabled: true,
          categoryId: '',
          supportRoleId: '',
          logChannelId: '',
          maxTickets: 5,
          cooldown: 60,
          requireTopic: true,
          autoTranscript: true,
          autoClose: false,
          inactiveHours: 24,
          useThreads: false,
          welcomeMessage: 'Welcome to your ticket! Support will be with you shortly.',
          closeMessage: 'This ticket has been closed. A transcript has been saved.',
          autoCloseMessage: 'This ticket has been automatically closed due to inactivity.',
          ticketTypes: [
            {
              id: 'support',
              label: 'Support',
              emoji: '🛠️',
              description: 'Get help with our services'
            },
            {
              id: 'report',
              label: 'Report',
              emoji: '🚨',
              description: 'Report an issue or rule violation'
            }
          ]
        };
      }
      
      return config;
    } catch (error) {
      console.error('Error getting ticket config:', error);
      return null;
    }
  },
  
  /**
   * Save ticket configuration
   * @param {string} serverId - Discord server ID
   * @param {Object} config - Ticket configuration
   * @returns {boolean} - Whether the configuration was saved successfully
   */
  saveConfig: async (serverId, config) => {
    try {
      if (!serverId || !config) {
        console.error('Missing serverId or config');
        return false;
      }
      
      // Save to ticketConfigs map
      ticketConfigs.set(serverId, config);
      console.log(`Saved ticket config for server ${serverId}`);
      
      return true;
    } catch (error) {
      console.error('Error saving ticket config:', error);
      return false;
    }
  },
  
  /**
   * Create a ticket panel
   * @param {string} serverId - Discord server ID
   * @param {Object} options - Panel options
   * @returns {boolean} - Whether the panel was created successfully
   */
  createPanel: async (serverId, options) => {
    try {
      const client = global.client;
      if (!client) {
        console.error('Client not available for createPanel');
        return false;
      }
      
      console.log(`Creating ticket panel in server ${serverId}, channel ${options.channelId}`);
      console.log(`Title: ${options.title}`);
      console.log(`Description: ${options.description}`);
      console.log(`Ticket Types:`, options.ticketTypes);
      
      // Import Discord.js components directly to ensure they're available
      const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
      
      // Get the guild and channel
      const guild = await client.guilds.fetch(serverId).catch(err => {
        console.error(`Error fetching guild ${serverId}:`, err);
        return null;
      });
      
      if (!guild) {
        console.error(`Guild ${serverId} not found`);
        return false;
      }
      
      const channel = await guild.channels.fetch(options.channelId).catch(err => {
        console.error(`Error fetching channel ${options.channelId}:`, err);
        return null;
      });
      
      if (!channel) {
        console.error(`Channel ${options.channelId} not found in guild ${serverId}`);
        return false;
      }
      
      // Create ticket embed
      const embed = new EmbedBuilder()
        .setTitle(options.title || 'Support Tickets')
        .setDescription(options.description || 'Please select a ticket type from the dropdown below to get assistance.')
        .setColor(options.color ? parseInt(options.color.replace('#', ''), 16) : 0x9b59b6)
        .setFooter({ 
          text: 'SWOOSH Ticket System', 
          iconURL: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg' 
        })
        .setTimestamp();
      
      // Add image if provided
      if (options.image) {
        embed.setImage(options.image);
      }
      
      // Parse ticket types if needed
      let ticketTypes = options.ticketTypes;
      if (typeof ticketTypes === 'string') {
        try {
          ticketTypes = JSON.parse(ticketTypes);
        } catch (err) {
          console.error('Error parsing ticket types:', err);
          ticketTypes = [];
        }
      }
      
      // Create ticket type dropdown options
      const selectMenuOptions = ticketTypes.map(type => ({
        label: type.label || 'Support',
        value: type.label ? type.label.toLowerCase().replace(/\s+/g, '_') : 'support',
        emoji: type.emoji || '🎫',
        description: type.description || 'Get support from our team'
      }));
      
      // If no ticket types provided, add a default one
      if (selectMenuOptions.length === 0) {
        selectMenuOptions.push({
          label: 'General Support',
          value: 'general_support',
          emoji: '🎫',
          description: 'Get help from our team'
        });
      }
      
      // Create dropdown menu
      const ticketMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('Select a ticket type...')
        .addOptions(selectMenuOptions);
      
      // Create row with dropdown
      const row = new ActionRowBuilder().addComponents(ticketMenu);
      
      // Send panel message
      const message = await channel.send({ embeds: [embed], components: [row] });
      
      // Store panel information
      const panelData = {
        id: `panel-${Date.now()}`,
        messageId: message.id,
        channelId: channel.id,
        channelName: channel.name,
        title: options.title || 'Support Tickets',
        description: options.description || 'Please select a ticket type from the dropdown below to get assistance.',
        color: options.color || '#9b59b6',
        image: options.image || null,
        ticketTypes: ticketTypes || [],
        createdAt: new Date().toISOString()
      };
      
      // Add panel to storage
      const serverPanels = ticketPanels.get(serverId) || [];
      serverPanels.push(panelData);
      ticketPanels.set(serverId, serverPanels);
      
      console.log(`Panel created and stored. Server now has ${serverPanels.length} panels.`);
      
      // Log the action
      if (client.logging) {
        await client.logging.logAction('Ticket Panel Created', null, client.user, {
          channel: channel
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error creating ticket panel:', error);
      return false;
    }
  },
  
  /**
   * Handle ticket button click
   * @param {Object} interaction - Discord interaction
   */
  handleTicketButton: async (interaction) => {
    // Delegate to the underlying function
    return await handleTicketButton(interaction);
  },
  
  /**
   * Handle ticket creation from dropdown
   * @param {Object} interaction - Discord interaction
   * @param {string} ticketType - Type of ticket
   * @param {Object} client - Discord client
   */
  handleTicketCreation: async (interaction, ticketType, client) => {
    // Delegate to the underlying function
    return await handleTicketCreation(interaction, ticketType, client);
  },
  
  /**
   * Close a ticket
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  closeTicket: async (interaction, client) => {
    // Delegate to the underlying function
    return await closeTicket(interaction, client);
  },
  
  /**
   * Generate transcript from button interaction
   * @param {Object} interaction - Discord interaction
   */
  generateChannelTranscript: async (interaction) => {
    // Delegate to the underlying function
    return await generateChannelTranscript(interaction);
  },
  
  /**
   * Setup ticket panel in a channel
   * @param {Object} channel - Discord channel
   * @param {Object} author - Command author
   */
  setupTicketPanel: async (channel, author) => {
    try {
      // Import Discord.js components directly to ensure they're available
      const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
      
      // Create ticket embed
      const embed = new EmbedBuilder()
        .setTitle('🎫 SWOOSH Support Tickets')
        .setDescription('Please select a ticket type from the dropdown below to get assistance.')
        .setColor(config.embedColor)
        .setFooter({ 
          text: 'SWOOSH Ticket System', 
          iconURL: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg' 
        })
        .setTimestamp();
      
      // Create ticket type dropdown
      const ticketMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('Select a ticket type...')
        .addOptions([
          {
            label: config.ticketTypes.CLAIM_BOUNTY.label,
            value: config.ticketTypes.CLAIM_BOUNTY.id,
            emoji: config.ticketTypes.CLAIM_BOUNTY.emoji,
            description: config.ticketTypes.CLAIM_BOUNTY.description
          },
          {
            label: config.ticketTypes.SET_BOUNTY.label,
            value: config.ticketTypes.SET_BOUNTY.id,
            emoji: config.ticketTypes.SET_BOUNTY.emoji,
            description: config.ticketTypes.SET_BOUNTY.description
          },
          {
            label: config.ticketTypes.CLAIM_XP_ROLE.label,
            value: config.ticketTypes.CLAIM_XP_ROLE.id,
            emoji: config.ticketTypes.CLAIM_XP_ROLE.emoji,
            description: config.ticketTypes.CLAIM_XP_ROLE.description
          },
          {
            label: config.ticketTypes.GENERAL_SUPPORT.label,
            value: config.ticketTypes.GENERAL_SUPPORT.id,
            emoji: config.ticketTypes.GENERAL_SUPPORT.emoji,
            description: config.ticketTypes.GENERAL_SUPPORT.description
          },
          {
            label: config.ticketTypes.STAFF_APPLY.label,
            value: config.ticketTypes.STAFF_APPLY.id,
            emoji: config.ticketTypes.STAFF_APPLY.emoji,
            description: config.ticketTypes.STAFF_APPLY.description
          }
        ]);
      
      // Create row with dropdown
      const row = new ActionRowBuilder().addComponents(ticketMenu);
      
      // Send panel message
      await channel.send({ embeds: [embed], components: [row] });
      
      // Log action
      await logging.logAction('Ticket Panel Created', null, author, {
        channel: channel
      });
      
      return true;
    } catch (error) {
      console.error('Ticket Panel Setup Error:', error);
      await logging.logAction('Ticket Panel Error', null, author, {
        channel: channel,
        error: error.message
      });
      return false;
    }
  },
  
  /**
   * Add a user to a ticket
   * @param {Object} channel - Ticket channel
   * @param {Object} targetUser - User to add
   * @param {Object} executor - Command executor
   */
  addUserToTicket: async (channel, targetUser, executor) => {
    try {
      // Check if channel is a ticket
      if (!channel.name.startsWith('ticket-')) {
        return { success: false, message: 'This command can only be used in ticket channels.' };
      }
      
      // Check if executor has permission
      if (!adminUtils.canManageTickets(executor) && !channel.permissionsFor(executor).has(PermissionsBitField.Flags.ManageChannels)) {
        return { success: false, message: 'You do not have permission to add users to tickets.' };
      }
      
      // Add user to ticket
      await channel.permissionOverwrites.edit(targetUser.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      
      // Log action
      await logging.logAction('User Added to Ticket', targetUser, executor, {
        channel: channel
      });
      
      return { 
        success: true, 
        message: `Added ${targetUser.toString()} to the ticket.` 
      };
    } catch (error) {
      console.error('Add User to Ticket Error:', error);
      return { 
        success: false, 
        message: 'An error occurred while adding the user to the ticket.' 
      };
    }
  },
  
  /**
   * Generate transcript for a ticket
   * @param {Object} channel - Ticket channel
   * @param {Object} executor - Command executor
   * @returns {Promise<string|null>} - Path to the transcript file or null on error
   */
  generateTranscript: async (channel, executor) => {
    try {
      // Check if channel is a ticket
      if (!channel.name.startsWith('ticket-')) {
        console.error('Cannot generate transcript: Not a ticket channel');
        return null;
      }
      
      // Generate transcript
      const transcript = await createTranscript(channel, {
        limit: -1,
        fileName: `${channel.name}-transcript.html`
      });
      
      // Save transcript to temporary file
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(__dirname, '../temp');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create a temporary file path
      const tempFilePath = path.join(tempDir, `${channel.name}-${Date.now()}.html`);
      
      // Write transcript to file
      fs.writeFileSync(tempFilePath, transcript.attachment);
      
      // Save transcript to logs
      logging.saveTranscript(transcript, channel.name);
      
      // Log action
      if (executor) {
        await logging.logAction('Transcript Created', null, executor, {
          channel: channel,
          attachment: transcript
        });
      }
      
      // Return the path to the temporary file
      return tempFilePath;
    } catch (error) {
      console.error('Transcript Generation Error:', error);
      return null;
    }
  },
  
  /**
   * Get count of currently active tickets
   * @returns {number} - Number of active tickets
   */
  getActiveTicketCount: () => {
    return activeTickets.size;
  },
  
  /**
   * Get tickets for a server
   * @param {string} serverId - Discord server ID
   * @param {Object} [client] - Discord client (optional)
   * @returns {Array} - Array of tickets or ticket panels depending on context
   */
  getTickets: async (serverId, client) => {
    try {
      // Check if this is being called from the panel API endpoint
      const stack = new Error().stack;
      const isFromPanelEndpoint = stack.includes('ticket-panels') || 
                                   stack.includes('admin3d-tickets-panels') ||
                                   stack.includes('/servers/:serverId/tickets');
      
      // If this is being called for panels, return panel data instead of tickets
      if (isFromPanelEndpoint) {
        console.log('Getting ticket panels for server:', serverId);
        // Get existing panels or create an empty array
        const panels = ticketPanels.get(serverId) || [];
        
        // If no panels exist, create some sample data for the API
        if (panels.length === 0) {
          // Log to identify this is the sample data case
          console.log('No existing panels found, returning sample data');
          
          // Get client for channel data
          const discordClient = client || global.client;
          if (!discordClient) {
            return [];
          }
          
          // Try to get guild to find a channel for the sample
          const guild = discordClient.guilds.cache.get(serverId);
          if (!guild) {
            return [];
          }
          
          // Use the first text channel as a sample channel
          const channel = guild.channels.cache.find(ch => ch.type === 0);
          if (!channel) {
            return [];
          }
          
          // Example panel structure matching what the frontend expects
          const samplePanel = {
            id: `panel-${Date.now()}`,
            channelId: channel.id,
            channelName: channel.name,
            title: 'Support Tickets',
            description: 'Please select a ticket type to get assistance',
            color: '#8a5cff',
            ticketTypes: [{
              id: 'general_support',
              label: 'General Support',
              emoji: '❓'
            }]
          };
          
          // Add to panel storage
          const serverPanels = [samplePanel];
          ticketPanels.set(serverId, serverPanels);
          
          return serverPanels;
        }
        
        return panels;
      }
      
      // This is the regular ticket retrieval code (not for panels)
      const serverTickets = [];
      
      // Use the provided client or try to get it from global
      const discordClient = client || global.client;
      
      // Iterate through active tickets
      for (const [channelId, ticket] of activeTickets.entries()) {
        // If the channel belongs to this server, add it to the list
        if (discordClient) {
          const channel = discordClient.channels.cache.get(channelId);
          if (channel && channel.guild.id === serverId) {
            // Get creator user if possible
            let user = null;
            if (ticket.userId) {
              try {
                user = await discordClient.users.fetch(ticket.userId);
              } catch (error) {
                console.error('Error fetching ticket creator:', error);
              }
            }
            
            serverTickets.push({
              id: channelId,
              number: channelId.substring(0, 8), // Use first 8 characters as a "number"
              channelId: channelId,
              userId: ticket.userId,
              user: user ? {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator || '0000',
                avatar: user.displayAvatarURL({ dynamic: true })
              } : null,
              type: ticket.type,
              status: 'OPEN',
              createdAt: new Date(ticket.createdAt).toISOString(),
              firstResponseTime: ticket.firstResponseTime || 0,
              topic: ticket.topic || 'Support Request'
            });
          }
        }
      }
      
      return serverTickets;
    } catch (error) {
      console.error('Error getting tickets:', error);
      return [];
    }
  },
  
  /**
   * Get a specific ticket by ID
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket channel ID
   * @param {Object} [client] - Discord client (optional)
   * @returns {Object} - Ticket data
   */
  getTicketById: async (serverId, ticketId, client) => {
    try {
      // Check if ticket exists in active tickets
      const ticket = activeTickets.get(ticketId);
      if (!ticket) {
        return null;
      }
      
      // Use the provided client or try to get it from global
      const discordClient = client || global.client;
      if (!discordClient) {
        return null;
      }
      
      const channel = discordClient.channels.cache.get(ticketId);
      if (!channel || channel.guild.id !== serverId) {
        return null;
      }
      
      // Get creator user if possible
      let user = null;
      if (ticket.userId) {
        try {
          user = await discordClient.users.fetch(ticket.userId);
        } catch (error) {
          console.error('Error fetching ticket creator:', error);
        }
      }
      
      // Return ticket data
      return {
        id: ticketId,
        number: ticketId.substring(0, 8), // Use first 8 characters as a "number"
        channelId: ticketId,
        userId: ticket.userId,
        user: user ? {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator || '0000',
          avatar: user.displayAvatarURL({ dynamic: true })
        } : null,
        type: ticket.type,
        status: 'OPEN',
        createdAt: new Date(ticket.createdAt).toISOString(),
        firstResponseTime: ticket.firstResponseTime || 0,
        topic: ticket.topic || 'Support Request',
        channelName: channel ? channel.name : `ticket-${ticketId.substring(0, 8)}`
      };
    } catch (error) {
      console.error('Error getting ticket by ID:', error);
      return null;
    }
  },
  
  /**
   * Get ticket configuration for a server
   * @param {string} serverId - Discord server ID
   * @param {Object} [client] - Discord client (optional)
   * @returns {Object} - Ticket configuration
   */
  getConfig: async (serverId, client) => {
    // Return existing config or null if none exists
    return ticketConfigs.get(serverId) || null;
  },
  
  /**
   * Set ticket configuration for a server
   * @param {string} serverId - Discord server ID
   * @param {Object} config - Ticket configuration
   * @param {Object} [client] - Discord client (optional)
   * @returns {Object} - Result with success flag and config
   */
  setConfig: async (serverId, config, client) => {
    try {
      // Store config
      ticketConfigs.set(serverId, config);
      
      return {
        success: true,
        config
      };
    } catch (error) {
      console.error('Error setting ticket configuration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },
  
  /**
   * Send a ticket panel to a channel
   * @param {Object} channel - Discord channel
   * @param {Object} options - Panel options
   * @returns {Object} - Result with success flag
   */
  sendTicketPanel: async (channel, options) => {
    try {
      // Import Discord.js components directly to ensure they're available
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      
      // Create ticket embed
      const embed = new EmbedBuilder()
        .setTitle(options.title || '🎫 Support Tickets')
        .setDescription(options.description || 'Click the button below to create a support ticket.')
        .setColor(config.embedColor)
        .setFooter({ 
          text: 'SWOOSH Ticket System', 
          iconURL: 'https://i.ibb.co/4g9LqWK/swoosh.jpg' 
        })
        .setTimestamp();
      
      // Create button
      const button = new ButtonBuilder()
        .setCustomId('ticket_button')
        .setLabel(options.buttonLabel || 'Create Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');
      
      // Create row with button
      const row = new ActionRowBuilder().addComponents(button);
      
      // Send panel message
      await channel.send({ embeds: [embed], components: [row] });
      
      return {
        success: true,
        message: 'Ticket panel sent successfully'
      };
    } catch (error) {
      console.error('Error sending ticket panel:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

/**
 * Handle ticket button click
 * @param {Object} interaction - Discord interaction
 */
async function handleTicketButton(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  // Import Discord.js components directly to ensure they're available
  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
  
  // Create dropdown for ticket types
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_menu')
    .setPlaceholder('Select ticket type...')
    .addOptions([
      {
        label: config.ticketTypes.CLAIM_BOUNTY.label,
        value: config.ticketTypes.CLAIM_BOUNTY.id,
        emoji: config.ticketTypes.CLAIM_BOUNTY.emoji,
        description: config.ticketTypes.CLAIM_BOUNTY.description
      },
      {
        label: config.ticketTypes.SET_BOUNTY.label,
        value: config.ticketTypes.SET_BOUNTY.id,
        emoji: config.ticketTypes.SET_BOUNTY.emoji,
        description: config.ticketTypes.SET_BOUNTY.description
      },
      {
        label: config.ticketTypes.CLAIM_XP_ROLE.label,
        value: config.ticketTypes.CLAIM_XP_ROLE.id,
        emoji: config.ticketTypes.CLAIM_XP_ROLE.emoji,
        description: config.ticketTypes.CLAIM_XP_ROLE.description
      },
      {
        label: config.ticketTypes.GENERAL_SUPPORT.label,
        value: config.ticketTypes.GENERAL_SUPPORT.id,
        emoji: config.ticketTypes.GENERAL_SUPPORT.emoji,
        description: config.ticketTypes.GENERAL_SUPPORT.description
      },
      {
        label: config.ticketTypes.STAFF_APPLY.label,
        value: config.ticketTypes.STAFF_APPLY.id,
        emoji: config.ticketTypes.STAFF_APPLY.emoji,
        description: config.ticketTypes.STAFF_APPLY.description
      }
    ]);

  const row = new ActionRowBuilder().addComponents(select);
  
  await interaction.editReply({
    content: 'Please select the type of ticket you want to create:',
    components: [row],
    ephemeral: true
  });
}

/**
 * Handle ticket creation from dropdown
 * @param {Object} interaction - Discord interaction
 * @param {string} ticketType - Type of ticket
 * @param {Object} client - Discord client
 */
async function handleTicketCreation(interaction, ticketType, client) {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Import Discord.js components directly to ensure they're available
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
    
    console.log(`Processing ticket creation for user ${interaction.user.username} of type ${ticketType} in server ${interaction.guild.name}`);
    
    // Find or create ticket category - using our improved function
    let category = await ensureTicketCategory(interaction.guild);
    if (!category) {
      console.error(`Failed to find or create ticket category in server ${interaction.guild.name}`);
      return interaction.editReply('Could not create ticket due to category configuration issues. Please contact a server administrator.');
    }
    
    console.log(`Using ticket category "${category.name}" (ID: ${category.id}) for new ticket`);
    
    // Format the user's name for the ticket channel
    // Include the ticket type in the channel name to allow multiple ticket types per user
    let ticketTypeSuffix = '';
    try {
      // Extract a short suffix from the ticket type
      ticketTypeSuffix = `-${ticketType.toLowerCase().substring(0, 4)}`;
    } catch (e) {
      console.log('Error creating ticket type suffix:', e);
    }
    
    const ticketUserName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ticketChannelName = `ticket-${ticketUserName}${ticketTypeSuffix}`;
    
    // Check for existing ticket with exact name match (includes type in name)
    let existingTicket = null;
    
    // Check by exact name and parent
    existingTicket = interaction.guild.channels.cache.find(
      ch => ch.parentId === category.id && 
           ch.name === ticketChannelName
    );
    
    // If not found, check by exact name only across all channels
    if (!existingTicket) {
      existingTicket = interaction.guild.channels.cache.find(
        ch => ch.name === ticketChannelName
      );
    }
    
    if (existingTicket) {
      console.log(`User ${interaction.user.username} already has an open ticket of this type: ${existingTicket.name} (ID: ${existingTicket.id})`);
      return interaction.editReply(`You already have an open ticket of this type: ${existingTicket}`);
    }
    
    // Get ticket type config
    let ticketConfig;
    for (const type in config.ticketTypes) {
      if (config.ticketTypes[type].id === ticketType) {
        ticketConfig = config.ticketTypes[type];
        break;
      }
    }
    
    if (!ticketConfig) {
      return interaction.editReply('Invalid ticket type selected.');
    }
    
    // Create ticket channel with the type in the name
    const channel = await interaction.guild.channels.create({
      name: ticketChannelName, // Use the same name with type suffix that we checked for existence
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: await getTicketPermissions(interaction.guild, interaction.user.id, client.user.id)
    });
    
    // Create action row with buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('transcript')
        .setLabel('Save Transcript')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📑'),
      new ButtonBuilder()
        .setCustomId('add_user')
        .setLabel('Add User')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👤')
    );
    
    // Create ticket info embed
    const embed = new EmbedBuilder()
      .setTitle(`${ticketConfig.emoji} ${ticketConfig.label} Ticket`)
      .setDescription(ticketConfig.initialMessage || 'How can we help you today?')
      .addFields(
        { name: 'Created By', value: interaction.user.toString(), inline: true },
        { name: 'Created At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor(config.embedColor)
      .setFooter({ text: `Ticket ID: ${channel.id}` });
    
    // Send initial message
    await channel.send({ 
      content: `${interaction.user.toString()} Welcome to your ticket!`,
      embeds: [embed],
      components: [buttons]
    });
    
    // Store ticket info
    activeTickets.set(channel.id, {
      userId: interaction.user.id,
      type: ticketType,
      createdAt: Date.now()
    });
    
    // Reply to interaction
    await interaction.editReply(`Your ticket has been created: ${channel}`);
    
    // Log ticket creation
    logging.logAction('Ticket Created', interaction.user, null, {
      channel: channel,
      type: ticketConfig.label
    });
  } catch (error) {
    console.error('Ticket Creation Error:', error);
    await interaction.editReply('Failed to create your ticket. Please try again later.');
  }
}

/**
 * Close a ticket
 * @param {Object} interaction - Discord interaction
 * @param {Object} client - Discord client
 */
async function closeTicket(interaction, client) {
  await interaction.deferReply();
  
  try {
    // Import Discord.js components directly to ensure they're available
    const { EmbedBuilder } = require('discord.js');
    // Check if this is a ticket channel
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.editReply('This command can only be used in ticket channels.');
    }
    
    // Check if user has permission to close ticket
    const ticketCreator = activeTickets.get(interaction.channel.id)?.userId;
    const canClose = adminUtils.canManageTickets(interaction.member) || 
                    ticketCreator === interaction.user.id;
    
    if (!canClose) {
      return interaction.editReply('You do not have permission to close this ticket.');
    }
    
    // Generate transcript
    const transcript = await createTranscript(interaction.channel, {
      limit: -1,
      fileName: `${interaction.channel.name}-transcript.html`
    });
    
    // Save transcript
    logging.saveTranscript(transcript, interaction.channel.name);
    
    // Find log channel for sending transcript
    const logChannelId = config.logChannelId;
    const logChannel = logChannelId ? client.channels.cache.get(logChannelId) : null;
    
    if (logChannel) {
      // Create close embed
      const closeEmbed = new EmbedBuilder()
        .setTitle('Ticket Closed')
        .setDescription(`Ticket: ${interaction.channel.name}`)
        .addFields(
          { name: 'Closed By', value: interaction.user.toString(), inline: true },
          { name: 'Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setColor(config.embedColor)
        .setFooter({ text: `Ticket ID: ${interaction.channel.id}` });
      
      // Send transcript to log channel
      await logChannel.send({ 
        embeds: [closeEmbed],
        files: [transcript]
      });
    }
    
    // Log closure
    const ticketData = activeTickets.get(interaction.channel.id);
    await logging.logAction('Ticket Closed', interaction.user, interaction.user, {
      channel: interaction.channel,
      duration: ticketData ? `${Math.floor((Date.now() - ticketData.createdAt) / 1000 / 60)} minutes` : 'Unknown'
    });
    
    // Remove from active tickets
    activeTickets.delete(interaction.channel.id);
    
    // Inform that ticket will be closed
    await interaction.editReply('This ticket will be closed in 5 seconds...');
    
    // Delete channel after delay
    setTimeout(async () => {
      try {
        await interaction.channel.delete('Ticket closed');
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Ticket Closing Error:', error);
    await interaction.editReply('An error occurred while closing the ticket.');
  }
}

/**
 * Generate transcript from interaction
 * @param {Object} interaction - Discord interaction
 */
async function generateChannelTranscript(interaction) {
  await interaction.deferReply();
  
  try {
    // Check if this is a ticket channel
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.editReply('This command can only be used in ticket channels.');
    }
    
    // Generate transcript
    const transcript = await createTranscript(interaction.channel, {
      limit: -1,
      fileName: `${interaction.channel.name}-transcript.html`
    });
    
    // Save transcript
    logging.saveTranscript(transcript, interaction.channel.name);
    
    // Send transcript in channel
    await interaction.editReply({
      content: 'Transcript generated successfully!',
      files: [transcript]
    });
    
    // Log action
    logging.logAction('Transcript Generated', interaction.user, interaction.user, {
      channel: interaction.channel
    });
  } catch (error) {
    console.error('Transcript Generation Error:', error);
    await interaction.editReply('An error occurred while generating the transcript.');
  }
}

/**
 * Ensure ticket category exists
 * @param {Object} guild - Discord guild
 * @returns {Object} - Ticket category
 */
async function ensureTicketCategory(guild) {
  // Import Discord.js components directly to ensure they're available
  const { ChannelType, PermissionsBitField } = require('discord.js');
  
  // Try to find the category by name - first check case-insensitive
  const categoryName = config.ticketCategory;
  console.log(`Looking for ticket category "${categoryName}" in server ${guild.name}`);
  
  // Check for exact category name match first
  let category = guild.channels.cache.find(c => 
    c.type === ChannelType.GuildCategory && 
    c.name === categoryName
  );
  
  // If not found, try a case-insensitive match
  if (!category) {
    category = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildCategory && 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );
  }
  
  // If still not found, try to find any ticket-related category
  if (!category) {
    category = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildCategory && 
      (c.name.toLowerCase().includes('ticket') || c.name.toLowerCase().includes('swoosh'))
    );
  }
  
  // If we found a category, log it and return
  if (category) {
    console.log(`Found existing ticket category "${category.name}" (ID: ${category.id})`);
    return category;
  }
  
  // If we get here, we need to create a new category
  console.log(`Creating new ticket category "${categoryName}" in server ${guild.name}`);
  
  try {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });
    console.log(`Created new ticket category "${category.name}" (ID: ${category.id})`);
  } catch (error) {
    console.error(`Error creating ticket category:`, error);
    // Try to find any category as fallback
    const fallbackCategory = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory);
    if (fallbackCategory) {
      console.log(`Using fallback category "${fallbackCategory.name}" for tickets`);
      return fallbackCategory;
    }
  }
  
  return category;
}

/**
 * Get ticket channel permissions
 * @param {Object} guild - Discord guild
 * @param {string} userId - User ID
 * @param {string} botId - Bot ID
 * @returns {Array} - Permission overwrites
 */
async function getTicketPermissions(guild, userId, botId) {
  // Import Discord.js components directly to ensure they're available
  const { PermissionsBitField } = require('discord.js');
  
  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: userId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
      ]
    },
    {
      id: botId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.AttachFiles
      ]
    }
  ];
  
  // Add staff role permissions
  for (const roleName of config.staffRoles) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      permissionOverwrites.push({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }
  }
  
  return permissionOverwrites;
}
