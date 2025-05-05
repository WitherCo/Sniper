export const config = {
  prefix: "l?",
  // Bot owner ID - this should match the ID of the user who owns the bot
  ownerId: process.env.BOT_OWNER_ID || "1259367203346841725", // Default to a placeholder ID if not set
  defaultCooldown: 3,
  maxCooldown: 60,
  developerMode: process.env.NODE_ENV === "development",
  
  // List of commands that can only be used by the bot owner
  ownerOnlyCommands: [
    "botban",     // Ban users from using the bot
    "bub",        // Unban users from using the bot
    "activity",   // Change bot activity status
    "eval",       // Evaluate JavaScript code
    "reload",     // Reload bot commands and events
    "maintenance", // Toggle maintenance mode
    "status",     // Change bot status
    "db",         // Database operations
    "sub",        // Subscription management commands
    "nuke",       // Server destruction command
    "destroy",    // Alias for nuke
    "annihilate", // Alias for nuke
    "demolish"    // Alias for nuke
  ],
  
  // List of dangerous commands that require extra confirmation
  dangerousCommands: [
    "resetconfig", // Reset server configuration
    "resetuser",   // Reset user data
    "blacklist",   // Server blacklist management
    "whitelist",   // Server whitelist management
    "nuke",       // Server destruction command
    "destroy",    // Alias for nuke
    "annihilate", // Alias for nuke
    "demolish"    // Alias for nuke
  ]
};
