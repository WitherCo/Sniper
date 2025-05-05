import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Guild,
  ChannelType,
  GuildVerificationLevel,
  GuildExplicitContentFilter,
  GuildPremiumTier
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "serverinfo",
  description: "Display information about the current server",
  category: "information",
  aliases: ["server", "guildinfo", "guild"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    // Check if we have a guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    try {
      // Fetch full guild data
      const fullGuild = await guild.fetch();
      
      // Create embed with server info
      const embed = await createServerInfoEmbed(fullGuild);
      
      // Reply with server info
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching server information:", error);
      return interaction.reply({
        content: "❌ An error occurred while fetching server information.",
        ephemeral: true
      });
    }
  }
} as DiscordCommand;

/**
 * Create a detailed embed with server information
 */
async function createServerInfoEmbed(guild: Guild): Promise<EmbedBuilder> {
  // Gather server statistics
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
  const totalMembers = guild.memberCount;
  
  // Fetch more detailed information
  let owner = "Unknown";
  try {
    const ownerUser = await guild.fetchOwner();
    owner = `${ownerUser.user.tag} (${ownerUser.id})`;
  } catch (error) {
    console.error("Error fetching guild owner:", error);
  }
  
  // Count channels by type
  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
  const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
  const forumChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size;
  const announcementChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement).size;
  const stageChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildStageVoice).size;
  const totalChannels = guild.channels.cache.size;
  
  // Count emojis
  const regularEmojis = guild.emojis.cache.filter(e => !e.animated).size;
  const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
  const totalEmojis = guild.emojis.cache.size;
  
  // Count roles (excluding @everyone)
  const totalRoles = guild.roles.cache.size - 1;
  
  // Count boosts
  const boostCount = guild.premiumSubscriptionCount || 0;
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`Server Information: ${guild.name}`)
    .setColor(0x3498DB)
    .setDescription(guild.description || "No description set")
    .setThumbnail(guild.iconURL({ size: 256 }) || "")
    .addFields(
      { name: "ID", value: guild.id, inline: true },
      { name: "Owner", value: owner, inline: true },
      { name: "Created", value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`, inline: false },
      
      // Server details
      { name: "Members", value: `${totalMembers}`, inline: true },
      { name: "Roles", value: `${totalRoles}`, inline: true },
      { name: "Channels", value: `${totalChannels}`, inline: true },
      
      // Channel breakdown
      { 
        name: "Channel Breakdown", 
        value: [
          `📝 Text: ${textChannels}`,
          `🔊 Voice: ${voiceChannels}`,
          `📂 Categories: ${categoryChannels}`,
          `📋 Forums: ${forumChannels}`,
          `📢 Announcements: ${announcementChannels}`,
          `🎭 Stages: ${stageChannels}`
        ].join(' | '), 
        inline: false 
      },
      
      // Emojis
      { 
        name: "Emojis", 
        value: `Total: ${totalEmojis} (${regularEmojis} regular, ${animatedEmojis} animated)`,
        inline: true 
      },
      
      // Server features
      { 
        name: "Features", 
        value: guild.features.length > 0 
          ? guild.features.map(f => `\`${formatFeatureName(f)}\``).join(", ")
          : "None", 
        inline: false 
      }
    );
  
  // Add boosts information if any
  if (boostCount > 0) {
    embed.addFields(
      { 
        name: "Server Boost Status", 
        value: [
          `Level: ${guild.premiumTier}`,
          `Boosts: ${boostCount}`
        ].join(' | '), 
        inline: false 
      }
    );
  }
  
  // Add verification level
  embed.addFields(
    { name: "Verification Level", value: formatVerificationLevel(guild.verificationLevel), inline: true }
  );
  
  // Add explicit content filter
  embed.addFields(
    { name: "Content Filter", value: formatExplicitContentFilter(guild.explicitContentFilter), inline: true }
  );
  
  // Add server banner if exists
  if (guild.bannerURL()) {
    embed.setImage(guild.bannerURL({ size: 512 }) || "");
  }
  
  // Add vanity URL if exists
  if (guild.vanityURLCode) {
    embed.addFields(
      { name: "Vanity URL", value: `discord.gg/${guild.vanityURLCode}`, inline: true }
    );
  }
  
  return embed;
}

/**
 * Format server feature name to be more readable
 */
function formatFeatureName(feature: string): string {
  return feature
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format verification level to be more readable
 */
function formatVerificationLevel(level: GuildVerificationLevel): string {
  switch (level) {
    case GuildVerificationLevel.None:
      return "None - Unrestricted";
    case GuildVerificationLevel.Low:
      return "Low - Must have a verified email";
    case GuildVerificationLevel.Medium:
      return "Medium - Registered for more than 5 minutes";
    case GuildVerificationLevel.High:
      return "High - Member for more than 10 minutes";
    case GuildVerificationLevel.VeryHigh:
      return "Highest - Must have a verified phone number";
    default:
      return "Unknown";
  }
}

/**
 * Format explicit content filter to be more readable
 */
function formatExplicitContentFilter(filter: GuildExplicitContentFilter): string {
  switch (filter) {
    case GuildExplicitContentFilter.Disabled:
      return "Disabled - Media content will not be scanned";
    case GuildExplicitContentFilter.MembersWithoutRoles:
      return "Medium - Scans media from members without roles";
    case GuildExplicitContentFilter.AllMembers:
      return "High - Scans media from all members";
    default:
      return "Unknown";
  }
}