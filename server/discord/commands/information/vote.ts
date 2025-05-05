import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "vote",
  description: "Vote for the bot on listing sites",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing vote command` });
    } else {
      await interaction.reply(`Executing vote command`);
    }
  }
} as DiscordCommand;
