import { 
  Message, 
  EmbedBuilder, 
  User, 
  Collection, 
  ColorResolvable,
  MessageReaction,
  ReactionCollector
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Word categories for the hangman game
const WORD_LISTS = {
  animals: [
    "elephant", "giraffe", "kangaroo", "penguin", "dolphin", "tiger", "lion", "zebra", 
    "rhinoceros", "crocodile", "panda", "koala", "cheetah", "gorilla", "hippopotamus"
  ],
  countries: [
    "australia", "brazil", "canada", "denmark", "egypt", "france", "germany", "hungary", 
    "indonesia", "japan", "kenya", "luxembourg", "malaysia", "netherlands", "portugal"
  ],
  fruits: [
    "apple", "banana", "cherry", "dragonfruit", "elderberry", "fig", "grape", "honeydew", 
    "kiwi", "lemon", "mango", "nectarine", "orange", "pineapple", "raspberry"
  ],
  technology: [
    "computer", "smartphone", "keyboard", "monitor", "router", "processor", "bluetooth", 
    "internet", "software", "hardware", "algorithm", "database", "network", "wireless", "programming"
  ]
};

// All categories combined
const ALL_WORDS = Object.values(WORD_LISTS).flat();

// Game states for different players
const gameStates = new Collection<string, {
  word: string;
  category: string;
  guessed: Set<string>;
  guessesLeft: number;
  message: Message;
  collector?: ReactionCollector;
}>();

// ASCII art for hangman stages
const hangmanStages = [
  // 0 mistakes
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "      |\n" +
  "      |\n" +
  "      |\n" +
  "      |\n" +
  "=========\n" +
  "```",
  // 1 mistake
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "  O   |\n" +
  "      |\n" +
  "      |\n" +
  "      |\n" +
  "=========\n" +
  "```",
  // 2 mistakes
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "  O   |\n" +
  "  |   |\n" +
  "      |\n" +
  "      |\n" +
  "=========\n" +
  "```",
  // 3 mistakes
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "  O   |\n" +
  " /|   |\n" +
  "      |\n" +
  "      |\n" +
  "=========\n" +
  "```",
  // 4 mistakes
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "  O   |\n" +
  " /|\\  |\n" +
  "      |\n" +
  "      |\n" +
  "=========\n" +
  "```",
  // 5 mistakes
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "  O   |\n" +
  " /|\\  |\n" +
  " /    |\n" +
  "      |\n" +
  "=========\n" +
  "```",
  // 6 mistakes (game over)
  "```\n" +
  "  +---+\n" +
  "  |   |\n" +
  "  O   |\n" +
  " /|\\  |\n" +
  " / \\  |\n" +
  "      |\n" +
  "=========\n" +
  "```"
];

// Letters for emoji reactions
const ALPHABET = "🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿".split(" ");
const LETTER_EMOJIS = new Map(
  ALPHABET.map((emoji, index) => [emoji, String.fromCharCode(97 + index)])
);

// Converts emoji to letter and vice versa
function emojiToLetter(emoji: string): string | undefined {
  return LETTER_EMOJIS.get(emoji);
}

function getRandomWord(category?: string): { word: string; category: string } {
  if (category && WORD_LISTS[category as keyof typeof WORD_LISTS]) {
    const list = WORD_LISTS[category as keyof typeof WORD_LISTS];
    return { 
      word: list[Math.floor(Math.random() * list.length)], 
      category 
    };
  }
  
  // Pick a random category if none specified
  const categories = Object.keys(WORD_LISTS);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const list = WORD_LISTS[randomCategory as keyof typeof WORD_LISTS];
  
  return { 
    word: list[Math.floor(Math.random() * list.length)], 
    category: randomCategory 
  };
}

function displayWord(word: string, guessed: Set<string>): string {
  return word
    .split("")
    .map(letter => (guessed.has(letter) ? letter.toUpperCase() : "_ "))
    .join(" ");
}

function getCategoryColor(category: string): ColorResolvable {
  switch (category) {
    case "animals": return 0x3498DB; // Blue
    case "countries": return 0x2ECC71; // Green
    case "fruits": return 0xE74C3C; // Red
    case "technology": return 0x9B59B6; // Purple
    default: return 0xF1C40F; // Yellow
  }
}

function getAvailableLetters(guessed: Set<string>): string {
  return "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .map(letter => guessed.has(letter) ? "~~" + letter.toUpperCase() + "~~" : letter.toUpperCase())
    .join(" ");
}

function isGameWon(word: string, guessed: Set<string>): boolean {
  return word.split("").every(letter => guessed.has(letter));
}

export default {
  name: "hangman",
  description: "Play a game of hangman with various word categories",
  category: "fun",
  aliases: ["hang", "guess"],
  slash: false,
  prefix: true,
  cooldown: 10,
  permissions: [],
  options: [
    {
      name: "category",
      description: "Word category (animals, countries, fruits, technology)",
      type: "STRING",
      required: false,
      choices: [
        { name: "Animals", value: "animals" },
        { name: "Countries", value: "countries" },
        { name: "Fruits", value: "fruits" },
        { name: "Technology", value: "technology" }
      ]
    }
  ],
  async execute(interaction: Message) {
    const playerId = interaction.author.id;
    
    // Check if player already has an active game
    if (gameStates.has(playerId)) {
      return await interaction.reply("You already have an active hangman game! Finish or stop that one first.");
    }
    
    // Parse the category from arguments if provided
    const args = interaction.content.split(" ").slice(1);
    let category: string | undefined;
    
    if (args.length > 0) {
      const requestedCategory = args[0].toLowerCase();
      if (["animals", "countries", "fruits", "technology"].includes(requestedCategory)) {
        category = requestedCategory;
      }
    }
    
    // Get a random word based on category
    const { word, category: actualCategory } = getRandomWord(category);
    
    // Initialize game state
    const gameState = {
      word,
      category: actualCategory,
      guessed: new Set<string>(),
      guessesLeft: 6,
      message: interaction
    };
    
    // Save the game state
    gameStates.set(playerId, gameState);
    
    // Create the initial embed
    const embed = new EmbedBuilder()
      .setTitle("🎮 Hangman Game")
      .setDescription(
        `**Category**: ${actualCategory.charAt(0).toUpperCase() + actualCategory.slice(1)}\n\n` +
        hangmanStages[0] + "\n\n" +
        `Word: \`${displayWord(word, gameState.guessed)}\`\n\n` +
        `Available Letters: ${getAvailableLetters(gameState.guessed)}\n\n` +
        `Guesses Left: ${gameState.guessesLeft}`
      )
      .setColor(getCategoryColor(actualCategory))
      .setFooter({ text: `Player: ${interaction.author.tag} | Type a letter to guess` });
    
    // Send initial game message
    const gameMessage = await interaction.reply({ embeds: [embed] });
    
    // Create a message collector for user guesses
    const filter = (m: Message) => m.author.id === playerId && m.content.length === 1 && /[a-z]/i.test(m.content);
    const collector = interaction.channel?.createMessageCollector({ filter, time: 300000 }); // 5 min timeout
    
    collector?.on("collect", async (m: Message) => {
      const guess = m.content.toLowerCase();
      
      // Ignore if letter was already guessed
      if (gameState.guessed.has(guess)) {
        const tempMsg = await m.reply(`You already guessed the letter "${guess.toUpperCase()}"!`);
        setTimeout(() => tempMsg.delete().catch(() => {}), 2000);
        return;
      }
      
      // Add the guessed letter
      gameState.guessed.add(guess);
      
      // Check if the letter is in the word
      if (!word.includes(guess)) {
        gameState.guessesLeft--;
      }
      
      // Check win condition
      const won = isGameWon(word, gameState.guessed);
      
      // Update the game embed
      const updatedEmbed = new EmbedBuilder()
        .setTitle(won ? "🎉 Hangman Game - You Won!" : (gameState.guessesLeft === 0 ? "😞 Hangman Game - You Lost!" : "🎮 Hangman Game"))
        .setDescription(
          `**Category**: ${actualCategory.charAt(0).toUpperCase() + actualCategory.slice(1)}\n\n` +
          hangmanStages[6 - gameState.guessesLeft] + "\n\n" +
          `Word: \`${won || gameState.guessesLeft === 0 ? word.toUpperCase() : displayWord(word, gameState.guessed)}\`\n\n` +
          `Available Letters: ${getAvailableLetters(gameState.guessed)}\n\n` +
          `Guesses Left: ${gameState.guessesLeft}` +
          (gameState.guessesLeft === 0 ? "\n\n**Game Over!** The word was: " + word.toUpperCase() : "")
        )
        .setColor(won ? 0x2ECC71 : (gameState.guessesLeft === 0 ? 0xE74C3C : getCategoryColor(actualCategory)))
        .setFooter({ text: `Player: ${interaction.author.tag} | ${won || gameState.guessesLeft === 0 ? "Game finished" : "Type a letter to guess"}` });
      
      // Update the game message
      await interaction.editReply({ embeds: [updatedEmbed] });
      
      // Delete the guess message to keep the channel clean
      if (m.deletable) {
        await m.delete().catch(() => {});
      }
      
      // End the game if won or lost
      if (won || gameState.guessesLeft === 0) {
        collector.stop();
        
        // Remove the game state
        gameStates.delete(playerId);
        
        // Add a reaction based on game outcome
        if (won) {
          await interaction.react("🎉");
        } else {
          await interaction.react("😞");
        }
      }
    });
    
    collector?.on("end", (collected, reason) => {
      // If game ended due to timeout and not win/lose
      if (reason === "time" && gameStates.has(playerId)) {
        // Create timeout embed
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏰ Hangman Game - Timed Out")
          .setDescription(
            `**Category**: ${actualCategory.charAt(0).toUpperCase() + actualCategory.slice(1)}\n\n` +
            `The game has ended due to inactivity.\n` +
            `The word was: \`${word.toUpperCase()}\``
          )
          .setColor(0xFFA500) // Orange
          .setFooter({ text: `Player: ${interaction.author.tag} | Game ended due to inactivity` });
        
        // Update the game message
        interaction.editReply({ embeds: [timeoutEmbed] }).catch(() => {});
        
        // Remove the game state
        gameStates.delete(playerId);
      }
    });
  }
} as DiscordCommand;
