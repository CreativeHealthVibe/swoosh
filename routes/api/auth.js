/**
 * Auth API Routes
 * Handles API authentication operations for the application
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();
const db = require('../../utils/database');

/**
 * POST /api/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    // Check if username already exists
    const existingUser = await db.getLocalUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Create the new user
    const newUser = await db.createLocalUser({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      is_admin: false, // default to non-admin
      permissions: {} // empty permissions by default
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    // Log in the new user
    req.login(userWithoutPassword, (err) => {
      if (err) {
        console.error('Login error after registration:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error during login after registration' 
        });
      }
      
      // Return the user data
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: userWithoutPassword
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creating user account' 
    });
  }
});

/**
 * POST /api/login
 * Login a user via API
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('API login error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid username or password' 
      });
    }
    
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('API login session error:', loginErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Login session error' 
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword
      });
    });
  })(req, res, next);
});

/**
 * POST /api/logout
 * Logout a user via API
 */
router.post('/logout', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not logged in' 
    });
  }
  
  req.logout((err) => {
    if (err) {
      console.error('API logout error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Logout error' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });
});

/**
 * GET /api/user
 * Get current user information
 */
router.get('/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user;
  
  return res.status(200).json({
    success: true,
    user: userWithoutPassword
  });
});

module.exports = router;