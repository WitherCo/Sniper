import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "coinflip",
  description: "Flip a coin with optional wager",
  category: "fun",
  aliases: ["flip", "coin"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "choice",
      description: "Your guess: heads or tails",
      type: "STRING",
      required: false,
      choices: [
        { name: "Heads", value: "heads" },
        { name: "Tails", value: "tails" }
      ]
    },
    {
      name: "amount",
      description: "Number of flips (1-100)",
      type: "INTEGER",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      const choice = interaction.options.getString("choice")?.toLowerCase();
      const amount = interaction.options.getInteger("amount") || 1;
      
      // Validate flip amount
      if (amount < 1 || amount > 100) {
        return await interaction.reply({ 
          content: "You can only flip between 1 and 100 coins at a time", 
          ephemeral: true 
        });
      }
      
      // Single flip
      if (amount === 1) {
        return await handleSingleFlip(interaction, choice);
      }
      
      // Multiple flips
      return await handleMultipleFlips(interaction, amount, choice);
    } else {
      // Message command handling
      const args = interaction.content.split(" ").slice(1);
      
      // Check for guess
      let choice: string | undefined;
      if (args[0]) {
        const lcArg = args[0].toLowerCase();
        if (lcArg === "heads" || lcArg === "head" || lcArg === "h") {
          choice = "heads";
        } else if (lcArg === "tails" || lcArg === "tail" || lcArg === "t") {
          choice = "tails";
        }
      }
      
      // Check for amount
      let amount = 1;
      const amountArg = choice ? args[1] : args[0];
      if (amountArg && !isNaN(parseInt(amountArg))) {
        amount = parseInt(amountArg);
      }
      
      // Validate flip amount
      if (amount < 1 || amount > 100) {
        return await interaction.reply("You can only flip between 1 and 100 coins at a time");
      }
      
      // Single flip
      if (amount === 1) {
        return await handleSingleFlip(interaction, choice);
      }
      
      // Multiple flips
      return await handleMultipleFlips(interaction, amount, choice);
    }
  }
} as DiscordCommand;

async function handleSingleFlip(interaction: CommandInteraction | Message, choice?: string) {
  // Generate flip result
  const result = Math.random() < 0.5 ? "heads" : "tails";
  
  // Check if the user made a prediction
  if (choice) {
    // Check if the prediction was correct
    const isCorrect = choice === result;
    
    // Build the response message
    const resultSymbol = result === "heads" ? "🪙" : "🪙";
    const resultText = result.charAt(0).toUpperCase() + result.slice(1);
    
    // Build response based on correctness
    const message = isCorrect
      ? `${resultSymbol} The coin landed on: **${resultText}**\n\n🎉 You guessed correctly!`
      : `${resultSymbol} The coin landed on: **${resultText}**\n\n❌ Your guess was incorrect.`;
    
    // Send response
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply(message);
    } else {
      return await interaction.reply(message);
    }
  } else {
    // No prediction, just show the result
    const resultSymbol = result === "heads" ? "🪙" : "🪙";
    const resultText = result.charAt(0).toUpperCase() + result.slice(1);
    
    // Send response
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply(`${resultSymbol} The coin landed on: **${resultText}**`);
    } else {
      return await interaction.reply(`${resultSymbol} The coin landed on: **${resultText}**`);
    }
  }
}

async function handleMultipleFlips(interaction: CommandInteraction | Message, amount: number, choice?: string) {
  // Flip coins
  const results = Array(amount).fill(0).map(() => Math.random() < 0.5 ? "heads" : "tails");
  
  // Count results
  const heads = results.filter(r => r === "heads").length;
  const tails = results.filter(r => r === "tails").length;
  
  // Build the response message
  let message = `Flipped ${amount} coins:\n\n`;
  message += `🪙 **Heads**: ${heads} (${(heads / amount * 100).toFixed(1)}%)\n`;
  message += `🪙 **Tails**: ${tails} (${(tails / amount * 100).toFixed(1)}%)`;
  
  // If there was a prediction, add the result
  if (choice) {
    const correctCount = choice === "heads" ? heads : tails;
    const accuracy = (correctCount / amount * 100).toFixed(1);
    
    message += `\n\nYou predicted **${choice}**:`;
    message += `\n✓ Correct guesses: ${correctCount}/${amount} (${accuracy}%)`;
  }
  
  // Send the response
  if (interaction instanceof CommandInteraction) {
    return await interaction.reply(message);
  } else {
    return await interaction.reply(message);
  }
}
