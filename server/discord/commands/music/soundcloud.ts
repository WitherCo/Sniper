import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "soundcloud",
  description: "Play a song from SoundCloud",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing soundcloud command` });
    } else {
      await interaction.reply(`Executing soundcloud command`);
    }
  }
} as DiscordCommand;
