import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "8ball",
  description: "Ask the magic 8ball a question",
  category: "fun",
  aliases: ["8b", "fortune", "magicball"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "question",
      description: "The question to ask the magic 8ball",
      type: "STRING",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let question = "";
    
    if (interaction instanceof CommandInteraction) {
      // Get question from options
      question = interaction.options.getString("question") || "";
    } else {
      // Get question from arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ You need to ask a question! For example: `!8ball Will I win the lottery?`",
          ephemeral: true
        });
      }
      
      question = args.join(" ");
    }
    
    // Check if question ends with a question mark
    if (!question.endsWith("?")) {
      question += "?";
    }
    
    // Get a random response
    const response = getRandomResponse();
    const emoji = getResponseEmoji(response.type);
    
    // Create embed with response
    const embed = new EmbedBuilder()
      .setTitle(`🎱 Magic 8-Ball`)
      .setColor(getResponseColor(response.type))
      .addFields(
        { name: "Question", value: question },
        { name: "Answer", value: `${emoji} ${response.text}` }
      )
      .setFooter({ 
        text: `Asked by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}` 
      })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;

interface Response {
  text: string;
  type: "positive" | "neutral" | "negative";
}

/**
 * Get a random 8ball response
 */
function getRandomResponse(): Response {
  // Positive responses
  const positiveResponses: Response[] = [
    { text: "It is certain.", type: "positive" },
    { text: "It is decidedly so.", type: "positive" },
    { text: "Without a doubt.", type: "positive" },
    { text: "Yes – definitely.", type: "positive" },
    { text: "You may rely on it.", type: "positive" },
    { text: "As I see it, yes.", type: "positive" },
    { text: "Most likely.", type: "positive" },
    { text: "Outlook good.", type: "positive" },
    { text: "Yes.", type: "positive" },
    { text: "Signs point to yes.", type: "positive" }
  ];
  
  // Neutral responses
  const neutralResponses: Response[] = [
    { text: "Reply hazy, try again.", type: "neutral" },
    { text: "Ask again later.", type: "neutral" },
    { text: "Better not tell you now.", type: "neutral" },
    { text: "Cannot predict now.", type: "neutral" },
    { text: "Concentrate and ask again.", type: "neutral" }
  ];
  
  // Negative responses
  const negativeResponses: Response[] = [
    { text: "Don't count on it.", type: "negative" },
    { text: "My reply is no.", type: "negative" },
    { text: "My sources say no.", type: "negative" },
    { text: "Outlook not so good.", type: "negative" },
    { text: "Very doubtful.", type: "negative" }
  ];
  
  // Combine all responses
  const allResponses = [...positiveResponses, ...neutralResponses, ...negativeResponses];
  
  // Return a random response
  return allResponses[Math.floor(Math.random() * allResponses.length)];
}

/**
 * Get color based on response type
 */
function getResponseColor(type: string): number {
  switch (type) {
    case "positive":
      return 0x2ECC71; // Green
    case "neutral":
      return 0xF1C40F; // Yellow
    case "negative":
      return 0xE74C3C; // Red
    default:
      return 0x3498DB; // Blue
  }
}

/**
 * Get emoji based on response type
 */
function getResponseEmoji(type: string): string {
  switch (type) {
    case "positive":
      return "✅";
    case "neutral":
      return "❓";
    case "negative":
      return "❌";
    default:
      return "🎱";
  }
}