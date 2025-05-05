import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "report",
  description: "Report a user to server moderators",
  category: "moderation",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing report command` });
    } else {
      await interaction.reply(`Executing report command`);
    }
  }
} as DiscordCommand;
