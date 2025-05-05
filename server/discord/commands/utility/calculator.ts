import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import * as math from "mathjs";

export default {
  name: "calculator",
  description: "Perform mathematical calculations",
  category: "utility",
  aliases: ["calc", "math", "evaluate"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "expression",
      description: "Mathematical expression to evaluate",
      type: "STRING",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let expression = "";
    
    if (interaction instanceof CommandInteraction) {
      // Get expression from slash command options
      expression = interaction.options.getString("expression") || "";
    } else {
      // Parse message command arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please provide a mathematical expression to evaluate. For example: `!calc 2 + 2 * 3`",
          ephemeral: true
        });
      }
      
      expression = args.join(" ");
    }
    
    // Try to evaluate the expression
    try {
      // Format expression for display
      const formattedExpression = formatExpression(expression);
      
      // Evaluate the expression using mathjs
      const result = evaluateExpression(expression);
      
      // Create an embed with the result
      const embed = createResultEmbed(formattedExpression, result);
      
      // Send the result
      return interaction.reply({ embeds: [embed] });
    } catch (error: any) {
      // Create an error embed
      const errorEmbed = createErrorEmbed(expression, error.message);
      
      // Send error message
      return interaction.reply({ embeds: [errorEmbed] });
    }
  }
} as DiscordCommand;

/**
 * Safely evaluates a mathematical expression using mathjs
 */
function evaluateExpression(expression: string): string {
  // Define a sandbox with limited functions and constants for safety
  const mathScope = {
    pi: Math.PI,
    e: Math.E,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    sqrt: Math.sqrt,
    log: Math.log,
    log10: Math.log10,
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    exp: Math.exp,
    pow: Math.pow,
    random: Math.random,
    max: Math.max,
    min: Math.min
  };
  
  try {
    // Use mathjs to safely evaluate the expression
    const result = math.evaluate(expression, mathScope);
    
    // Format result based on type
    if (typeof result === 'number') {
      // Check if it's a whole number
      if (Number.isInteger(result)) {
        return result.toString();
      }
      // For floating point, limit precision 
      return result.toPrecision(12).replace(/\.?0+$/, '');
    } else if (typeof result === 'boolean') {
      return result ? 'true' : 'false';
    } else {
      return String(result);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Format expression for display
 */
function formatExpression(expression: string): string {
  // Replace ^ with superscript for display
  return expression
    .replace(/\*/g, '×')  // Multiply
    .replace(/\//g, '÷')  // Divide
    .replace(/\^/g, '^'); // Power
}

/**
 * Create an embed with the calculation result
 */
function createResultEmbed(expression: string, result: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Calculator")
    .setColor(0x3498DB)
    .addFields(
      { name: "Expression", value: `\`${expression}\`` },
      { name: "Result", value: `\`${result}\`` }
    )
    .setFooter({ text: "Powered by mathjs" })
    .setTimestamp();
}

/**
 * Create an embed for calculation errors
 */
function createErrorEmbed(expression: string, errorMessage: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Calculator Error")
    .setColor(0xE74C3C)
    .addFields(
      { name: "Expression", value: `\`${expression}\`` },
      { name: "Error", value: `\`${errorMessage}\`` }
    )
    .setFooter({ text: "Try using a valid mathematical expression" })
    .setTimestamp();
}