// bounty.js - Member command to submit a bounty for admin approval
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../config');
const validators = require('../utils/validators');
const bountyManager = require('../handlers/bountyManager');
const logging = require('../modules/logging');

// Utility function to fetch Roblox username from ID
async function fetchRobloxUsername(robloxId) {
  try {
    const response = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    if (!response.ok) {
      return null;
    }
    const userData = await response.json();
    return userData.name;
  } catch (error) {
    console.error('Error fetching Roblox username:', error);
    return null;
  }
}

// Utility function to fetch Roblox avatar URL from ID
async function fetchRobloxAvatar(robloxId) {
  try {
    // First get the headshot image
    const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png`);
    if (!headshotResponse.ok) {
      return null;
    }
    const headshotData = await headshotResponse.json();
    if (headshotData.data && headshotData.data.length > 0) {
      return headshotData.data[0].imageUrl;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Roblox avatar:', error);
    return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('Submit a bounty for admin approval')
    .addStringOption(option =>
      option.setName('roblox_id')
        .setDescription('Roblox user ID of the target')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Bounty amount in Robux')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000000)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for this bounty')
        .setRequired(false)
    ),
    
  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  execute: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true }); // Start with ephemeral reply
    
    try {
      // Get command options
      const robloxId = interaction.options.getString('roblox_id');
      const amount = interaction.options.getInteger('amount');
      const reason = interaction.options.getString('reason');
      
      // Validate Roblox ID
      if (!validators.validateRobloxID(robloxId)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Invalid Roblox ID')
              .setDescription('Please provide a valid Roblox user ID (numbers only).')
              .setColor('#FF0000')
          ]
        });
      }
      
      // Check if server has a log channel configured for bounty submissions
      const guildSettings = await logging.getGuildSettings(interaction.guild.id);
      let bountySubmissionChannel = client.channels.cache.get(guildSettings?.channels?.bountySubmissions);
      
      if (!bountySubmissionChannel) {
        // If no bounty submission channel is configured, just use the current channel
        bountySubmissionChannel = interaction.channel;
      }
      
      // Fetch Roblox username from ID
      const loadingEmbed = new EmbedBuilder()
        .setTitle('Processing Bounty Submission')
        .setDescription('Fetching user information from Roblox...')
        .setColor('#000000')
        .setFooter({ text: 'SWOOSH Bounty System' });
      
      await interaction.editReply({ embeds: [loadingEmbed] });
      
      const robloxUsername = await fetchRobloxUsername(robloxId);
      if (!robloxUsername) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ User Not Found')
              .setDescription('Could not find a Roblox user with that ID. Please verify the ID and try again.')
              .setColor('#FF0000')
          ]
        });
      }
      
      // Fetch avatar URL
      const robloxAvatarUrl = await fetchRobloxAvatar(robloxId);
      
      // Submit the bounty for admin approval (not direct creation)
      const submissionResult = await bountyManager.submitBounty(interaction, {
        robloxId,
        robloxUsername,
        amount,
        reason,
        robloxAvatarUrl,
        requiresApproval: true // Force admin approval
      });
      
      if (submissionResult.success) {
        // Create a clean, professional bounty submission notification for the logs channel
        const submissionEmbed = new EmbedBuilder()
          .setTitle('📋 New Bounty Submission')
          .setDescription(
            `## Target: ${robloxUsername}\n\n` +
            `**Roblox ID:** ${robloxId}\n` +
            `**Reward:** R$ ${amount.toLocaleString()}\n` +
            `**Submitted By:** ${interaction.user.toString()}\n` +
            `${reason ? `**Reason:** ${reason}\n` : ''}` +
            `\nUse \`/log_bounty\` to review and manage this submission.`
          )
          .setColor('#000000')
          .setFooter({ 
            text: `SWOOSH Bounty System • Submission ID: ${submissionResult.submissionId}`,
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp();
        
        // Add avatar if available
        if (robloxAvatarUrl) {
          submissionEmbed.setThumbnail(robloxAvatarUrl);
        }
        
        // Send notification to the admin channel
        await bountySubmissionChannel.send({ embeds: [submissionEmbed] });
        
        // Send success message to the user
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Bounty Submitted Successfully')
          .setDescription(
            `Your bounty on ${robloxUsername} (${robloxId}) for R$ ${amount.toLocaleString()} has been submitted for admin review.\n\n` +
            `Submission ID: ${submissionResult.submissionId}\n\n` +
            `You will be notified if your bounty is approved.`
          )
          .setColor('#000000')
          .setFooter({ 
            text: 'SWOOSH Bounty System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
          .setTimestamp();
        
        // Add avatar if available
        if (robloxAvatarUrl) {
          successEmbed.setThumbnail(robloxAvatarUrl);
        }
        
        return interaction.editReply({ embeds: [successEmbed] });
      } else {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Submission Failed')
              .setDescription(`Error: ${submissionResult.message}`)
              .setColor('#FF0000')
              .setFooter({ 
                text: 'SWOOSH Bounty System • Error Report',
                iconURL: interaction.guild.iconURL({ dynamic: true })
              })
              .setTimestamp()
          ]
        });
      }
    } catch (error) {
      console.error('Bounty Command Error:', error);
      
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
        command: 'bounty',
        error: error.message,
        stack: error.stack
      });
    }
  }
};