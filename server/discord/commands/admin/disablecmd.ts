import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "disablecmd",
  description: "Disable commands in certain channels",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing disablecmd command` });
    } else {
      await interaction.reply(`Executing disablecmd command`);
    }
  }
} as DiscordCommand;
