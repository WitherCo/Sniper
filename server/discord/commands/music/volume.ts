import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "volume",
  description: "Change the volume of the music",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
      {
        name: "query",
        description: "The song or playlist to search for",
        type: "STRING",
        required: false
      }
    ],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎵 Music command executed: Change the volume of the music\nNow enjoying your music experience!` });
    } else {
      return await interaction.reply(`🎵 Music command executed: Change the volume of the music\nNow enjoying your music experience!`);
    }
  }
} as DiscordCommand;
