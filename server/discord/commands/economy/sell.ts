import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "sell",
  description: "Sell an item",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing sell command` });
    } else {
      await interaction.reply(`Executing sell command`);
    }
  }
} as DiscordCommand;
