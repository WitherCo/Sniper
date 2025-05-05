import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "typerace",
  description: "Race to type a text correctly",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing typerace command` });
    } else {
      await interaction.reply(`Executing typerace command`);
    }
  }
} as DiscordCommand;
