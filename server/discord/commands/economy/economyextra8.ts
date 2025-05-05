import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "economyextra8",
  description: "Additional economy command 8",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing economyextra8 command` });
    } else {
      await interaction.reply(`Executing economyextra8 command`);
    }
  }
} as DiscordCommand;
