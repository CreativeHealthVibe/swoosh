const express = require('express');
const passport = require('passport');
const router = express.Router();
const config = require('../../config');
const { redirectIfAuthenticated } = require('../../middlewares/auth');

/**
 * GET /auth/login
 * Render login page
 */
router.get('/login', redirectIfAuthenticated, (req, res) => {
  const clientId = config.oauth.clientId;
  const redirectUri = encodeURIComponent(config.oauth.callbackUrl);
  const scopesString = config.oauth.scopes.join('+');
  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopesString}`;
  
  console.log('OAuth URL generated:', oauthUrl);
  
  res.render('auth/login', {
    title: 'Login | SWOOSH Bot Admin',
    oauthUrl,
    layout: 'layouts/auth',
    flashMessages: req.flash()
  });
});

/**
 * GET /auth/discord
 * Initiate Discord OAuth2 authentication
 */
router.get('/discord', passport.authenticate('discord', { 
  scope: config.oauth.scopes
}));

/**
 * GET /auth/discord/callback
 * Handle Discord OAuth2 callback
 */
router.get('/discord/callback', 
  passport.authenticate('discord', { 
    failureRedirect: '/auth/login',
    failureFlash: true
  }),
  (req, res) => {
    // Successful authentication
    console.log('OAuth authentication successful, user:', req.user.username);
    
    // Redirect to admin welcome page with time-based greeting
    const redirectUrl = req.session.returnTo || '/admin/welcome';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

/**
 * POST /auth/login
 * Handle local authentication
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Local auth error:', err);
      req.flash('error', 'An error occurred during authentication.');
      return res.redirect('/auth/login');
    }
    
    if (!user) {
      req.flash('error', info.message || 'Invalid username or password.');
      return res.redirect('/auth/login');
    }
    
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Login session error:', loginErr);
        req.flash('error', 'An error occurred during login.');
        return res.redirect('/auth/login');
      }
      
      console.log('Local authentication successful, user:', user.username);
      
      // Redirect to admin welcome page or original destination
      const redirectUrl = req.session.returnTo || '/admin/welcome';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    });
  })(req, res, next);
});

/**
 * GET /auth/logout
 * Log out user
 */
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success', 'You have been logged out');
    res.redirect('/auth/login');
  });
});

module.exports = router;
