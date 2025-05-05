import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "unlock",
  description: "Unlock a previously locked channel",
  category: "moderation",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageChannels"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing unlock command` });
    } else {
      await interaction.reply(`Executing unlock command`);
    }
  }
} as DiscordCommand;
