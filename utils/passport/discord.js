const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

// Define the scopes we need from Discord
const scopes = ['identify', 'guilds.join'];

// Configure Discord authentication strategy
const setupDiscordStrategy = () => {
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.WEBSITE_URL}${process.env.DISCORD_CALLBACK_URL}`,
    scope: scopes
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('Discord OAuth callback received. User:', profile.username);
    try {
      // List of allowed admin user IDs
      const adminUserIds = [
        '930131254106550333', // gh_Sman
        '1196042021488570391', // fl4ddie
        '506323791140356106' // cdn.gov
      ];
      
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
        accessToken: accessToken,
        refreshToken: refreshToken
      };
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Serialize user to store in session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

module.exports = setupDiscordStrategy;
