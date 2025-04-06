// Authentication middlewares
const config = require('../config');

/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Save the original URL for redirecting after authentication
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
}

/**
 * Middleware to check if user is an admin
 */
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  
  // Save the original URL for redirecting after authentication
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  
  // User is authenticated but not an admin
  res.status(403).render('errors/403', {
    title: 'Access Denied',
    message: 'You do not have permission to access this page.'
  });
}

/**
 * Check if a user is an admin (used for non-middleware contexts)
 * @param {Object} user - Discord.js GuildMember or user object with roles property
 * @returns {boolean} - Whether the user is an admin
 */
function checkAdmin(user) {
  // If we're passed a Discord user ID directly (string)
  if (typeof user === 'string') {
    return config.adminUserIds && config.adminUserIds.includes(user);
  }
  
  // If we're passed a user object from the session
  if (user && user.id) {
    return config.adminUserIds && config.adminUserIds.includes(user.id);
  }
  
  // If we're passed a GuildMember from Discord.js
  if (user && user.roles && typeof user.roles.cache !== 'undefined') {
    // Check for admin role
    const adminRoleId = config.adminRoleId;
    if (adminRoleId && user.roles.cache.has(adminRoleId)) {
      return true;
    }
    
    // Check user ID against admin list
    return config.adminUserIds && config.adminUserIds.includes(user.id);
  }
  
  return false;
}

// Export middlewares
module.exports = {
  isAuthenticated,
  isAdmin,
  checkAdmin
};