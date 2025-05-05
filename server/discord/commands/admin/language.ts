
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "language",
  description: "Change bot language for this server",
  category: "admin",
  aliases: ["setlang"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!interaction.guild) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    const supportedLanguages = ["en", "es", "fr", "de", "pt", "ru"];

    if (!args || args.length < 1) {
      const embed = new EmbedBuilder()
        .setTitle("🌐 Bot Language")
        .setDescription("Usage: !language <code>\nSupported languages: " + supportedLanguages.join(", "))
        .setColor(0x3498db)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const lang = args[0].toLowerCase();

    if (!supportedLanguages.includes(lang)) {
      return interaction.reply("❌ Unsupported language. Supported languages: " + supportedLanguages.join(", "));
    }

    try {
      await storage.setGuildLanguage(interaction.guild.id, lang);
      return interaction.reply(`✅ Bot language has been set to ${lang}`);
    } catch (error) {
      return interaction.reply("❌ Failed to update language settings");
    }
  }
} as DiscordCommand;
