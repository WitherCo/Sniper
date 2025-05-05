
import { Collection } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const cooldowns = new Collection<string, Collection<string, number>>();

export const handleCooldown = (userId: string, command: DiscordCommand) => {
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps?.has(userId)) {
    const expirationTime = timestamps.get(userId)! + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return { onCooldown: true, timeLeft };
    }
  }

  timestamps?.set(userId, now);
  setTimeout(() => timestamps?.delete(userId), cooldownAmount);

  return { onCooldown: false, timeLeft: 0 };
};
