import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  GuildMember,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  ForumChannel,
  OverwriteResolvable,
  Collection,
  GuildBasedChannel
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";

export default {
  name: "channel",
  description: "Manage server channels (create, delete, info, list)",
  category: "admin",
  aliases: ["channels"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageChannels"],
  options: [
    {
      name: "create",
      description: "Create a new channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "type",
          description: "The type of channel to create",
          type: "STRING",
          required: true,
          choices: [
            { name: "Text", value: "text" },
            { name: "Voice", value: "voice" },
            { name: "Category", value: "category" },
            { name: "Forum", value: "forum" }
          ]
        },
        {
          name: "name",
          description: "The name for the new channel",
          type: "STRING",
          required: true
        },
        {
          name: "category",
          description: "The category to place the channel in (not applicable for category type)",
          type: "CHANNEL",
          required: false
        },
        {
          name: "nsfw",
          description: "Whether the channel should be NSFW (text and forum only)",
          type: "BOOLEAN",
          required: false
        }
      ]
    },
    {
      name: "delete",
      description: "Delete a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "channel",
          description: "The channel to delete",
          type: "CHANNEL",
          required: true
        },
        {
          name: "reason",
          description: "The reason for deleting the channel",
          type: "STRING",
          required: false
        }
      ]
    },
    {
      name: "info",
      description: "Get information about a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "channel",
          description: "The channel to get information about (defaults to current channel)",
          type: "CHANNEL",
          required: false
        }
      ]
    },
    {
      name: "list",
      description: "List all channels in the server or within a category",
      type: "SUB_COMMAND",
      options: [
        {
          name: "category",
          description: "The category to list channels from (defaults to all categories)",
          type: "CHANNEL",
          required: false
        },
        {
          name: "type",
          description: "Filter channels by type",
          type: "STRING",
          required: false,
          choices: [
            { name: "Text", value: "text" },
            { name: "Voice", value: "voice" },
            { name: "Forum", value: "forum" },
            { name: "All", value: "all" }
          ]
        }
      ]
    },
    {
      name: "clone",
      description: "Clone a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "channel",
          description: "The channel to clone (defaults to current channel)",
          type: "CHANNEL",
          required: false
        },
        {
          name: "name",
          description: "New name for the cloned channel (optional)",
          type: "STRING",
          required: false
        }
      ]
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Check if we have a guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Check permissions
    const member = interaction instanceof Message 
      ? interaction.member as GuildMember 
      : interaction.member as GuildMember;
    
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: "❌ You need the Manage Channels permission to use this command.",
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const botMember = guild.members.me;
    if (!botMember) {
      return interaction.reply({
        content: "❌ Could not fetch bot's permissions.",
        ephemeral: true
      });
    }
    
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: "❌ I need the Manage Channels permission to execute this command.",
        ephemeral: true
      });
    }
    
    // Handle command based on interaction type
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'create':
          return handleCreateChannel(interaction);
        case 'delete':
          return handleDeleteChannel(interaction);
        case 'info':
          return handleChannelInfo(interaction);
        case 'list':
          return handleChannelList(interaction);
        case 'clone':
          return handleCloneChannel(interaction);
        default:
          return interaction.reply({
            content: "❌ Unknown subcommand.",
            ephemeral: true
          });
      }
    } else {
      // Handle message command
      if (!args || args.length === 0) {
        return showHelp(interaction);
      }
      
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case 'create':
        case 'new':
          return handleTextCreateChannel(interaction, args.slice(1));
        case 'delete':
        case 'remove':
          return handleTextDeleteChannel(interaction, args.slice(1));
        case 'info':
        case 'information':
          return handleTextChannelInfo(interaction, args.slice(1));
        case 'list':
        case 'all':
          return handleTextChannelList(interaction, args.slice(1));
        case 'clone':
        case 'copy':
          return handleTextCloneChannel(interaction, args.slice(1));
        case 'help':
          return showHelp(interaction);
        default:
          return interaction.reply(`❌ Unknown subcommand. Use \`${config.prefix}channel help\` for usage information.`);
      }
    }
  }
} as DiscordCommand;

// Helper functions

/**
 * Show help information for the command
 */
