import { CommandInteraction, Message, ActivityType } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "activity",
  description: "Change the bot activity",
  category: "admin",
  aliases: [],
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
      return interaction.reply("Usage: !activity <text>");
    }

    try {
      if (!interaction.client.isReady()) {
        console.error("[DEBUG] Client not ready, token:", process.env.DISCORD_BOT_TOKEN?.slice(0,10));
        return interaction.reply("Bot is not connected to Discord. Please check the token.");
      }

      const text = args.join(" ");
      await interaction.client.user.setActivity(text);
      return interaction.reply(`✅ Activity set to: ${text}`);
    } catch (error) {
      console.error("[ACTIVITY ERROR]", error);
      if (error.message?.includes('TOKEN')) {
        return interaction.reply("❌ Invalid bot token. Please check your Discord token in Secrets.");
      }
      return interaction.reply("❌ Failed to set activity. Make sure the bot is online.");
    }
  }
} as DiscordCommand;