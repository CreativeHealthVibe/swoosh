/**
 * Authentication routes for Discord OAuth
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { isAuthenticated, isLoggedOut, handleLoginError } = require('../../middlewares/auth');

// Login page
router.get('/login', isLoggedOut, handleLoginError, (req, res) => {
  res.render('auth/login', { 
    title: 'Login - SWOOSH Bot Admin' 
  });
});

// Discord OAuth routes
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', 
  passport.authenticate('discord', { 
    failureRedirect: '/auth/login?error=AuthenticationFailed',
    failureMessage: true 
  }),
  (req, res) => {
    // Successful authentication
    const redirectTo = req.session.returnTo || '/auth/profile';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  }
);

// User profile
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('auth/profile', {
    title: 'Your Profile - SWOOSH Bot Admin',
    user: req.user
  });
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy();
    res.redirect('/');
  });
});

module.exports = router;
