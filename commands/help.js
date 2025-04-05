const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const adminUtils = require('../utils/admin');

module.exports = {
    name: 'help',
    description: 'Shows a list of available commands',
    async execute(message, args, client) {
        // Check if user has permissions to use this command
        if (!adminUtils.canManageTickets(message.member)) {
            return message.reply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('<:Role_:1358183713522847855> SWOOSH Bot Commands')
            .setDescription(`**Prefix:** \`${config.prefix}\`\n*Note: Most commands are restricted to staff members*`)
            .addFields(
                { 
                    name: '<:date~1:1358183055071903805> Ticket System', 
                    value: '`.setup-tickets` - Create ticket panel\n`.adduser @user` - Add user to ticket\n`/transcript` - Generate ticket transcript' 
                },
                { 
                    name: '<:Joindate:1358183055071903805> Bounty System', 
                    value: '`/setbounty` - Create a new bounty\n`/image` - Set webhook avatar\n`/template` - Send template message for bounties' 
                },
                { 
                    name: '<:Role_:1358183713522847855> Role Management', 
                    value: '`/role @user @role` - Assign/remove role\n`.autorole add @role` - Add autorole\n`.autorole remove @role` - Remove autorole\n`.autorole list` - List autoroles' 
                },
                { 
                    name: '<:Role_:1358183713522847855> Moderation', 
                    value: '`.ban @user [reason]` - Ban member\n`.unban ID [reason]` - Unban member by ID\n`.kick @user [reason]` - Kick member\n`.mute @user [duration] [reason]` - Mute member\n`.unmute @user [reason]` - Unmute member\n`.purge <amount> [reason]` - Delete multiple messages\n`.dm @user <message>` - Send a direct message to user' 
                },
                {
                    name: '<:Role_:1358183713522847855> Blacklist System',
                    value: '`.blacklists` - Show all blacklisted users\n`.add blacklist ID: [User ID] User: [@Username] Reason: [Reason]` - Add user to blacklist'
                },
                {
                    name: '<:aperson:1358185076449476660> User Information',
                    value: '`/whos @user` - Shows detailed user information\n`.afk [reason]` - Set yourself as AFK'
                },
                {
                    name: '<:Calendar_when:1358183398434410636> Emoji Management',
                    value: '`/emoji` - Convert and upload an image as a server emoji'
                },
                { 
                    name: '<:aperson:1358185076449476660> Utilities', 
                    value: '`.help` - Show this menu\n`.create role name: [Name] color: [Color] mentionable: [yes/no]` - Create a new role\n`/website` - Get a link to the bot website' 
                }
            )
            .setColor('#0099ff')
            .setFooter({ text: 'SWOOSH Bot | https://swoosh-bot.replit.app' });

        await message.reply({ embeds: [embed] });
    }
};