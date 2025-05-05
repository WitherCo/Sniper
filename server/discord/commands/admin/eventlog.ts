import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "eventlog",
  description: "Configure event logging settings",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing adminextra9 command` });
    } else {
      await interaction.reply(`Executing adminextra9 command`);
    }
  }
} as DiscordCommand;
