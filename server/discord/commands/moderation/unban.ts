
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "unban",
  description: "Unban a user from the server",
  category: "moderation",
  permissions: ["BanMembers"],
  options: [
    {
      name: "userid",
      description: "The ID of the user to unban",
      type: "STRING",
      required: true
    },
    {
      name: "reason",
      description: "Reason for the unban",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let userId: string;
    let reason: string;

    if (interaction instanceof Message) {
      if (!args || args.length < 1) {
        return interaction.reply("Usage: !unban <userid> [reason]");
      }
      userId = args[0].replace(/[<@!>]/g, '');
      reason = args.slice(1).join(" ") || "No reason provided";
    } else {
      userId = interaction.options.getString("userid")!;
      reason = interaction.options.getString("reason") || "No reason provided";
    }

    try {
      await interaction.guild?.members.unban(userId, reason);
      const response = `✅ Successfully unbanned user with ID ${userId}\nReason: ${reason}`;
      return interaction instanceof Message ? interaction.reply(response) : interaction.reply({ content: response, ephemeral: true });
    } catch (error) {
      console.error("Unban error:", error);
      return interaction.reply("❌ Failed to unban user. Make sure the ID is valid and the user is banned.");
    }
  }
} as DiscordCommand;
