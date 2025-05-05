import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Guild,
  ChannelType,
  Collection,
  GuildMember,
  Role,
  PresenceStatus
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "serverstats",
  description: "Display detailed statistics about the server",
  category: "utility",
  aliases: ["stats", "serverinfo", "guildstats"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    // Get guild from interaction
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Send initial response while gathering stats
    let response;
    if (interaction instanceof CommandInteraction) {
      await interaction.deferReply();
    } else {
      response = await interaction.reply({ content: "📊 Gathering server statistics..." });
    }
    
    try {
      // Fetch members if needed for accurate stats
      if (guild.members.cache.size < guild.memberCount && guild.members.cache.size < 1000) {
        try {
          await guild.members.fetch();
        } catch (error) {
          console.error("Error fetching all members:", error);
          // Continue with cached members if fetch fails
        }
      }
      
      // Generate server statistics
      const statsEmbed = await generateServerStatsEmbed(guild);
      
      // Send the stats
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [statsEmbed] });
      } else if (response) {
        await response.edit({ content: null, embeds: [statsEmbed] });
      }
    } catch (error) {
      const errorMessage = `❌ Error gathering server statistics: ${(error as Error).message || "Unknown error"}`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ content: errorMessage });
      } else if (response) {
        await response.edit({ content: errorMessage });
      }
    }
  }
} as DiscordCommand;

/**
 * Generate a detailed embed with server statistics
 */
async function generateServerStatsEmbed(guild: Guild): Promise<EmbedBuilder> {
  // Get member statistics
  const memberStats = getMemberStats(guild);
  
  // Get channel statistics
  const channelStats = getChannelStats(guild);
  
  // Get emoji statistics
  const emojiStats = getEmojiStats(guild);
  
  // Get role statistics
  const roleStats = getRoleStats(guild);
  
  // Calculate server age
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
  const ageInDays = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`${guild.name} - Server Statistics`)
    .setColor(0x3498DB)
    .setThumbnail(guild.iconURL({ size: 256 }) || null);
  
  // Add general information
  embed.addFields(
    {
      name: "📋 General Information",
      value: [
        `📛 **Name:** ${guild.name}`,
        `🆔 **ID:** ${guild.id}`,
        `👑 **Owner:** ${(await guild.fetchOwner()).user.tag}`,
        `📆 **Created:** <t:${createdTimestamp}:D> (<t:${createdTimestamp}:R>)`,
        `🗓️ **Age:** ${ageInDays} days`,
        `🌐 **Region:** ${guild.preferredLocale}`,
        guild.description ? `📝 **Description:** ${guild.description}` : null,
      ].filter(Boolean).join('\n'),
      inline: false
    }
  );
  
  // Add member statistics
  embed.addFields(
    {
      name: "👥 Member Statistics",
      value: [
        `👤 **Total Members:** ${guild.memberCount}`,
        `🧑 **Humans:** ${memberStats.humans}`,
        `🤖 **Bots:** ${memberStats.bots}`,
        `🟢 **Online:** ${memberStats.online}`,
        `🌙 **Idle:** ${memberStats.idle}`,
        `⛔ **Do Not Disturb:** ${memberStats.dnd}`,
        `⚫ **Offline:** ${memberStats.offline}`,
        `🎭 **Members with Roles:** ${memberStats.withRoles}`,
      ].join('\n'),
      inline: true
    }
  );
  
  // Add channel statistics
  embed.addFields(
    {
      name: "📊 Channel Statistics",
      value: [
        `📁 **Total Channels:** ${channelStats.total}`,
        `📝 **Text Channels:** ${channelStats.text}`,
        `🔊 **Voice Channels:** ${channelStats.voice}`,
        `🧵 **Threads:** ${channelStats.threads}`,
        `📢 **Announcement Channels:** ${channelStats.announcement}`,
        `📁 **Categories:** ${channelStats.category}`,
        `🎭 **Stage Channels:** ${channelStats.stage}`,
        `💬 **Forum Channels:** ${channelStats.forum}`,
      ].join('\n'),
      inline: true
    }
  );
  
  // Add role and emoji statistics
  embed.addFields(
    {
      name: "✨ Other Statistics",
      value: [
        `🎭 **Roles:** ${roleStats.total}`,
        roleStats.highestRole ? `👑 **Highest Role:** ${roleStats.highestRole}` : null,
        `🎨 **Color Roles:** ${roleStats.colorRoles}`,
        `🤝 **Managed Roles:** ${roleStats.managedRoles}`,
        `😀 **Emojis:** ${emojiStats.total}/${emojiStats.maxEmojis}`,
        `🔄 **Animated Emojis:** ${emojiStats.animated}`,
        `🔤 **Static Emojis:** ${emojiStats.static}`,
      ].filter(Boolean).join('\n'),
      inline: true
    }
  );
  
  // Add boost information if available
  if (guild.premiumSubscriptionCount > 0) {
    embed.addFields(
      {
        name: "🚀 Server Boost Status",
        value: [
          `📊 **Level:** ${guild.premiumTier}`,
          `🚀 **Boosts:** ${guild.premiumSubscriptionCount}`,
          `🧑‍🚀 **Boosters:** ${memberStats.boosters}`,
        ].join('\n'),
        inline: false
      }
    );
  }
  
  // Add footer
  embed.setFooter({ text: `Requested at ${new Date().toLocaleString()}` })
    .setTimestamp();
  
  return embed;
}

