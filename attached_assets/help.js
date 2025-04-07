const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('SWOOSH Bot Commands')
            .setDescription(`**Prefix:** \`${config.prefix}\``)
            .addFields(
                { name: '🎟️ Tickets', value: '`.setup-tickets` - Create ticket panel\n`.ticket` - Legacy ticket creation' },
                { name: '🛠️ Moderation', value: '`.ban @user` - Ban member\n`.kick @user` - Kick member\n`.mute @user` - Mute member' },
                { name: '⚙️ Utilities', value: '`.help` - Show this menu\n`.close` - Close ticket' }
            )
            .setColor(config.embedColor)
            .setFooter({ text: 'Close tickets using the button in the ticket channel' });

        message.channel.send({ embeds: [embed] });
    }
};