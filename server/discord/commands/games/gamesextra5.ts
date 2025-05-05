import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "gamesextra5",
  description: "Additional games command 5",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing gamesextra5 command` });
    } else {
      await interaction.reply(`Executing gamesextra5 command`);
    }
  }
} as DiscordCommand;
