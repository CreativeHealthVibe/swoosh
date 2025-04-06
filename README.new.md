# Swoosh Discord Bot

A powerful Discord bot platform offering advanced server management, intelligent user interactions, and an administrative web dashboard.

## Features

### Bot Features
- Advanced server management commands
- Ticket system with transcripts
- Blacklist management
- Autoroles and moderation tools
- Custom image generation
- User information and status tracking

### Admin Dashboard
- Secure Discord OAuth2 authentication
- Real-time bot and server monitoring
- Blacklist management interface
- System statistics and performance metrics
- Log viewing and management
- Server and user analytics

### Desktop Application
- Easy-to-use graphical interface to control your Discord bot
- Start, stop, and restart the bot with a single click
- Real-time bot status monitoring
- View CPU usage, memory consumption, and uptime statistics
- Live log viewing directly in the application
- Stays in the system tray when closed

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or later
- Discord Bot Token and Application from [Discord Developer Portal](https://discord.com/developers/applications)
- MongoDB database (optional, for session storage)

### Setting Up the Bot

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/swoosh-bot.git
   cd swoosh-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.sample`:
   ```
   # Copy the sample environment file
   cp .env.sample .env
   ```

4. Edit the `.env` file with your credentials:
   - `DISCORD_BOT_TOKEN`: Your Discord bot token
   - `DISCORD_CLIENT_ID`: Your Discord application client ID
   - `DISCORD_CLIENT_SECRET`: Your Discord application client secret
   - `DISCORD_CALLBACK_URL`: Your OAuth callback URL (e.g., https://yoursite.com/auth/discord/callback)
   - `MONGODB_URI`: (Optional) MongoDB connection string for session storage

### Setting Up Discord OAuth2

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to the "OAuth2" tab
4. Add a redirect URL: `https://yoursite.com/auth/discord/callback`
   - For local development: `http://localhost:5000/auth/discord/callback`
5. Save changes
6. Copy the Client ID and Client Secret to your `.env` file

### Running the Bot

Start the bot with:
```
npm start
```

For development mode:
```
npm run dev
```

### Building the Desktop Application

1. Build the executable:
   ```
   npm run build
   ```

2. Find the installer in the `dist` folder.

## Accessing the Admin Dashboard

1. Start the bot
2. Visit `https://yoursite.com/admin` (or `http://localhost:5000/admin` for local development)
3. Log in with your Discord account
4. Only users with specific permissions can access the admin dashboard

## Configuration

You can configure various aspects of the bot in `config.js`:
- Command prefix
- Default permissions
- Feature toggles
- Server-specific settings

## Support

For support, join our [Discord server](https://discord.gg/swoosh) or open an issue on GitHub.