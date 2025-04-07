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
  // First ensure that the user is authenticated
  if (!req.isAuthenticated()) {
    // User is not authenticated
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  
  // Check if req.user exists and has the isAdmin property
  if (!req.user) {
    console.error('User object is undefined or null in isAdmin middleware');
    return res.status(500).render('error', {
      title: 'Session Error',
      message: 'Your session appears to be invalid. Please try logging in again.',
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'development' ? 'Invalid user session' : ''
      }
    });
  }
  
  // Check if the user is an admin (handle both property naming conventions)
  if (req.user.isAdmin || req.user.is_admin) {
    return next();
  }
  
  // User is authenticated but not an admin
  return res.status(403).render('error', {
    title: 'Access Denied',
    message: 'You do not have permission to access this page',
    error: {
      status: 403,
      stack: process.env.NODE_ENV === 'development' ? 'Not authorized' : ''
    }
  });
};

/**
 * Middleware to redirect authenticated users away from login page
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin/welcome');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  redirectIfAuthenticated
};
