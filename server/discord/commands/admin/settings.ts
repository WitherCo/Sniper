import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";
import { storage } from "../../../storage";

export default {
  name: "settings",
  description: "View and change bot settings",
  category: "admin",
  aliases: ["config"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const botConfig = await storage.getBotConfig();
    if (!botConfig) {
      return interaction.reply("❌ Could not load bot configuration");
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("Bot Settings")
      .addFields([
        { name: "Prefix", value: `\`${config.prefix}\``, inline: true },
        { name: "Owner ID", value: config.ownerId || "Not set", inline: true },
        { name: "Commands", value: `${interaction.client.commands.size} loaded`, inline: true },
        { name: "Active Servers", value: `${interaction.client.guilds.cache.size}`, inline: true }
      ])
      .setFooter({ text: `Use ${config.prefix}help admin for admin commands` });

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;