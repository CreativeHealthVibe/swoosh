// admin.js - Admin permission utilities
const config = require('../config');

module.exports = {
  /**
   * Checks if a member has admin permissions
   * @param {Object} member - Discord guild member
   * @returns {boolean} - Whether the member has admin permissions
   */
  isAdmin: (member) => {
    // Admin role names from config
    const ADMIN_ROLES = ["Admin", "Administrator", "Owner"];
    
    // Admin user IDs - hard-coded for security
    const ADMIN_IDS = config.adminUserIds || ['1234567890123456']; // Fallback to example ID if not configured
    
    // Check if member has admin permissions in the server
    if (member.permissions.has('Administrator')) {
      return true;
    }
    
    // Check if member has admin roles or is in admin ID list
    return member.roles.cache.some(r => ADMIN_ROLES.includes(r.name)) || 
           ADMIN_IDS.includes(member.id);
  },
  
  /**
   * Checks if a member can manage tickets
   * @param {Object} member - Discord guild member
   * @returns {boolean} - Whether the member can manage tickets
   */
  canManageTickets: (member) => {
    // Check if member is admin first
    if (module.exports.isAdmin(member)) {
      return true;
    }
    
    // Staff role names from config that can manage tickets
    const STAFF_ROLES = config.staffRoles;
    
    // Check if member has staff roles
    return member.roles.cache.some(r => STAFF_ROLES.includes(r.name));
  },
  
  /**
   * Checks if a member can create bounties
   * @param {Object} member - Discord guild member
   * @returns {boolean} - Whether the member can create bounties
   */
  canCreateBounty: (member) => {
    // Check if member is admin first
    if (module.exports.isAdmin(member)) {
      return true;
    }
    
    // Bounty creator role names - now strictly enforced
    const BOUNTY_ROLES = ["Bounty Master"];
    
    // Check if member has bounty creator roles
    return member.roles.cache.some(r => BOUNTY_ROLES.includes(r.name));
  }
};