async function showHelp(interaction: Message) {
  const embed = new EmbedBuilder()
    .setTitle("Channel Command Help")
    .setColor(0x3498DB)
    .setDescription("Manage server channels with the following subcommands:")
    .addFields(
      { name: `${config.prefix}channel create <text|voice|category|forum> <name> [category] [nsfw]`, value: "Create a new channel" },
      { name: `${config.prefix}channel delete <channel> [reason]`, value: "Delete a channel" },
      { name: `${config.prefix}channel info [channel]`, value: "Get information about a channel (defaults to current channel)" },
      { name: `${config.prefix}channel list [category] [text|voice|forum|all]`, value: "List all channels in the server or within a category" },
      { name: `${config.prefix}channel clone [channel] [new-name]`, value: "Clone a channel (defaults to current channel)" }
    );
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Handle creating a new channel (slash command)
 */
async function handleCreateChannel(interaction: CommandInteraction) {
  const type = interaction.options.getString("type");
  const name = interaction.options.getString("name");
  const category = interaction.options.getChannel("category");
  const nsfw = interaction.options.getBoolean("nsfw") ?? false;
  
  if (!type || !name) {
    return interaction.reply({
      content: "❌ Both channel type and name must be specified.",
      ephemeral: true
    });
  }
  
  const guild = interaction.guild;
  if (!guild) return;
  
  // Validate parent category if provided
  let parentId: string | null = null;
  if (category) {
    if (category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: "❌ The specified parent must be a category.",
        ephemeral: true
      });
    }
    parentId = category.id;
  }
  
  // Create the channel
  try {
    let newChannel;
    
    switch (type) {
      case 'text':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildText,
          parent: parentId || undefined,
          nsfw,
          reason: `Created by ${interaction.user.tag} using the channel command`
        });
        break;
      case 'voice':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildVoice,
          parent: parentId || undefined,
          reason: `Created by ${interaction.user.tag} using the channel command`
        });
        break;
      case 'category':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildCategory,
          reason: `Created by ${interaction.user.tag} using the channel command`
        });
        break;
      case 'forum':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildForum,
          parent: parentId || undefined,
          nsfw,
          reason: `Created by ${interaction.user.tag} using the channel command`
        });
        break;
      default:
        return interaction.reply({
          content: "❌ Invalid channel type. Must be 'text', 'voice', 'category', or 'forum'.",
          ephemeral: true
        });
    }
    
    // Format channel type for display
    let channelType = 'Unknown';
    switch (newChannel.type) {
      case ChannelType.GuildText:
        channelType = 'Text';
        break;
      case ChannelType.GuildVoice:
        channelType = 'Voice';
        break;
      case ChannelType.GuildCategory:
        channelType = 'Category';
        break;
      case ChannelType.GuildForum:
        channelType = 'Forum';
        break;
    }
    
    // Send success message
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Channel Created")
          .setDescription(`Successfully created the ${newChannel} channel`)
          .setColor(0x2ECC71)
          .addFields(
            { name: "Name", value: newChannel.name, inline: true },
            { name: "Type", value: channelType, inline: true },
            { name: "ID", value: newChannel.id, inline: true },
            { name: "Category", value: newChannel.parent ? newChannel.parent.name : "None", inline: true },
            { name: "NSFW", value: (newChannel as TextChannel).nsfw ? "Yes" : "No", inline: true }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    return interaction.reply({
      content: `❌ Failed to create channel: ${error}`,
      ephemeral: true
    });
  }
}

/**
 * Handle deleting a channel (slash command)
 */
