import { CommandInteraction, Message, EmbedBuilder, ChannelType, TextChannel, VoiceChannel, CategoryChannel } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "channelinfo",
  description: "Display information about a channel",
  category: "utility",
  aliases: ["channel"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const channel = interaction.mentions.channels.first() || interaction.channel;
    if (!channel) return interaction.reply("❌ Channel not found");

    const embed = new EmbedBuilder()
      .setTitle(`${channel.name} Channel Information`)
      .setColor(0x3498db)
      .addFields([
        { name: "🆔 Channel ID", value: channel.id, inline: true },
        { name: "📺 Type", value: channel.type.toString(), inline: true },
        { name: "📅 Created At", value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true }
      ]);

    if (channel instanceof TextChannel) {
      embed.addFields([
        { name: "📝 Topic", value: channel.topic || "No topic set", inline: false },
        { name: "🕒 Slowmode", value: `${channel.rateLimitPerUser} seconds`, inline: true },
        { name: "🔞 NSFW", value: channel.nsfw ? "Yes" : "No", inline: true }
      ]);
    } else if (channel instanceof VoiceChannel) {
      embed.addFields([
        { name: "👥 User Limit", value: channel.userLimit ? channel.userLimit.toString() : "No limit", inline: true },
        { name: "🎵 Bitrate", value: `${channel.bitrate / 1000}kbps`, inline: true }
      ]);
    } else if (channel instanceof CategoryChannel) {
      const childChannels = channel.children.cache;
      embed.addFields([
        { name: "📁 Child Channels", value: childChannels.size.toString(), inline: true },
        { name: "💬 Text Channels", value: childChannels.filter(c => c.type === ChannelType.GuildText).size.toString(), inline: true },
        { name: "🔊 Voice Channels", value: childChannels.filter(c => c.type === ChannelType.GuildVoice).size.toString(), inline: true }
      ]);
    }

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
