import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "reason",
  description: "Add a reason to a previous moderation action",
  category: "moderation",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ViewAuditLog"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing reason command` });
    } else {
      await interaction.reply(`Executing reason command`);
    }
  }
} as DiscordCommand;
