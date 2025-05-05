import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "reactionroles",
  description: "Set up reaction roles",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageRoles"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing reactionroles command` });
    } else {
      await interaction.reply(`Executing reactionroles command`);
    }
  }
} as DiscordCommand;
