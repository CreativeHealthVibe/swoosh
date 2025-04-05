// logging.js
const { WebhookClient, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('./config.json');

let logChannel, webhook;

module.exports = {
  setup: async (client) => {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) throw new Error('No guild found');

      // Create logs channel if missing
      logChannel = guild.channels.cache.find(c => c.name === 'logs');
      if (!logChannel) {
        logChannel = await guild.channels.create({
          name: 'logs',
          type: ChannelType.GuildText,
          permissionOverwrites: [{
            id: guild.id,
            deny: [PermissionsBitField.Flags.SendMessages]
          }]
        });
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

      console.log(`✅ Logging system ready in #${logChannel.name}`);
    } catch (error) {
      console.error('❌ Logging setup failed:', error);
    }
  },

  logAction: async (action, user, executor = null, details = {}) => {
    try {
      if (!webhook) return;

      const embed = new EmbedBuilder()
        .setTitle(`📝 ${action}`)
        .setColor(config.embedColor || '#0099ff')
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
          value: executor.tag,
          inline: true
        });
      }

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

      const logger = new WebhookClient({ url: webhook.url });
      await logger.send({
        username: 'SWOOSH Logger',
        avatarURL: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg',
        embeds: [embed]
      });

    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
};