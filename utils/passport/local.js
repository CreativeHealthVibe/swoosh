/**
 * Local authentication strategy using Passport
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('../database');

module.exports = function() {
  // Configure local authentication strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        // Find user by username
        const user = await db.getLocalUserByUsername(username);
        
        // If user doesn't exist
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Verify password
        const isValidPassword = await db.verifyPassword(password, user.password);
        
        // If password doesn't match
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Remove password from user object before returning
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        // Add userType to identify this as a local user
        userWithoutPassword.userType = 'local';
        
        // Return authenticated user
        return done(null, userWithoutPassword);
      } catch (error) {
        console.error('Local authentication error:', error);
        return done(error);
      }
    }
  ));

  // Note: We don't set up serialization/deserialization here
  // because it's now done in the discord.js strategy file
};