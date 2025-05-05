import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "translation",
  description: "Translate messages between languages",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🔧 Utility function executed: Translate messages between languages` });
    } else {
      return await interaction.reply(`🔧 Utility function executed: Translate messages between languages`);
    }
  }
} as DiscordCommand;
