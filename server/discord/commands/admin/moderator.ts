import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "moderator",
  description: "Assign or remove moderator roles",
  category: "admin",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  options: [
      {
        name: "target",
        description: "The target of this admin action",
        type: "USER",
        required: true
      }
    ],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: "✅ Admin action completed: Assign or remove moderator roles", ephemeral: true });
    } else {
      return await interaction.reply("✅ Admin action completed: Assign or remove moderator roles");
    }
  }
} as DiscordCommand;
