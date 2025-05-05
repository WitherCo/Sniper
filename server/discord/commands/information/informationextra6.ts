import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "informationextra6",
  description: "Additional information command 6",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing informationextra6 command` });
    } else {
      await interaction.reply(`Executing informationextra6 command`);
    }
  }
} as DiscordCommand;
