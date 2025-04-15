// log_bounty.js - Admin command to manage bounty submissions
const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  ChannelType
} = require('discord.js');
const config = require('../config');
const validators = require('../utils/validators');
const adminUtils = require('../utils/admin');
const bountyManager = require('../handlers/bountyManager');
const logging = require('../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log_bounty')
    .setDescription('Manage pending bounty submissions')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all pending bounty submissions')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a specific bounty submission')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('Submission ID to view')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Approve a bounty submission')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('Submission ID to approve')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel to post the approved bounty in')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option.setName('clip_required')
            .setDescription('Whether a video clip is required for evidence')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option.setName('log_evidence')
            .setDescription('Whether to log RE (evidence) submissions')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deny')
        .setDescription('Deny a bounty submission')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('Submission ID to deny')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for denial')
            .setRequired(false)
        )
    ),
    
  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  execute: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true }); // Start with ephemeral reply for security
    
    try {
      // Check if user has permission
      if (!adminUtils.canCreateBounty(interaction.member)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⛔ Permission Denied')
              .setDescription('You need the **Bounty Master** or **Admin** role to manage bounty submissions.')
              .setColor('#FF0000')
              .setFooter({ text: 'SWOOSH Bounty System' })
          ]
        });
      }
      
      // Handle subcommands
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'list':
          return handleListSubcommand(interaction, client);
        case 'view':
          return handleViewSubcommand(interaction, client);
        case 'approve':
          return handleApproveSubcommand(interaction, client);
        case 'deny':
          return handleDenySubcommand(interaction, client);
        default:
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('❌ Invalid Command')
                .setDescription('Invalid subcommand. Please use one of: list, view, approve, deny.')
                .setColor('#FF0000')
            ]
          });
      }
    } catch (error) {
      console.error('Log Bounty Command Error:', error);
      
      // Error message
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(`An error occurred: ${error.message || 'Unknown error'}`)
        .setColor('#FF0000')
        .setFooter({ 
          text: `SWOOSH Bounty System • Error Report`,
          iconURL: interaction.guild?.iconURL({ dynamic: true }) || null
        })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
      
      // Log error
      logging.logAction('Command Error', interaction.user, null, {
        command: 'log_bounty',
        error: error.message,
        stack: error.stack
      });
    }
  }
};

/**
 * Handle the list subcommand to show all pending bounty submissions
 * @param {Object} interaction - Discord interaction
 * @param {Object} client - Discord client
 */
