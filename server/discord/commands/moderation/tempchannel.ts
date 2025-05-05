import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  VoiceChannel,
  Guild,
  GuildMember,
  Role,
  Collection
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Map to track temporary channels
// Key: channel ID, Value: { guildId, creatorId, expiresAt, timeout }
interface TempChannelData {
  guildId: string;
  creatorId: string;
  expiresAt: number;
  timeout: NodeJS.Timeout;
}

const temporaryChannels = new Map<string, TempChannelData>();

export default {
  name: "tempchannel",
  description: "Create a temporary channel that will be deleted after a specified time",
  category: "moderation",
  aliases: ["tempc", "createtemp"],
  slash: true,
  prefix: true,
  cooldown: 30,
  permissions: ["ManageChannels"],
  options: [
    {
      name: "name",
      description: "Name for the temporary channel",
      type: "STRING",
      required: true
    },
    {
      name: "type",
      description: "Type of channel to create",
      type: "STRING",
      required: true,
      choices: [
        { name: "Text Channel", value: "text" },
        { name: "Voice Channel", value: "voice" }
      ]
    },
    {
      name: "duration",
      description: "How long the channel should exist (e.g. 1h, 30m, 24h)",
      type: "STRING",
      required: true
    },
    {
      name: "category",
      description: "Category to place the channel in (category ID)",
      type: "STRING",
      required: false
    },
    {
      name: "private",
      description: "Make the channel private (only visible to specified roles)",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "roles",
      description: "Comma-separated list of role IDs that can access private channel",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let name = "";
    let type = "text";
    let durationStr = "1h";
    let categoryId = "";
    let isPrivate = false;
    let rolesString = "";
    
    if (interaction instanceof CommandInteraction) {
      // Get options from slash command
      name = interaction.options.getString("name") || "temp-channel";
      type = interaction.options.getString("type") || "text";
      durationStr = interaction.options.getString("duration") || "1h";
      categoryId = interaction.options.getString("category") || "";
      isPrivate = interaction.options.getBoolean("private") || false;
      rolesString = interaction.options.getString("roles") || "";
    } else {
      // Parse message command arguments
      if (!args || args.length < 3) {
        return interaction.reply({
          content: "❌ Please provide the required arguments: `!tempchannel <name> <text|voice> <duration> [categoryID] [--private] [--roles=role1,role2]`",
          ephemeral: true
        });
      }
      
      // First argument is name
      name = args[0];
      
      // Second argument is type
      if (["text", "voice"].includes(args[1].toLowerCase())) {
        type = args[1].toLowerCase();
      } else {
        return interaction.reply({
          content: "❌ Channel type must be either 'text' or 'voice'.",
          ephemeral: true
        });
      }
      
      // Third argument is duration
      durationStr = args[2];
      
      // Parse remaining optional arguments
      for (let i = 3; i < args.length; i++) {
        const arg = args[i];
        
        if (/^\d{17,19}$/.test(arg)) {
          // If it's a snowflake ID, treat as category ID
          categoryId = arg;
        } else if (arg === "--private") {
          isPrivate = true;
        } else if (arg.startsWith("--roles=")) {
          rolesString = arg.substring(8);
        }
      }
    }
    
    // Get guild object
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Parse duration string
    const duration = parseDuration(durationStr);
    if (duration <= 0) {
      return interaction.reply({
        content: "❌ Invalid duration format. Please use a format like '30m', '1h', '1d', etc.",
        ephemeral: true
      });
    }
    
    // Check if duration is within limits (5 minutes to 7 days)
    if (duration < 5 * 60 * 1000 || duration > 7 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: "❌ Duration must be between 5 minutes and 7 days.",
        ephemeral: true
      });
    }
    
    // Parse roles for private channel
    const roles: Role[] = [];
    if (isPrivate && rolesString) {
      const roleIds = rolesString.split(",").map(id => id.trim());
      for (const roleId of roleIds) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          roles.push(role);
        }
      }
    }
    
    try {
      // Get creator member
      const creator = interaction instanceof Message ? 
        interaction.member as GuildMember : 
        interaction.member as GuildMember;
      
      // Defer reply
      let response;
      if (interaction instanceof CommandInteraction) {
        await interaction.deferReply();
      } else {
        response = await interaction.reply({ content: "🔄 Creating temporary channel..." });
      }
      
      // Create the channel
      const channel = await createTemporaryChannel(
        guild,
        name,
        type as "text" | "voice",
        duration,
        creator,
        categoryId,
        isPrivate,
        roles
      );
      
      // Format expiration time
      const expiresAt = Math.floor((Date.now() + duration) / 1000);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle("✅ Temporary Channel Created")
        .setColor(0x2ECC71)
        .setDescription(`Successfully created a temporary ${type} channel: ${channel}`)
        .addFields(
          { name: "Expires", value: `<t:${expiresAt}:R>`, inline: true },
          { name: "Type", value: type === "text" ? "Text Channel" : "Voice Channel", inline: true },
          { name: "Access", value: isPrivate ? "Private" : "Public", inline: true }
        )
        .setFooter({ text: `Created by ${creator.user.tag}` })
        .setTimestamp();
      
      // Send confirmation
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [embed] });
      } else if (response) {
        await response.edit({ content: null, embeds: [embed] });
      }
      
      return;
    } catch (error) {
      const errorMessage = `❌ Error creating temporary channel: ${(error as Error).message}`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage });
      }
    }
  }
} as DiscordCommand;

