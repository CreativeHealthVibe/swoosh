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
    
    console.log('🎫 Ticket Manager initialized');
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
   */
  generateTranscript: async (channel, executor) => {
    try {
      // Check if channel is a ticket
      if (!channel.name.startsWith('ticket-')) {
        return { success: false, message: 'This command can only be used in ticket channels.' };
      }
      
      // Generate transcript
      const transcript = await createTranscript(channel, {
        limit: -1,
        fileName: `${channel.name}-transcript.html`
      });
      
      // Save transcript
      logging.saveTranscript(transcript, channel.name);
      
      // Log action
      await logging.logAction('Transcript Created', null, executor, {
        channel: channel,
        attachment: transcript
      });
      
      return { 
        success: true, 
        transcript,
        message: 'Transcript generated successfully.' 
      };
    } catch (error) {
      console.error('Transcript Generation Error:', error);
      return { 
        success: false, 
        message: 'An error occurred while generating the transcript.' 
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
    // Find or create ticket category
    let category = await ensureTicketCategory(interaction.guild);
    
    // Check for existing ticket
    const existingTicket = interaction.guild.channels.cache.find(
      ch => ch.parentId === category.id && 
           ch.name === `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    );
    
    if (existingTicket) {
      return interaction.editReply(`You already have an open ticket: ${existingTicket}`);
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
    
    // Create ticket channel
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
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
  // Find existing category
  let category = guild.channels.cache.find(c => 
    c.type === ChannelType.GuildCategory && 
    c.name === config.ticketCategory
  );
  
  // Create category if it doesn't exist
  if (!category) {
    category = await guild.channels.create({
      name: config.ticketCategory,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });
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
