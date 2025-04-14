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
            .setTitle('✨ SWOOSH Premium Command Suite ✨')
            .setDescription(`Welcome to the **SWOOSH Bot** premium command interface.\n\n**Prefix:** \`${config.prefix}\`\n\n*This advanced command system provides enterprise-grade server management features exclusively for staff members with appropriate permissions.*`)
            .addFields(
                { 
                    name: '<:SWOOSHT:1361283625320190002> • Ticket Management',
                    value: '```yaml\n.setup-tickets : Create premium ticket panel\n.adduser @user : Add user to active ticket\n/transcript : Generate professional ticket transcript\n```' 
                },
                { 
                    name: '<:SWOOSHT:1361283625320190002> • Bounty System', 
                    value: '```yaml\n/setbounty : Create a new community bounty\n/image : Set custom webhook avatar\n/template : Send template message for bounties\n```' 
                },
                { 
                    name: '<:Role_:1358183713522847855> • Role Management', 
                    value: '```yaml\n/role @user @role : Assign or remove role\n.autorole add @role : Configure auto-role system\n.autorole remove @role : Remove from auto-role\n.autorole list : Display all configured auto-roles\n.logrole set [action] @role : Assign roles on actions\n```' 
                },
                { 
                    name: '🛡️ • Advanced Moderation', 
                    value: '```yaml\n.ban @user [reason] : Ban member with tracking\n.unban ID [reason] : Unban member with audit\n.banlist [page] : View paginated ban list\n.banlist-enhanced [filters] : Pro ban filtering\n.kick @user [reason] : Remove member\n.mute @user [duration] [reason] : Temporarily mute\n.purge <amount> [reason] : Bulk message deletion\n```' 
                },
                {
                    name: '🚫 • Security & Blacklisting',
                    value: '```yaml\n.blacklists : Review all blacklisted users\n.add blacklist : Add user to global blacklist\n.setlogs [channel] : Configure logging system\n.setlogroles : Manage log channel permissions\n```'
                },
                {
                    name: '👤 • Member Intelligence',
                    value: '```yaml\n/whos @user : Deep user profile analysis\n.afk [reason] : Set away status with notice\n/setlogroles : Configure log access control\n```'
                },
                {
                    name: '🔧 • Server Utilities',
                    value: '```yaml\n/emoji : Convert and upload custom emoji\n.create role : Create custom role with options\n/setnews : Configure news channel system\n/website : Access admin dashboard\n```'
                }
            )
            .setColor('#5865F2') // Discord blurple for premium look
            .setThumbnail('https://i.ibb.co/4g9LqWyK/swoosh.jpg')
            .setImage('https://i.imgur.com/SL5VfDY.png') // Placeholder for premium banner
            .setFooter({ 
                text: 'SWOOSH Enterprise • Premium Command Suite', 
                iconURL: 'https://i.ibb.co/4g9LqWyK/swoosh.jpg' 
            })
            .setTimestamp();

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