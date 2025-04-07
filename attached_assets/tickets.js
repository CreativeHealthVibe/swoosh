// tickets.js
const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const path = require('path');
const cron = require('node-cron');
const config = require('./config.json');
const logging = require('./logging.js');

const tickets = new Map();

async function generateTranscript(channel) {
  try {
    const transcript = await createTranscript(channel, {
      limit: -1,
      returnBuffer: false,
      fileName: `${channel.name}-transcript.html`
    });
    
    // Ensure transcripts directory exists
    const logsDir = path.join(__dirname, 'transcripts');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    
    // Save transcript file
    const filePath = path.join(logsDir, transcript.name);
    fs.writeFileSync(filePath, transcript.content);
    
    return new AttachmentBuilder(fs.readFileSync(filePath), { 
      name: transcript.name 
    });
  } catch (error) {
    console.error('Transcript Error:', error);
    return null;
  }
}

module.exports = {
  init: (client) => {
    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) return;

      // Ticket Creation
      if (interaction.customId === 'create_ticket') {
        try {
          await interaction.deferReply({ ephemeral: true });
          
          // Find or create ticket category
          let category = interaction.guild.channels.cache.find(
            c => c.name === config.ticketCategory
          );
          
          if (!category) {
            category = await interaction.guild.channels.create({
              name: config.ticketCategory,
              type: ChannelType.GuildCategory,
            });
          }

          // Check for existing ticket
          const existingTicket = interaction.guild.channels.cache.find(
            ch => ch.parentId === category.id && 
            ch.name === `ticket-${interaction.user.username}`
          );

          if (existingTicket) {
            return interaction.editReply(`❌ You already have an open ticket: ${existingTicket}`);
          }

          // Create ticket channel
          const ticket = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
              },
              {
                id: interaction.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages
                ]
              },
              {
                id: client.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.ManageChannels
                ]
              }
            ]
          });

          // Store ticket info
          tickets.set(ticket.id, {
            creator: interaction.user.id,
            createdAt: Date.now()
          });

          // Create close button
          const closeButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('close_ticket')
              .setLabel('Close Ticket')
              .setStyle(ButtonStyle.Danger)
          );

          // Send initial message
          await ticket.send({
            content: `${interaction.user}, welcome to your support ticket!\n\n` +
              `**Ticket ID:** \`${ticket.id}\`\n` +
              `**Created at:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            components: [closeButton]
          });

          await interaction.editReply(`✅ Ticket created: ${ticket}`);
          await logging.logAction('Ticket Created', interaction.user, null, {
            channel: ticket
          });

        } catch (error) {
          console.error('Ticket Creation Error:', error);
          interaction.editReply('❌ Failed to create ticket!').catch(() => {});
        }
      }

      // Ticket Closing
      if (interaction.customId === 'close_ticket') {
        try {
          await interaction.deferReply({ ephemeral: true });
          if (!interaction.channel.name.startsWith('ticket-')) return;

          const transcript = await generateTranscript(interaction.channel);
          
          // Log closure
          await logging.logAction('Ticket Closed', interaction.user, null, {
            channel: interaction.channel,
            duration: `${Math.floor((Date.now() - tickets.get(interaction.channel.id).createdAt) / 1000)} seconds`
          });

          // Delete ticket
          tickets.delete(interaction.channel.id);
          await interaction.channel.delete();
          
        } catch (error) {
          console.error('Ticket Closing Error:', error);
          interaction.editReply('❌ Failed to close ticket!').catch(() => {});
        }
      }
    });

    // Daily transcript cleanup
    cron.schedule('0 0 * * *', () => {
      const dir = path.join(__dirname, 'transcripts');
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          fs.unlinkSync(path.join(dir, file));
        });
      }
    });
  },

  setupTickets: async (guild) => {
    // Ensure ticket category exists
    let category = guild.channels.cache.find(
      c => c.name === config.ticketCategory
    );
    
    if (!category) {
      category = await guild.channels.create({
        name: config.ticketCategory,
        type: ChannelType.GuildCategory,
      });
    }
    return category;
  }
};