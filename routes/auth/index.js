// Authentication routes
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isAuthenticated } = require('../../middlewares/auth');

// Login page
router.get('/login', (req, res) => {
  // If already logged in, redirect to profile page
  if (req.isAuthenticated()) {
    return res.redirect('/auth/profile');
  }
  
  res.render('auth/login', {
    title: 'SWOOSH Bot - Admin Login',
    user: req.user
  });
});

// Discord OAuth login route
router.get('/discord', passport.authenticate('discord'));

// Discord OAuth callback route
router.get('/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/auth/login'
  }),
  (req, res) => {
    // Successful authentication, redirect to returnTo or profile
    const redirectTo = req.session.returnTo || '/auth/profile';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  }
);

// User profile page (requires auth)
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('auth/profile', {
    title: 'SWOOSH Bot - Your Profile',
    user: req.user
  });
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.error('Error during logout:', err);
      return next(err);
    }
    res.redirect('/');
  });
});

module.exports = router;