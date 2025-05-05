import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "dog",
  description: "Get a random dog image to brighten your day",
  category: "fun",
  aliases: ["doggo", "puppy", "woof"],
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

      // Dog image URLs (using dog.ceo API)
      const dogAPI = "https://dog.ceo/api/breeds/image/random";
      
      // Random dog facts
      const dogFacts = [
        "Dogs have three eyelids, including one to keep their eyes lubricated and protected.",
        "The Basenji is the only breed of dog that can't bark.",
        "A dog's nose print is unique, much like a human's fingerprint.",
        "Dogs can hear about 4 times the distance of humans.",
        "Dogs' sense of smell is about 40 times better than humans.",
        "Greyhounds can run up to 45 miles per hour.",
        "Dalmatian puppies are born completely white.",
        "The tallest dog in history was a Great Dane named Zeus who stood 44 inches tall.",
        "Dogs have about 1,700 taste buds. Humans have approximately 9,000.",
        "Dogs can be trained to detect changes in blood sugar levels for diabetics.",
        "Dogs sweat through their paw pads.",
        "Dogs can see in color, just not as vividly as humans.",
        "The oldest dog on record lived to be 29 years old.",
        "A dog's average body temperature is about 101.5°F.",
        "Dogs can learn more than 1,000 words."
      ];
      
      // Pick random fact
      const randomDogFact = dogFacts[Math.floor(Math.random() * dogFacts.length)];
      
      try {
        // Create embed
        const dogEmbed = new EmbedBuilder()
          .setColor(0xF1C40F)
          .setTitle('🐶 Random Dog')
          .setDescription(randomDogFact)
          .setImage("https://images.dog.ceo/breeds/retriever-golden/n02099601_5796.jpg") // Fallback image
          .setFooter({ text: 'Powered by dog.ceo API' });
        
        // Try to fetch from API (but use fallback if fails)
        try {
          const response = await fetch(dogAPI);
          if (response.ok) {
            const data = await response.json();
            if (data.status === "success" && data.message) {
              dogEmbed.setImage(data.message);
            }
          }
        } catch (apiError) {
          console.error("Error fetching from dog API:", apiError);
          // We'll use the fallback image already set
        }
        
        if (interaction instanceof CommandInteraction) {
          await interaction.editReply({ embeds: [dogEmbed] });
        } else {
          await interaction.reply({ embeds: [dogEmbed] });
        }
      } catch (error) {
        throw error; // Propagate to outer catch
      }
    } catch (error) {
      console.error("Error in dog command:", error);
      const errorMessage = "Sorry, I couldn't fetch a dog image right now. Try again later!";
      
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
