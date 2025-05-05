
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "members",
  description: "View member statistics",
  category: "information",
  aliases: ["membercount", "memberinfo"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;

    const guild = interaction.guild;
    if (!guild) return interaction.reply("❌ This command can only be used in a server.");

    const members = await guild.members.fetch();
    const bots = members.filter(member => member.user.bot).size;
    const humans = members.size - bots;
    const online = members.filter(member => member.presence?.status === 'online').size;
    const offline = members.filter(member => !member.presence || member.presence.status === 'offline').size;

    const embed = new EmbedBuilder()
      .setTitle(`${guild.name} Member Statistics`)
      .setColor("#5865F2")
      .setThumbnail(guild.iconURL() || '')
      .addFields([
        { name: '👥 Total Members', value: `${members.size}`, inline: true },
        { name: '👤 Humans', value: `${humans}`, inline: true },
        { name: '🤖 Bots', value: `${bots}`, inline: true },
        { name: '🟢 Online', value: `${online}`, inline: true },
        { name: '⚫ Offline', value: `${offline}`, inline: true }
      ])
      .setFooter({ text: `Requested by ${interaction.author.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
