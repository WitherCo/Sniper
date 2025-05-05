
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "code",
  description: "Format code with syntax highlighting",
  category: "utility",
  aliases: ["format"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !code <language> <code>\nExample: !code js console.log('Hello')");
    }

    const language = args[0].toLowerCase();
    const code = args.slice(1).join(" ");

    // Strip code block markers if present
    const cleanCode = code.replace(/```\w*\n?|\n?```/g, "");

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("Formatted Code")
      .setDescription(`\`\`\`${language}\n${cleanCode}\n\`\`\``)
      .setFooter({ text: `Language: ${language}` });

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
