
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "boosters",
  description: "Shows server boosters sorted by boost date",
  category: "information",
  aliases: ["boosts", "serverboosts"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;
    if (!interaction.guild) return interaction.reply("❌ This command can only be used in a server!");

    const boosters = interaction.guild.members.cache
      .filter(m => m.premiumSince !== null)
      .sort((a, b) => (a.premiumSince?.getTime() || 0) - (b.premiumSince?.getTime() || 0));
    
    const boostTier = interaction.guild.premiumTier;
    const boostCount = interaction.guild.premiumSubscriptionCount || 0;
    const tierProgress = {
      NONE: `0/2 boosts to Tier 1`,
      TIER_1: `${boostCount}/7 boosts to Tier 2`,
      TIER_2: `${boostCount}/14 boosts to Tier 3`,
      TIER_3: `${boostCount} total boosts`
    }[boostTier];

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name}'s Server Boosts`)
      .setDescription(boosters.size > 0 
        ? boosters.map(b => `👑 **${b.user.tag}**\n└ Boosting since: ${b.premiumSince?.toLocaleDateString()}`).join('\n\n')
        : '🌟 No boosters found! Be the first to boost this server!')
      .setColor(boostTier === 'TIER_3' ? '#f47fff' : '#ff73fa')
      .addFields([
        { name: 'Current Tier', value: `${boostTier.replace('_', ' ')}`, inline: true },
        { name: 'Total Boosts', value: `${boostCount}`, inline: true },
        { name: 'Progress', value: tierProgress }
      ])
      .setFooter({ text: `Server has ${boosters.size} active booster${boosters.size !== 1 ? 's' : ''}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
