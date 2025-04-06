// config.js - Bot configuration
require('dotenv').config();

module.exports = {
  prefix: ".",
  embedColor: process.env.EMBED_COLOR || "#0099ff",
  ticketCategory: process.env.TICKET_CATEGORY || "SWOOSH | Tickets",
  logChannelId: process.env.LOG_CHANNEL_ID,
  
  // Specific logging channels
  loggingChannels: {
    deletedMessages: "1357714564946464808",  // Channel for deleted message logs
    ticketTranscripts: "1357714658248622192", // Channel for ticket transcripts
    commandUsage: "1357715073073938532",     // Channel for command usage logs
    botStatus: "1357715278003441686"         // Channel for bot status & uptime
  },
  
  // Admin User IDs with full system access
  adminUserIds: ['930131254106550333', '1196042021488570391', '506323791140356106'], // Core team members
  
  // Ticket types and their configurations
  ticketTypes: {
    CLAIM_BOUNTY: {
      id: "claim_bounty",
      label: "Claim Bounty",
      emoji: "💰",
      description: "Submit evidence to claim a bounty",
      initialMessage: "Please provide a link to your evidence and the bounty you wish to claim."
    },
    SET_BOUNTY: {
      id: "set_bounty",
      label: "Set Bounty",
      emoji: "🎯",
      description: "Set a new bounty on a player",
      initialMessage: "Please use the /setbounty command to create a new bounty."
    },
    CLAIM_XP_ROLE: {
      id: "claim_xp_role",
      label: "Claim XP",
      emoji: "⭐",
      description: "Discuss your XP and claim your role",
      initialMessage: "Please provide details about your XP level and what you would like to discuss. Include any relevant screenshots if needed."
    },
    GENERAL_SUPPORT: {
      id: "general_support",
      label: "General Support",
      emoji: "❓",
      description: "Get help with general inquiries",
      initialMessage: "How can we assist you today? Please describe your issue in detail."
    },
    STAFF_APPLY: {
      id: "staff_apply",
      label: "Staff Application",
      emoji: "📝",
      description: "Apply to join our staff team",
      initialMessage: "Thank you for your interest in joining our staff team. Please answer the following questions:\n\n1. What's your Discord username?\n2. How old are you?\n3. What's your timezone?\n4. Do you have any moderation experience?\n5. Why do you want to join our staff team?"
    }
  },
  
  // Role IDs that can access tickets (will be overridden by database settings)
  staffRoles: ["Admin", "Moderator", "Staff", "Bounty Master"],
  
  // Validation limits
  validation: {
    bountyMin: 15,        // Minimum bounty amount allowed
    bountyMax: 30000,     // Maximum bounty amount allowed
    allowedImageTypes: ["image/png", "image/jpeg", "image/jpg"]
  },
  
  // Webhook settings
  webhooks: {
    bountyAvatarUrl: 'https://i.imgur.com/YzOA3Rb.png', // Default avatar URL for bounty webhooks
    bountyName: 'SWOOSH Bounty System',                // Default name for bounty webhooks
  }
};
