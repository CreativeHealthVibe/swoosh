// moderation.js
const { 
  PermissionsBitField, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType 
} = require('discord.js');
const config = require('./config.json');
const logging = require('./logging.js');

module.exports = {
  init: (client) => {
    client.on('messageCreate', async message => {
      if (message.author.bot || !message.content.startsWith(config.prefix) || !message.guild) return;

      const args = message.content.slice(config.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      // Help Command
      if (command === 'help') {
        try {
          const helpEmbed = new EmbedBuilder()
            .setTitle('🛠️ SWOOSH Bot Commands')
            .setColor(config.embedColor)
            .addFields(
              {
                name: '🎟️ Tickets',
                value: `\`${config.prefix}setup-tickets\` - Create ticket panel\n` +
                       '`Create Ticket` button - Open new ticket',
                inline: true
              },
              {
                name: '🛡️ Moderation',
                value: `\`${config.prefix}ban @user\n` +
                       `\`${config.prefix}kick @user\n` +
                       `\`${config.prefix}mute @user [minutes]\n` +
                       `\`${config.prefix}purge [1-100]\``,
                inline: true
              },
              {
                name: '🔧 Utilities',
                value: `\`${config.prefix}help\` - Show this menu\n` +
                       '`Close` button - In tickets',
                inline: true
              }
            )
            .setFooter({ text: `Prefix: ${config.prefix} | SWOOSH Bot v2.0` });

          await message.channel.send({ embeds: [helpEmbed] });
        } catch (error) {
          console.error('Help Command Error:', error);
          message.reply('❌ Failed to show help menu!').catch(() => {});
        }
        return;
      }

      // Setup Tickets Command
      if (command === 'setup-tickets') {
        try {
          if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Administrator permissions required!');
          }

          // Create ticket category
          let category = message.guild.channels.cache.find(c => c.name === config.ticketCategory);
          if (!category) {
            category = await message.guild.channels.create({
              name: config.ticketCategory,
              type: ChannelType.GuildCategory,
              permissionOverwrites: [{
                id: message.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
              }]
            });
          }

          // Create panel embed
          const embed = new EmbedBuilder()
            .setTitle('🎫 Support Tickets')
            .setDescription('Click the button below to create a ticket!')
            .setColor(config.embedColor)
            .setImage('https://i.ibb.co/4g9LqWyK/swoosh.jpg');

          // Create ticket button
          const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('create_ticket')
              .setLabel('Create Ticket')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📩')
          );

          // Send panel
          await message.channel.send({ 
            embeds: [embed], 
            components: [button] 
          });

          await message.reply('✅ Ticket system activated!');
          await logging.logAction('Ticket Panel Setup', message.author, null, {
            channel: message.channel
          });

        } catch (error) {
          console.error('Ticket Setup Error:', error);
          message.reply('❌ Failed to setup tickets!');
        }
        return;
      }

      // Ban Command
      if (command === 'ban') {
        try {
          if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('❌ You need **Ban Members** permission!');
          }

          const target = message.mentions.members.first();
          if (!target) return message.reply('❌ Please mention a user!');
          if (!target.bannable) return message.reply("❌ I can't ban this user!");

          const reason = args.slice(1).join(' ') || 'No reason provided';
          await target.ban({ reason });
          
          await message.reply(`✅ Banned ${target.user.tag}`);
          await logging.logAction('Member Banned', target.user, message.author, {
            reason,
            channel: message.channel
          });

        } catch (error) {
          console.error('Ban Error:', error);
          message.reply('❌ Ban failed!');
        }
      }

      // Kick Command
      if (command === 'kick') {
        try {
          if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('❌ You need **Kick Members** permission!');
          }

          const target = message.mentions.members.first();
          if (!target) return message.reply('❌ Please mention a user!');
          if (!target.kickable) return message.reply("❌ I can't kick this user!");

          const reason = args.slice(1).join(' ') || 'No reason provided';
          await target.kick(reason);
          
          await message.reply(`✅ Kicked ${target.user.tag}`);
          await logging.logAction('Member Kicked', target.user, message.author, {
            reason,
            channel: message.channel
          });

        } catch (error) {
          console.error('Kick Error:', error);
          message.reply('❌ Kick failed!');
        }
      }

      // Mute Command (Timeout)
      if (command === 'mute') {
        try {
          if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('❌ You need **Moderate Members** permission!');
          }

          const target = message.mentions.members.first();
          if (!target) return message.reply('❌ Please mention a user!');
          
          const duration = parseInt(args[1]) || 60;
          if (duration > 40320) return message.reply("❌ Max mute duration is 28 days (40320 minutes)!");
          
          const reason = args.slice(2).join(' ') || 'No reason provided';
          await target.timeout(duration * 60 * 1000, reason);
          
          await message.reply(`✅ Muted ${target.user.tag} for ${duration} minutes`);
          await logging.logAction('Member Muted', target.user, message.author, {
            reason,
            duration: `${duration} minutes`,
            channel: message.channel
          });

        } catch (error) {
          console.error('Mute Error:', error);
          message.reply('❌ Mute failed!');
        }
      }

      // Purge Command
      if (command === 'purge') {
        try {
          if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ You need **Manage Messages** permission!');
          }

          const amount = parseInt(args[0]);
          if (isNaN(amount)) return message.reply('❌ Specify a valid number!');
          if (amount < 1 || amount > 100) return message.reply('❌ Number must be 1-100!');

          await message.channel.bulkDelete(amount + 1);
          const confirmation = await message.channel.send(`✅ Deleted ${amount} messages`);
          setTimeout(() => confirmation.delete(), 3000);
          
          await logging.logAction('Messages Purged', null, message.author, {
            amount,
            channel: message.channel
          });

        } catch (error) {
          console.error('Purge Error:', error);
          message.reply('❌ Purge failed!');
        }
      }

      // Unmute Command
      if (command === 'unmute') {
        try {
          if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('❌ You need **Moderate Members** permission!');
          }

          const target = message.mentions.members.first();
          if (!target) return message.reply('❌ Please mention a user!');
          
          await target.timeout(null);
          await message.reply(`✅ Unmuted ${target.user.tag}`);
          await logging.logAction('Member Unmuted', target.user, message.author, {
            channel: message.channel
          });

        } catch (error) {
          console.error('Unmute Error:', error);
          message.reply('❌ Unmute failed!');
        }
      }
    });
  }
};