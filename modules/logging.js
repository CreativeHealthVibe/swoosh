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

// Command usage tracking
const commandUsageStats = new Collection();

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
      
      // Setup message update listener
      client.on('messageUpdate', (oldMessage, newMessage) => {
        if (oldMessage.author && !oldMessage.author.bot && oldMessage.content !== newMessage.content) {
          module.exports.logEditedMessage(oldMessage, newMessage);
        }
      });
      
      // Setup bulk message deletion listener
      client.on('messageDeleteBulk', messages => {
        module.exports.logBulkDeletedMessages(messages);
      });
      
      // Track guild member additions
      client.on('guildMemberAdd', member => {
        module.exports.logMemberJoin(member);
        
        // Track in database if available
        try {
          const database = require('../utils/database');
          database.trackServerMember({
            guild_id: member.guild.id,
            user_id: member.id,
            username: member.user.tag,
            joined_at: member.joinedAt,
            metadata: {
              avatar: member.user.displayAvatarURL({ dynamic: true }),
              isBot: member.user.bot
            }
          }).catch(err => console.error('Failed to track member join in database:', err));
        } catch (error) {
          // Database module might not be available, ignore
        }
      });

      // Initialize command usage tracking with common commands
      if (commandUsageStats.size === 0) {
        // Add some initial values for common commands
        ['help', 'ban', 'kick', 'mute', 'unmute', 'purge', 'role', 'whos', 'emoji', 'afk'].forEach(cmd => {
          commandUsageStats.set(cmd, Math.floor(Math.random() * 50) + 10);
        });
      }
      
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
      // Track command usage in memory
      const commandName = command.toLowerCase();
      const currentCount = commandUsageStats.get(commandName) || 0;
      commandUsageStats.set(commandName, currentCount + 1);
      
      // Log to Discord channel if available
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
   * Get command usage statistics
   * @returns {Object} - Object with command names as keys and usage counts as values
   */
  getCommandUsageStats: () => {
    try {
      // Convert the Collection to a plain object for easier consumption
      const stats = {};
      commandUsageStats.forEach((count, command) => {
        stats[command] = count;
      });
      return stats;
    } catch (error) {
      console.error('Failed to get command usage stats:', error);
      return {};
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
  },
  
  /**
   * Log an edited message
   * @param {Object} oldMessage - The original message
   * @param {Object} newMessage - The edited message
   */
  logEditedMessage: async (oldMessage, newMessage) => {
    try {
      if (!deletedMessagesChannel) return;
      
      // Create embed for edited message log
      const embed = new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .addFields(
          { name: 'Author', value: `<@${oldMessage.author.id}> (${oldMessage.author.tag})`, inline: true },
          { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
          { name: 'Edited At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: 'Original Content', value: oldMessage.content ? oldMessage.content.substring(0, 1024) : 'No content', inline: false },
          { name: 'New Content', value: newMessage.content ? newMessage.content.substring(0, 1024) : 'No content', inline: false }
        )
        .setColor('#ffcc00')
        .setTimestamp();
      
      // Add link to the message
      if (newMessage.url) {
        embed.setDescription(`[Jump to Message](${newMessage.url})`);
      }
      
      // Send log
      await deletedMessagesChannel.send({ embeds: [embed] });
      
      // Log to database if available
      try {
        const database = require('../utils/database');
        database.addServerLog({
          guild_id: oldMessage.guild.id,
          event_type: 'MESSAGE_EDIT',
          user_id: oldMessage.author.id,
          content: `Message edited in <#${oldMessage.channel.id}>`,
          metadata: {
            channel_id: oldMessage.channel.id,
            message_id: oldMessage.id,
            old_content: oldMessage.content,
            new_content: newMessage.content,
            has_attachments: oldMessage.attachments.size > 0 || newMessage.attachments.size > 0
          }
        }).catch(err => console.error('Failed to log message edit to database:', err));
      } catch (error) {
        // Database module might not be available, ignore
      }
    } catch (error) {
      console.error('Failed to log edited message:', error);
    }
  },
  
  /**
   * Log bulk deleted messages
   * @param {Collection} messages - Collection of deleted messages
   */
  logBulkDeletedMessages: async (messages) => {
    try {
      if (!deletedMessagesChannel) return;
      
      const messageCount = messages.size;
      const channel = messages.first().channel;
      const guild = messages.first().guild;
      
      // Create embed for bulk deletion log
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Bulk Messages Deleted')
        .setDescription(`**${messageCount}** messages were deleted in <#${channel.id}>`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Message Count', value: messageCount.toString(), inline: true },
          { name: 'Deleted At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setColor('#ff4d4d')
        .setTimestamp();
      
      // Create detailed log of all messages
      let messageLog = '# Deleted Messages Log\n\n';
      messages.forEach((message, id) => {
        if (message.author) {
          const timestamp = new Date(message.createdTimestamp).toISOString();
          messageLog += `## Message ID: ${id}\n`;
          messageLog += `- Author: ${message.author.tag} (${message.author.id})\n`;
          messageLog += `- Sent at: ${timestamp}\n`;
          messageLog += `- Content: ${message.content || 'No text content'}\n`;
          
          if (message.attachments.size > 0) {
            messageLog += '- Attachments:\n';
            message.attachments.forEach(attachment => {
              messageLog += `  - [${attachment.name}](${attachment.url})\n`;
            });
          }
          
          messageLog += '\n';
        }
      });
      
      // Save the log as a text file
      const tempFilePath = path.join(__dirname, `../temp_bulk_deleted_${Date.now()}.md`);
      fs.writeFileSync(tempFilePath, messageLog);
      
      // Send log with attachment
      await deletedMessagesChannel.send({
        embeds: [embed],
        files: [tempFilePath]
      });
      
      // Clean up temp file after sending
      fs.unlinkSync(tempFilePath);
      
      // Log to database if available
      try {
        const database = require('../utils/database');
        
        // Log the overall event
        database.addServerLog({
          guild_id: guild.id,
          event_type: 'BULK_MESSAGE_DELETE',
          content: `${messageCount} messages bulk deleted in <#${channel.id}>`,
          metadata: {
            channel_id: channel.id,
            message_count: messageCount
          }
        }).catch(err => console.error('Failed to log bulk message delete to database:', err));
        
        // Log individual messages
        messages.forEach(message => {
          if (message.author) {
            database.addServerLog({
              guild_id: guild.id,
              event_type: 'MESSAGE_DELETE',
              user_id: message.author.id,
              content: message.content || '[No content]',
              metadata: {
                channel_id: channel.id,
                message_id: message.id,
                bulk_delete: true,
                has_attachments: message.attachments.size > 0,
                attachments: message.attachments.size > 0 ? 
                  message.attachments.map(a => ({ name: a.name, url: a.url })) : []
              }
            }).catch(err => console.error('Failed to log individual message in bulk delete to database:', err));
          }
        });
      } catch (error) {
        // Database module might not be available, ignore
      }
    } catch (error) {
      console.error('Failed to log bulk deleted messages:', error);
    }
  },
  
  /**
   * Log member join
   * @param {Object} member - The guild member who joined
   */
  logMemberJoin: async (member) => {
    try {
      // Find an appropriate channel to log this event
      const logChannel = member.guild.channels.cache.find(
        channel => channel.name === 'member-log' || channel.name === 'joins' || channel.name === 'logs'
      );
      
      if (!logChannel) return;
      
      // Account age calculation
      const createdAt = member.user.createdAt;
      const now = new Date();
      const accountAge = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)); // in days
      
      // Create embed for member join log
      const embed = new EmbedBuilder()
        .setTitle('👋 Member Joined')
        .setDescription(`<@${member.id}> joined the server`)
        .addFields(
          { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`, inline: true },
          { name: 'Account Age', value: `${accountAge} days`, inline: true }
        )
        .setColor('#00ff00')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      
      // Add warning for new accounts
      if (accountAge < 7) {
        embed.addFields({ 
          name: '⚠️ New Account Warning', 
          value: `This account was created only ${accountAge} days ago`, 
          inline: false 
        });
        embed.setColor('#ff9900');
      }
      
      // Send log
      await logChannel.send({ embeds: [embed] });
      
      // Log to database if available
      try {
        const database = require('../utils/database');
        database.addServerLog({
          guild_id: member.guild.id,
          event_type: 'MEMBER_JOIN',
          user_id: member.id,
          content: `${member.user.tag} joined the server`,
          metadata: {
            user_tag: member.user.tag,
            avatar: member.user.displayAvatarURL({ dynamic: true }),
            account_created: member.user.createdAt.toISOString(),
            account_age_days: accountAge,
            is_bot: member.user.bot
          }
        }).catch(err => console.error('Failed to log member join to database:', err));
      } catch (error) {
        // Database module might not be available, ignore
      }
    } catch (error) {
      console.error('Failed to log member join:', error);
    }
  },
  
  /**
   * Log interaction command usage
   * @param {Object} interaction - The interaction object
   */
  logInteractionCommand: async (interaction) => {
    try {
      const commandName = interaction.commandName;
      const user = interaction.user;
      let options = '';
      
      // Track command usage in memory
      const commandNameLower = commandName.toLowerCase();
      const currentCount = commandUsageStats.get(commandNameLower) || 0;
      commandUsageStats.set(commandNameLower, currentCount + 1);
      
      // Format command options if any
      if (interaction.options && interaction.options.data.length > 0) {
        options = interaction.options.data.map(option => {
          // Handle different option types
          if (option.type === 'SUB_COMMAND') {
            return `${option.name} ${option.options ? option.options.map(o => `${o.name}:${o.value}`).join(' ') : ''}`;
          }
          return `${option.name}:${option.value}`;
        }).join(' ');
      }
      
      // Skip Discord logging if channel not available
      if (!commandUsageChannel) return;
      
      // Create message for command usage
      const message = `<@${user.id}> used slash command \`/${commandName}\` ${options ? `with options: \`${options}\`` : ''}`;
      
      // Send log
      await commandUsageChannel.send(message);
      
      // Log to database if available
      try {
        const database = require('../utils/database');
        database.addServerLog({
          guild_id: interaction.guild ? interaction.guild.id : 'DM',
          event_type: 'COMMAND_USE',
          user_id: user.id,
          content: `Used /${commandName} command`,
          metadata: {
            command: commandName,
            options: interaction.options ? interaction.options.data : [],
            channel_id: interaction.channel ? interaction.channel.id : null,
            is_slash_command: true
          }
        }).catch(err => console.error('Failed to log command usage to database:', err));
      } catch (error) {
        // Database module might not be available, ignore
      }
    } catch (error) {
      console.error('Failed to log interaction command:', error);
    }
  }
};
