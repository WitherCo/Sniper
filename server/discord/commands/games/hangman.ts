
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const words = [
  "DISCORD", "GAMING", "COMPUTER", "INTERNET", "PROGRAMMING",
  "JAVASCRIPT", "TYPESCRIPT", "PYTHON", "DEVELOPER", "SOFTWARE"
];

const hangmanStages = [
  "```\n  +---+\n      |\n      |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  O   |\n      |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  O   |\n  |   |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  O   |\n /|   |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  O   |\n /|\\  |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  O   |\n /|\\  |\n /    |\n      |\n      |\n=========```",
  "```\n  +---+\n  O   |\n /|\\  |\n / \\  |\n      |\n      |\n=========```"
];

export default {
  name: "hangman",
  description: "Play a game of hangman",
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

    const word = words[Math.floor(Math.random() * words.length)];
    let guessed = new Set<string>();
    let mistakes = 0;
    
    const getDisplay = () => {
      return word
        .split('')
        .map(letter => guessed.has(letter) ? letter : '_')
        .join(' ');
    };

    const getGameStatus = () => {
      const display = getDisplay();
      const stage = hangmanStages[mistakes];
      const guessedLetters = Array.from(guessed).join(', ');
      
      return new EmbedBuilder()
        .setTitle("🎯 Hangman")
        .setDescription(`${stage}\n\nWord: \`${display}\`\n\nGuessed Letters: ${guessedLetters || 'None'}`)
        .setColor(0x3498DB)
        .setFooter({ text: "Type a letter to guess!" });
    };

    const message = await interaction.reply({ embeds: [getGameStatus()] });
    const collector = interaction.channel.createMessageCollector({
      filter: m => m.author.id === interaction.author.id,
      time: 60000
    });

    collector.on('collect', async m => {
      const guess = m.content.toUpperCase();
      
      if (guess.length !== 1) {
        return;
      }

      if (guessed.has(guess)) {
        m.reply("You already guessed that letter!");
        return;
      }

      guessed.add(guess);
      
      if (!word.includes(guess)) {
        mistakes++;
      }

      const won = word.split('').every(letter => guessed.has(letter));
      const lost = mistakes >= 6;

      const embed = getGameStatus();
      
      if (won) {
        embed.setDescription(`${hangmanStages[mistakes]}\n\nCongratulations! You won! 🎉\nThe word was: \`${word}\``);
        embed.setColor(0x2ECC71);
        collector.stop('won');
      } else if (lost) {
        embed.setDescription(`${hangmanStages[6]}\n\nGame Over! You lost! 😢\nThe word was: \`${word}\``);
        embed.setColor(0xE74C3C);
        collector.stop('lost');
      }

      await message.edit({ embeds: [embed] });
      
      if (won || lost) {
        collector.stop();
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        const embed = getGameStatus()
          .setDescription(`${hangmanStages[mistakes]}\n\n⏰ Time's up!\nThe word was: \`${word}\``)
          .setColor(0xE74C3C);
        message.edit({ embeds: [embed] });
      }
    });
  }
} as DiscordCommand;
