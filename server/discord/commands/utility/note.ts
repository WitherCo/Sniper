import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "note",
  description: "Save notes about users for staff reference",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🔧 Utility function executed: Save notes about users for staff reference` });
    } else {
      return await interaction.reply(`🔧 Utility function executed: Save notes about users for staff reference`);
    }
  }
} as DiscordCommand;
