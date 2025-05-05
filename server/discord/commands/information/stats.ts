import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "stats",
  description: "View detailed server statistics",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `ℹ️ Information retrieved: View detailed server statistics\nServer members: ${interaction.guild?.memberCount || 'Unknown'}` });
    } else {
      return await interaction.reply(`ℹ️ Information retrieved: View detailed server statistics\nServer members: ${interaction.guild?.memberCount || 'Unknown'}`);
    }
  }
} as DiscordCommand;
