
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "bs",
  description: "Ban a server from using bot commands",
  category: "admin",
  aliases: ["banserver"],
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

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !bs <server_id> <reason>");
    }

    const serverId = args[0];
    const reason = args.slice(1).join(" ");

    try {
      // Check if server exists
      const guild = await interaction.client.guilds.fetch(serverId).catch(() => null);
      if (!guild) {
        return interaction.reply("❌ Could not find that server.");
      }

      // Add server to banned list in database
      await storage.addServerBan(serverId, {
        reason,
        bannedBy: interaction.author.id,
        bannedAt: new Date()
      });

      return interaction.reply(`✅ Server ${guild.name} (${serverId}) has been banned.\nReason: ${reason}`);
    } catch (error) {
      console.error("[SERVER BAN ERROR]", error);
      return interaction.reply("❌ Failed to ban server.");
    }
  }
} as DiscordCommand;
