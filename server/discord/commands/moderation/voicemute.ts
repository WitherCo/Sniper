import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "voicemute",
  description: "Mute a user in voice channels",
  category: "moderation",
  aliases: ["vmute"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["MuteMembers"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !voicemute <user> [reason]");
    }

    const target = interaction.mentions.members?.first() || 
      await interaction.guild?.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return interaction.reply("❌ Could not find that user");
    }

    if (!target.voice.channel) {
      return interaction.reply("❌ User is not in a voice channel");
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.voice.setMute(true, reason);
      return interaction.reply(`✅ Voice muted ${target.user.tag}\nReason: ${reason}`);
    } catch (error) {
      console.error("[VOICEMUTE ERROR]", error);
      return interaction.reply("❌ Failed to voice mute user");
    }
  }
} as DiscordCommand;
