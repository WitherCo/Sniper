import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "resetconfig",
  description: "Reset server configuration to defaults",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing resetconfig command` });
    } else {
      await interaction.reply(`Executing resetconfig command`);
    }
  }
} as DiscordCommand;
