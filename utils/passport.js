/**
 * Passport configuration for Discord OAuth
 */
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const config = require('../config');

// Configure passport to use Discord strategy
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  // Check if user is in the admin list
  const isAdmin = config.adminUserIds.includes(profile.id);
  
  // Add isAdmin flag to the profile
  profile.isAdmin = isAdmin;
  
  // In a production app, you might want to store the user in a database here
  return done(null, profile);
}));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  // In a production app, you would fetch the user from a database here
  done(null, user);
});

module.exports = passport;
