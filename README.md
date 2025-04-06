# SWOOSH Discord Bot

A Discord bot with moderation tools, ticket system, blacklist management, and more. Available as both a web service and a desktop application.

## Features

- Ticket management system with transcript generation
- User blacklisting
- Server moderation tools (kick, ban, mute)
- Role management
- Logging system
- AFK status tracking
- Desktop application for managing your bot
- Web dashboard for monitoring and control

## Web Service Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your configuration (see `.env.sample`)
4. Start the bot with `node index.js`

## Desktop Application

The SWOOSH Bot is also available as a desktop application, making it easier to manage your bot directly from your computer.

### Desktop App Features

- Real-time bot metrics and server statistics
- Command management interface
- Live activity logs
- Desktop notifications for important events
- One-click bot restart
- System tray integration

### Building the Desktop App

#### Windows
1. Clone this repository
2. Install dependencies with `npm install`
3. Run the build script: `build.bat`
4. The installer will be created in the `dist` folder

#### macOS/Linux
1. Clone this repository
2. Install dependencies with `npm install`
3. Make the build script executable: `chmod +x build.sh`
4. Run the build script: `./build.sh`
5. The installer will be created in the `dist` folder

### Requirements for Building

- Node.js 18 or newer
- npm 8 or newer
- Windows, macOS, or Linux operating system
- At least 4GB of RAM and 100MB of free disk space

## Environment Variables

- `DISCORD_TOKEN` - Your Discord bot token
- `EMBED_COLOR` - Color for embeds (hex code)
- `TICKET_CATEGORY` - Category name for tickets
- `LOG_CHANNEL_ID` - Channel ID for logging

## Web Deployment

This bot is configured for deployment on Render and includes a web dashboard at `/` path.

## Downloads

You can download the pre-built desktop application from our website at `/download`.