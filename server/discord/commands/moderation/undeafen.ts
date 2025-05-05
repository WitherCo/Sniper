
import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "undeafen",
  description: "Undeafen a member in voice channels",
  category: "moderation",
  aliases: ["vundeafen"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["DeafenMembers"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !undeafen <user>");
    }

    const target = interaction.mentions.members?.first() || 
      await interaction.guild?.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return interaction.reply("❌ Could not find that user");
    }

    if (!target.voice.channel) {
      return interaction.reply("❌ User is not in a voice channel");
    }

    if (!target.voice.serverDeaf) {
      return interaction.reply("❌ User is not server deafened");
    }

    try {
      await target.voice.setDeaf(false);
      return interaction.reply(`✅ Successfully undeafened ${target.user.tag}`);
    } catch (error) {
      console.error("[UNDEAFEN ERROR]", error);
      return interaction.reply("❌ Failed to undeafen member. Please check my permissions.");
    }
  }
} as DiscordCommand;
