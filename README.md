# SWOOSH Discord Bot

A Discord bot with moderation tools, ticket system, blacklist management, and more.

## Features

- Ticket management system with transcript generation
- User blacklisting
- Server moderation tools (kick, ban, mute)
- Role management
- Logging system
- AFK status tracking

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your configuration (see `.env.sample`)
4. Start the bot with `node index.js`

## Environment Variables

- `DISCORD_TOKEN` - Your Discord bot token
- `EMBED_COLOR` - Color for embeds (hex code)
- `TICKET_CATEGORY` - Category name for tickets
- `LOG_CHANNEL_ID` - Channel ID for logging

## Deployment

This bot is configured for deployment on Render.