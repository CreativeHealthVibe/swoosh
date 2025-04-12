/**
 * Admin Authentication Middleware
 * Checks if a user is authenticated and has admin privileges
 */

module.exports = function isAdmin(req, res, next) {
  // Log middleware execution for debugging
  console.log(`isAdmin middleware for URL: ${req.originalUrl}, Method: ${req.method}`);
  
  // Check if user is authenticated
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    // Log the authentication failure
    console.log('Admin access denied: Not authenticated');
    
    // Store the original URL for redirect after login
    req.session.returnTo = req.originalUrl;
    
    // Check if this is an XHR/API request
    const isXHR = req.xhr || 
                 req.headers.accept && req.headers.accept.indexOf('json') > -1 ||
                 req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    // For API requests, return JSON error
    if (isXHR) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        redirect: '/auth/discord'
      });
    }
    
    // For regular requests, redirect to login
    return res.redirect('/auth/discord');
  }
  
  // Check if user has admin role
  if (!req.user.isAdmin) {
    // Log the authorization failure
    console.log(`Admin access denied for user ${req.user.id}: Not an admin`);
    
    // Check if this is an XHR/API request
    const isXHR = req.xhr || 
                 req.headers.accept && req.headers.accept.indexOf('json') > -1 ||
                 req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    // For API requests, return JSON error
    if (isXHR) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }
    
    // For regular requests, render access denied page
    return res.status(403).render('access-denied', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  
  // User is authenticated and has admin role
  next();
};