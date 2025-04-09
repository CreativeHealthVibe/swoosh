/**
 * Set News Channel Command
 * Allows server admins to set a channel for news updates
 */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  // Command metadata
  name: 'setnews',
  description: 'Set a channel for news updates',
  category: 'Admin',
  usage: '/setnews channel:#channel',
  
  // Slash command definition
  data: new SlashCommandBuilder()
    .setName('setnews')
    .setDescription('Set a channel for news updates')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to use for news')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  /**
   * Execute the slash command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async execute(interaction, client) {
    // Defer reply to give us time to process
    await interaction.deferReply();
    
    // Get the selected channel
    const channel = interaction.options.getChannel('channel');
    
    // Check if we have a database connection
    if (!client.db) {
      return interaction.editReply('❌ Database connection not available');
    }
    
    try {
      // Get the server's configuration or create a new one
      const guildId = interaction.guild.id;
      
      // Save the news channel to the database
      await client.db.set('configs', guildId, {
        newsChannel: channel.id,
        guild: guildId,
        updatedAt: new Date().toISOString(),
        updatedBy: interaction.user.id
      }, true); // Using merge option to update existing record
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('✅ News Channel Set')
        .setDescription(`News updates will now be sent to ${channel}`)
        .addFields(
          { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
          { name: 'Set By', value: `${interaction.user.tag}`, inline: true }
        )
        .setFooter({ text: 'Use the admin panel to send news updates' })
        .setTimestamp();
      
      // Send the confirmation
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error setting news channel:', error);
      return interaction.editReply(`❌ Error: ${error.message}`);
    }
  },
  
  /**
   * Execute the command (text version)
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async executeMessage(message, args, client) {
    // Check if user has administrator permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permissions to use this command');
    }
    
    // Check if channel was mentioned
    if (!message.mentions.channels.size) {
      return message.reply('❌ Please mention a channel, e.g. `.setnews #announcements`');
    }
    
    // Get the first mentioned channel
    const channel = message.mentions.channels.first();
    
    // Check if we have a database connection
    if (!client.db) {
      return message.reply('❌ Database connection not available');
    }
    
    try {
      // Get the server's configuration or create a new one
      const guildId = message.guild.id;
      
      // Save the news channel to the database
      await client.db.set('configs', guildId, {
        newsChannel: channel.id,
        guild: guildId,
        updatedAt: new Date().toISOString(),
        updatedBy: message.author.id
      }, true); // Using merge option to update existing record
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('✅ News Channel Set')
        .setDescription(`News updates will now be sent to ${channel}`)
        .addFields(
          { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
          { name: 'Set By', value: `${message.author.tag}`, inline: true }
        )
        .setFooter({ text: 'Use the admin panel to send news updates' })
        .setTimestamp();
      
      // Send the confirmation
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error setting news channel:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};