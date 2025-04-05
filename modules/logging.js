// logging.js - Advanced logging system
const { 
  WebhookClient, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder,
  AttachmentBuilder,
  Collection
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');

// Channels for different log types
let logChannel = null;
let deletedMessagesChannel = null;
let transcriptsChannel = null;
let commandUsageChannel = null; 
let botStatusChannel = null;

// Webhooks
let webhook = null;
const logDir = path.join(__dirname, '../logs');

// Bot start time for uptime tracking
const BOT_START_TIME = Date.now();

module.exports = {
  /**
   * Setup logging system
   * @param {Object} client - Discord client
   */
  setup: async (client) => {
    try {
      // Ensure logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Store basic logs to file
      fs.appendFileSync(
        path.join(logDir, 'bot.log'), 
        `[${new Date().toISOString()}] Bot started\n`
      );
      
      // Find the guild to set up logging
      const guild = client.guilds.cache.first();
      if (!guild) {
        console.warn('No guilds available for logging setup');
        return;
      }

      // Get log channel by ID from env var or find/create by name
      if (config.logChannelId) {
        logChannel = guild.channels.cache.get(config.logChannelId);
      }
      
      if (!logChannel) {
        logChannel = guild.channels.cache.find(c => c.name === 'logs');
      }
      
      if (!logChannel) {
        logChannel = await guild.channels.create({
          name: 'logs',
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionsBitField.Flags.SendMessages]
            },
            {
              id: client.user.id,
              allow: [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.AttachFiles
              ]
            }
          ]
        });
      }

      // Initialize specialized logging channels
      if (config.loggingChannels) {
        // Deleted Messages Channel
        if (config.loggingChannels.deletedMessages) {
          deletedMessagesChannel = client.channels.cache.get(config.loggingChannels.deletedMessages);
        }
        
        // Transcript Channel
        if (config.loggingChannels.ticketTranscripts) {
          transcriptsChannel = client.channels.cache.get(config.loggingChannels.ticketTranscripts);
        }
        
        // Command Usage Channel
        if (config.loggingChannels.commandUsage) {
          commandUsageChannel = client.channels.cache.get(config.loggingChannels.commandUsage);
        }
        
        // Bot Status Channel
        if (config.loggingChannels.botStatus) {
          botStatusChannel = client.channels.cache.get(config.loggingChannels.botStatus);
          
          // Send initial bot status when the bot starts up
          if (botStatusChannel) {
            module.exports.logBotStatus(client);
          }
        }
      }

      // Create/retrieve webhook
      const webhooks = await logChannel.fetchWebhooks();
      webhook = webhooks.find(wh => wh.name === 'SWOOSH Logger');
      
      if (!webhook) {
        webhook = await logChannel.createWebhook({
          name: 'SWOOSH Logger',
          avatar: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg'
        });
      }

      // Setup message deletion listener
      client.on('messageDelete', message => {
        if (message.author && !message.author.bot) {
          module.exports.logDeletedMessage(message);
        }
      });

      console.log(`✅ Logging system initialized`);
    } catch (error) {
      console.error('❌ Logging setup failed:', error);
    }
  },

  /**
   * Log an action to both file and Discord
   * @param {string} action - Action name
   * @param {Object} user - Target user
   * @param {Object} executor - Action executor
   * @param {Object} details - Additional details
   */
  logAction: async (action, user, executor = null, details = {}) => {
    try {
      // Log to file
      const logMessage = `[${new Date().toISOString()}] ${action} | ` +
                        `User: ${user ? `${user.tag} (${user.id})` : 'N/A'} | ` +
                        `Executor: ${executor ? `${executor.tag} (${executor.id})` : 'System'} | ` +
                        `Details: ${JSON.stringify(details)}`;
      
      fs.appendFileSync(path.join(logDir, 'actions.log'), logMessage + '\n');
      
      // Don't proceed with Discord logging if webhook isn't set up
      if (!webhook) {
        console.warn('Discord webhook logging not available');
        return;
      }

      // Create embed for Discord logging
      const embed = new EmbedBuilder()
        .setTitle(`📝 ${action}`)
        .setColor(config.embedColor)
        .setTimestamp();

      if (user) {
        embed.addFields({
          name: 'User',
          value: `${user.tag} (${user.id})`,
          inline: true
        });
      }

      if (executor) {
        embed.addFields({
          name: 'Moderator',
          value: `${executor.tag} (${executor.id})`,
          inline: true
        });
      }

      // Add details to embed
      if (details.reason) {
        embed.addFields({
          name: 'Reason',
          value: details.reason.substring(0, 1000) // Prevent overflow
        });
      }

      if (details.channel) {
        embed.addFields({
          name: 'Channel',
          value: details.channel.toString()
        });
      }
      
      if (details.duration) {
        embed.addFields({
          name: 'Duration',
          value: details.duration
        });
      }
      
      if (details.amount) {
        embed.addFields({
          name: 'Amount',
          value: details.amount.toString()
        });
      }

      if (details.error) {
        embed.addFields({
          name: 'Error',
          value: `\`\`\`${details.error.substring(0, 1000)}\`\`\``
        });
      }

      // Send log via webhook
      const webhookClient = new WebhookClient({ url: webhook.url });
      
      // Prepare message options
      const messageOptions = {
        username: 'SWOOSH Logger',
        avatarURL: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg',
        embeds: [embed]
      };
      
      // Add attachment if provided
      if (details.attachment) {
        messageOptions.files = [details.attachment];
      }
      
      await webhookClient.send(messageOptions);

    } catch (error) {
      console.error('Failed to log action:', error);
    }
  },
  
  /**
   * Save transcript to logs
   * @param {Object} transcript - Transcript attachment
   * @param {string} ticketName - Name of the ticket
   */
  saveTranscript: (transcript, ticketName) => {
    try {
      // Check if transcript is valid
      if (!transcript) {
        console.error('Invalid transcript object provided');
        return;
      }
      
      const transcriptDir = path.join(__dirname, '../transcripts');
      
      // Create transcripts directory if it doesn't exist
      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }
      
      // Determine what to save based on transcript type
      let content;
      let fileName = `${ticketName}-${Date.now()}.html`;
      
      if (Buffer.isBuffer(transcript)) {
        // If it's a buffer, save directly
        content = transcript;
      } else if (transcript.attachment) {
        // If it has an attachment property (AttachmentBuilder)
        content = Buffer.from(transcript.attachment);
      } else if (transcript.content) {
        // If it has content property
        content = transcript.content;
      } else if (transcript.buffer) {
        // If it has a buffer property
        content = transcript.buffer;
      } else {
        // Try to get the attachment itself
        content = transcript;
      }
      
      if (!content) {
        console.error('Could not extract content from transcript');
        return;
      }
      
      // Save transcript
      fs.writeFileSync(
        path.join(transcriptDir, fileName),
        content
      );
      
      // Log transcript to special channel if it exists
      if (transcriptsChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`📄 Ticket Transcript: ${ticketName}`)
          .setDescription(`Transcript saved at ${new Date().toISOString()}`)
          .setColor(config.embedColor)
          .setTimestamp();
          
        transcriptsChannel.send({
          embeds: [embed], 
          files: [transcript]
        }).catch(err => console.error('Error sending transcript to log channel:', err));
      }
      
      console.log(`Transcript saved for ticket: ${ticketName}`);
    } catch (error) {
      console.error('Failed to save transcript:', error);
    }
  },
  
  /**
   * Log a deleted message
   * @param {Object} message - The deleted message
   */
  logDeletedMessage: async (message) => {
    try {
      if (!deletedMessagesChannel) return;
      
      // Create embed for deleted message log
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .setDescription(`**Message Content:**\n${message.content || 'No content (possibly an embed or attachment)'}`)
        .addFields(
          { name: 'Author', value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
          { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
          { name: 'Deleted At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setColor('#ff4d4d')
        .setTimestamp();
      
      // Add attachments info if any
      if (message.attachments.size > 0) {
        const attachmentList = message.attachments.map(a => a.url).join('\n');
        embed.addFields({ name: 'Attachments', value: attachmentList.substring(0, 1024) });
      }
      
      // Send log
      await deletedMessagesChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to log deleted message:', error);
    }
  },
  
  /**
   * Log command usage
   * @param {Object} user - The user who used the command
   * @param {string} command - The command used
   * @param {Array} args - Command arguments
   */
  logCommandUsage: async (user, command, args = []) => {
    try {
      if (!commandUsageChannel) return;
      
      // Create simple message for command usage
      const message = `<@${user.id}> used \`${command}\` ${args.length > 0 ? `with args: \`${args.join(' ')}\`` : ''}`;
      
      // Send log
      await commandUsageChannel.send(message);
    } catch (error) {
      console.error('Failed to log command usage:', error);
    }
  },
  
  /**
   * Log bot status and system information
   * @param {Object} client - Discord client
   */
  logBotStatus: async (client) => {
    try {
      if (!botStatusChannel) return;
      
      // Calculate uptime
      const uptime = Date.now() - BOT_START_TIME;
      const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
      const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((uptime % (60 * 1000)) / 1000);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      
      // Get system info
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);
      const cpuUsage = os.loadavg()[0].toFixed(2);
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      
      // Create embed for bot status
      const embed = new EmbedBuilder()
        .setTitle('🤖 Bot Status Update')
        .setDescription(`${client.user.tag} is online and operational.`)
        .addFields(
          { name: 'Uptime', value: uptimeString, inline: true },
          { name: 'Memory Usage', value: `${memoryUsageMB} MB`, inline: true },
          { name: 'CPU Load', value: `${cpuUsage}%`, inline: true },
          { name: 'System Memory', value: `${freeMem} GB / ${totalMem} GB`, inline: true },
          { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: 'Node.js Version', value: process.version, inline: true },
          { name: 'Guilds', value: client.guilds.cache.size.toString(), inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp()
        .setFooter({ text: 'Status refreshes every hour' });
      
      // Send status update
      await botStatusChannel.send({ embeds: [embed] });
      
      // Schedule next status update in 1 hour
      setTimeout(() => module.exports.logBotStatus(client), 60 * 60 * 1000);
    } catch (error) {
      console.error('Failed to log bot status:', error);
    }
  }
};
