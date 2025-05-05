import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "funextra6",
  description: "Additional fun command 6",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing funextra6 command` });
    } else {
      await interaction.reply(`Executing funextra6 command`);
    }
  }
} as DiscordCommand;
