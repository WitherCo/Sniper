import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  PermissionsBitField,
  GuildChannel,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  ChannelType,
  ThreadChannel,
  Collection,
  GuildMember,
  PermissionResolvable
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "channel",
  description: "Get detailed information about a channel",
  category: "information",
  aliases: ["channelinfo", "cinfo"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "channel",
      description: "The channel to get information about",
      type: "CHANNEL",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Determine which channel to show info for
    let channel;
    
    if (interaction instanceof Message) {
      if (!args || args.length === 0) {
        // If no args, use the current channel
        channel = interaction.channel;
      } else {
        // Try to find channel by ID or mention
        const channelArg = args[0].replace(/[<#>]/g, "");
        const foundChannel = guild.channels.cache.get(channelArg);
        
        if (!foundChannel) {
          // Try by name
          const foundByName = guild.channels.cache.find(c => 
            c.name.toLowerCase() === args.join(" ").toLowerCase()
          );
          
          if (!foundByName) {
            return interaction.reply("❌ Channel not found.");
          }
          
          channel = foundByName;
        } else {
          channel = foundChannel;
        }
      }
    } else {
      // For slash commands - not currently used as slash is false
      const requestedChannel = interaction.options?.getChannel("channel");
      channel = requestedChannel || interaction.channel;
    }
    
    if (!channel || channel.isDMBased()) {
      return interaction.reply("❌ Invalid channel.");
    }
    
    const channelInfo = await getChannelInfo(channel as GuildChannel);
    return interaction.reply({ embeds: [channelInfo] });
  }
} as DiscordCommand;

/**
 * Get detailed channel information
 */
async function getChannelInfo(channel: GuildChannel): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle(`Channel Information: #${channel.name}`)
    .setColor(0x3498DB)
    .addFields(
      { name: "ID", value: channel.id, inline: true },
      { name: "Type", value: getChannelTypeString(channel.type), inline: true },
      { name: "Created", value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true }
    );
  
  // Add category if it exists
  if (channel.parent) {
    embed.addFields({ name: "Category", value: channel.parent.name, inline: true });
  }
  
  // Add type-specific info
  if (channel.type === ChannelType.GuildText) {
    const textChannel = channel as TextChannel;
    
    embed.addFields(
      { name: "Topic", value: textChannel.topic || "No topic set", inline: false },
      { name: "NSFW", value: textChannel.nsfw ? "Yes" : "No", inline: true },
      { name: "Rate Limit", value: textChannel.rateLimitPerUser > 0 ? 
          `${textChannel.rateLimitPerUser} seconds` : "No slowmode", inline: true }
    );
    
    // Add thread count if available
    const threads = await textChannel.threads.fetchActive();
    if (threads.threads.size > 0) {
      embed.addFields({ name: "Active Threads", value: threads.threads.size.toString(), inline: true });
    }
  } 
  else if (channel.type === ChannelType.GuildVoice) {
    const voiceChannel = channel as VoiceChannel;
    
    embed.addFields(
      { name: "Bitrate", value: `${voiceChannel.bitrate / 1000} kbps`, inline: true },
      { name: "User Limit", value: voiceChannel.userLimit > 0 ? 
          voiceChannel.userLimit.toString() : "No limit", inline: true },
      { name: "Current Users", value: voiceChannel.members.size.toString(), inline: true }
    );
  } 
  else if (channel.type === ChannelType.GuildCategory) {
    const categoryChannel = channel as CategoryChannel;
    const children = categoryChannel.children.cache;
    
    const textCount = children.filter(c => c.type === ChannelType.GuildText).size;
    const voiceCount = children.filter(c => c.type === ChannelType.GuildVoice).size;
    const otherCount = children.size - textCount - voiceCount;
    
    embed.addFields(
      { name: "Child Channels", value: children.size.toString(), inline: true },
      { name: "Text Channels", value: textCount.toString(), inline: true },
      { name: "Voice Channels", value: voiceCount.toString(), inline: true }
    );
    
    if (otherCount > 0) {
      embed.addFields({ name: "Other Channels", value: otherCount.toString(), inline: true });
    }
  }
  else if (channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia) {
    // For forum or media channels
    embed.addFields({ name: "Posts", value: "Forum/Media channel", inline: true });
  }
  else if (channel.isThread()) {
    const threadChannel = channel as ThreadChannel;
    
    embed.addFields(
      { name: "Owner", value: threadChannel.ownerId ? `<@${threadChannel.ownerId}>` : "Unknown", inline: true },
      { name: "Message Count", value: threadChannel.messageCount?.toString() || "Unknown", inline: true },
      { name: "Member Count", value: threadChannel.memberCount?.toString() || "Unknown", inline: true },
      { name: "Archived", value: threadChannel.archived ? "Yes" : "No", inline: true },
      { name: "Locked", value: threadChannel.locked ? "Yes" : "No", inline: true }
    );
    
    if (threadChannel.autoArchiveDuration) {
      embed.addFields({ 
        name: "Auto Archive", 
        value: `${threadChannel.autoArchiveDuration} minutes`, 
        inline: true 
      });
    }
  }
  
  // Add key permissions info
  embed.addFields({
    name: "Key Permissions",
    value: getPermissionsSummary(channel),
    inline: false
  });
  
  return embed;
}

