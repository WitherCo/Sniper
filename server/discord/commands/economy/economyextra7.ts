import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "economyextra7",
  description: "Additional economy command 7",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing economyextra7 command` });
    } else {
      await interaction.reply(`Executing economyextra7 command`);
    }
  }
} as DiscordCommand;
