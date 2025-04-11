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
  console.log(`isAdmin middleware for URL: ${req.originalUrl}, Method: ${req.method}`);
  
  // First ensure that the user is authenticated
  if (!req.isAuthenticated()) {
    // User is not authenticated
    req.session.returnTo = req.originalUrl;
    
    // Check if this is an AJAX/API request - more comprehensive check
    const isApiRequest = req.xhr || 
                        req.originalUrl.includes('/api/') || 
                        req.get('Accept') === 'application/json';
    
    console.log(`Request auth check: isXHR=${req.xhr}, path=${req.originalUrl}, isApiRequest=${isApiRequest}`);
    
    if (isApiRequest) {
      // For API requests, return a JSON response
      console.log(`API auth failed for ${req.originalUrl} - returning JSON 401`);
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        redirectTo: '/auth/login'
      });
    }
    
    // For regular page requests, redirect to login
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  
  // Check if req.user exists and has the isAdmin property
  if (!req.user) {
    console.error('User object is undefined or null in isAdmin middleware');
    
    // Check if this is an AJAX/API request
    const isApiRequest = req.xhr || 
                        req.originalUrl.includes('/api/') || 
                        req.get('Accept') === 'application/json';
    
    console.log(`User object check: isXHR=${req.xhr}, path=${req.originalUrl}, isApiRequest=${isApiRequest}`);
    
    if (isApiRequest) {
      // For API requests, return a JSON response
      console.log(`API user object error for ${req.originalUrl} - returning JSON 500`);
      return res.status(500).json({
        success: false,
        message: 'Session error: Invalid user session'
      });
    }
    
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
  // Check if this is an AJAX/API request
  const isApiRequest = req.xhr || 
                      req.originalUrl.includes('/api/') || 
                      req.get('Accept') === 'application/json';
  
  console.log(`Admin check: isXHR=${req.xhr}, path=${req.originalUrl}, isApiRequest=${isApiRequest}`);
  
  if (isApiRequest) {
    // For API requests, return a JSON response
    console.log(`API admin access denied for ${req.originalUrl} - returning JSON 403`);
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required'
    });
  }
  
  // For regular page requests, show error page
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
    return res.redirect('/admin3d');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  redirectIfAuthenticated
};
