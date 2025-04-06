const express = require('express');
const passport = require('passport');
const router = express.Router();
const { redirectIfAuthenticated } = require('../../middlewares/auth');

/**
 * GET /auth/login
 * Render login page
 */
router.get('/login', redirectIfAuthenticated, (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.WEBSITE_URL + '/');
  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=guilds.join+identify`;
  
  res.render('auth/login', {
    title: 'Login | SWOOSH Bot Admin',
    oauthUrl,
    layout: 'layouts/auth'
  });
});

/**
 * GET /auth/discord
 * Initiate Discord OAuth2 authentication
 */
router.get('/discord', passport.authenticate('discord', { 
  scope: ['identify', 'guilds.join'] 
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
    const redirectUrl = req.session.returnTo || '/admin/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

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
