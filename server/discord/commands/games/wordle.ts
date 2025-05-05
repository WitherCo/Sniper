
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const wordList = [
  "REACT", "SWIFT", "PIANO", "WATER", "EARTH", "LIGHT", "BRAIN", "DANCE", "MUSIC", "GRASS",
  "HAPPY", "PHONE", "CLOUD", "BREAD", "DREAM", "SLEEP", "TIGER", "ROBOT", "PIZZA", "BEACH"
];

function createWordleResponse(guess: string, answer: string): string {
  let response = '';
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      response += '🟩'; // Correct letter, correct position
    } else if (answer.includes(guess[i])) {
      response += '🟨'; // Correct letter, wrong position
    } else {
      response += '⬛'; // Wrong letter
    }
  }
  return response;
}

export default {
  name: "wordle",
  description: "Play a game of Wordle",
  category: "games",
  aliases: [],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const answer = wordList[Math.floor(Math.random() * wordList.length)];
    let attempts = 6;
    let won = false;

    const embed = new EmbedBuilder()
      .setTitle("🎯 Wordle")
      .setDescription("Guess the 5-letter word! You have 6 attempts.\nType your guess in the chat.")
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });

    const filter = (m: Message) => m.author.id === interaction.author.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 180000, max: 6 });

    collector.on("collect", (msg) => {
      const guess = msg.content.toUpperCase();
      
      if (guess.length !== 5) {
        msg.reply("Please enter a 5-letter word!");
        return;
      }

      const result = createWordleResponse(guess, answer);
      attempts--;

      if (guess === answer) {
        won = true;
        collector.stop("win");
        msg.reply(`🎉 Correct! The word was ${answer}!\n${result}`);
      } else {
        msg.reply(`${result}\n${attempts} attempts remaining.`);
        if (attempts === 0) collector.stop("lose");
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        interaction.channel.send("Time's up! The game has ended.");
      } else if (reason === "lose" && !won) {
        interaction.channel.send(`Game Over! The word was ${answer}.`);
      }
    });
  }
} as DiscordCommand;
