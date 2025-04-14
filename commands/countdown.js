const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const logging = require('../modules/logging');

// Store active countdowns
const activeCountdowns = new Map();

module.exports = {
    name: 'countdown',
    description: 'Set a countdown timer with notification when complete',
    usage: '.countdown <time> [description]',
    aliases: ['count', 'timer'],
    async execute(message, args, client) {
        try {
            // Log command usage
            logging.logCommandUsage(message.author, this.name, args);

            if (args.length < 1) {
                return message.reply({
                    content: `❌ Please provide a time for the countdown. Example: \`.countdown 5h 30m Meeting starts\``,
                    ephemeral: true
                });
            }

            // Parse the time arguments
            const timeArgs = [];
            const descriptionArgs = [];
            let parsingTime = true;

            for (const arg of args) {
                if (parsingTime && (arg.endsWith('h') || arg.endsWith('m') || arg.endsWith('s'))) {
                    timeArgs.push(arg);
                } else {
                    parsingTime = false;
                    descriptionArgs.push(arg);
                }
            }

            if (timeArgs.length === 0) {
                return message.reply({
                    content: `❌ Invalid time format. Please use a format like \`5h 30m 10s\` where h=hours, m=minutes, s=seconds.`,
                    ephemeral: true
                });
            }

            // Calculate total milliseconds
            let totalMs = 0;
            let timeDescription = [];

            for (const time of timeArgs) {
                const value = parseInt(time.slice(0, -1));
                const unit = time.slice(-1).toLowerCase();

                if (isNaN(value) || value < 0) {
                    return message.reply({
                        content: `❌ Invalid time value: \`${time}\`. Please provide a positive number.`,
                        ephemeral: true
                    });
                }

                if (unit === 'h') {
                    totalMs += value * 3600000; // hours to ms
                    if (value > 0) timeDescription.push(`${value} hour${value !== 1 ? 's' : ''}`);
                } else if (unit === 'm') {
                    totalMs += value * 60000; // minutes to ms
                    if (value > 0) timeDescription.push(`${value} minute${value !== 1 ? 's' : ''}`);
                } else if (unit === 's') {
                    totalMs += value * 1000; // seconds to ms
                    if (value > 0) timeDescription.push(`${value} second${value !== 1 ? 's' : ''}`);
                } else {
                    return message.reply({
                        content: `❌ Invalid time unit: \`${unit}\`. Please use h (hours), m (minutes), or s (seconds).`,
                        ephemeral: true
                    });
                }
            }

            // Set a maximum countdown time (24 hours)
            const MAX_COUNTDOWN = 86400000; // 24 hours in ms
            if (totalMs > MAX_COUNTDOWN) {
                return message.reply({
                    content: `❌ Countdown time is too long. Maximum allowed is 24 hours.`,
                    ephemeral: true
                });
            }

            // Set a minimum countdown time (5 seconds)
            const MIN_COUNTDOWN = 5000; // 5 seconds in ms
            if (totalMs < MIN_COUNTDOWN) {
                return message.reply({
                    content: `❌ Countdown time is too short. Minimum allowed is 5 seconds.`,
                    ephemeral: true
                });
            }

            // Get countdown description
            const description = descriptionArgs.length > 0 
                ? descriptionArgs.join(' ') 
                : 'Countdown complete!';

            // Format the time for display
            const formattedTime = timeDescription.join(', ');

            // Calculate end time
            const endTime = Date.now() + totalMs;

            // Create initial embed
            const embed = new EmbedBuilder()
                .setTitle('⏱️ Countdown Started')
                .setDescription(`**${description}**`)
                .addFields(
                    { name: 'Time', value: formattedTime, inline: true },
                    { name: 'Started by', value: message.author.toString(), inline: true },
                    { name: 'Ends at', value: `<t:${Math.floor(endTime / 1000)}:F>`, inline: false },
                    { name: 'Time remaining', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: false }
                )
                .setColor(config.embedColor)
                .setTimestamp();

            // Send the initial countdown message
            const countdownMessage = await message.channel.send({ embeds: [embed] });

            // Store the countdown in the active countdowns map
            const countdownId = `${message.channel.id}-${countdownMessage.id}`;
            activeCountdowns.set(countdownId, {
                endTime,
                description,
                authorId: message.author.id,
                channelId: message.channel.id,
                messageId: countdownMessage.id
            });

            // Set a timeout to handle the countdown completion
            setTimeout(async () => {
                try {
                    // Get the stored countdown info
                    const countdownInfo = activeCountdowns.get(countdownId);
                    if (!countdownInfo) return; // Countdown was already removed

                    // Remove from active countdowns
                    activeCountdowns.delete(countdownId);

                    // Get the channel and message
                    const channel = await client.channels.fetch(countdownInfo.channelId);
                    if (!channel) return;

                    try {
                        const message = await channel.messages.fetch(countdownInfo.messageId);
                        if (!message) return;

                        // Create completion embed
                        const completionEmbed = new EmbedBuilder()
                            .setTitle('⏱️ Countdown Complete!')
                            .setDescription(`**${countdownInfo.description}**`)
                            .addFields(
                                { name: 'Started by', value: `<@${countdownInfo.authorId}>`, inline: true },
                                { name: 'Completed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                            )
                            .setColor('#00FF00') // Green color
                            .setTimestamp();

                        // Update the message with the completion embed
                        await message.edit({ embeds: [completionEmbed] });

                        // Send a notification ping
                        await channel.send({ 
                            content: `⏱️ <@${countdownInfo.authorId}> Your countdown **${countdownInfo.description}** has completed!`,
                            allowedMentions: { users: [countdownInfo.authorId] }
                        });
                    } catch (err) {
                        console.error('Error updating countdown message:', err);
                    }
                } catch (err) {
                    console.error('Error handling countdown completion:', err);
                }
            }, totalMs);

            // Acknowledge to the user that we've started the countdown
            await message.reply({ content: `✅ Countdown started! ${formattedTime} until **${description}**` });
        } catch (error) {
            console.error('Error executing countdown command:', error);
            message.reply('An error occurred while setting up the countdown.');
        }
    },

    // Get a list of all active countdowns
    getActiveCountdowns() {
        return activeCountdowns;
    },

    // Cancel a specific countdown
    async cancelCountdown(countdownId, client) {
        const countdown = activeCountdowns.get(countdownId);
        if (!countdown) return false;

        activeCountdowns.delete(countdownId);

        try {
            const channel = await client.channels.fetch(countdown.channelId);
            if (channel) {
                const message = await channel.messages.fetch(countdown.messageId);
                if (message) {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle('⏱️ Countdown Cancelled')
                        .setDescription(`**${countdown.description}**`)
                        .addFields(
                            { name: 'Started by', value: `<@${countdown.authorId}>`, inline: true },
                            { name: 'Cancelled at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setColor('#FF0000') // Red color
                        .setTimestamp();

                    await message.edit({ embeds: [cancelEmbed] });
                }
            }
            return true;
        } catch (err) {
            console.error('Error cancelling countdown:', err);
            return false;
        }
    }
};