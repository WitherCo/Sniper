import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";
import * as util from "util";

export default {
  name: "eval",
  description: "Evaluate JavaScript code",
  category: "admin",
  aliases: ["evaluate"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    // Only allow bot owner to use eval
    if (interaction.author.id !== config.ownerId) {
      return interaction.reply("❌ Only the bot owner can use this command");
    }

    if (!args || args.length < 1) {
      return interaction.reply(`Usage: ${config.prefix}eval <code>`);
    }

    const code = args.join(" ");
    let evaled;

    try {
      evaled = await eval(code);
      if (typeof evaled !== "string") {
        evaled = util.inspect(evaled, { depth: 0 });
      }

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("Code Evaluation")
        .addFields([
          { name: "Input", value: `\`\`\`js\n${code}\n\`\`\``, inline: false },
          { name: "Output", value: `\`\`\`js\n${evaled}\n\`\`\``, inline: false }
        ]);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("Evaluation Error")
        .addFields([
          { name: "Input", value: `\`\`\`js\n${code}\n\`\`\``, inline: false },
          { name: "Error", value: `\`\`\`js\n${error}\n\`\`\``, inline: false }
        ]);

      return interaction.reply({ embeds: [embed] });
    }
  }
} as DiscordCommand;