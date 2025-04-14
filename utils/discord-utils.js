/**
 * Discord Utility Functions
 * Helper functions for working with Discord.js
 */

/**
 * Get a guild by its ID
 * @param {Client} client - Discord client
 * @param {string} guildId - Guild ID
 * @returns {Promise<Guild|null>} - Guild object or null if not found
 */
async function getGuildById(client, guildId) {
  try {
    return await client.guilds.fetch(guildId);
  } catch (error) {
    console.error(`Error fetching guild ${guildId}:`, error);
    return null;
  }
}

/**
 * Get a channel by its ID
 * @param {Client} client - Discord client
 * @param {string} channelId - Channel ID
 * @returns {Promise<Channel|null>} - Channel object or null if not found
 */
async function getChannelById(client, channelId) {
  try {
    return await client.channels.fetch(channelId);
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Get a user by their ID
 * @param {Client} client - Discord client
 * @param {string} userId - User ID
 * @returns {Promise<User|null>} - User object or null if not found
 */
async function getUserById(client, userId) {
  try {
    return await client.users.fetch(userId);
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

/**
 * Get a member from a guild
 * @param {Guild} guild - Guild object
 * @param {string} userId - User ID
 * @returns {Promise<GuildMember|null>} - GuildMember object or null if not found
 */
async function getMemberFromGuild(guild, userId) {
  try {
    return await guild.members.fetch(userId);
  } catch (error) {
    console.error(`Error fetching member ${userId} from guild ${guild.id}:`, error);
    return null;
  }
}

/**
 * Check if a bot has permissions in a channel
 * @param {Channel} channel - Discord channel
 * @param {Array<string>} permissions - Array of permission flags
 * @returns {boolean} - Whether the bot has the permissions
 */
function botHasPermissions(channel, permissions) {
  if (!channel || !channel.guild) return false;
  
  const botMember = channel.guild.members.me;
  if (!botMember) return false;
  
  const channelPermissions = channel.permissionsFor(botMember);
  if (!channelPermissions) return false;
  
  return permissions.every(permission => channelPermissions.has(permission));
}

module.exports = {
  getGuildById,
  getChannelById,
  getUserById,
  getMemberFromGuild,
  botHasPermissions
};