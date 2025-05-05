
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "audit",
  description: "View audit log entries for moderation actions",
  category: "moderation",
  aliases: ["auditlog"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ViewAuditLog"],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof Message) {
      await interaction.reply("This command is still under development");
    } else {
      await interaction.reply({ content: "This command is still under development", ephemeral: true });
    }
  }
} as DiscordCommand;
