import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "gamesextra8",
  description: "Additional games command 8",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing gamesextra8 command` });
    } else {
      await interaction.reply(`Executing gamesextra8 command`);
    }
  }
} as DiscordCommand;
