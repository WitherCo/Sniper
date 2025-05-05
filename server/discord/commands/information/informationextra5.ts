import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "informationextra5",
  description: "Additional information command 5",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing informationextra5 command` });
    } else {
      await interaction.reply(`Executing informationextra5 command`);
    }
  }
} as DiscordCommand;
