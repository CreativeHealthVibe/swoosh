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
                    value: '`.setup-tickets` - Create ticket panel\n`.adduser @user` - Add user to ticket\n`.transcript` - Generate ticket transcript' 
                },
                { 
                    name: '<:SWOOSHT:1361283625320190002> Bounty System', 
                    value: '`.setbounty` - Create a new bounty\n`.image` - Set webhook avatar\n`.template` - Send template message' 
                },
                { 
                    name: '<:Role_:1358183713522847855> Role Management', 
                    value: '`.role @user @role` - Assign/remove role\n`.roleall @role` - Add role to all members\n`.autorole add @role` - Add autorole\n`.autorole remove @role` - Remove autorole\n`.autorole list` - List autoroles\n`.autorole clean` - Remove deleted roles\n`.deleteroles` - Delete unused roles\n`.giverole @user <role-type>` - Assign special bot roles' 
                },
                { 
                    name: '🛡️ Moderation', 
                    value: '`.ban @user [reason]` - Ban member\n`.tempban @user [time]` - Temporary ban\n`.softban @user` - Ban and immediately unban\n`.unban ID [reason]` - Unban member\n`.banlist [page]` - View ban list\n`.banlist-enhanced [filters]` - Advanced ban list\n`.kick @user [reason]` - Kick member\n`.mute @user [time] [reason]` - Mute member\n`.unmute @user` - Unmute member\n`.warn @user [reason]` - Warn a user\n`.purge <amount>` - Delete messages\n`.bulkban` - Ban multiple users' 
                },
                {
                    name: '🚫 Security & Blacklisting',
                    value: '`.blacklists` - Show blacklisted users\n`.add-blacklist` - Add to blacklist\n`.baninfo ID` - View ban details'
                },
                {
                    name: '⚙️ Server Configuration',
                    value: '`.setnews` - Configure news channels\n`.setlogs [channel]` - Set up logging channels\n`.setlogroles` - Manage log permissions\n`.create role` - Create server role\n`.emoji` - Upload custom emoji\n`.logrole set [action] @role` - Configure action roles\n`.logrole list` - View log roles'
                },
                {
                    name: '📨 Communication',
                    value: '`.send #channel <message>` - Send message to channel\n`.dm @user <message>` - Send DM to user\n`.gif <search>` - Post a GIF\n`.voice` - Manage voice channels'
                },
                {
                    name: '👥 MEMBER COMMANDS',
                    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                },
                {
                    name: '👤 User Commands',
                    value: '`.whos @user` - Shows user details\n`.website` - Open dashboard\n`.leaderboard` - View server stats'
                },
                {
                    name: '🎫 Ticket Commands',
                    value: '`.ticket` - Create a new ticket\n`.close` - Close your ticket\n`.add @user` - Add user to your ticket'
                },
                {
                    name: '⏱️ Utility Commands',
                    value: '`.countdown 5h 30m 10s [description]` - Set a countdown timer\n`.afk [reason]` - Set yourself as AFK\n`.help` - Show this help message'
                },
                {
                    name: '📋 Other Commands',
                    value: '`.developers` - Show bot developers\n`.dbtest` - Test database connection'
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