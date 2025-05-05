
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "sub",
  description: "Unban a server from using bot commands",
  category: "admin",
  aliases: ["unbanserver"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    // Check if user is the bot owner
    if (interaction.author.id !== "1259367203346841725") {
      return interaction.reply("❌ This command can only be used by the bot owner.");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !sub <server_id>");
    }

    const serverId = args[0];

    try {
      // Remove server from banned list in database
      await storage.removeServerBan(serverId);

      return interaction.reply(`✅ Server ${serverId} has been unbanned.`);
    } catch (error) {
      console.error("[SERVER UNBAN ERROR]", error);
      return interaction.reply("❌ Failed to unban server.");
    }
  }
} as DiscordCommand;
