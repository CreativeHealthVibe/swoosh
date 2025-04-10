/**
 * Roles API Routes
 * Handles role operations from the 3D admin panel
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/auth');
const { PermissionsBitField, DiscordAPIError } = require('discord.js');

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * GET /api/v2/servers/:serverId/roles
 * Get all roles for a server
 */
router.get('/servers/:serverId/roles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Fetch roles
    const roles = guild.roles.cache
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        position: role.position,
        mentionable: role.mentionable,
        permissions: role.permissions.toArray(),
        memberCount: role.members.size
      }))
      .sort((a, b) => b.position - a.position); // Sort by position (highest first)
    
    res.json({
      success: true,
      serverId,
      roles
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get roles: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/roles
 * Create a new role
 */
router.post('/servers/:serverId/roles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    const { name, color, hoist, mentionable, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }
    
    // Convert permission strings to bitfield
    let permissionBitfield = 0n;
    if (permissions && permissions.length > 0) {
      try {
        permissionBitfield = new PermissionsBitField(permissions).bitfield;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permissions: ' + error.message
        });
      }
    }
    
    // Create role
    const newRole = await guild.roles.create({
      name,
      color: color || 0,
      hoist: hoist || false,
      mentionable: mentionable || false,
      permissions: permissionBitfield,
      reason: `Created by ${req.user.username} via admin panel`
    });
    
    res.json({
      success: true,
      role: {
        id: newRole.id,
        name: newRole.name,
        color: newRole.color,
        hoist: newRole.hoist,
        position: newRole.position,
        mentionable: newRole.mentionable,
        permissions: newRole.permissions.toArray()
      }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error instanceof DiscordAPIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'Discord API error: ' + error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create role: ' + error.message
    });
  }
});

/**
 * PATCH /api/v2/servers/:serverId/roles/:roleId
 * Update a role
 */
router.patch('/servers/:serverId/roles/:roleId', async (req, res) => {
  try {
    const { serverId, roleId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    const { name, color, hoist, mentionable, permissions } = req.body;
    
    // Validate that we're not editing @everyone
    if (role.id === guild.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit the @everyone role'
      });
    }
    
    // Check bot permissions
    if (!guild.members.me.permissions.has('ManageRoles')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to manage roles'
      });
    }
    
    // Check if the bot's highest role is above the target role
    if (guild.members.me.roles.highest.position <= role.position) {
      return res.status(403).json({
        success: false,
        message: 'Bot role is not high enough to edit this role'
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (hoist !== undefined) updateData.hoist = hoist;
    if (mentionable !== undefined) updateData.mentionable = mentionable;
    
    // Convert permission strings to bitfield if provided
    if (permissions && permissions.length > 0) {
      try {
        updateData.permissions = new PermissionsBitField(permissions).bitfield;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permissions: ' + error.message
        });
      }
    }
    
    // Update role
    const updatedRole = await role.edit(updateData, `Updated by ${req.user.username} via admin panel`);
    
    res.json({
      success: true,
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        color: updatedRole.color,
        hoist: updatedRole.hoist,
        position: updatedRole.position,
        mentionable: updatedRole.mentionable,
        permissions: updatedRole.permissions.toArray()
      }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    
    if (error instanceof DiscordAPIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'Discord API error: ' + error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update role: ' + error.message
    });
  }
});

/**
 * DELETE /api/v2/servers/:serverId/roles/:roleId
 * Delete a role
 */
router.delete('/servers/:serverId/roles/:roleId', async (req, res) => {
  try {
    const { serverId, roleId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Validate that we're not deleting @everyone
    if (role.id === guild.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the @everyone role'
      });
    }
    
    // Check bot permissions
    if (!guild.members.me.permissions.has('ManageRoles')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to manage roles'
      });
    }
    
    // Check if the bot's highest role is above the target role
    if (guild.members.me.roles.highest.position <= role.position) {
      return res.status(403).json({
        success: false,
        message: 'Bot role is not high enough to delete this role'
      });
    }
    
    // Delete role
    await role.delete(`Deleted by ${req.user.username} via admin panel`);
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    
    if (error instanceof DiscordAPIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'Discord API error: ' + error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete role: ' + error.message
    });
  }
});

/**
 * PATCH /api/v2/servers/:serverId/roles/:roleId/position
 * Move a role up or down in position
 */
