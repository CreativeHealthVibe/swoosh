/**
 * Auth middleware functions
 * These functions are used to protect routes that require authentication
 */

/**
 * Middleware to check if the user is authenticated
 * If not, redirect to login page
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Store the original URL to redirect back after login
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page');
  res.redirect('/auth/login');
};

/**
 * Middleware to check if the user is an admin
 * If not, show an error page
 */
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  
  if (req.isAuthenticated()) {
    // User is authenticated but not an admin
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page',
      error: {
        status: 403,
        stack: process.env.NODE_ENV === 'development' ? 'Not authorized' : ''
      }
    });
  }
  
  // User is not authenticated
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page');
  res.redirect('/auth/login');
};

/**
 * Middleware to redirect authenticated users away from login page
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  redirectIfAuthenticated
};
