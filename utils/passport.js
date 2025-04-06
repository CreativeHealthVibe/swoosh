// Passport OAuth configuration
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const config = require('../config');

// Configure Passport
module.exports = function(app) {
  // Serialize user to the session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from the session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Discord OAuth2 strategy
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || `${process.env.WEBSITE_URL || 'http://localhost:3000'}/auth/discord/callback`,
    scope: ['identify', 'guilds']
  }, 
  (accessToken, refreshToken, profile, done) => {
    // Store tokens in the profile object
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    
    // Check if the user is in the admin list
    const adminUserIds = config.adminUserIds || [];
    profile.isAdmin = adminUserIds.includes(profile.id);
    
    return done(null, profile);
  }));

  return passport;
};