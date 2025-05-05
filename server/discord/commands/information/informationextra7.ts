import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "informationextra7",
  description: "Additional information command 7",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing informationextra7 command` });
    } else {
      await interaction.reply(`Executing informationextra7 command`);
    }
  }
} as DiscordCommand;
