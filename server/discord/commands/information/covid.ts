import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "covid",
  description: "Get COVID-19 statistics",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing covid command` });
    } else {
      await interaction.reply(`Executing covid command`);
    }
  }
} as DiscordCommand;
