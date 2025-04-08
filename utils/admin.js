/**
 * Admin utility functions
 * Contains functions for admin permissions and operations
 */

/**
 * Check if a user is a server admin
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user is an admin
 */
const isAdmin = (member) => {
  if (!member) return false;
  
  // Check if user has administrator permission
  if (member.permissions && member.permissions.has('ADMINISTRATOR')) {
    return true;
  }
  
  // Check for admin role
  const adminRoles = ['Admin', 'Administrator', 'Moderator', 'Staff'];
  return member.roles.cache.some(role => adminRoles.includes(role.name));
};

/**
 * Check if a user can create channels
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user can create channels
 */
const canCreateChannels = (member) => {
  if (!member) return false;
  return member.permissions.has('MANAGE_CHANNELS') || isAdmin(member);
};

/**
 * Check if a user can manage tickets
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user can manage tickets
 */
const canManageTickets = (member) => {
  if (!member) return false;
  return isAdmin(member) || member.roles.cache.some(role => 
    ['Ticket Support', 'Support Team', 'Support'].includes(role.name)
  );
};

/**
 * Check if a user can manage roles
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user can manage roles
 */
const canManageRoles = (member) => {
  if (!member) return false;
  return member.permissions.has('MANAGE_ROLES') || isAdmin(member);
};

/**
 * Check if a user can ban members
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user can ban members
 */
const canBanMembers = (member) => {
  if (!member) return false;
  return member.permissions.has('BAN_MEMBERS') || isAdmin(member);
};

/**
 * Check if a user can kick members
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user can kick members
 */
const canKickMembers = (member) => {
  if (!member) return false;
  return member.permissions.has('KICK_MEMBERS') || isAdmin(member);
};

/**
 * Check if a user can create bounties
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user can create bounties
 */
const canCreateBounty = (member) => {
  if (!member) return false;
  return isAdmin(member) || member.roles.cache.some(role => 
    ['Bounty Master', 'Bounty Admin'].includes(role.name)
  );
};

module.exports = {
  isAdmin,
  canCreateChannels,
  canManageTickets,
  canManageRoles,
  canBanMembers,
  canKickMembers,
  canCreateBounty
};
