import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "inviteinfo",
  description: "Get information about an invite",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing inviteinfo command` });
    } else {
      await interaction.reply(`Executing inviteinfo command`);
    }
  }
} as DiscordCommand;
