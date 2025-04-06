/**
 * Authentication Middleware for Admin Dashboard
 * 
 * This middleware handles authentication checks and authorization for the admin dashboard.
 */
const config = require('../config');

/**
 * Middleware to check if a user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Store the requested URL to redirect after login
  req.session.returnTo = req.originalUrl || req.url;
  res.redirect('/auth/login');
};

/**
 * Middleware to check if a user is an admin
 */
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl || req.url;
    return res.redirect('/auth/login');
  }
  
  // Check if user ID is in the adminUserIds array in config
  if (config.adminUserIds.includes(req.user.id)) {
    req.user.isAdmin = true;
    return next();
  }
  
  // User is authenticated but not authorized as admin
  res.status(403).render('errors/403', { 
    title: 'Access Denied',
    message: 'You do not have permission to access the admin dashboard.',
    user: req.user
  });
};

/**
 * Middleware to check if a user is logged out
 */
const isLoggedOut = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/profile');
};

/**
 * Add user to all views
 */
const addUserToViews = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
};

/**
 * Handle login errors
 */
const handleLoginError = (req, res, next) => {
  if (req.query.error) {
    res.locals.error = req.query.error;
  } else {
    res.locals.error = null;
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isLoggedOut,
  addUserToViews,
  handleLoginError
};
