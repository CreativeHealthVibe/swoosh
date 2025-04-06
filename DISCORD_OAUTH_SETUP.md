# Setting Up Discord OAuth for SWOOSH Bot Admin Dashboard

This guide will walk you through how to set up Discord OAuth authentication for the SWOOSH Bot admin dashboard.

## 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on "New Application".
3. Give your application a name (e.g., "SWOOSH Bot").
4. Accept the terms and click "Create".

## 2. Set Up OAuth2

1. In your application dashboard, click on the "OAuth2" tab in the left sidebar.
2. Under "Redirects", click "Add Redirect" and enter your callback URL:
   - For local development: `http://localhost:3000/auth/discord/callback`
   - For production: `https://your-domain.com/auth/discord/callback` (or `https://swooshfinal.onrender.com/auth/discord/callback`)
3. Click "Save Changes".

## 3. Get Your Credentials

1. In the "OAuth2" tab, you'll see your "Client ID". Copy this value.
2. Click on "Reset Secret" to generate a new Client Secret, then copy this value.
   - ⚠️ **IMPORTANT**: Keep your Client Secret secure and never share it publicly!

## 4. Configure Your Bot's Environment Variables

Add the following to your `.env` file:

```
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_CALLBACK_URL=your_callback_url_here
SESSION_SECRET=a_random_secure_string_here
WEBSITE_URL=your_website_url_here
```

For example:
```
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
DISCORD_CALLBACK_URL=https://swooshfinal.onrender.com/auth/discord/callback
SESSION_SECRET=some_secure_random_string
WEBSITE_URL=https://swooshfinal.onrender.com
```

## 5. Set Up Authorization Scopes

When creating OAuth links for your users, you'll need to request appropriate scopes. For the admin dashboard, we use:

- `identify`: To get the user's Discord ID and username
- `email`: To get the user's email (optional)

## 6. Configure Admin User Access

To restrict admin dashboard access to specific Discord users:

1. Open the `middlewares/auth.js` file.
2. Look for the `isAuthorizedAdmin` middleware function.
3. Add the Discord IDs of users who should have admin access.

Example:
```javascript
function isAuthorizedAdmin(req, res, next) {
  const authorizedAdmins = [
    '123456789012345678', // Your Discord ID
    '876543210987654321'  // Another admin's Discord ID
  ];
  
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }
  
  if (!authorizedAdmins.includes(req.user.id)) {
    return res.status(403).render('errors/403', { 
      user: req.user,
      message: 'You are not authorized to access the admin dashboard.' 
    });
  }
  
  next();
}
```

## 7. Testing Your Setup

1. Start your bot with `node index.js`.
2. Navigate to `http://localhost:3000/admin` (or your production URL).
3. You should be redirected to the Discord authorization page.
4. After authorizing, you should be redirected back to your admin dashboard if you're in the authorized admins list.

## Troubleshooting

### Invalid Redirect URI
- Make sure the redirect URI in your Discord Developer Portal exactly matches the one in your .env file.
- Include the full path with protocol (http:// or https://).

### Authentication Failed
- Check that your CLIENT_ID and CLIENT_SECRET are correct.
- Ensure your bot is running with the correct environment variables.

### Authorization Error
- Verify that your Discord user ID is in the authorized admins list.
- Check for typos in the user ID.

### Session Issues
- Make sure SESSION_SECRET is set.
- Check that MongoDB connection is working (for session storage).

## Security Considerations

- Always use HTTPS in production.
- Generate a strong, random value for SESSION_SECRET.
- Store sensitive credentials in environment variables, never in code.
- Regularly rotate your Client Secret.
- Implement rate limiting on login attempts.
- Keep the list of admin users as small as possible.

If you're experiencing issues not covered here, check the server logs or create a GitHub issue for assistance.
