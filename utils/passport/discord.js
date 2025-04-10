const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const config = require('../../config');
const db = require('../database');

// Get OAuth settings from config
const scopes = config.oauth.scopes;

// Configure Discord authentication strategy
const setupDiscordStrategy = () => {
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: config.oauth.callbackUrl,
    scope: scopes
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('Discord OAuth callback received. User:', profile.username);
    try {
      // Get admin user IDs from config
      const adminUserIds = config.adminUserIds;
      
      // Check if the user is authorized to access the admin panel
      const isAdmin = adminUserIds.includes(profile.id);
      
      if (!isAdmin) {
        return done(null, false, { message: 'You are not authorized to access the admin panel.' });
      }
      
      // Store user info to pass to the client
      const user = {
        id: profile.id,
        username: profile.username,
        discriminator: profile.discriminator,
        avatar: profile.avatar,
        isAdmin: isAdmin,
        userType: 'discord', // Add user type for differentiation
        accessToken: accessToken,
        refreshToken: refreshToken
      };
      
      // Check if this Discord user is linked to a local user account
      const localUser = await db.getLocalUserByDiscordId(profile.id);
      if (localUser) {
        // Enhance user object with local user permissions if available
        user.permissions = localUser.permissions;
        user.is_super_admin = localUser.is_super_admin;
        
        console.log(`Discord user ${profile.username} is linked to local account with ID ${localUser.id}`);
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Discord auth error:', error);
      return done(error, null);
    }
  }));

  // Set up session serialization for all user types
  passport.serializeUser((user, done) => {
    // Check if it's a Discord user or local user
    const userType = user.discriminator ? 'discord' : 'local';
    
    // Store all profile data if it's a Discord user
    if (userType === 'discord') {
      done(null, {
        id: user.id,
        type: userType,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        is_super_admin: user.is_super_admin
      });
    } else {
      done(null, {
        id: user.id,
        type: userType
      });
    }
  });

  // Set up session deserialization for all user types
  passport.deserializeUser(async (obj, done) => {
    try {
      // Handle different user types
      if (obj.type === 'discord') {
        // For Discord users, we can simply return the stored user object
        // Check if user is still authorized in latest config
        const adminUserIds = config.adminUserIds;
        const isStillAdmin = adminUserIds.includes(obj.id);
        
        if (!isStillAdmin) {
          return done(null, false);
        }
        
        // Use the profile data that was stored during serialization
        return done(null, {
          id: obj.id,
          username: obj.username || 'Discord Admin',
          discriminator: obj.discriminator,
          avatar: obj.avatar,
          accessToken: obj.accessToken,
          refreshToken: obj.refreshToken,
          is_super_admin: obj.is_super_admin,
          isAdmin: true,
          userType: 'discord'
        });
      } else if (obj.type === 'local') {
        // Local user - retrieve from database
        const user = await db.getLocalUserById(obj.id);
        if (user) {
          // Remove sensitive data
          delete user.password;
          user.userType = 'local';
          return done(null, user);
        }
        return done(null, false);
      } else {
        // Unknown user type
        return done(new Error('Unknown user type'), null);
      }
    } catch (error) {
      console.error('Passport deserialization error:', error);
      done(error, null);
    }
  });
};

module.exports = setupDiscordStrategy;