/**
 * Calculate member statistics for the guild
 */
function getMemberStats(guild: Guild) {
  const members = guild.members.cache;
  
  // Count humans and bots
  const humans = members.filter(member => !member.user.bot).size;
  const bots = members.filter(member => member.user.bot).size;
  
  // Count online statuses
  const online = members.filter(member => member.presence?.status === 'online').size;
  const idle = members.filter(member => member.presence?.status === 'idle').size;
  const dnd = members.filter(member => member.presence?.status === 'dnd').size;
  const offline = members.filter(member => !member.presence || member.presence.status === 'offline').size;
  
  // Count members with roles (excluding @everyone)
  const withRoles = members.filter(member => member.roles.cache.size > 1).size;
  
  // Count boosters
  const boosters = members.filter(member => Boolean(member.premiumSince)).size;
  
  return {
    total: guild.memberCount,
    humans,
    bots,
    online,
    idle,
    dnd,
    offline,
    withRoles,
    boosters
  };
}

/**
 * Calculate channel statistics for the guild
 */
function getChannelStats(guild: Guild) {
  const channels = guild.channels.cache;
  
  // Count different channel types
  const text = channels.filter(channel => channel.type === ChannelType.GuildText).size;
  const voice = channels.filter(channel => channel.type === ChannelType.GuildVoice).size;
  const category = channels.filter(channel => channel.type === ChannelType.GuildCategory).size;
  const announcement = channels.filter(channel => channel.type === ChannelType.GuildAnnouncement).size;
  const stage = channels.filter(channel => channel.type === ChannelType.GuildStageVoice).size;
  const threads = channels.filter(channel => 
    channel.type === ChannelType.PublicThread || 
    channel.type === ChannelType.PrivateThread || 
    channel.type === ChannelType.AnnouncementThread
  ).size;
  const forum = channels.filter(channel => channel.type === ChannelType.GuildForum).size;
  
  return {
    total: channels.size,
    text,
    voice,
    category,
    announcement,
    stage,
    threads,
    forum
  };
}

/**
 * Calculate emoji statistics for the guild
 */
function getEmojiStats(guild: Guild) {
  const emojis = guild.emojis.cache;
  
  // Count animated and static emojis
  const animated = emojis.filter(emoji => emoji.animated).size;
  const staticEmojis = emojis.filter(emoji => !emoji.animated).size;
  
  // Calculate max emojis based on boost tier
  let maxEmojis = 50;
  switch (guild.premiumTier) {
    case 1:
      maxEmojis = 100;
      break;
    case 2:
      maxEmojis = 150;
      break;
    case 3:
      maxEmojis = 250;
      break;
  }
  
  return {
    total: emojis.size,
    animated,
    static: staticEmojis,
    maxEmojis
  };
}

/**
 * Calculate role statistics for the guild
 */
function getRoleStats(guild: Guild) {
  const roles = guild.roles.cache;
  
  // Count color roles (roles with non-default colors)
  const colorRoles = roles.filter(role => role.color !== 0).size;
  
  // Count managed roles (roles managed by integrations)
  const managedRoles = roles.filter(role => role.managed).size;
  
  // Get highest role (excluding @everyone and managed roles)
  const highestRole = roles
    .filter(role => role.id !== guild.id && !role.managed)
    .sort((a, b) => b.position - a.position)
    .first();
  
  return {
    total: roles.size - 1, // Exclude @everyone
    colorRoles,
    managedRoles,
    highestRole: highestRole ? highestRole.name : null
  };
}