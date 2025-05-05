import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "musicextra2",
  description: "Additional music command 2",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing musicextra2 command` });
    } else {
      await interaction.reply(`Executing musicextra2 command`);
    }
  }
} as DiscordCommand;
