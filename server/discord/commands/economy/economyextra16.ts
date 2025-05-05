import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "economyextra16",
  description: "Additional economy command 16",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing economyextra16 command` });
    } else {
      await interaction.reply(`Executing economyextra16 command`);
    }
  }
} as DiscordCommand;
