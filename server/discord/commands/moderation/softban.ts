
import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "softban",
  description: "Ban and immediately unban a user to delete their messages",
  category: "moderation",
  permissions: ["BanMembers"],
  options: [
    {
      name: "target",
      description: "The user to softban",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "Reason for the softban",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let target: GuildMember | undefined;
    let reason: string;

    if (interaction instanceof Message) {
      if (!args || args.length < 1) {
        return interaction.reply("Usage: !softban @user [reason]");
      }
      target = await interaction.guild?.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => undefined);
      reason = args.slice(1).join(" ") || "No reason provided";
    } else {
      target = await interaction.guild?.members.fetch(interaction.options.getUser("target")!.id).catch(() => undefined);
      reason = interaction.options.getString("reason") || "No reason provided";
    }

    if (!target) {
      return interaction.reply("❌ Could not find that user.");
    }

    if (!target.bannable) {
      return interaction.reply("❌ I cannot ban this user. They may have higher permissions than me.");
    }

    try {
      await target.ban({ deleteMessageSeconds: 60 * 60 * 24 * 7, reason: `Softban: ${reason}` });
      await interaction.guild?.members.unban(target.id, "Softban completed");
      
      const response = `✅ Successfully softbanned ${target.user.tag}\nReason: ${reason}`;
      return interaction instanceof Message ? interaction.reply(response) : interaction.reply({ content: response, ephemeral: true });
    } catch (error) {
      console.error("Softban error:", error);
      return interaction.reply("❌ Failed to softban user.");
    }
  }
} as DiscordCommand;
