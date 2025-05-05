import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "duel",
  description: "Challenge someone to a duel",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing duel command` });
    } else {
      await interaction.reply(`Executing duel command`);
    }
  }
} as DiscordCommand;
