import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "withdraw",
  description: "Withdraw currency from your bank",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing withdraw command` });
    } else {
      await interaction.reply(`Executing withdraw command`);
    }
  }
} as DiscordCommand;
