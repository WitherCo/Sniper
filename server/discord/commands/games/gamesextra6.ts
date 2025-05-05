import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "gamesextra6",
  description: "Additional games command 6",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing gamesextra6 command` });
    } else {
      await interaction.reply(`Executing gamesextra6 command`);
    }
  }
} as DiscordCommand;
