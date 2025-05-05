import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "role",
  description: "Manage roles for a user",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageRoles"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing role command` });
    } else {
      await interaction.reply(`Executing role command`);
    }
  }
} as DiscordCommand;
