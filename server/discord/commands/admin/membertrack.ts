import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "membertrack",
  description: "Track member activity and statistics",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing adminextra16 command` });
    } else {
      await interaction.reply(`Executing adminextra16 command`);
    }
  }
} as DiscordCommand;
