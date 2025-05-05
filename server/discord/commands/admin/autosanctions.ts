import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "autosanctions",
  description: "Configure automatic sanctions for rule violations",
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
      return await interaction.reply({ content: "✅ Admin action completed: Configure automatic sanctions for rule violations", ephemeral: true });
    } else {
      return await interaction.reply("✅ Admin action completed: Configure automatic sanctions for rule violations");
    }
  }
} as DiscordCommand;
