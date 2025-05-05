import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "musicextra4",
  description: "Additional music command 4",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing musicextra4 command` });
    } else {
      await interaction.reply(`Executing musicextra4 command`);
    }
  }
} as DiscordCommand;
