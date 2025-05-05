import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Create a Map to store cooldowns
// Key: userId, Value: last claim timestamp
const dailyCooldowns = new Map<string, number>();

// Daily reward amount
const BASE_REWARD = 100;
const STREAK_BONUS = 25; // Bonus per day streak
const MAX_STREAK = 7; // Maximum streak days

// Cooldown period (in milliseconds)
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Map to track streaks
const userStreaks = new Map<string, { count: number, lastClaim: number }>();

export default {
  name: "daily",
  description: "Claim your daily rewards",
  category: "economy",
  aliases: ["dailyreward", "claim"],
  slash: true,
  prefix: true,
  cooldown: 3, // Command cooldown (this is just for rate limiting, not the daily reward cooldown)
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    // Get user ID
    const userId = interaction instanceof CommandInteraction ? interaction.user.id : interaction.author.id;
    
    // Check if the user has already claimed their daily reward
    const lastClaimTime = dailyCooldowns.get(userId) || 0;
    const now = Date.now();
    const timeDifference = now - lastClaimTime;
    
    // If the user is still on cooldown
    if (lastClaimTime && timeDifference < COOLDOWN_PERIOD) {
      const timeRemaining = COOLDOWN_PERIOD - timeDifference;
      return await sendCooldownMessage(interaction, timeRemaining);
    }
    
    // Calculate streak
    const userStreak = calculateStreak(userId, now);
    
    // Calculate reward amount
    const streakBonus = Math.min(userStreak.count, MAX_STREAK) * STREAK_BONUS;
    const totalReward = BASE_REWARD + streakBonus;
    
    // Update cooldown
    dailyCooldowns.set(userId, now);
    
    // Send success message
    return await sendSuccessMessage(interaction, totalReward, userStreak.count);
  }
} as DiscordCommand;

// Calculate streak for user
function calculateStreak(userId: string, now: number): { count: number, lastClaim: number } {
  const streak = userStreaks.get(userId) || { count: 0, lastClaim: 0 };
  const lastClaim = streak.lastClaim;
  
  // If it's been more than 48 hours since last claim, reset streak
  if (now - lastClaim > 2 * COOLDOWN_PERIOD) {
    userStreaks.set(userId, { count: 1, lastClaim: now });
    return { count: 1, lastClaim: now };
  }
  
  // If it's been between 20-28 hours (allowing some flexibility), increment streak
  if (now - lastClaim >= 20 * 60 * 60 * 1000 && now - lastClaim <= 28 * 60 * 60 * 1000) {
    const newCount = streak.count + 1;
    userStreaks.set(userId, { count: newCount, lastClaim: now });
    return { count: newCount, lastClaim: now };
  }
  
  // Otherwise, keep the same streak but update last claim time
  userStreaks.set(userId, { count: streak.count || 1, lastClaim: now });
  return { count: streak.count || 1, lastClaim: now };
}

// Formats milliseconds into a human-readable time string
function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Send cooldown message
async function sendCooldownMessage(interaction: CommandInteraction | Message, timeRemaining: number): Promise<any> {
  const formattedTime = formatTimeRemaining(timeRemaining);
  const message = `⏱️ You've already claimed your daily reward! Come back in **${formattedTime}**.`;
  
  if (interaction instanceof CommandInteraction) {
    return await interaction.reply({ content: message, ephemeral: true });
  } else {
    return await interaction.reply(message);
  }
}

// Send success message
async function sendSuccessMessage(interaction: CommandInteraction | Message, amount: number, streak: number): Promise<any> {
  let message = `💰 You've claimed your daily reward of **${amount}** coins!`;
  
  if (streak > 1) {
    message += `\n🔥 Current streak: **${streak}** day${streak !== 1 ? 's' : ''}`;
    
    if (streak < MAX_STREAK) {
      const nextBonus = (streak + 1) * STREAK_BONUS;
      message += `\n⭐ Continue your streak for a **${nextBonus}** coin bonus tomorrow!`;
    } else {
      message += `\n🌟 You've reached the maximum streak bonus of **${MAX_STREAK * STREAK_BONUS}** coins!`;
    }
  } else {
    message += `\n⭐ Come back tomorrow to start a streak and earn bonus coins!`;
  }
  
  const embed = {
    title: "Daily Reward Claimed!",
    description: message,
    color: 0xF1C40F, // Gold color
    footer: { text: "Come back in 24 hours for your next reward!" }
  };
  
  if (interaction instanceof CommandInteraction) {
    return await interaction.reply({ embeds: [embed] });
  } else {
    return await interaction.reply({ embeds: [embed] });
  }
}
