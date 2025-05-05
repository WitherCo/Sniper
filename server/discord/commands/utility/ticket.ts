import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "ticket",
  description: "Create support tickets",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🔧 Utility function executed: Create support tickets` });
    } else {
      return await interaction.reply(`🔧 Utility function executed: Create support tickets`);
    }
  }
} as DiscordCommand;
