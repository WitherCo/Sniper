
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import * as mathjs from "mathjs";

export default {
  name: "math",
  description: "Perform advanced mathematical calculations",
  category: "utility",
  aliases: ["calc", "calculate"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply(
        "Usage: !math <expression>\nExamples:\n" +
        "- Basic: !math 2 + 2\n" +
        "- Advanced: !math derivative('x^2 + 2x', 'x')\n" +
        "- Matrix: !math [1, 2; 3, 4] * [5, 6; 7, 8]\n" +
        "- Complex: !math i * i\n" +
        "- Calculus: !math integrate('x^2', 'x')\n" +
        "- Equation: !math solve('x^2 + 2x + 1 = 0', 'x')"
      );
    }

    const expression = args.join(" ");

    try {
      // Create mathjs scope with all functions enabled
      const scope = {};
      
      // Handle special cases
      if (expression.toLowerCase().startsWith('solve ')) {
        const eq = expression.substring(6);
        const result = mathjs.solve(eq, 'x');
        return interaction.reply({
          embeds: [createEmbed("Equation Solution", eq, result)]
        });
      }

      // Evaluate the expression with full math.js capabilities
      const result = mathjs.evaluate(expression, scope);
      
      // Format special results
      let formattedResult = result;
      if (mathjs.isMatrix(result)) {
        formattedResult = mathjs.format(result, { precision: 14 });
      } else if (Array.isArray(result)) {
        formattedResult = result.join(', ');
      } else if (typeof result === 'function') {
        formattedResult = 'Function';
      }

      return interaction.reply({
        embeds: [createEmbed("Math Result", expression, formattedResult)]
      });

    } catch (error) {
      return interaction.reply(`❌ Invalid mathematical expression: ${error.message}`);
    }
  }
} as DiscordCommand;

function createEmbed(title: string, expression: string, result: any) {
  return new EmbedBuilder()
    .setTitle(`🧮 ${title}`)
    .addFields([
      { name: "Expression", value: `\`${expression}\`` },
      { name: "Result", value: `\`${result}\`` }
    ])
    .setColor(0x3498db)
    .setTimestamp();
}