async function handleDeleteChannel(interaction: CommandInteraction) {
  const channel = interaction.options.getChannel("channel");
  const reason = interaction.options.getString("reason") || `Deleted by ${interaction.user.tag}`;
  
  if (!channel) {
    return interaction.reply({
      content: "❌ Channel must be specified.",
      ephemeral: true
    });
  }
  
  const guild = interaction.guild;
  if (!guild) return;
  
  // Check if the channel is in this guild
  const guildChannel = guild.channels.cache.get(channel.id);
  if (!guildChannel) {
    return interaction.reply({
      content: "❌ The specified channel doesn't exist in this server.",
      ephemeral: true
    });
  }
  
  // Prevent deleting the channel where the command was used
  if (interaction.channelId === channel.id) {
    return interaction.reply({
      content: "❌ You cannot delete the channel you're currently using.",
      ephemeral: true
    });
  }
  
  // Store channel info before deletion
  const channelInfo = {
    name: guildChannel.name,
    type: getChannelTypeName(guildChannel.type),
    id: guildChannel.id,
    parent: guildChannel.parent?.name || "None"
  };
  
  // Delete the channel
  try {
    await guildChannel.delete(reason);
    
    // Send success message
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Channel Deleted")
          .setDescription(`Successfully deleted the **${channelInfo.name}** channel`)
          .setColor(0xE74C3C)
          .addFields(
            { name: "Name", value: channelInfo.name, inline: true },
            { name: "Type", value: channelInfo.type, inline: true },
            { name: "ID", value: channelInfo.id, inline: true },
            { name: "Category", value: channelInfo.parent, inline: true },
            { name: "Reason", value: reason }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return interaction.reply({
      content: `❌ Failed to delete channel: ${error}`,
      ephemeral: true
    });
  }
}

/**
 * Handle getting channel info (slash command)
 */
async function handleChannelInfo(interaction: CommandInteraction) {
  // Get the channel (defaults to current channel)
  const channelOption = interaction.options.getChannel("channel");
  const channelToCheck = channelOption || interaction.channel;
  
  if (!channelToCheck) {
    return interaction.reply({
      content: "❌ Could not find the specified channel.",
      ephemeral: true
    });
  }
  
  const guild = interaction.guild;
  if (!guild) return;
  
  // Verify the channel is in this guild
  const guildChannel = guild.channels.cache.get(channelToCheck.id);
  if (!guildChannel) {
    return interaction.reply({
      content: "❌ The specified channel doesn't exist in this server.",
      ephemeral: true
    });
  }
  
  // Get channel information
  try {
    // Get basic information
    const channelType = getChannelTypeName(guildChannel.type);
    const createdTimestamp = Math.floor(guildChannel.createdTimestamp / 1000);
    
    // Create base embed
    const embed = new EmbedBuilder()
      .setTitle(`Channel Information: ${guildChannel.name}`)
      .setColor(0x3498DB)
      .addFields(
        { name: "ID", value: guildChannel.id, inline: true },
        { name: "Type", value: channelType, inline: true },
        { name: "Category", value: guildChannel.parent?.name || "None", inline: true },
        { name: "Created", value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)` },
        { name: "Position", value: `${guildChannel.position}`, inline: true }
      );
    
    // Add type-specific information
    if (guildChannel.type === ChannelType.GuildText || guildChannel.type === ChannelType.GuildForum) {
      const textChannel = guildChannel as TextChannel | ForumChannel;
      
      embed.addFields(
        { name: "NSFW", value: 'nsfw' in textChannel ? (textChannel.nsfw ? "Yes" : "No") : "No", inline: true },
        { name: "Topic", value: 'topic' in textChannel && textChannel.topic ? textChannel.topic : "None", inline: false }
      );
      
      if (guildChannel.type === ChannelType.GuildText) {
        embed.addFields(
          { name: "Slowmode", value: `${(guildChannel as TextChannel).rateLimitPerUser || 0} seconds`, inline: true }
        );
      }
    } else if (guildChannel.type === ChannelType.GuildVoice) {
      const voiceChannel = guildChannel as VoiceChannel;
      
      embed.addFields(
        { name: "Bitrate", value: `${voiceChannel.bitrate / 1000} kbps`, inline: true },
        { name: "User Limit", value: voiceChannel.userLimit > 0 ? `${voiceChannel.userLimit}` : "Unlimited", inline: true }
      );
    } else if (guildChannel.type === ChannelType.GuildCategory) {
      const categoryChannel = guildChannel as CategoryChannel;
      const childChannels = categoryChannel.children.cache;
      
      const textCount = childChannels.filter(c => c.type === ChannelType.GuildText).size;
      const voiceCount = childChannels.filter(c => c.type === ChannelType.GuildVoice).size;
      const forumCount = childChannels.filter(c => c.type === ChannelType.GuildForum).size;
      
      embed.addFields(
        { name: "Channels", value: `${childChannels.size} total (${textCount} text, ${voiceCount} voice, ${forumCount} forum)`, inline: true }
      );
    }
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error getting channel info:", error);
    return interaction.reply({
      content: `❌ Failed to get channel information: ${error}`,
      ephemeral: true
    });
  }
}

/**
 * Handle listing channels (slash command)
 */
async function handleChannelList(interaction: CommandInteraction) {
  const categoryOption = interaction.options.getChannel("category");
  const typeOption = interaction.options.getString("type") || "all";
  
  const guild = interaction.guild;
  if (!guild) return;
  
  try {
    let channels: Collection<string, GuildBasedChannel>;
    
    // Filter by category if specified
    if (categoryOption) {
      if (categoryOption.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content: "❌ The specified category must be a category channel.",
          ephemeral: true
        });
      }
      
      const category = categoryOption as CategoryChannel;
      channels = category.children.cache;
    } else {
      // Get all channels
      channels = guild.channels.cache;
    }
    
    // Filter by type if specified
    if (typeOption !== "all") {
      switch (typeOption) {
        case 'text':
          channels = channels.filter(c => c.type === ChannelType.GuildText);
          break;
        case 'voice':
          channels = channels.filter(c => c.type === ChannelType.GuildVoice);
          break;
        case 'forum':
          channels = channels.filter(c => c.type === ChannelType.GuildForum);
          break;
      }
    }
    
    // Sort channels by type and position
    const sorted = [...channels.values()].sort((a, b) => {
      // Categories first, then text/forum channels, then voice channels
      if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return -1;
      if (a.type !== ChannelType.GuildCategory && b.type === ChannelType.GuildCategory) return 1;
      
      // Sort by position within each type
      return a.position - b.position;
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Channels in ${categoryOption ? `${categoryOption.name}` : guild.name}`)
      .setColor(0x3498DB)
      .setDescription(`Showing ${sorted.length} channels ${typeOption !== "all" ? `of type ${typeOption}` : ""}`)
      .setTimestamp();
    
    // Group channels by category for better display
    const categories = new Map<string, GuildBasedChannel[]>();
    categories.set("No Category", []);
    
    for (const channel of sorted) {
      if (channel.type === ChannelType.GuildCategory) {
        categories.set(channel.id, []);
      } else {
        const categoryId = channel.parentId || "No Category";
        const categoryChannels = categories.get(categoryId) || [];
        categoryChannels.push(channel);
        categories.set(categoryId, categoryChannels);
      }
    }
    
    // Add fields for each category
    for (const [categoryId, categoryChannels] of categories.entries()) {
      if (categoryId === "No Category" && categoryChannels.length === 0) {
        continue; // Skip empty "No Category" section
      }
      
      let categoryName = "No Category";
      if (categoryId !== "No Category") {
        const category = guild.channels.cache.get(categoryId);
        if (category) {
          categoryName = category.name;
        }
      }
      
      if (categoryChannels.length > 0 || categoryId !== "No Category") {
        // Add category name as field title
        let channelList = "";
        
        // First add the category itself if it's in our sorted list
        if (categoryId !== "No Category") {
          const category = sorted.find(c => c.id === categoryId);
          if (category) {
            channelList += `📁 **${category.name}** (${getChannelTypeName(category.type)})\n`;
          }
        }
        
        // Then add all channels in this category
        for (const channel of categoryChannels) {
          const icon = channel.type === ChannelType.GuildText ? "💬" :
                      channel.type === ChannelType.GuildVoice ? "🔊" :
                      channel.type === ChannelType.GuildForum ? "📋" : "🔷";
          
          channelList += `${icon} ${channel} (${getChannelTypeName(channel.type)})\n`;
        }
        
        embed.addFields({
          name: categoryName,
          value: channelList || "No channels"
        });
      }
    }
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error listing channels:", error);
    return interaction.reply({
      content: `❌ Failed to list channels: ${error}`,
      ephemeral: true
    });
  }
}

/**
 * Handle cloning a channel (slash command)
 */
async function handleCloneChannel(interaction: CommandInteraction) {
  const channelOption = interaction.options.getChannel("channel");
  const nameOption = interaction.options.getString("name");
  
  // Default to current channel if none specified
  const channelToClone = channelOption || interaction.channel;
  
  if (!channelToClone) {
    return interaction.reply({
      content: "❌ Could not find the specified channel.",
      ephemeral: true
    });
  }
  
  const guild = interaction.guild;
  if (!guild) return;
  
  // Verify the channel is in this guild
  const guildChannel = guild.channels.cache.get(channelToClone.id);
  if (!guildChannel) {
    return interaction.reply({
      content: "❌ The specified channel doesn't exist in this server.",
      ephemeral: true
    });
  }
  
  try {
    // Clone the channel
    const clonedChannel = await guildChannel.clone({
      name: nameOption || `${guildChannel.name}-clone`,
      reason: `Cloned by ${interaction.user.tag} using the channel command`
    });
    
    // Send success message
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Channel Cloned")
          .setDescription(`Successfully cloned ${guildChannel} to ${clonedChannel}`)
          .setColor(0x2ECC71)
          .addFields(
            { name: "Original", value: guildChannel.name, inline: true },
            { name: "Clone", value: clonedChannel.name, inline: true },
            { name: "Type", value: getChannelTypeName(clonedChannel.type), inline: true },
            { name: "Category", value: clonedChannel.parent?.name || "None", inline: true }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error("Error cloning channel:", error);
    return interaction.reply({
      content: `❌ Failed to clone channel: ${error}`,
      ephemeral: true
    });
  }
}

/**
 * Handle text-based create channel command
 */
async function handleTextCreateChannel(interaction: Message, args: string[]) {
  if (args.length < 2) {
    return interaction.reply(`❌ Usage: ${config.prefix}channel create <text|voice|category|forum> <name> [category] [nsfw]`);
  }
  
  const guild = interaction.guild;
  if (!guild) return;
  
  const type = args[0].toLowerCase();
  const name = args[1];
  
  // Parse optional arguments
  let categoryName = "";
  let nsfw = false;
  
  for (let i = 2; i < args.length; i++) {
    const arg = args[i].toLowerCase();
    
    if (arg === "nsfw") {
      nsfw = true;
    } else if (!categoryName && arg !== "nsfw") {
      // Assume it's the category name
      categoryName = arg;
    }
  }
  
  // Find the category if specified
  let parentId: string | undefined;
  if (categoryName) {
    const category = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildCategory && 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (category) {
      parentId = category.id;
    } else {
      return interaction.reply(`❌ Could not find a category named "${categoryName}".`);
    }
  }
  
  // Create the channel
  try {
    let newChannel;
    
    switch (type) {
      case 'text':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildText,
          parent: parentId,
          nsfw,
          reason: `Created by ${interaction.author.tag} using the channel command`
        });
        break;
      case 'voice':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildVoice,
          parent: parentId,
          reason: `Created by ${interaction.author.tag} using the channel command`
        });
        break;
      case 'category':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildCategory,
          reason: `Created by ${interaction.author.tag} using the channel command`
        });
        break;
      case 'forum':
        newChannel = await guild.channels.create({
          name,
          type: ChannelType.GuildForum,
          parent: parentId,
          nsfw,
          reason: `Created by ${interaction.author.tag} using the channel command`
        });
        break;
      default:
        return interaction.reply("❌ Invalid channel type. Must be 'text', 'voice', 'category', or 'forum'.");
    }
    
    // Format channel type for display
    let channelType = 'Unknown';
    switch (newChannel.type) {
      case ChannelType.GuildText:
        channelType = 'Text';
        break;
      case ChannelType.GuildVoice:
        channelType = 'Voice';
        break;
      case ChannelType.GuildCategory:
        channelType = 'Category';
        break;
      case ChannelType.GuildForum:
        channelType = 'Forum';
        break;
    }
    
    // Send success message
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Channel Created")
          .setDescription(`Successfully created the ${newChannel} channel`)
          .setColor(0x2ECC71)
          .addFields(
            { name: "Name", value: newChannel.name, inline: true },
            { name: "Type", value: channelType, inline: true },
            { name: "ID", value: newChannel.id, inline: true },
            { name: "Category", value: newChannel.parent ? newChannel.parent.name : "None", inline: true },
            { name: "NSFW", value: (newChannel as TextChannel).nsfw ? "Yes" : "No", inline: true }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    return interaction.reply(`❌ Failed to create channel: ${error}`);
  }
}

