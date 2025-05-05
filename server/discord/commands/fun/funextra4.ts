import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "funextra4",
  description: "Additional fun command 4",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing funextra4 command` });
    } else {
      await interaction.reply(`Executing funextra4 command`);
    }
  }
} as DiscordCommand;