async function handleListSubcommand(interaction, client) {
  // Get all pending bounties
  const pendingBounties = bountyManager.getPendingBounties();
  
  if (pendingBounties.length === 0) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('📋 Bounty Submissions')
          .setDescription('There are no pending bounty submissions to review.')
          .setColor('#000000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
  
  // Sort by submission date (newest first)
  pendingBounties.sort((a, b) => b.submittedAt - a.submittedAt);
  
  // Create a concise list of pending bounties
  const submissionList = pendingBounties
    .filter(bounty => bounty.status === 'pending')
    .map((bounty, index) => {
      const submittedAt = new Date(bounty.submittedAt).toLocaleString();
      return `**${index + 1}.** ${bounty.robloxUsername} (${bounty.robloxId})\n` +
        `   💰 R$ ${bounty.amount.toLocaleString()} | 🕒 ${submittedAt}\n` +
        `   👤 Submitted by: ${bounty.submittedBy.tag}\n` +
        `   🆔 ID: \`${bounty.id}\`\n`;
    })
    .join('\n');
  
  // Create select menu for quick actions
  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('bounty-action')
        .setPlaceholder('Select a submission to view...')
        .addOptions(
          pendingBounties
            .filter(bounty => bounty.status === 'pending')
            .map((bounty, index) => ({
              label: `${index + 1}. ${bounty.robloxUsername}`,
              description: `R$ ${bounty.amount.toLocaleString()} | ${new Date(bounty.submittedAt).toLocaleString()}`,
              value: bounty.id
            }))
        )
    );
  
  const listEmbed = new EmbedBuilder()
    .setTitle('📋 Pending Bounty Submissions')
    .setDescription(
      `**${pendingBounties.filter(b => b.status === 'pending').length}** pending submissions:\n\n` +
      submissionList
    )
    .setColor('#000000')
    .setFooter({ 
      text: 'SWOOSH Bounty System • Select a submission to view details',
      iconURL: interaction.guild.iconURL({ dynamic: true })
    })
    .setTimestamp();
  
  const reply = await interaction.editReply({
    embeds: [listEmbed],
    components: [selectMenu]
  });
  
  // Add collector for the select menu
  try {
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (selectInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        return selectInteraction.reply({
          content: "You cannot interact with this menu.",
          ephemeral: true
        });
      }
      
      const selectedId = selectInteraction.values[0];
      const selectedBounty = bountyManager.getPendingBounty(selectedId);
      
      if (!selectedBounty) {
        return selectInteraction.update({
          content: "Bounty submission not found. It may have been processed already.",
          embeds: [],
          components: []
        });
      }
      
      // Show detailed view with action buttons
      const detailEmbed = createDetailedBountyEmbed(selectedBounty);
      
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`approve-bounty-${selectedId}`)
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId(`deny-bounty-${selectedId}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌'),
          new ButtonBuilder()
            .setCustomId('back-to-list')
            .setLabel('Back to List')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
        );
      
      await selectInteraction.update({
        embeds: [detailEmbed],
        components: [actionButtons]
      });
    });
    
    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: "The selection menu has expired.",
          components: []
        });
      }
    });
  } catch (error) {
    console.error('Bounty select menu error:', error);
  }
}

/**
 * Handle the view subcommand to show a specific bounty submission
 * @param {Object} interaction - Discord interaction
 * @param {Object} client - Discord client
 */
async function handleViewSubcommand(interaction, client) {
  const submissionId = interaction.options.getString('id');
  const bounty = bountyManager.getPendingBounty(submissionId);
  
  if (!bounty) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Submission Not Found')
          .setDescription(`Could not find a bounty submission with ID: ${submissionId}`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
  
  const detailEmbed = createDetailedBountyEmbed(bounty);
  
  const actionButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`approve-bounty-${submissionId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`deny-bounty-${submissionId}`)
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
      new ButtonBuilder()
        .setCustomId('view-all-bounties')
        .setLabel('View All')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋')
    );
  
  const reply = await interaction.editReply({
    embeds: [detailEmbed],
    components: [actionButtons]
  });
  
  // Add collector for the buttons
  try {
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          content: "You cannot interact with these buttons.",
          ephemeral: true
        });
      }
      
      if (buttonInteraction.customId === 'view-all-bounties') {
        await buttonInteraction.deferUpdate();
        return handleListSubcommand(interaction, client);
      } else if (buttonInteraction.customId === `approve-bounty-${submissionId}`) {
        // Create channel selection menu for approval
        const channels = interaction.guild.channels.cache
          .filter(channel => 
            channel.type === ChannelType.GuildText && 
            channel.permissionsFor(interaction.guild.members.me).has('SendMessages')
          )
          .map(channel => ({
            label: channel.name,
            value: channel.id
          }));
        
        const channelSelect = new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`channel-select-${submissionId}`)
              .setPlaceholder('Select a channel to post the bounty...')
              .addOptions(channels.slice(0, 25)) // Discord limits to 25 options
          );
        
        const channelMessage = await buttonInteraction.update({
          content: "Please select a channel to post the approved bounty:",
          components: [channelSelect],
          fetchReply: true
        });
        
        // Create a new collector specifically for the channel selection
        const channelCollector = channelMessage.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60000 // 1 minute timeout
        });
        
        channelCollector.on('collect', async (channelInteraction) => {
          if (channelInteraction.user.id !== interaction.user.id) {
            return channelInteraction.reply({
              content: "You cannot interact with this menu.",
              ephemeral: true
            });
          }
          
          await channelInteraction.deferUpdate();
          
          // Get the selected channel
          const selectedChannelId = channelInteraction.values[0];
          const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId);
          
          if (!selectedChannel) {
            return channelInteraction.editReply({
              content: "Error: Could not find the selected channel. Please try again.",
              components: []
            });
          }
          
          // Process the approval with the selected channel
          const clipRequired = false; // Default value
          const logEvidence = true; // Default value
          
          const approvalResult = await bountyManager.approveBounty(interaction, submissionId, {
            channel: selectedChannel,
            clipRequired,
            logEvidence
          });
          
          // Show result
          if (approvalResult.success) {
            channelInteraction.editReply({
              content: `✅ Bounty approved and posted successfully in ${selectedChannel.toString()}!`,
              components: []
            });
          } else {
            channelInteraction.editReply({
              content: `❌ Error: ${approvalResult.message}`,
              components: []
            });
          }
        });
        
        channelCollector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            await buttonInteraction.editReply({
              content: "Channel selection timed out. Please try again.",
              components: []
            });
          }
        });
      } else if (buttonInteraction.customId === `deny-bounty-${submissionId}`) {
        // Modal for denial reason
        const reasonButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`deny-reason-invalid-${submissionId}`)
              .setLabel('Invalid Target')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`deny-reason-duplicate-${submissionId}`)
              .setLabel('Duplicate')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`deny-reason-policy-${submissionId}`)
              .setLabel('Policy Violation')
              .setStyle(ButtonStyle.Secondary)
          );
        
        await buttonInteraction.update({
          content: "Please select a reason for denial:",
          components: [reasonButtons]
        });
      }
    });
    
    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: "The interaction has expired.",
          components: []
        });
      }
    });
  } catch (error) {
    console.error('Bounty button interaction error:', error);
  }
}

