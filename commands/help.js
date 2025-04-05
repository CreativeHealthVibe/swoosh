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
            .setTitle('SWOOSH Bot Commands')
            .setDescription(`**Prefix:** \`${config.prefix}\`\n*Note: All commands are restricted to staff members only*`)
            .addFields(
                { 
                    name: '🎟️ Ticket System', 
                    value: '`.setup-tickets` - Create ticket panel\n`.adduser @user` - Add user to ticket\n`/transcript` - Generate ticket transcript' 
                },
                { 
                    name: '💰 Bounty System', 
                    value: '`/setbounty` - Create a new bounty\n`/image` - Set webhook avatar\n`/template` - Send template message for bounties' 
                },
                { 
                    name: '👥 Role Management', 
                    value: '`/role @user @role` - Assign/remove role\n`.autorole add @role` - Add autorole\n`.autorole remove @role` - Remove autorole\n`.autorole list` - List autoroles' 
                },
                { 
                    name: '🛠️ Moderation', 
                    value: '`.ban @user [reason]` - Ban member\n`.unban ID [reason]` - Unban member by ID\n`.kick @user [reason]` - Kick member\n`.mute @user [duration] [reason]` - Mute member\n`.unmute @user [reason]` - Unmute member\n`.purge <amount> [reason]` - Delete multiple messages\n`.dm @user <message>` - Send a direct message to user' 
                },
                {
                    name: '📋 Blacklist System',
                    value: '`.blacklists` - Show all blacklisted users\n`.add blacklist ID: [User ID] User: [@Username] Reason: [Reason]` - Add user to blacklist'
                },
                { 
                    name: '⚙️ Utilities', 
                    value: '`.help` - Show this menu\n`.afk [reason]` - Set yourself as AFK\n`.create role name: [Name] color: [Color] mentionable: [yes/no]` - Create a new role' 
                }
            )
            .setColor(config.embedColor)
            .setFooter({ text: 'SWOOSH Staff Commands | All commands restricted to staff' });

        await message.reply({ embeds: [embed] });
    }
};