
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "joindate",
  description: "See when a user joined the server",
  category: "information",
  aliases: ["joined"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) return;

    const member = args?.length ? 
      await interaction.guild?.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) :
      interaction.member;

    if (!member) {
      return interaction.reply("❌ User not found!");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Join Date Information`)
      .setColor("#5865F2")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields([
        { name: '👤 User', value: member.user.tag, inline: true },
        { name: '📅 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>`, inline: true },
        { name: '📆 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true }
      ])
      .setFooter({ text: `User ID: ${member.id}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
