// admins.js
module.exports = {
    isAdmin: (member) => {
      const ADMIN_ROLES = ['Bounty Master', 'Admin'];
      const ADMIN_IDS = ['1234567890123456'];
      return member.roles.cache.some(r => ADMIN_ROLES.includes(r.name)) || 
             ADMIN_IDS.includes(member.id);
    }
  };