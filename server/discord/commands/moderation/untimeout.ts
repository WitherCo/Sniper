import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "untimeout",
  description: "Remove timeout from a user",
  category: "moderation",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ModerateMembers"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing untimeout command` });
    } else {
      await interaction.reply(`Executing untimeout command`);
    }
  }
} as DiscordCommand;
