import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "joke",
  description: "Get a random joke",
  category: "fun",
  aliases: ["dadjoke", "humor", "funny"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "category",
      description: "Type of joke",
      type: "STRING",
      required: false,
      choices: [
        { name: "General", value: "general" },
        { name: "Programming", value: "programming" },
        { name: "Dad Joke", value: "dad" },
        { name: "Pun", value: "pun" },
        { name: "Knock-Knock", value: "knock" }
      ]
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let category = "general"; // Default category
    
    if (interaction instanceof CommandInteraction) {
      // Get category option
      const categoryOption = interaction.options.getString("category");
      if (categoryOption) category = categoryOption;
    } else {
      // Check for category in args
      if (args && args.length > 0) {
        const arg = args[0].toLowerCase();
        if (["general", "programming", "dad", "pun", "knock"].includes(arg)) {
          category = arg;
        }
        // Special case for "dad joke" as two words
        else if (arg === "dad" && args.length > 1 && args[1].toLowerCase() === "joke") {
          category = "dad";
        }
      }
    }
    
    // Get a joke based on the category
    const joke = getRandomJoke(category);
    
    // Create an embed with the joke
    const embed = new EmbedBuilder()
      .setTitle(`${getCategoryEmoji(category)} ${getCategoryTitle(category)}`)
      .setColor(getCategoryColor(category))
      .setDescription(joke.text)
      .setFooter({
        text: `Requested by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
      })
      .setTimestamp();
    
    // Add punchline field for two-part jokes
    if (joke.punchline) {
      embed.addFields({ name: "Punchline", value: joke.punchline });
    }
    
    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;

interface Joke {
  text: string;
  punchline?: string;
}

/**
 * Get a random joke from the specified category
 */
function getRandomJoke(category: string): Joke {
  // Select jokes array based on category
  const jokesArray = 
    category === "programming" ? programmingJokes :
    category === "dad" ? dadJokes :
    category === "pun" ? punJokes :
    category === "knock" ? knockKnockJokes :
    generalJokes;
  
  // Return a random joke
  return jokesArray[Math.floor(Math.random() * jokesArray.length)];
}

/**
 * Get emoji for a joke category
 */
function getCategoryEmoji(category: string): string {
  switch (category) {
    case "programming":
      return "💻";
    case "dad":
      return "👨";
    case "pun":
      return "😏";
    case "knock":
      return "🚪";
    default:
      return "😂";
  }
}

/**
 * Get title for a joke category
 */
function getCategoryTitle(category: string): string {
  switch (category) {
    case "programming":
      return "Programming Joke";
    case "dad":
      return "Dad Joke";
    case "pun":
      return "Pun";
    case "knock":
      return "Knock-Knock Joke";
    default:
      return "Random Joke";
  }
}

/**
 * Get color for a joke category
 */
function getCategoryColor(category: string): number {
  switch (category) {
    case "programming":
      return 0x3498DB; // Blue
    case "dad":
      return 0xE67E22; // Orange
    case "pun":
      return 0x9B59B6; // Purple
    case "knock":
      return 0x2ECC71; // Green
    default:
      return 0xF1C40F; // Yellow
  }
}

// General Jokes
const generalJokes: Joke[] = [
  { text: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { text: "Did you hear about the mathematician who's afraid of negative numbers?", punchline: "He'll stop at nothing to avoid them!" },
  { text: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
  { text: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
  { text: "What's the best thing about Switzerland?", punchline: "I don't know, but the flag is a big plus!" },
  { text: "How do you organize a space party?", punchline: "You planet!" },
  { text: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
  { text: "What do you call cheese that isn't yours?", punchline: "Nacho cheese!" },
  { text: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
  { text: "I told my wife she was drawing her eyebrows too high.", punchline: "She looked surprised." }
];

// Programming Jokes
const programmingJokes: Joke[] = [
  { text: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { text: "Why do programmers always mix up Christmas and Halloween?", punchline: "Because Oct 31 == Dec 25!" },
  { text: "How many programmers does it take to change a light bulb?", punchline: "None, it's a hardware problem!" },
  { text: "Why do Java developers wear glasses?", punchline: "Because they don't C#!" },
  { text: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: "Can I join you?" },
  { text: "Why was the JavaScript developer sad?", punchline: "Because he didn't know how to 'null' his feelings!" },
  { text: "Why do programmers always confuse Halloween and Christmas?", punchline: "Because Oct 31 == Dec 25" },
  { text: "How many programmers does it take to screw in a lightbulb?", punchline: "None, it's a hardware problem!" },
  { text: "Why did the programmer quit his job?", punchline: "Because he didn't get arrays!" },
  { text: "What do you call a programmer from Finland?", punchline: "Nerdic!" }
];

// Dad Jokes
const dadJokes: Joke[] = [
  { text: "I'm reading a book about anti-gravity.", punchline: "It's impossible to put down!" },
  { text: "I don't trust stairs.", punchline: "They're always up to something." },
  { text: "I told my wife she was drawing her eyebrows too high.", punchline: "She looked surprised." },
  { text: "Did you hear about the guy whose whole left side was cut off?", punchline: "He's all right now." },
  { text: "What do you call a fake noodle?", punchline: "An impasta!" },
  { text: "How do you make a tissue dance?", punchline: "Put a little boogie in it!" },
  { text: "What's brown and sticky?", punchline: "A stick!" },
  { text: "Why can't a nose be 12 inches long?", punchline: "Because then it would be a foot!" },
  { text: "What do you call a fish with no eyes?", punchline: "Fsh!" },
  { text: "I used to be a baker, but I couldn't make enough dough.", punchline: "Also, I kept getting battered." }
];

// Puns
const punJokes: Joke[] = [
  { text: "I tried to make a belt out of watches.", punchline: "It was a waist of time." },
  { text: "I was going to tell you a joke about boxing but I forgot the punch line." },
  { text: "When life gives you melons, you're probably dyslexic." },
  { text: "It's hard to explain puns to kleptomaniacs.", punchline: "They always take things literally." },
  { text: "The future, the present, and the past walked into a bar.", punchline: "It was tense." },
  { text: "I wasn't originally going to get a brain transplant.", punchline: "But then I changed my mind." },
  { text: "A man just assaulted me with milk, cream and butter.", punchline: "How dairy!" },
  { text: "The other day I held the door open for a clown.", punchline: "I thought it was a nice jester." },
  { text: "Did you hear about the guy who invented the knock-knock joke?", punchline: "He won the 'no-bell' prize." },
  { text: "Whenever I'm sad, I start singing 'The Green, Green Grass of Home.'", punchline: "It helps me find my key." }
];

// Knock-Knock Jokes
const knockKnockJokes: Joke[] = [
  { 
    text: "Knock knock!\nWho's there?\nBoo.\nBoo who?", 
    punchline: "Don't cry, it's just a joke!" 
  },
  { 
    text: "Knock knock!\nWho's there?\nCow says.\nCow says who?", 
    punchline: "No, a cow says moo!" 
  },
  { 
    text: "Knock knock!\nWho's there?\nBanana.\nBanana who?", 
    punchline: "Knock knock!\nWho's there?\nBanana.\nBanana who?\nKnock knock!\nWho's there?\nOrange.\nOrange who?\nOrange you glad I didn't say banana?" 
  },
  { 
    text: "Knock knock!\nWho's there?\nInterrupting cow.\nInterrupting cow wh-", 
    punchline: "MOOOOO!" 
  },
  { 
    text: "Knock knock!\nWho's there?\nTo.\nTo who?", 
    punchline: "It's to *whom*!" 
  },
  { 
    text: "Knock knock!\nWho's there?\nLettuce.\nLettuce who?", 
    punchline: "Lettuce in, it's cold out here!" 
  },
  { 
    text: "Knock knock!\nWho's there?\nWisdom.\nWisdom who?", 
    punchline: "Wisdom one do I tell my jokes to?" 
  },
  { 
    text: "Knock knock!\nWho's there?\nOink oink.\nOink oink who?", 
    punchline: "Make up your mind! Are you a pig or an owl?" 
  },
  { 
    text: "Knock knock!\nWho's there?\nHa.\nHa who?", 
    punchline: "What's so funny?" 
  },
  { 
    text: "Knock knock!\nWho's there?\nCanoe.\nCanoe who?", 
    punchline: "Canoe help me with my homework?" 
  }
];