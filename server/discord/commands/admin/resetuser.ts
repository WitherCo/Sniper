import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "resetuser",
  description: "Reset a user's data",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing resetuser command` });
    } else {
      await interaction.reply(`Executing resetuser command`);
    }
  }
} as DiscordCommand;
