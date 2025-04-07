/**
 * Member Management API Routes
 * Handles member moderation actions from the admin panel
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const logging = require('../../modules/logging');

// Protect all routes with admin middleware
router.use(isAdmin);

/**
 * POST /api/admin/members/send-dm
 * Send DM to a user via the bot
 */
router.post('/send-dm', async (req, res) => {
  const { userId, content } = req.body;
  const client = req.app.get('client');
  
  if (!userId || !content) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  try {
    // Find the user in Discord
    const user = await client.users.fetch(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Send the DM
    let dmSent = true;
    try {
      await user.send(content);
    } catch (dmError) {
      dmSent = false;
      console.warn(`Failed to send DM to ${user.username} (${userId}): ${dmError.message}`);
      // Continue even if DM fails - this is normal behavior when users have DMs disabled
    }
    
    // Log the action
    console.info(`Admin ${req.user.username} sent DM to ${user.username} (${userId}) - ${dmSent ? 'Delivered' : 'Failed to deliver'}`);
    
    // Log using the logging module
    logging.logAction('DM Sent', user, req.user, {
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      delivered: dmSent ? 'Yes' : 'No'
    });
    
    return res.json({ 
      success: true, 
      message: dmSent ? 'Message sent successfully' : 'Message could not be delivered',
      dmSent: dmSent,
      dmStatus: dmSent 
        ? 'DM was successfully sent to the user' 
        : 'DM could not be sent to the user (they likely have DMs disabled)'
    });
  } catch (error) {
    console.error(`Error processing DM request for user ${userId}: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process DM request: ' + error.message,
      dmStatus: 'An error occurred while trying to process the DM request. The message may not have been sent.'
    });
  }
});

/**
 * POST /api/admin/members/kick
 * Kick a user from a guild
 */
router.post('/kick', async (req, res) => {
  const { userId, guildId, reason } = req.body;
  const client = req.app.get('client');
  
  if (!userId || !guildId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  try {
    // Find the guild by ID
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Guild not found' });
    }
    
    // Get the member
    let member;
    try {
      member = await guild.members.fetch(userId);
    } catch (fetchError) {
      return res.status(404).json({ success: false, message: 'Member not found in this guild' });
    }
    
    // Check if member is kickable
    if (!member.kickable) {
      return res.status(403).json({ success: false, message: 'Bot does not have permission to kick this user' });
    }
    
    // Kick the member
    await member.kick(reason || 'No reason provided');
    
    // Log the action
    console.info(`Admin ${req.user.username} kicked ${member.user.username} (${userId}) from ${guild.name}${reason ? ` for: ${reason}` : ''}`);
    
    // Log using the logging module
    logging.logAction('User Kicked', member.user, req.user, {
      reason: reason || 'No reason provided',
      guild: guild.name
    });
    
    return res.json({ success: true, message: 'User kicked successfully' });
  } catch (error) {
    console.error(`Error kicking user ${userId} from guild ${guildId}: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to kick user: ' + error.message });
  }
});

/**
 * POST /api/admin/members/ban
 * Ban a user from a guild
 */
router.post('/ban', async (req, res) => {
  const { userId, guildId, reason, deleteMessages } = req.body;
  const client = req.app.get('client');
  
  if (!userId || !guildId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  try {
    // Find the guild by ID
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Guild not found' });
    }
    
    // Get the member (if they're in the guild)
    let username = 'Unknown User';
    let user = null;
    try {
      const member = await guild.members.fetch(userId);
      username = member.user.username;
      user = member.user;
      
      // Check if member is bannable
      if (!member.bannable) {
        return res.status(403).json({ success: false, message: 'Bot does not have permission to ban this user' });
      }
    } catch (e) {
      // User might not be in the guild, try to get info from Discord API
      try {
        user = await client.users.fetch(userId);
        username = user.username;
      } catch (err) {
        // Proceed with ban even if we can't get the username
      }
    }
    
    // Ban options
    const banOptions = {
      reason: reason || 'No reason provided'
    };
    
    // If deleteMessages is true, delete messages from the last day
    if (deleteMessages) {
      banOptions.deleteMessageSeconds = 86400; // 1 day in seconds
    }
    
    // Ban the user
    await guild.members.ban(userId, banOptions);
    
    // Log the action
    console.info(`Admin ${req.user.username} banned ${username} (${userId}) from ${guild.name}${reason ? ` for: ${reason}` : ''}`);
    
    // Log using the logging module
    if (user) {
      logging.logAction('User Banned', user, req.user, {
        reason: reason || 'No reason provided',
        guild: guild.name,
        deleteMessages: deleteMessages ? 'Yes (24h)' : 'No'
      });
    } else {
      // If we couldn't get user object, create a minimal one for logging
      logging.logAction('User Banned', { id: userId, tag: username }, req.user, {
        reason: reason || 'No reason provided',
        guild: guild.name,
        deleteMessages: deleteMessages ? 'Yes (24h)' : 'No'
      });
    }
    
    return res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    console.error(`Error banning user ${userId} from guild ${guildId}: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to ban user: ' + error.message });
  }
});

/**
 * POST /api/admin/members/timeout
 * Timeout a user in a guild
 */
router.post('/timeout', async (req, res) => {
  const { userId, guildId, reason, duration } = req.body;
  const client = req.app.get('client');
  
  if (!userId || !guildId || !duration) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  try {
    // Find the guild by ID (more reliable than name)
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Guild not found' });
    }
    
    // Get the member
    let member;
    try {
      member = await guild.members.fetch(userId);
    } catch (fetchError) {
      return res.status(404).json({ success: false, message: 'Member not found in this guild' });
    }
    
    // Check if member can be timed out
    if (!member.moderatable) {
      return res.status(403).json({ success: false, message: 'Bot does not have permission to timeout this user' });
    }
    
    // Parse duration from milliseconds to a Date
    const timeoutUntil = new Date(Date.now() + parseInt(duration));
    
    // Timeout the member
    await member.timeout(parseInt(duration), reason || 'No reason provided');
    
    // Format duration for logging
    let formattedDuration;
    const durationMs = parseInt(duration);
    
    if (durationMs >= 86400000) { // 1 day
      formattedDuration = `${durationMs / 86400000} day(s)`;
    } else if (durationMs >= 3600000) { // 1 hour
      formattedDuration = `${durationMs / 3600000} hour(s)`;
    } else if (durationMs >= 60000) { // 1 minute
      formattedDuration = `${durationMs / 60000} minute(s)`;
    } else {
      formattedDuration = `${durationMs / 1000} second(s)`;
    }
    
    // Log the action
    console.info(`Admin ${req.user.username} timed out ${member.user.username} (${userId}) in ${guild.name} for ${formattedDuration}${reason ? `. Reason: ${reason}` : ''}`);
    
    // Log using the logging module
    logging.logAction('User Timed Out', member.user, req.user, {
      reason: reason || 'No reason provided',
      guild: guild.name,
      duration: formattedDuration
    });
    
    return res.json({ success: true, message: 'User timed out successfully' });
  } catch (error) {
    console.error(`Error timing out user ${userId} in guild ${guildId}: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to timeout user: ' + error.message });
  }
});

/**
 * Ensure "warnings" collection exists in Discord database
 * This is now handled automatically by the Discord database manager
 * when writing the first document to the collection
 */

/**
 * POST /api/admin/members/warn
 * Warn a user and record the warning
 */
router.post('/warn', async (req, res) => {
  const { userId, reason } = req.body;
  const client = req.app.get('client');
  
  if (!userId || !reason) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  try {
    // Find the user in Discord
    const user = await client.users.fetch(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Send DM to the user with the warning
    let dmSent = true;
    try {
      await user.send(`⚠️ **Warning**\nYou have been warned. Reason: ${reason}`);
    } catch (dmError) {
      dmSent = false;
      console.warn(`Failed to send warning DM to ${user.username} (${userId}): ${dmError.message}`);
      // Continue even if DM fails - this is normal behavior when users have DMs disabled
    }
    
    // Record the warning in the Discord database
    const warningId = `${userId}-${Date.now()}`;
    const warningData = {
      userId: userId,
      username: user.username,
      reason: reason,
      timestamp: new Date().toISOString(),
      issuer: req.user.username,
      issuerId: req.user.id
    };
    
    await client.discordDB.setDocument('warnings', warningId, warningData);
    
    // Log the action
    console.info(`Admin ${req.user.username} warned ${user.username} (${userId}). Reason: ${reason}`);
    
    // Log using the logging module
    logging.logAction('User Warned', user, req.user, {
      reason: reason
    });
    
    return res.json({ 
      success: true, 
      message: 'Warning recorded successfully', 
      dmSent: dmSent, 
      dmStatus: dmSent 
        ? 'Warning DM was successfully sent to the user' 
        : 'Warning was recorded but the DM could not be sent (user likely has DMs disabled)'
    });
  } catch (error) {
    console.error(`Error warning user ${userId}: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to complete warning process: ' + error.message,
      dmStatus: 'The warning DM may or may not have been sent, but there was an error completing the warning process.'
    });
  }
});

/**
 * GET /api/admin/members/warnings/:userId
 * Get all warnings for a user
 */
router.get('/warnings/:userId', async (req, res) => {
  const { userId } = req.params;
  const client = req.app.get('client');
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'Missing user ID' });
  }
  
  try {
    // Check if Discord database is initialized
    if (!client.discordDB || !client.discordDB.initialized) {
      return res.status(503).json({ success: false, message: 'Discord database not initialized' });
    }
    
    // Get warnings from Discord database
    const warnings = client.discordDB.findDocuments('warnings', (doc) => {
      return doc.userId === userId;
    });
    
    // Sort by timestamp, newest first
    warnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return res.json({ success: true, warnings });
  } catch (error) {
    console.error(`Error fetching warnings for user ${userId}: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch warnings: ' + error.message });
  }
});

/**
 * GET /api/admin/members/servers
 * Get list of all servers the bot is in
 */
router.get('/servers', async (req, res) => {
  const client = req.app.get('client');
  
  try {
    // Get all guilds the bot is in
    const servers = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL({ dynamic: true })
    }));
    
    // Sort by member count (largest first)
    servers.sort((a, b) => b.memberCount - a.memberCount);
    
    return res.json({ success: true, servers });
  } catch (error) {
    console.error(`Error fetching servers: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch servers: ' + error.message });
  }
});

module.exports = router;
