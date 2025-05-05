import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "utilityextra9",
  description: "Additional utility command 9",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing utilityextra9 command` });
    } else {
      await interaction.reply(`Executing utilityextra9 command`);
    }
  }
} as DiscordCommand;
