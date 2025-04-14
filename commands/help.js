const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');

module.exports = {
    name: 'help',
    description: 'Shows a list of available commands in a premium format',
    async execute(message, args, client) {
        // Help command is available to all users, no permission check needed

        const embed = new EmbedBuilder()
            .setTitle('SWOOSH Bot Commands')
            .setDescription(`**Command Prefix:** \`${config.prefix}\`\n*Use the appropriate commands based on your permissions*`)
            .addFields(
                {
                    name: '🧰 ADMIN COMMANDS',
                    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                },
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
                    value: '`/role @user @role` - Assign/remove role\n`.autorole add @role` - Add autorole\n`.autorole remove @role` - Remove autorole\n`.autorole list` - List autoroles\n`.logrole set [action] @role` - Assign action roles\n`.autorole clean` - Remove deleted roles' 
                },
                { 
                    name: '🛡️ Moderation', 
                    value: '`.ban @user [reason]` - Ban member\n`.unban ID [reason]` - Unban member\n`.banlist [page]` - View ban list\n`.banlist-enhanced [filters]` - Advanced ban list\n`.kick @user [reason]` - Kick member\n`.mute @user [time] [reason]` - Mute member\n`.purge <amount>` - Delete messages\n`.bulkban` - Ban multiple users' 
                },
                {
                    name: '🚫 Security & Blacklisting',
                    value: '`.blacklists` - Show blacklisted users\n`.add blacklist` - Add to blacklist\n`.setlogs [channel]` - Set log channels\n`.setlogroles` - Manage log permissions\n`.baninfo ID` - View ban details'
                },
                {
                    name: '⚙️ Server Configuration',
                    value: '`/setnews` - Configure news channels\n`.create role` - Create server role\n`/emoji` - Upload custom emoji\n`/logrole config` - Configure action roles\n`.setlogs` - Set up logging channels'
                },
                {
                    name: '👥 MEMBER COMMANDS',
                    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                },
                {
                    name: '👤 User Commands',
                    value: '`/whos @user` - Shows user details\n`.afk [reason]` - Set yourself as AFK\n`/website` - Open dashboard\n`/logrole list` - View your log roles'
                },
                {
                    name: '🎫 Ticket Commands',
                    value: '`/ticket` - Create a new ticket\n`/close` - Close your ticket\n`/add @user` - Add user to your ticket'
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
                    .setLabel('Privacy Policy')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://swooshfinal.onrender.com/privacy')
            );

        await message.reply({ embeds: [embed], components: [row] });
    }
};