const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');

module.exports = {
    name: 'help',
    description: 'Shows a list of available commands in a premium format',
    async execute(message, args, client) {
        // Check if user has permissions to use this command
        if (!adminUtils.canManageTickets(message.member)) {
            return message.reply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('SWOOSH Bot Commands')
            .setDescription(`**Command Prefix:** \`${config.prefix}\`\n*Staff permissions required for most commands*`)
            .addFields(
                { 
                    name: '<:SWOOSHT:1361283625320190002> Ticket Management',
                    value: '`.setup-tickets` - Create ticket panel\n`.adduser @user` - Add user to ticket\n`/transcript` - Generate ticket transcript' 
                },
                { 
                    name: '<:SWOOSHT:1361283625320190002> Bounty System', 
                    value: '`/setbounty` - Create a new bounty\n`/image` - Set webhook avatar\n`/template` - Send template message' 
                },
                { 
                    name: '<:Role_:1358183713522847855> Role Management', 
                    value: '`/role @user @role` - Assign/remove role\n`.autorole add @role` - Add autorole\n`.autorole remove @role` - Remove autorole\n`.autorole list` - List autoroles\n`.logrole set [action] @role` - Assign action roles' 
                },
                { 
                    name: '🛡️ Moderation', 
                    value: '`.ban @user [reason]` - Ban member\n`.unban ID [reason]` - Unban member\n`.banlist [page]` - View ban list\n`.banlist-enhanced [filters]` - Advanced ban list\n`.kick @user [reason]` - Kick member\n`.mute @user [time] [reason]` - Mute member\n`.purge <amount>` - Delete messages' 
                },
                {
                    name: '🚫 Security & Blacklisting',
                    value: '`.blacklists` - Show blacklisted users\n`.add blacklist` - Add to blacklist\n`.setlogs [channel]` - Set log channels\n`.setlogroles` - Manage log permissions'
                },
                {
                    name: '👤 User Information',
                    value: '`/whos @user` - Shows user details\n`.afk [reason]` - Set yourself as AFK\n`/logrole` - Configure action roles'
                },
                {
                    name: '🔧 Utilities',
                    value: '`/emoji` - Upload custom emoji\n`.create role` - Create server role\n`/setnews` - Configure news channels\n`/website` - Open dashboard'
                }
            )
            .setColor('#5865F2')
            .setThumbnail('https://i.ibb.co/4g9LqWyK/swoosh.jpg')
            .setFooter({ 
                text: 'SWOOSH Bot • Command Guide', 
                iconURL: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg' 
            });

        // Create buttons for additional resources
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Website Dashboard')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://swooshfinal.onrender.com'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/swoosh'),
                new ButtonBuilder()
                    .setLabel('Documentation')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://swooshfinal.onrender.com/docs')
            );

        await message.reply({ embeds: [embed], components: [row] });
    }
};