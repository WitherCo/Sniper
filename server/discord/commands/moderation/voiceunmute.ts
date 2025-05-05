import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "voiceunmute",
  description: "Unmute a user in voice channels",
  category: "moderation",
  aliases: ["vunmute"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["MuteMembers"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !voiceunmute <user>");
    }

    const target = interaction.mentions.members?.first() || 
      await interaction.guild?.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return interaction.reply("❌ Could not find that user");
    }

    if (!target.voice.channel) {
      return interaction.reply("❌ User is not in a voice channel");
    }

    try {
      await target.voice.setMute(false);
      return interaction.reply(`✅ Voice unmuted ${target.user.tag}`);
    } catch (error) {
      console.error("[VOICEUNMUTE ERROR]", error);
      return interaction.reply("❌ Failed to voice unmute user");
    }
  }
} as DiscordCommand;
