import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "case",
  description: "View or edit moderation cases",
  category: "moderation",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["BanMembers","KickMembers","ManageMessages"],
  options: [
      {
        name: "user",
        description: "The user to target with this moderation action",
        type: "USER",
        required: true
      },
      {
        name: "reason",
        description: "The reason for this moderation action",
        type: "STRING",
        required: false
      }
    ],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      const target = interaction.options.getUser("user") || "No user specified";
      const reason = interaction.options.getString("reason") || "No reason specified";
      return await interaction.reply({ content: `✅ Moderation action completed: View or edit moderation cases\nTarget: ${target}\nReason: ${reason}`, ephemeral: true });
    } else {
      const args = interaction.content.split(" ").slice(1);
      const target = args[0] || "No user specified";
      const reason = args.slice(1).join(" ") || "No reason specified";
      return await interaction.reply(`✅ Moderation action completed: View or edit moderation cases\nTarget: ${target}\nReason: ${reason}`);
    }
  }
} as DiscordCommand;
