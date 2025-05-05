import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "neverhaveiever",
  description: "Never have I ever game",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing neverhaveiever command` });
    } else {
      await interaction.reply(`Executing neverhaveiever command`);
    }
  }
} as DiscordCommand;
