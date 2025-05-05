import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "balance",
  description: "Check your balance",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing balance command` });
    } else {
      await interaction.reply(`Executing balance command`);
    }
  }
} as DiscordCommand;