router.patch('/servers/:serverId/roles/:roleId/position', async (req, res) => {
  try {
    const { serverId, roleId } = req.params;
    const { direction } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Validate that we're not moving @everyone
    if (role.id === guild.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move the @everyone role'
      });
    }
    
    // Check bot permissions
    if (!guild.members.me.permissions.has('ManageRoles')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to manage roles'
      });
    }
    
    // Check if the bot's highest role is above the target role
    if (guild.members.me.roles.highest.position <= role.position) {
      return res.status(403).json({
        success: false,
        message: 'Bot role is not high enough to move this role'
      });
    }
    
    // Get all roles sorted by position
    const rolesSorted = Array.from(guild.roles.cache.values())
      .filter(r => r.id !== guild.id) // Filter out @everyone
      .sort((a, b) => b.position - a.position);
    
    // Find index of the role we want to move
    const roleIndex = rolesSorted.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Role not found in sorted list'
      });
    }
    
    // Calculate new position based on direction
    let newPosition;
    
    if (direction === 'up') {
      // If already at the top, don't move
      if (roleIndex === 0) {
        return res.status(400).json({
          success: false,
          message: 'Role is already at the top'
        });
      }
      
      // Swap positions with the role above
      newPosition = rolesSorted[roleIndex - 1].position;
    } else if (direction === 'down') {
      // If already at the bottom, don't move
      if (roleIndex === rolesSorted.length - 1) {
        return res.status(400).json({
          success: false,
          message: 'Role is already at the bottom'
        });
      }
      
      // Swap positions with the role below
      newPosition = rolesSorted[roleIndex + 1].position;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid direction. Must be "up" or "down"'
      });
    }
    
    // Update role position
    await role.setPosition(newPosition, { reason: `Moved by ${req.user.username} via admin panel` });
    
    res.json({
      success: true,
      message: `Role moved ${direction} successfully`
    });
  } catch (error) {
    console.error('Error moving role:', error);
    
    if (error instanceof DiscordAPIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'Discord API error: ' + error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to move role: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/roles/:roleId/members
 * Get members who have a specific role
 */
router.get('/servers/:serverId/roles/:roleId/members', async (req, res) => {
  try {
    const { serverId, roleId } = req.params;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Get members with the role
    const members = role.members.map(member => ({
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator || '0000',
      nickname: member.nickname,
      avatar: member.user.displayAvatarURL({ dynamic: true, size: 64 }),
      isBot: member.user.bot,
      joinedAt: member.joinedAt?.toISOString()
    }));
    
    res.json({
      success: true,
      roleId,
      roleName: role.name,
      members
    });
  } catch (error) {
    console.error('Error getting role members:', error);
    
    if (error instanceof DiscordAPIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'Discord API error: ' + error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get role members: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/roles/:roleId/bulk-assign
 * Assign a role to multiple users
 */
router.post('/servers/:serverId/roles/:roleId/bulk-assign', async (req, res) => {
  try {
    const { serverId, roleId } = req.params;
    const { type = 'all' } = req.body;
    const client = req.app.get('client');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Validate that we're not assigning @everyone
    if (role.id === guild.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign the @everyone role'
      });
    }
    
    // Check bot permissions
    if (!guild.members.me.permissions.has('ManageRoles')) {
      return res.status(403).json({
        success: false,
        message: 'Bot does not have permission to manage roles'
      });
    }
    
    // Check if the bot's highest role is above the target role
    if (guild.members.me.roles.highest.position <= role.position) {
      return res.status(403).json({
        success: false,
        message: 'Bot role is not high enough to assign this role'
      });
    }
    
    // Fetch all members if not cached
    if (guild.members.cache.size < guild.memberCount) {
      try {
        await guild.members.fetch();
      } catch (error) {
        console.error('Error fetching all members:', error);
        // Continue with cached members
      }
    }
    
    // Filter members based on type
    let membersToAssign;
    
    switch (type) {
      case 'all':
        membersToAssign = guild.members.cache.filter(member => !member.roles.cache.has(roleId));
        break;
      case 'humans':
        membersToAssign = guild.members.cache.filter(member => !member.user.bot && !member.roles.cache.has(roleId));
        break;
      case 'bots':
        membersToAssign = guild.members.cache.filter(member => member.user.bot && !member.roles.cache.has(roleId));
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be "all", "humans", or "bots"'
        });
    }
    
    // Check if there are any members to assign the role to
    if (membersToAssign.size === 0) {
      return res.json({
        success: true,
        message: 'No members matched the criteria for assignment',
        count: 0
      });
    }
    
    // Add role to members
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    const assignPromises = membersToAssign.map(async member => {
      try {
        await member.roles.add(role, `Bulk assigned by ${req.user.username} via admin panel`);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          userId: member.id,
          username: member.user.username,
          error: error.message
        });
      }
    });
    
    await Promise.all(assignPromises);
    
    res.json({
      success: true,
      message: `Role assigned to ${successCount} members${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
      count: successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk assigning role:', error);
    
    if (error instanceof DiscordAPIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'Discord API error: ' + error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign role: ' + error.message
    });
  }
});

/**
 * GET /api/v2/servers/:serverId/autoroles
 * Get auto-roles for a server
 */
router.get('/servers/:serverId/autoroles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const client = req.app.get('client');
    const fs = require('fs');
    const path = require('path');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Path to autoroles configuration
    const autrolesConfigPath = path.join(process.cwd(), 'data/autoroles.json');
    
    // Check if file exists
    if (!fs.existsSync(autrolesConfigPath)) {
      return res.json({
        success: true,
        serverId,
        autoroles: []
      });
    }
    
    // Read autoroles configuration
    const autoroles = JSON.parse(fs.readFileSync(autrolesConfigPath, 'utf8'));
    
    res.json({
      success: true,
      serverId,
      autoroles: autoroles[serverId] || []
    });
  } catch (error) {
    console.error('Error getting autoroles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get autoroles: ' + error.message
    });
  }
});

/**
 * POST /api/v2/servers/:serverId/autoroles
 * Add an auto-role
 */
router.post('/servers/:serverId/autoroles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { roleId } = req.body;
    const client = req.app.get('client');
    const fs = require('fs');
    const path = require('path');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Check if role exists
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Validate that we're not adding @everyone
    if (role.id === guild.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add the @everyone role as an auto-role'
      });
    }
    
    // Path to autoroles configuration
    const autrolesConfigPath = path.join(process.cwd(), 'data/autoroles.json');
    
    // Create directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read existing configuration or create new one
    let autoroles = {};
    
    if (fs.existsSync(autrolesConfigPath)) {
      autoroles = JSON.parse(fs.readFileSync(autrolesConfigPath, 'utf8'));
    }
    
    // Initialize server autoroles if it doesn't exist
    if (!autoroles[serverId]) {
      autoroles[serverId] = [];
    }
    
    // Check if role is already in autoroles
    if (autoroles[serverId].includes(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Role is already an auto-role'
      });
    }
    
    // Add role to autoroles
    autoroles[serverId].push(roleId);
    
    // Save configuration
    fs.writeFileSync(autrolesConfigPath, JSON.stringify(autoroles, null, 2));
    
    res.json({
      success: true,
      message: 'Auto-role added successfully',
      roleId,
      roleName: role.name
    });
  } catch (error) {
    console.error('Error adding autorole:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add autorole: ' + error.message
    });
  }
});

/**
 * DELETE /api/v2/servers/:serverId/autoroles/:roleId
 * Remove an auto-role
 */
router.delete('/servers/:serverId/autoroles/:roleId', async (req, res) => {
  try {
    const { serverId, roleId } = req.params;
    const client = req.app.get('client');
    const fs = require('fs');
    const path = require('path');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Discord client not available'
      });
    }
    
    const guild = client.guilds.cache.get(serverId);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Path to autoroles configuration
    const autrolesConfigPath = path.join(process.cwd(), 'data/autoroles.json');
    
    // Check if file exists
    if (!fs.existsSync(autrolesConfigPath)) {
      return res.status(404).json({
        success: false,
        message: 'Auto-roles configuration not found'
      });
    }
    
    // Read autoroles configuration
    const autoroles = JSON.parse(fs.readFileSync(autrolesConfigPath, 'utf8'));
    
    // Check if server has autoroles
    if (!autoroles[serverId] || !autoroles[serverId].includes(roleId)) {
      return res.status(404).json({
        success: false,
        message: 'Role is not an auto-role'
      });
    }
    
    // Remove role from autoroles
    autoroles[serverId] = autoroles[serverId].filter(id => id !== roleId);
    
    // Save configuration
    fs.writeFileSync(autrolesConfigPath, JSON.stringify(autoroles, null, 2));
    
    // Get role name if role exists
    const role = guild.roles.cache.get(roleId);
    const roleName = role ? role.name : 'Unknown Role';
    
    res.json({
      success: true,
      message: 'Auto-role removed successfully',
      roleId,
      roleName
    });
  } catch (error) {
    console.error('Error removing autorole:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove autorole: ' + error.message
    });
  }
});

module.exports = router;