/**
 * Convert duration string to milliseconds
 */
function parseDuration(durationStr: string): number {
  let totalMs = 0;
  
  // Regular expression to match time components
  const regex = /(\d+)([mhd])/g;
  let match;
  
  while ((match = regex.exec(durationStr)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'm': // Minutes
        totalMs += value * 60 * 1000;
        break;
      case 'h': // Hours
        totalMs += value * 60 * 60 * 1000;
        break;
      case 'd': // Days
        totalMs += value * 24 * 60 * 60 * 1000;
        break;
    }
  }
  
  return totalMs;
}

/**
 * Create a temporary channel that will be deleted after the specified duration
 */
async function createTemporaryChannel(
  guild: Guild,
  name: string,
  type: "text" | "voice",
  duration: number,
  creator: GuildMember,
  categoryId?: string,
  isPrivate: boolean = false,
  roles: Role[] = []
): Promise<TextChannel | VoiceChannel> {
  // Set channel type
  const channelType = type === "text" ? ChannelType.GuildText : ChannelType.GuildVoice;
  
  // Set up permission overwrites for private channels
  const permissionOverwrites = [];
  
  if (isPrivate) {
    // First, deny access to @everyone
    permissionOverwrites.push({
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel]
    });
    
    // Allow access to specified roles
    for (const role of roles) {
      permissionOverwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel]
      });
    }
    
    // Allow access to the creator
    permissionOverwrites.push({
      id: creator.id,
      allow: [PermissionFlagsBits.ViewChannel]
    });
    
    // Add bot permissions
    permissionOverwrites.push({
      id: guild.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles
      ]
    });
  }
  
  // Create channel options
  const channelOptions: any = {
    type: channelType,
    name: name,
    reason: `Temporary channel created by ${creator.user.tag}`,
    permissionOverwrites: isPrivate ? permissionOverwrites : []
  };
  
  // Add to category if specified
  if (categoryId) {
    const category = guild.channels.cache.get(categoryId);
    if (category && category.type === ChannelType.GuildCategory) {
      channelOptions.parent = categoryId;
    }
  }
  
  // Create the channel
  const channel = await guild.channels.create(channelOptions);
  
  // Send initial message in text channels
  if (type === "text") {
    const textChannel = channel as TextChannel;
    await textChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("⏱️ Temporary Channel")
          .setColor(0x3498DB)
          .setDescription(`This is a temporary channel that will be deleted <t:${Math.floor((Date.now() + duration) / 1000)}:R>.`)
          .setFooter({ text: `Created by ${creator.user.tag}` })
      ]
    });
  }
  
  // Set up timeout to delete the channel
  const timeout = setTimeout(async () => {
    try {
      // Check if channel still exists
      const fetchedChannel = await guild.channels.fetch(channel.id).catch(() => null);
      if (fetchedChannel) {
        await fetchedChannel.delete(`Temporary channel expired after ${formatDuration(duration)}`);
      }
      
      // Remove from tracking
      temporaryChannels.delete(channel.id);
    } catch (error) {
      console.error(`Error deleting temporary channel ${channel.id}:`, error);
    }
  }, duration);
  
  // Store channel in tracking map
  temporaryChannels.set(channel.id, {
    guildId: guild.id,
    creatorId: creator.id,
    expiresAt: Date.now() + duration,
    timeout
  });
  
  return channel;
}

