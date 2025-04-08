# Swoosh Discord Bot - Desktop Application

A desktop application wrapper for the Swoosh Discord bot, built with Electron.

## Features

- Easy-to-use graphical interface to control your Discord bot
- Start, stop, and restart the bot with a single click
- Real-time bot status monitoring
- View CPU usage, memory consumption, and uptime statistics
- Live log viewing directly in the application
- Stays in the system tray when closed
- Starts automatically with Windows (optional)

## Installation

### Prerequisites

- Windows 10 or later
- [Node.js](https://nodejs.org/) v16 or later
- Admin privileges (for the build process)

### Setting Up

1. Clone the repository:
   ```
   git clone https://github.com/ghsammo/swoosh-win-app.git
   cd swoosh-win-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.sample`:
   ```
   # Copy the sample environment file
   cp .env.sample .env
   
   # Edit the .env file with your Discord bot credentials
   # DISCORD_TOKEN=your_token_here
   # CLIENT_ID=your_client_id_here
   # GUILD_ID=your_guild_id_here
   ```

### Building the Application

1. Build the executable:
   ```
   npm run build
   ```

2. Find the installer in the `dist` folder.

## Development

To run the application in development mode:

```
npm run dev
```

This will start the application with DevTools enabled.

## Support

For support, join our [Discord server](https://discord.gg/) or open an issue on GitHub.
