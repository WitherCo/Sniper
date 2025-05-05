import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "utilityextra6",
  description: "Additional utility command 6",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing utilityextra6 command` });
    } else {
      await interaction.reply(`Executing utilityextra6 command`);
    }
  }
} as DiscordCommand;
