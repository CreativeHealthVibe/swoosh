# Discord OAuth Setup for SWOOSH Bot Admin Dashboard

This document outlines the setup process for Discord OAuth authentication used in the SWOOSH Bot admin dashboard.

## Prerequisites

1. A Discord account
2. Access to the [Discord Developer Portal](https://discord.com/developers/applications)
3. A Discord application with a bot user

## Configuration

### Step 1: Configure OAuth2 in Discord Developer Portal

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your SWOOSH Bot application
3. Navigate to the "OAuth2" section in the left sidebar
4. Add the following redirect URL:
   ```
   https://swooshfinal.onrender.com/auth/discord/callback
   ```
5. Save changes

### Step 2: Set Environment Variables

Make sure the following environment variables are set in your `.env` file or deployment environment:

```
DISCORD_CLIENT_ID=1356989479491080494
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_CALLBACK_URL=https://swooshfinal.onrender.com/auth/discord/callback
SESSION_SECRET=swoosh-admin-dashboard-secret
WEBSITE_URL=https://swooshfinal.onrender.com
```

### Step 3: Authorized Users

Edit the `utils/passport/discord.js` file to include the Discord user IDs of users who should have admin access:

```javascript
// List of allowed admin user IDs
const adminUserIds = [
  '930131254106550333', // gh_Sman
  '1196042021488570391', // fl4ddie
  '506323791140356106' // cdn.gov
  // Add more IDs as needed
];
```

## OAuth Flow

1. User accesses `/auth/login` or attempts to access a protected route
2. User clicks "Login with Discord" button
3. User is redirected to Discord for authentication
4. After authentication, Discord redirects back to the callback URL
5. The server verifies if the user is authorized (in the admin user list)
6. If authorized, the user is granted access to the admin dashboard
7. If not authorized, an error message is displayed

## Scopes

The following OAuth2 scopes are used:

- `identify`: Allows reading the user's username, discriminator, avatar, and ID
- `guilds.join`: Allows the bot to add the user to a guild

## OAuth2 URL

The OAuth2 URL format is:

```
https://discord.com/oauth2/authorize?client_id=1356989479491080494&response_type=code&redirect_uri=https%3A%2F%2Fswooshfinal.onrender.com%2F&scope=guilds.join+identify
```

## Troubleshooting

- **Invalid redirect URI**: Make sure the redirect URI in your code exactly matches what's configured in the Discord Developer Portal.
- **Authentication failed**: Check that the client ID and client secret are correct.
- **Access denied**: Verify that the user's ID is in the `adminUserIds` list.

## Security Considerations

- The session secret should be a strong, random string
- Store the Discord client secret securely and never expose it in client-side code
- Use HTTPS for all OAuth traffic in production
- Regularly review the list of authorized admin users
