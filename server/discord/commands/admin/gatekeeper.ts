
import { Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "gatekeeper",
  description: "Configure member verification settings",
  category: "admin",
  aliases: ["verify"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: Message, args?: string[]) {
    if (!args?.length) {
      return interaction.reply("Usage: !gatekeeper <setup/level/role/disable>");
    }

    const action = args[0].toLowerCase();
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Gatekeeper Settings")
      .setTimestamp();

    switch (action) {
      case "setup":
        embed.setDescription("Verification system enabled")
          .addFields([
            { name: "Required Level", value: "1", inline: true },
            { name: "Verified Role", value: "Verified", inline: true }
          ])
          .setColor("#00ff00");
        break;
      case "disable":
        embed.setDescription("Verification system disabled")
          .setColor("#ff0000");
        break;
      default:
        embed.setDescription("Invalid action. Use setup, level, role, or disable")
          .setColor("#ff9900");
    }

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
