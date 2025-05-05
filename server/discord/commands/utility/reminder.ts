import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  User,
  Client
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Map to store active reminders
// Key: reminder ID, Value: NodeJS.Timeout object
const activeReminders = new Map<string, NodeJS.Timeout>();

export default {
  name: "reminder",
  description: "Set a reminder for yourself",
  category: "utility",
  aliases: ["remind", "timer", "remindme"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "time",
      description: "Time until reminder (e.g. 5m, 1h, 1d)",
      type: "STRING",
      required: true
    },
    {
      name: "message",
      description: "Message to remind you about",
      type: "STRING",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let timeString = "";
    let reminderText = "";
    
    if (interaction instanceof CommandInteraction) {
      // Get options from slash command
      timeString = interaction.options.getString("time") || "5m";
      reminderText = interaction.options.getString("message") || "Reminder!";
    } else {
      // Parse message command arguments
      if (!args || args.length < 2) {
        return interaction.reply({
          content: "❌ Please provide a time and message. Example: `!reminder 5m Take the pizza out of the oven`",
          ephemeral: true
        });
      }
      
      // First argument is the time
      timeString = args[0];
      
      // Rest of the arguments form the reminder message
      reminderText = args.slice(1).join(" ");
    }
    
    // Parse the time string into milliseconds
    const milliseconds = parseTimeString(timeString);
    
    if (milliseconds === 0) {
      return interaction.reply({
        content: "❌ Invalid time format. Please use a format like `5m`, `1h30m`, `2d`, etc.",
        ephemeral: true
      });
    }
    
    if (milliseconds < 1000) {
      return interaction.reply({
        content: "❌ Reminder time must be at least 1 second.",
        ephemeral: true
      });
    }
    
    if (milliseconds > 30 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: "❌ Reminder time cannot exceed 30 days.",
        ephemeral: true
      });
    }
    
    // Create a unique ID for this reminder
    const user = interaction instanceof Message ? interaction.author : interaction.user;
    const reminderId = `${user.id}-${Date.now()}`;
    
    // Calculate when the reminder will trigger
    const triggerTime = new Date(Date.now() + milliseconds);
    
    // Format the trigger time as a Discord timestamp
    const discordTimestamp = Math.floor(triggerTime.getTime() / 1000);
    
    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setTitle("⏰ Reminder Set")
      .setColor(0x3498DB)
      .setDescription(`I'll remind you: **${reminderText}**`)
      .addFields(
        { name: "When", value: `<t:${discordTimestamp}:F> (<t:${discordTimestamp}:R>)` }
      )
      .setFooter({ text: `Reminder ID: ${reminderId}` })
      .setTimestamp();
    
    // Send confirmation message
    await interaction.reply({ embeds: [confirmEmbed] });
    
    // Set up the timeout to send the reminder
    const timeout = setTimeout(() => {
      sendReminder(user, reminderText, reminderId, interaction.client);
      // Remove from active reminders once triggered
      activeReminders.delete(reminderId);
    }, milliseconds);
    
    // Store the timeout so it can be cancelled if needed
    activeReminders.set(reminderId, timeout);
  }
} as DiscordCommand;

/**
 * Parse a time string into milliseconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 * Examples: 30s, 5m, 1h30m, 2d
 */
function parseTimeString(timeString: string): number {
  let totalMilliseconds = 0;
  
  // Regular expression to match time components
  const regex = /(\d+)([smhd])/g;
  let match;
  
  while ((match = regex.exec(timeString)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': // Seconds
        totalMilliseconds += value * 1000;
        break;
      case 'm': // Minutes
        totalMilliseconds += value * 60 * 1000;
        break;
      case 'h': // Hours
        totalMilliseconds += value * 60 * 60 * 1000;
        break;
      case 'd': // Days
        totalMilliseconds += value * 24 * 60 * 60 * 1000;
        break;
    }
  }
  
  return totalMilliseconds;
}

/**
 * Send a reminder to a user
 */
async function sendReminder(user: User, message: string, reminderId: string, client: Client): Promise<void> {
  try {
    // Create reminder embed
    const reminderEmbed = new EmbedBuilder()
      .setTitle("⏰ Reminder")
      .setColor(0x2ECC71)
      .setDescription(`You asked me to remind you: **${message}**`)
      .setFooter({ text: `Reminder ID: ${reminderId}` })
      .setTimestamp();
    
    // Try to DM the user
    try {
      const dmChannel = await user.createDM();
      await dmChannel.send({ embeds: [reminderEmbed] });
    } catch (error) {
      // If can't DM, will fall back to a mention in the original channel
      // But we won't have access to that in this implementation
      console.error(`Failed to send reminder DM to user ${user.tag}:`, error);
    }
  } catch (error) {
    console.error(`Error sending reminder:`, error);
  }
}

// Command to list active reminders
export const list = {
  name: "reminders",
  description: "List your active reminders",
  category: "utility",
  aliases: ["listreminders", "myreminders"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
    
    // Filter reminders for this user
    const userReminders = Array.from(activeReminders.keys())
      .filter(id => id.startsWith(userId));
    
    if (userReminders.length === 0) {
      return interaction.reply({
        content: "You don't have any active reminders.",
        ephemeral: true
      });
    }
    
    // Create embedded message with reminder list
    const embed = new EmbedBuilder()
      .setTitle("Your Active Reminders")
      .setColor(0x3498DB)
      .setDescription(`You have ${userReminders.length} active reminder(s).`)
      .setTimestamp();
    
    // We don't store reminder details in this implementation
    // In a real bot, you would store the reminder details and list them here
    embed.setDescription("You have active reminders, but detailed listing is not implemented in this version.");
    
    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;

// Command to cancel a reminder
export const cancel = {
  name: "cancelreminder",
  description: "Cancel an active reminder",
  category: "utility",
  aliases: ["cancelremind", "stopreminder"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "id",
      description: "ID of the reminder to cancel",
      type: "STRING",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let reminderId = "";
    
    if (interaction instanceof CommandInteraction) {
      reminderId = interaction.options.getString("id") || "";
    } else {
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please provide the reminder ID to cancel.",
          ephemeral: true
        });
      }
      
      reminderId = args[0];
    }
    
    const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
    
    // Check if reminder exists and belongs to the user
    if (!reminderId.startsWith(userId) || !activeReminders.has(reminderId)) {
      return interaction.reply({
        content: "❌ Reminder not found or it doesn't belong to you.",
        ephemeral: true
      });
    }
    
    // Cancel the timeout
    clearTimeout(activeReminders.get(reminderId)!);
    activeReminders.delete(reminderId);
    
    return interaction.reply({
      content: "✅ Reminder cancelled successfully.",
      ephemeral: true
    });
  }
} as DiscordCommand;