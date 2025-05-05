import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "bugreport",
  description: "Report a bug",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing bugreport command` });
    } else {
      await interaction.reply(`Executing bugreport command`);
    }
  }
} as DiscordCommand;
