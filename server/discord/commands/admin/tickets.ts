import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "tickets",
  description: "Configure the ticket system",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing tickets command` });
    } else {
      await interaction.reply(`Executing tickets command`);
    }
  }
} as DiscordCommand;
