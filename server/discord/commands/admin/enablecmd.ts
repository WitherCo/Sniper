import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "enablecmd",
  description: "Enable previously disabled commands",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing enablecmd command` });
    } else {
      await interaction.reply(`Executing enablecmd command`);
    }
  }
} as DiscordCommand;
