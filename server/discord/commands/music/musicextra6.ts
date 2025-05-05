import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "musicextra6",
  description: "Additional music command 6",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing musicextra6 command` });
    } else {
      await interaction.reply(`Executing musicextra6 command`);
    }
  }
} as DiscordCommand;
