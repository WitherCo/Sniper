import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";
import { config } from "../../config";

export default {
  name: "prefix",
  description: "Change the bot prefix",
  category: "admin",
  aliases: ["setprefix"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply(`Current prefix is: \`${config.prefix}\`\nUsage: ${config.prefix}prefix <new prefix>`);
    }

    const newPrefix = args[0];
    if (newPrefix.length > 3) {
      return interaction.reply("❌ Prefix cannot be longer than 3 characters");
    }

    try {
      await storage.updateBotConfig({ prefix: newPrefix });
      config.prefix = newPrefix;

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Prefix Updated")
        .setDescription(`Prefix has been changed to: \`${newPrefix}\``)
        .setFooter({ text: `Changed by ${interaction.author.tag}` });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[PREFIX ERROR]", error);
      return interaction.reply("❌ Failed to update prefix");
    }
  }
} as DiscordCommand;