/**
 * Handle text-based delete channel command
 */
async function handleTextDeleteChannel(interaction: Message, args: string[]) {
  if (args.length < 1) {
    return interaction.reply(`❌ Usage: ${config.prefix}channel delete <channel> [reason]`);
  }
  
  const guild = interaction.guild;
  if (!guild) return;
  
  // Parse channel
  const channelArg = args[0];
  let channel: GuildBasedChannel | null = null;
  
  // Check if it's a mention
  const channelMentionMatch = channelArg.match(/^<#(\d+)>$/);
  if (channelMentionMatch) {
    const channelId = channelMentionMatch[1];
    channel = guild.channels.cache.get(channelId) || null;
  } 
  // Check if it's a raw ID
  else if (/^\d+$/.test(channelArg)) {
    channel = guild.channels.cache.get(channelArg) || null;
  } 
  // Try to find by name
  else {
    channel = guild.channels.cache.find(c => 
      c.name.toLowerCase() === channelArg.toLowerCase()
    ) || null;
  }
  
  if (!channel) {
    return interaction.reply(`❌ Could not find a channel named "${channelArg}" in this server.`);
  }
  
  // Get reason if provided
  const reason = args.length > 1 ? args.slice(1).join(" ") : `Deleted by ${interaction.author.tag}`;
  
  // Prevent deleting the channel where the command was used
  if (interaction.channelId === channel.id) {
    return interaction.reply("❌ You cannot delete the channel you're currently using.");
  }
  
  // Store channel info before deletion
  const channelInfo = {
    name: channel.name,
    type: getChannelTypeName(channel.type),
    id: channel.id,
    parent: channel.parent?.name || "None"
  };
  
  // Delete the channel
  try {
    await channel.delete(reason);
    
    // Send success message
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Channel Deleted")
          .setDescription(`Successfully deleted the **${channelInfo.name}** channel`)
          .setColor(0xE74C3C)
          .addFields(
            { name: "Name", value: channelInfo.name, inline: true },
            { name: "Type", value: channelInfo.type, inline: true },
            { name: "ID", value: channelInfo.id, inline: true },
            { name: "Category", value: channelInfo.parent, inline: true },
            { name: "Reason", value: reason }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return interaction.reply(`❌ Failed to delete channel: ${error}`);
  }
}

/**
 * Handle text-based channel info command
 */
async function handleTextChannelInfo(interaction: Message, args: string[]) {
  const guild = interaction.guild;
  if (!guild) return;
  
  // Get the channel (defaults to current channel)
  let channel: GuildBasedChannel | null = null;
  
  if (args.length > 0) {
    const channelArg = args[0];
    
    // Check if it's a mention
    const channelMentionMatch = channelArg.match(/^<#(\d+)>$/);
    if (channelMentionMatch) {
      const channelId = channelMentionMatch[1];
      channel = guild.channels.cache.get(channelId) || null;
    } 
    // Check if it's a raw ID
    else if (/^\d+$/.test(channelArg)) {
      channel = guild.channels.cache.get(channelArg) || null;
    } 
    // Try to find by name
    else {
      channel = guild.channels.cache.find(c => 
        c.name.toLowerCase() === channelArg.toLowerCase()
      ) || null;
    }
    
    if (!channel) {
      return interaction.reply(`❌ Could not find a channel named "${channelArg}" in this server.`);
    }
  } else {
    // Default to current channel
    channel = interaction.channel;
  }
  
  if (!channel) {
    return interaction.reply("❌ Could not find the specified channel.");
  }
  
  // Get channel information
  try {
    // Get basic information
    const channelType = getChannelTypeName(channel.type);
    const createdTimestamp = Math.floor(channel.createdTimestamp / 1000);
    
    // Create base embed
    const embed = new EmbedBuilder()
      .setTitle(`Channel Information: ${channel.name}`)
      .setColor(0x3498DB)
      .addFields(
        { name: "ID", value: channel.id, inline: true },
        { name: "Type", value: channelType, inline: true },
        { name: "Category", value: channel.parent?.name || "None", inline: true },
        { name: "Created", value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)` },
        { name: "Position", value: `${channel.position}`, inline: true }
      );
    
    // Add type-specific information
    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildForum) {
      const textChannel = channel as TextChannel | ForumChannel;
      
      embed.addFields(
        { name: "NSFW", value: 'nsfw' in textChannel ? (textChannel.nsfw ? "Yes" : "No") : "No", inline: true },
        { name: "Topic", value: 'topic' in textChannel && textChannel.topic ? textChannel.topic : "None", inline: false }
      );
      
      if (channel.type === ChannelType.GuildText) {
        embed.addFields(
          { name: "Slowmode", value: `${(channel as TextChannel).rateLimitPerUser || 0} seconds`, inline: true }
        );
      }
    } else if (channel.type === ChannelType.GuildVoice) {
      const voiceChannel = channel as VoiceChannel;
      
      embed.addFields(
        { name: "Bitrate", value: `${voiceChannel.bitrate / 1000} kbps`, inline: true },
        { name: "User Limit", value: voiceChannel.userLimit > 0 ? `${voiceChannel.userLimit}` : "Unlimited", inline: true }
      );
    } else if (channel.type === ChannelType.GuildCategory) {
      const categoryChannel = channel as CategoryChannel;
      const childChannels = categoryChannel.children.cache;
      
      const textCount = childChannels.filter(c => c.type === ChannelType.GuildText).size;
      const voiceCount = childChannels.filter(c => c.type === ChannelType.GuildVoice).size;
      const forumCount = childChannels.filter(c => c.type === ChannelType.GuildForum).size;
      
      embed.addFields(
        { name: "Channels", value: `${childChannels.size} total (${textCount} text, ${voiceCount} voice, ${forumCount} forum)`, inline: true }
      );
    }
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error getting channel info:", error);
    return interaction.reply(`❌ Failed to get channel information: ${error}`);
  }
}

/**
 * Handle text-based channel list command
 */
async function handleTextChannelList(interaction: Message, args: string[]) {
  const guild = interaction.guild;
  if (!guild) return;
  
  // Parse arguments
  let categoryName = "";
  let typeFilter = "all";
  
  for (const arg of args) {
    const lowerArg = arg.toLowerCase();
    
    if (lowerArg === "text" || lowerArg === "voice" || lowerArg === "forum" || lowerArg === "all") {
      typeFilter = lowerArg;
    } else if (!categoryName) {
      categoryName = lowerArg;
    }
  }
  
  try {
    let channels: Collection<string, GuildBasedChannel>;
    
    // Filter by category if specified
    if (categoryName) {
      const category = guild.channels.cache.find(c => 
        c.type === ChannelType.GuildCategory && 
        c.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (!category) {
        return interaction.reply(`❌ Could not find a category named "${categoryName}".`);
      }
      
      channels = (category as CategoryChannel).children.cache;
    } else {
      // Get all channels
      channels = guild.channels.cache;
    }
    
    // Filter by type if specified
    if (typeFilter !== "all") {
      switch (typeFilter) {
        case 'text':
          channels = channels.filter(c => c.type === ChannelType.GuildText);
          break;
        case 'voice':
          channels = channels.filter(c => c.type === ChannelType.GuildVoice);
          break;
        case 'forum':
          channels = channels.filter(c => c.type === ChannelType.GuildForum);
          break;
      }
    }
    
    // Sort channels by type and position
    const sorted = [...channels.values()].sort((a, b) => {
      // Categories first, then text/forum channels, then voice channels
      if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return -1;
      if (a.type !== ChannelType.GuildCategory && b.type === ChannelType.GuildCategory) return 1;
      
      // Sort by position within each type
      return a.position - b.position;
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Channels in ${categoryName ? categoryName : guild.name}`)
      .setColor(0x3498DB)
      .setDescription(`Showing ${sorted.length} channels ${typeFilter !== "all" ? `of type ${typeFilter}` : ""}`)
      .setTimestamp();
    
    // Group channels by category for better display
    const categories = new Map<string, GuildBasedChannel[]>();
    categories.set("No Category", []);
    
    for (const channel of sorted) {
      if (channel.type === ChannelType.GuildCategory) {
        categories.set(channel.id, []);
      } else {
        const categoryId = channel.parentId || "No Category";
        const categoryChannels = categories.get(categoryId) || [];
        categoryChannels.push(channel);
        categories.set(categoryId, categoryChannels);
      }
    }
    
    // Add fields for each category
    for (const [categoryId, categoryChannels] of categories.entries()) {
      if (categoryId === "No Category" && categoryChannels.length === 0) {
        continue; // Skip empty "No Category" section
      }
      
      let categoryName = "No Category";
      if (categoryId !== "No Category") {
        const category = guild.channels.cache.get(categoryId);
        if (category) {
          categoryName = category.name;
        }
      }
      
      if (categoryChannels.length > 0 || categoryId !== "No Category") {
        // Add category name as field title
        let channelList = "";
        
        // First add the category itself if it's in our sorted list
        if (categoryId !== "No Category") {
          const category = sorted.find(c => c.id === categoryId);
          if (category) {
            channelList += `📁 **${category.name}** (${getChannelTypeName(category.type)})\n`;
          }
        }
        
        // Then add all channels in this category
        for (const channel of categoryChannels) {
          const icon = channel.type === ChannelType.GuildText ? "💬" :
                      channel.type === ChannelType.GuildVoice ? "🔊" :
                      channel.type === ChannelType.GuildForum ? "📋" : "🔷";
          
          channelList += `${icon} ${channel} (${getChannelTypeName(channel.type)})\n`;
        }
        
        embed.addFields({
          name: categoryName,
          value: channelList || "No channels"
        });
      }
    }
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error listing channels:", error);
    return interaction.reply(`❌ Failed to list channels: ${error}`);
  }
}

/**
 * Handle text-based clone channel command
 */
async function handleTextCloneChannel(interaction: Message, args: string[]) {
  const guild = interaction.guild;
  if (!guild) return;
  
  // Parse arguments
  let channel: GuildBasedChannel | null = null;
  let newName = "";
  
  if (args.length > 0) {
    const channelArg = args[0];
    
    // Check if it's a mention
    const channelMentionMatch = channelArg.match(/^<#(\d+)>$/);
    if (channelMentionMatch) {
      const channelId = channelMentionMatch[1];
      channel = guild.channels.cache.get(channelId) || null;
    } 
    // Check if it's a raw ID
    else if (/^\d+$/.test(channelArg)) {
      channel = guild.channels.cache.get(channelArg) || null;
    } 
    // Try to find by name
    else {
      channel = guild.channels.cache.find(c => 
        c.name.toLowerCase() === channelArg.toLowerCase()
      ) || null;
    }
    
    if (!channel && args[0].includes(" ")) {
      // If there's a space in the first argument, it's probably not a channel name
      // So default to current channel and treat all args as the new name
      channel = interaction.channel;
      newName = args.join(" ");
    } else if (channel && args.length > 1) {
      // If we found a channel and there are more args, use them as the new name
      newName = args.slice(1).join(" ");
    }
  }
  
  // Default to current channel if none specified
  if (!channel) {
    channel = interaction.channel;
  }
  
  if (!channel) {
    return interaction.reply("❌ Could not find the specified channel.");
  }
  
  // Default name if none provided
  if (!newName) {
    newName = `${channel.name}-clone`;
  }
  
  try {
    // Clone the channel
    const clonedChannel = await channel.clone({
      name: newName,
      reason: `Cloned by ${interaction.author.tag} using the channel command`
    });
    
    // Send success message
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Channel Cloned")
          .setDescription(`Successfully cloned ${channel} to ${clonedChannel}`)
          .setColor(0x2ECC71)
          .addFields(
            { name: "Original", value: channel.name, inline: true },
            { name: "Clone", value: clonedChannel.name, inline: true },
            { name: "Type", value: getChannelTypeName(clonedChannel.type), inline: true },
            { name: "Category", value: clonedChannel.parent?.name || "None", inline: true }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error("Error cloning channel:", error);
    return interaction.reply(`❌ Failed to clone channel: ${error}`);
  }
}

/**
 * Get a readable name for a channel type
 */
function getChannelTypeName(type: number): string {
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
    default:
      return "Unknown Channel";
  }
}