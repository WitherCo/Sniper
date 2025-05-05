import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "roll",
  description: "Roll dice or flip a coin",
  category: "fun",
  aliases: ["dice", "coin", "flip"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "type",
      description: "Choose whether to roll dice or flip a coin",
      type: "STRING",
      required: false,
      choices: [
        { name: "Dice", value: "dice" },
        { name: "Coin", value: "coin" }
      ]
    },
    {
      name: "dice",
      description: "Type of dice to roll (e.g., d20, 2d6)",
      type: "STRING",
      required: false
    },
    {
      name: "sides",
      description: "Number of sides on the dice (2-1000)",
      type: "INTEGER",
      required: false,
      minValue: 2,
      maxValue: 1000
    },
    {
      name: "count",
      description: "Number of dice to roll (1-100)",
      type: "INTEGER",
      required: false,
      minValue: 1,
      maxValue: 100
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let type = "dice";  // Default to dice roll
    let sides = 6;      // Default to 6-sided die
    let count = 1;      // Default to 1 die
    
    if (interaction instanceof CommandInteraction) {
      // Get options from slash command
      const typeOption = interaction.options.getString("type");
      const diceOption = interaction.options.getString("dice");
      const sidesOption = interaction.options.getInteger("sides");
      const countOption = interaction.options.getInteger("count");
      
      if (typeOption) type = typeOption;
      
      // Parse dice option (format like "d20" or "3d6")
      if (diceOption) {
        const diceRegex = /^(\d+)?d(\d+)$/i;
        const match = diceOption.match(diceRegex);
        
        if (match) {
          count = match[1] ? parseInt(match[1]) : 1;
          sides = parseInt(match[2]);
          
          // Validate values
          if (count < 1 || count > 100) count = 1;
          if (sides < 2 || sides > 1000) sides = 6;
        }
      }
      
      // Override with specific options if provided
      if (sidesOption) sides = sidesOption;
      if (countOption) count = countOption;
    } else {
      // Parse message command arguments
      if (args && args.length > 0) {
        const firstArg = args[0].toLowerCase();
        
        // Check for coin flip command
        if (["coin", "flip", "coinflip"].includes(firstArg)) {
          type = "coin";
        } 
        // Check for dice specification
        else {
          // Parse dice format (e.g., d20, 3d6)
          const diceRegex = /^(\d+)?d(\d+)$/i;
          const match = firstArg.match(diceRegex);
          
          if (match) {
            count = match[1] ? parseInt(match[1]) : 1;
            sides = parseInt(match[2]);
            
            // Validate values
            if (count < 1 || count > 100) count = 1;
            if (sides < 2 || sides > 1000) sides = 6;
          } 
          // Check for sides specification
          else if (!isNaN(parseInt(firstArg))) {
            sides = parseInt(firstArg);
            
            // Check for count specification as second argument
            if (args.length > 1 && !isNaN(parseInt(args[1]))) {
              count = parseInt(args[1]);
            }
          }
        }
      }
    }
    
    // Execute the appropriate action
    if (type === "coin") {
      return flipCoin(interaction);
    } else {
      return rollDice(interaction, sides, count);
    }
  }
} as DiscordCommand;

/**
 * Flip a coin
 */
function flipCoin(interaction: CommandInteraction | Message): Promise<any> {
  // Randomly choose heads or tails
  const result = Math.random() < 0.5 ? "heads" : "tails";
  
  // Create an embed with the result
  const embed = new EmbedBuilder()
    .setTitle("Coin Flip")
    .setDescription(`${getFlipEmoji(result)} The coin landed on **${result}**!`)
    .setColor(0xF1C40F) // Gold color
    .setFooter({
      text: `Flipped by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
    })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Roll dice
 */
function rollDice(interaction: CommandInteraction | Message, sides: number, count: number): Promise<any> {
  // Roll the dice
  const rolls: number[] = [];
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  // Create an embed with the result
  const embed = new EmbedBuilder()
    .setTitle(`Dice Roll: ${count}d${sides}`)
    .setColor(0x3498DB); // Blue color
  
  // Format the description based on number of dice
  if (count === 1) {
    embed.setDescription(`${getDiceEmoji(rolls[0], sides)} You rolled a **${rolls[0]}**!`);
  } else {
    const rollsFormatted = rolls.map(r => `${r}`).join(', ');
    embed.setDescription(
      `🎲 You rolled: **${rollsFormatted}**\n\n` +
      `Total: **${total}**`
    );
    
    // Add stats for multiple dice
    embed.addFields(
      { name: "Highest Roll", value: `${Math.max(...rolls)}`, inline: true },
      { name: "Lowest Roll", value: `${Math.min(...rolls)}`, inline: true },
      { name: "Average", value: `${(total / count).toFixed(2)}`, inline: true }
    );
  }
  
  // Add footer
  embed.setFooter({
    text: `Rolled by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
  })
  .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Get emoji for coin flip result
 */
function getFlipEmoji(result: string): string {
  return result === "heads" ? "🪙" : "💿";
}

/**
 * Get emoji for dice roll
 */
function getDiceEmoji(roll: number, sides: number): string {
  // Special emojis for d6
  if (sides === 6) {
    const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return diceEmojis[roll - 1];
  }
  
  // Default emoji for other dice
  return "🎲";
}