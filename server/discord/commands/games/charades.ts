
import { CommandInteraction, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const categories = [
  {
    name: "Movies",
    items: ["Star Wars", "The Matrix", "Jurassic Park", "Titanic", "Avatar", "Spider-Man", "Harry Potter", "The Lion King"]
  },
  {
    name: "Animals",
    items: ["Elephant", "Penguin", "Giraffe", "Kangaroo", "Dolphin", "Octopus", "Cheetah", "Panda"]
  },
  {
    name: "Actions",
    items: ["Dancing", "Swimming", "Cooking", "Painting", "Running", "Sleeping", "Reading", "Laughing"]
  },
  {
    name: "Objects",
    items: ["Umbrella", "Telephone", "Computer", "Guitar", "Camera", "Clock", "Bicycle", "Backpack"]
  }
];

export default {
  name: "charades",
  description: "Play a game of charades",
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

    const category = categories[Math.floor(Math.random() * categories.length)];
    const word = category.items[Math.floor(Math.random() * category.items.length)];
    
    const embed = new EmbedBuilder()
      .setTitle("🎭 Charades")
      .setDescription(`**Category:** ${category.name}\n\nAct out or describe this without saying the word!\nClick 'Reveal' when ready.`)
      .setColor(0x3498DB)
      .setFooter({ text: "You have 30 seconds to reveal the word" });

    const revealButton = new ButtonBuilder()
      .setCustomId('reveal')
      .setLabel('Reveal Word')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(revealButton);

    const message = await interaction.reply({ embeds: [embed], components: [row] });

    const collector = message.createMessageComponentCollector({
      time: 30000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.author.id) {
        return i.reply({ content: "This is not your game!", ephemeral: true });
      }

      embed.setDescription(`**Category:** ${category.name}\n\n**The word was:** ${word}`)
        .setColor(0x2ECC71);

      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        embed.setDescription(`Time's up!\n\n**The word was:** ${word}`)
          .setColor(0xE74C3C);
        message.edit({ embeds: [embed], components: [] });
      }
    });
  }
} as DiscordCommand;