/**
 * Format duration in milliseconds to human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}

// Command to list temporary channels
export const list = {
  name: "tempchannels",
  description: "List all temporary channels in the server",
  category: "moderation",
  aliases: ["tempclist", "listtempc"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: ["ManageChannels"],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    // Get guild object
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Filter temporary channels for this guild
    const guildTempChannels = Array.from(temporaryChannels.entries())
      .filter(([_, data]) => data.guildId === guild.id);
    
    if (guildTempChannels.length === 0) {
      return interaction.reply({
        content: "ℹ️ There are no temporary channels active in this server.",
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("⏱️ Temporary Channels")
      .setColor(0x3498DB)
      .setDescription(`This server has ${guildTempChannels.length} active temporary channel(s).`)
      .setTimestamp();
    
    // Add each channel to the embed
    for (const [channelId, data] of guildTempChannels) {
      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        const timeRemaining = Math.max(0, data.expiresAt - Date.now());
        const formattedTime = formatDuration(timeRemaining);
        const creatorMention = `<@${data.creatorId}>`;
        
        embed.addFields({
          name: `#${channel.name}`,
          value: `Type: ${channel.type === ChannelType.GuildText ? "Text" : "Voice"}\nExpires: <t:${Math.floor(data.expiresAt / 1000)}:R>\nCreated by: ${creatorMention}`,
          inline: true
        });
      }
    }
    
    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;

// Command to delete a temporary channel early
export const del = {
  name: "deltempch",
  description: "Delete a temporary channel before its expiration",
  category: "moderation",
  aliases: ["deltempc", "removetemp"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: ["ManageChannels"],
  options: [
    {
      name: "channel",
      description: "The temporary channel to delete",
      type: "CHANNEL",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let targetChannelId = "";
    
    if (interaction instanceof CommandInteraction) {
      const channel = interaction.options.getChannel("channel");
      if (channel) targetChannelId = channel.id;
    } else {
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please specify a channel ID or mention.",
          ephemeral: true
        });
      }
      
      // Parse channel ID from mention or raw ID
      targetChannelId = args[0].replace(/[<#>]/g, '');
    }
    
    // Get guild object
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Check if channel is temporary
    if (!temporaryChannels.has(targetChannelId)) {
      return interaction.reply({
        content: "❌ That is not a temporary channel or it does not exist.",
        ephemeral: true
      });
    }
    
    try {
      // Get channel data
      const channelData = temporaryChannels.get(targetChannelId)!;
      
      // Clear timeout
      clearTimeout(channelData.timeout);
      
      // Delete the channel
      const channel = await guild.channels.fetch(targetChannelId);
      if (channel) {
        await channel.delete(`Temporary channel deleted early by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`);
      }
      
      // Remove from tracking
      temporaryChannels.delete(targetChannelId);
      
      return interaction.reply({
        content: "✅ Temporary channel deleted successfully.",
        ephemeral: true
      });
    } catch (error) {
      return interaction.reply({
        content: `❌ Error deleting temporary channel: ${(error as Error).message}`,
        ephemeral: true
      });
    }
  }
} as DiscordCommand;

// Command to extend a temporary channel's duration
export const extend = {
  name: "extendtemp",
  description: "Extend the duration of a temporary channel",
  category: "moderation",
  aliases: ["extendc", "tempext"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: ["ManageChannels"],
  options: [
    {
      name: "channel",
      description: "The temporary channel to extend",
      type: "CHANNEL",
      required: true
    },
    {
      name: "duration",
      description: "Additional time to add (e.g. 1h, 30m, 24h)",
      type: "STRING",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let targetChannelId = "";
    let durationStr = "";
    
    if (interaction instanceof CommandInteraction) {
      const channel = interaction.options.getChannel("channel");
      if (channel) targetChannelId = channel.id;
      durationStr = interaction.options.getString("duration") || "1h";
    } else {
      if (!args || args.length < 2) {
        return interaction.reply({
          content: "❌ Please specify a channel ID and duration to extend.",
          ephemeral: true
        });
      }
      
      // Parse channel ID from mention or raw ID
      targetChannelId = args[0].replace(/[<#>]/g, '');
      durationStr = args[1];
    }
    
    // Get guild object
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Check if channel is temporary
    if (!temporaryChannels.has(targetChannelId)) {
      return interaction.reply({
        content: "❌ That is not a temporary channel or it does not exist.",
        ephemeral: true
      });
    }
    
    // Parse duration string
    const additionalDuration = parseDuration(durationStr);
    if (additionalDuration <= 0) {
      return interaction.reply({
        content: "❌ Invalid duration format. Please use a format like '30m', '1h', '1d', etc.",
        ephemeral: true
      });
    }
    
    try {
      // Get channel data
      const channelData = temporaryChannels.get(targetChannelId)!;
      
      // Clear existing timeout
      clearTimeout(channelData.timeout);
      
      // Calculate new expiration time
      const newExpiresAt = channelData.expiresAt + additionalDuration;
      
      // Create new timeout
      const newTimeout = setTimeout(async () => {
        try {
          // Check if channel still exists
          const fetchedChannel = await guild.channels.fetch(targetChannelId).catch(() => null);
          if (fetchedChannel) {
            await fetchedChannel.delete(`Temporary channel expired`);
          }
          
          // Remove from tracking
          temporaryChannels.delete(targetChannelId);
        } catch (error) {
          console.error(`Error deleting temporary channel ${targetChannelId}:`, error);
        }
      }, newExpiresAt - Date.now());
      
      // Update tracking data
      temporaryChannels.set(targetChannelId, {
        ...channelData,
        expiresAt: newExpiresAt,
        timeout: newTimeout
      });
      
      // Get the channel
      const channel = await guild.channels.fetch(targetChannelId);
      
      // Send confirmation message
      const embed = new EmbedBuilder()
        .setTitle("⏱️ Channel Duration Extended")
        .setColor(0x2ECC71)
        .setDescription(`The temporary channel ${channel} has been extended by ${formatDuration(additionalDuration)}.`)
        .addFields({
          name: "New Expiration",
          value: `<t:${Math.floor(newExpiresAt / 1000)}:R>`,
          inline: true
        })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({
        content: `❌ Error extending temporary channel: ${(error as Error).message}`,
        ephemeral: true
      });
    }
  }
} as DiscordCommand;