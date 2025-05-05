
import { Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../storage";
import { handleCooldown } from "../utils/cooldown";
import { config } from "../config";

export default {
  name: "messageCreate",
  once: false,
  async execute(message: Message) {
    try {
      if (!message.guild || message.author.bot) return;

      // Add verbose debugging for command processing
      console.log(`[MESSAGE DEBUG] Received: "${message.content}"`);
      console.log(`[MESSAGE DEBUG] Author: ${message.author.tag} (${message.author.id})`);
      console.log(`[MESSAGE DEBUG] Expected prefix: "${config.prefix}"`);
      
      const prefix = config.prefix;
      if (!message.content.startsWith(prefix)) {
        console.log(`[MESSAGE DEBUG] Message does not start with prefix "${prefix}"`);
        return;
      }

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = message.client.commands.get(commandName);
      if (!command) return;

      // Check if user is blacklisted
      const blacklist = await storage.getBlacklist() || [];
      if (blacklist.includes(message.author.id)) {
        return message.reply("❌ You are blacklisted from using bot commands.");
      }

      // Check if user is bot banned
      const botBan = await storage.getBotBan(message.author.id);
      if (botBan) {
        return message.reply(`❌ You are banned from using bot commands.\nReason: ${botBan.reason}`);
      }

      // Check permissions
      if (command.permissions && command.permissions.length > 0) {
        const missingPerms = command.permissions.filter(perm => !message.member?.permissions.has(perm));
        if (missingPerms.length) {
          return message.reply(`❌ You need the following permissions to use this command: ${missingPerms.join(", ")}`);
        }
      }

      // Check cooldown
      const cooldownResult = handleCooldown(message.author.id, command);
      if (cooldownResult.onCooldown) {
        return message.reply(`⏰ Please wait ${cooldownResult.timeLeft.toFixed(1)} seconds before using this command again.`);
      }

      await command.execute(message, args);
    } catch (error) {
      console.error("[COMMAND ERROR]", error);
      await message.reply("❌ There was an error executing that command.");
    }
  }
};
