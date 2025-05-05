import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "wikipedia",
  description: "Search Wikipedia",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing wikipedia command` });
    } else {
      await interaction.reply(`Executing wikipedia command`);
    }
  }
} as DiscordCommand;
