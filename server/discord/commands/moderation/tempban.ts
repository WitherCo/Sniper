
import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "tempban",
  description: "Temporarily ban a user",
  category: "moderation",
  permissions: ["BanMembers"],
  options: [
    {
      name: "target",
      description: "The user to temporarily ban",
      type: "USER",
      required: true
    },
    {
      name: "duration",
      description: "Duration in hours",
      type: "NUMBER",
      required: true
    },
    {
      name: "reason",
      description: "Reason for the ban",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let target: GuildMember | undefined;
    let duration: number;
    let reason: string;

    if (interaction instanceof Message) {
      if (!args || args.length < 2) {
        return interaction.reply("Usage: !tempban @user <duration_hours> [reason]");
      }
      target = await interaction.guild?.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => undefined);
      duration = parseInt(args[1]);
      reason = args.slice(2).join(" ") || "No reason provided";
    } else {
      target = await interaction.guild?.members.fetch(interaction.options.getUser("target")!.id).catch(() => undefined);
      duration = interaction.options.getNumber("duration") || 24;
      reason = interaction.options.getString("reason") || "No reason provided";
    }

    if (!target) {
      return interaction.reply("❌ Could not find that user.");
    }

    if (!duration || duration < 1) {
      return interaction.reply("❌ Please provide a valid duration in hours.");
    }

    if (!target.bannable) {
      return interaction.reply("❌ I cannot ban this user. They may have higher permissions than me.");
    }

    try {
      await target.ban({ reason: `Temporary ban for ${duration} hours: ${reason}` });
      
      // Schedule unban
      setTimeout(async () => {
        try {
          await interaction.guild?.members.unban(target!.id, "Temporary ban duration expired");
        } catch (error) {
          console.error("Failed to unban user after temp ban:", error);
        }
      }, duration * 60 * 60 * 1000);

      const response = `✅ Temporarily banned ${target.user.tag} for ${duration} hours\nReason: ${reason}`;
      return interaction instanceof Message ? interaction.reply(response) : interaction.reply({ content: response, ephemeral: true });
    } catch (error) {
      console.error("Tempban error:", error);
      return interaction.reply("❌ Failed to temporarily ban user.");
    }
  }
} as DiscordCommand;
