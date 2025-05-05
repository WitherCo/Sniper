import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "cat",
  description: "Get a random cat image to brighten your day",
  category: "fun",
  aliases: ["kitty", "meow"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    try {
      // Handle different types of interactions
      if (interaction instanceof Message) {
        // For message-based commands, no need for typing indicators in this implementation
      } else {
        await interaction.deferReply();
      }

      // Cat image URLs
      const catImages = [
        "https://cataas.com/cat",
        "https://cataas.com/cat/cute",
        "https://cataas.com/cat/says/Hello%20Discord",
        "https://cataas.com/cat/gif",
        "https://cataas.com/cat/cute/says/Meow",
        "https://cataas.com/cat/says/I%20Love%20Discord",
        "https://cataas.com/cat/says/Purr",
        "https://cataas.com/cat/cute/says/Pet%20Me",
        "https://cataas.com/cat/says/Feed%20Me"
      ];
      
      // Random cat facts
      const catFacts = [
        "Cats sleep for about 70% of their lives.",
        "A group of cats is called a clowder.",
        "Cats have 32 muscles in each ear.",
        "A cat's purr can heal bones, muscles, and tendons.",
        "Cats can jump up to 6 times their length.",
        "A cat's nose print is as unique as a human's fingerprint.",
        "Cats have 230 bones, while humans only have 206.",
        "The world's oldest cat lived to be 38 years old.",
        "Cats can't taste sweetness.",
        "Cats have a third eyelid called a 'haw.'"
      ];
      
      // Pick random image and fact
      const randomCatImage = catImages[Math.floor(Math.random() * catImages.length)];
      const randomCatFact = catFacts[Math.floor(Math.random() * catFacts.length)];
      
      // Create embed
      const catEmbed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🐱 Random Cat')
        .setDescription(randomCatFact)
        .setImage(randomCatImage + "?t=" + new Date().getTime()) // Add time parameter to prevent caching
        .setFooter({ text: 'Powered by CATAAS' });
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [catEmbed] });
      } else {
        await interaction.reply({ embeds: [catEmbed] });
      }
    } catch (error) {
      console.error("Error in cat command:", error);
      const errorMessage = "Sorry, I couldn't fetch a cat image right now. Try again later!";
      
      if (interaction instanceof CommandInteraction) {
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMessage });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
} as DiscordCommand;
