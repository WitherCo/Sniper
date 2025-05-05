import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "dadjoke",
  description: "Get a random dad joke",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing dadjoke command` });
    } else {
      await interaction.reply(`Executing dadjoke command`);
    }
  }
} as DiscordCommand;
