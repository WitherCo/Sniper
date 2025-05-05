
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const pokemons = [
  { name: "Pikachu", hint: "The most famous electric mouse Pokemon" },
  { name: "Charizard", hint: "A fire-breathing dragon-like Pokemon" },
  { name: "Mewtwo", hint: "A powerful psychic legendary Pokemon" },
  { name: "Snorlax", hint: "A big sleeping Pokemon that blocks paths" },
  { name: "Gyarados", hint: "A fearsome water dragon evolved from Magikarp" }
];

export default {
  name: "pokemon",
  description: "Play a Pokemon guessing game",
  category: "games",
  aliases: ["pokeguess"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const pokemon = pokemons[Math.floor(Math.random() * pokemons.length)];
    const embed = new EmbedBuilder()
      .setTitle("Pokemon Guessing Game")
      .setDescription(`**Hint:** ${pokemon.hint}\n\nYou have 30 seconds to guess the Pokemon!`)
      .setColor(0xFFA500);

    await interaction.reply({ embeds: [embed] });

    const filter = (m: Message) => m.author.id === interaction.author.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

    collector.on("collect", (msg) => {
      if (msg.content.toLowerCase() === pokemon.name.toLowerCase()) {
        collector.stop("win");
        msg.reply(`🎉 Correct! The Pokemon was ${pokemon.name}!`);
      }
    });

    collector.on("end", (_, reason) => {
      if (reason !== "win") {
        interaction.channel.send(`Time's up! The Pokemon was ${pokemon.name}.`);
      }
    });
  }
} as DiscordCommand;
