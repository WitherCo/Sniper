
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "chess",
  description: "Start a chess game using the lichess API",
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

    const opponent = interaction.mentions.users.first();
    if (!opponent) {
      return interaction.reply("Please mention a user to play against");
    }

    if (opponent.bot) {
      return interaction.reply("You cannot play against a bot");
    }

    if (opponent.id === interaction.author.id) {
      return interaction.reply("You cannot play against yourself");
    }

    const gameId = Math.random().toString(36).substring(2, 15);
    const gameUrl = `https://lichess.org/embed/${gameId}`;

    const embed = new EmbedBuilder()
      .setTitle("Chess Game")
      .setDescription(`${interaction.author.tag} vs ${opponent.tag}\n\nGame started! Click the link below to play:`)
      .setColor(0x3498db)
      .setURL(gameUrl)
      .setFooter({ text: "Powered by Lichess" });

    await interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