/**
 * Get a human-readable channel type
 */
function getChannelTypeString(type: number): string {
  switch (type) {
    case ChannelType.GuildText:
      return "Text Channel";
    case ChannelType.GuildVoice:
      return "Voice Channel";
    case ChannelType.GuildCategory:
      return "Category";
    case ChannelType.GuildNews:
      return "Announcement Channel";
    case ChannelType.GuildNewsThread:
      return "Announcement Thread";
    case ChannelType.GuildPublicThread:
      return "Public Thread";
    case ChannelType.GuildPrivateThread:
      return "Private Thread";
    case ChannelType.GuildStageVoice:
      return "Stage Channel";
    case ChannelType.GuildForum:
      return "Forum Channel";
    case ChannelType.GuildMedia:
      return "Media Channel";
    default:
      return "Unknown Channel Type";
  }
}

/**
 * Get permissions summary for the channel
 */
function getPermissionsSummary(channel: GuildChannel): string {
  const guild = channel.guild;
  const everyone = guild.roles.everyone;
  
  const everyonePerms = channel.permissionsFor(everyone);
  if (!everyonePerms) return "Could not determine permissions";
  
  const canView = everyonePerms.has(PermissionsBitField.Flags.ViewChannel);
  const canSend = everyonePerms.has(PermissionsBitField.Flags.SendMessages);
  const canReact = everyonePerms.has(PermissionsBitField.Flags.AddReactions);
  const canAttach = everyonePerms.has(PermissionsBitField.Flags.AttachFiles);
  const canEmbed = everyonePerms.has(PermissionsBitField.Flags.EmbedLinks);
  const canInvite = everyonePerms.has(PermissionsBitField.Flags.CreateInstantInvite);
  
  const perms = [];
  perms.push(`Everyone can view: ${canView ? '✅' : '❌'}`);
  
  if (channel.type === ChannelType.GuildText) {
    perms.push(`Everyone can send messages: ${canSend ? '✅' : '❌'}`);
    perms.push(`Everyone can add reactions: ${canReact ? '✅' : '❌'}`);
    perms.push(`Everyone can attach files: ${canAttach ? '✅' : '❌'}`);
    perms.push(`Everyone can embed links: ${canEmbed ? '✅' : '❌'}`);
  }
  
  perms.push(`Everyone can create invites: ${canInvite ? '✅' : '❌'}`);
  
  // List roles with special permissions
  const rolesWithViewOverrides = channel.permissionOverwrites.cache
    .filter(override => 
      override.type === 0 && // Role type
      override.id !== everyone.id && // Not @everyone
      (override.allow.has(PermissionsBitField.Flags.ViewChannel) || 
       override.deny.has(PermissionsBitField.Flags.ViewChannel))
    );
  
  if (rolesWithViewOverrides.size > 0) {
    const rolesList = rolesWithViewOverrides.map(override => {
      const role = guild.roles.cache.get(override.id);
      if (!role) return null;
      
      const canView = override.allow.has(PermissionsBitField.Flags.ViewChannel);
      const cannotView = override.deny.has(PermissionsBitField.Flags.ViewChannel);
      
      if (canView) {
        return `${role.name}: Can view ✅`;
      } else if (cannotView) {
        return `${role.name}: Cannot view ❌`;
      }
      return null;
    }).filter(Boolean);
    
    if (rolesList.length > 0) {
      perms.push("\nRole overrides:");
      perms.push(...rolesList);
    }
  }
  
  return perms.join("\n");
}