/**
 * Handle the approve subcommand to approve a bounty submission
 * @param {Object} interaction - Discord interaction
 * @param {Object} client - Discord client
 */
async function handleApproveSubcommand(interaction, client) {
  const submissionId = interaction.options.getString('id');
  const channel = interaction.options.getChannel('channel');
  const clipRequired = interaction.options.getBoolean('clip_required') ?? false;
  const logEvidence = interaction.options.getBoolean('log_evidence') ?? true;
  
  const bounty = bountyManager.getPendingBounty(submissionId);
  
  if (!bounty) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Submission Not Found')
          .setDescription(`Could not find a bounty submission with ID: ${submissionId}`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
  
  if (bounty.status !== 'pending') {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Already Processed')
          .setDescription(`This bounty submission has already been ${bounty.status}.`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
  
  // Process the approval
  const approvalResult = await bountyManager.approveBounty(interaction, submissionId, {
    channel,
    clipRequired,
    logEvidence
  });
  
  if (approvalResult.success) {
    // Notify the submitter if possible
    try {
      const submitter = client.users.cache.get(bounty.submittedBy.id);
      if (submitter) {
        const notificationEmbed = new EmbedBuilder()
          .setTitle('✅ Bounty Approved')
          .setDescription(
            `Your bounty submission for **${bounty.robloxUsername}** has been approved!\n\n` +
            `**Target:** ${bounty.robloxUsername} (${bounty.robloxId})\n` +
            `**Reward:** R$ ${bounty.amount.toLocaleString()}\n` +
            `**Posted in:** ${channel.toString()}\n\n` +
            `The bounty has been posted and is now active.`
          )
          .setColor('#000000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp();
        
        await submitter.send({ embeds: [notificationEmbed] }).catch(() => {
          // User may have DMs disabled, this is fine to ignore
        });
      }
    } catch (dmError) {
      console.error('Error sending DM notification:', dmError);
    }
    
    // Success message to admin
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ Bounty Approved')
          .setDescription(
            `Successfully approved bounty submission for **${bounty.robloxUsername}**.\n\n` +
            `**Target:** ${bounty.robloxUsername} (${bounty.robloxId})\n` +
            `**Reward:** R$ ${bounty.amount.toLocaleString()}\n` +
            `**Posted in:** ${channel.toString()}\n` +
            `**Submitted by:** ${bounty.submittedBy.tag}\n\n` +
            `${approvalResult.message || 'The bounty has been posted successfully.'}`
          )
          .setColor('#000000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  } else {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Approval Failed')
          .setDescription(`Error: ${approvalResult.message}`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System • Error Report',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
}

/**
 * Handle the deny subcommand to deny a bounty submission
 * @param {Object} interaction - Discord interaction
 * @param {Object} client - Discord client
 */
async function handleDenySubcommand(interaction, client) {
  const submissionId = interaction.options.getString('id');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  
  const bounty = bountyManager.getPendingBounty(submissionId);
  
  if (!bounty) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Submission Not Found')
          .setDescription(`Could not find a bounty submission with ID: ${submissionId}`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
  
  if (bounty.status !== 'pending') {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Already Processed')
          .setDescription(`This bounty submission has already been ${bounty.status}.`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
  
  // Process the denial
  const denialResult = await bountyManager.denyBounty(interaction, submissionId, reason);
  
  if (denialResult.success) {
    // Notify the submitter if possible
    try {
      const submitter = client.users.cache.get(bounty.submittedBy.id);
      if (submitter) {
        const notificationEmbed = new EmbedBuilder()
          .setTitle('❌ Bounty Denied')
          .setDescription(
            `Your bounty submission for **${bounty.robloxUsername}** has been denied.\n\n` +
            `**Target:** ${bounty.robloxUsername} (${bounty.robloxId})\n` +
            `**Reward:** R$ ${bounty.amount.toLocaleString()}\n` +
            `**Reason for denial:** ${reason}\n\n` +
            `If you believe this is an error, please contact a server administrator.`
          )
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp();
        
        await submitter.send({ embeds: [notificationEmbed] }).catch(() => {
          // User may have DMs disabled, this is fine to ignore
        });
      }
    } catch (dmError) {
      console.error('Error sending DM notification:', dmError);
    }
    
    // Success message to admin
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ Bounty Denied')
          .setDescription(
            `Successfully denied bounty submission for **${bounty.robloxUsername}**.\n\n` +
            `**Target:** ${bounty.robloxUsername} (${bounty.robloxId})\n` +
            `**Reward:** R$ ${bounty.amount.toLocaleString()}\n` +
            `**Reason:** ${reason}\n` +
            `**Submitted by:** ${bounty.submittedBy.tag}\n\n` +
            `${denialResult.message || 'The submitter has been notified of the denial.'}`
          )
          .setColor('#000000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  } else {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Denial Failed')
          .setDescription(`Error: ${denialResult.message}`)
          .setColor('#FF0000')
          .setFooter({ 
            text: 'SWOOSH Bounty System • Error Report',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp()
      ]
    });
  }
}

/**
 * Create a detailed embed for a bounty submission
 * @param {Object} bounty - Bounty submission data
 * @returns {EmbedBuilder} - Detailed embed
 */
function createDetailedBountyEmbed(bounty) {
  const submittedAt = new Date(bounty.submittedAt).toLocaleString();
  
  const embed = new EmbedBuilder()
    .setTitle(`📋 Bounty Submission Details`)
    .setDescription(
      `## Target: ${bounty.robloxUsername}\n\n` +
      `**Roblox ID:** ${bounty.robloxId}\n` +
      `**Reward:** R$ ${bounty.amount.toLocaleString()}\n` +
      `**Status:** ${formatStatus(bounty.status)}\n` +
      `**Submitted By:** ${bounty.submittedBy.tag} (${bounty.submittedBy.toString()})\n` +
      `**Submitted At:** ${submittedAt}\n` +
      `**Submission ID:** \`${bounty.id}\`\n\n` +
      `${bounty.reason ? `**Reason:** ${bounty.reason}\n\n` : ''}`
    )
    .setColor(getStatusColor(bounty.status))
    .setFooter({ 
      text: 'SWOOSH Bounty System',
      iconURL: bounty.robloxAvatarUrl || null
    })
    .setTimestamp();
  
  // Add avatar if available
  if (bounty.robloxAvatarUrl) {
    embed.setThumbnail(bounty.robloxAvatarUrl);
  }
  
  // Add approval information if approved
  if (bounty.status === 'approved' && bounty.approvedBy) {
    const approvedAt = new Date(bounty.approvedAt).toLocaleString();
    embed.addFields({
      name: '✅ Approval Information',
      value: `**Approved By:** ${bounty.approvedBy.tag}\n**Approved At:** ${approvedAt}`,
      inline: false
    });
  }
  
  // Add denial information if denied
  if (bounty.status === 'denied' && bounty.deniedBy) {
    const deniedAt = new Date(bounty.deniedAt).toLocaleString();
    embed.addFields({
      name: '❌ Denial Information',
      value: `**Denied By:** ${bounty.deniedBy.tag}\n**Denied At:** ${deniedAt}\n**Reason:** ${bounty.denialReason || 'No reason provided'}`,
      inline: false
    });
  }
  
  return embed;
}

/**
 * Format bounty status for display
 * @param {string} status - Bounty status
 * @returns {string} - Formatted status
 */
function formatStatus(status) {
  switch (status) {
    case 'pending':
      return '⏳ Pending Approval';
    case 'approved':
      return '✅ Approved';
    case 'denied':
      return '❌ Denied';
    default:
      return status;
  }
}

/**
 * Get color based on bounty status
 * @param {string} status - Bounty status
 * @returns {string} - Color hex code
 */
function getStatusColor(status) {
  switch (status) {
    case 'pending':
      return '#FFA500'; // Orange
    case 'approved':
      return '#00FF00'; // Green
    case 'denied':
      return '#FF0000'; // Red
    default:
      return '#000000'; // Black
  }
}