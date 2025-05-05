import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  TextChannel,
  Guild,
  GuildMember,
  ChannelType,
  AttachmentBuilder
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Store welcome settings for each guild
// Using in-memory storage for demonstration
interface WelcomeSettings {
  enabled: boolean;
  channelId: string | null;
  message: string | null;
  embedEnabled: boolean;
  embedColor: number;
  embedTitle: string | null;
  embedDescription: string | null;
  embedImageUrl: string | null;
  useUserAvatar: boolean;
  useServerImage: boolean;
  randomImages: string[];
  dmEnabled: boolean;
  dmMessage: string | null;
}

const guildWelcomeSettings = new Map<string, WelcomeSettings>();

// Default welcome settings
function getDefaultSettings(): WelcomeSettings {
  return {
    enabled: false,
    channelId: null,
    message: "Welcome {user} to {server}! You are member #{count}.",
    embedEnabled: false,
    embedColor: 0x3498DB,
    embedTitle: "Welcome to {server}!",
    embedDescription: "Hello {user.mention}, welcome to **{server}**! You are our {count}th member!",
    embedImageUrl: null,
    useUserAvatar: true,
    useServerImage: false,
    randomImages: [],
    dmEnabled: false,
    dmMessage: "Welcome to {server}! We hope you enjoy your stay."
  };
}

// Function to get settings for a guild, creating defaults if needed
function getSettings(guildId: string): WelcomeSettings {
  if (!guildWelcomeSettings.has(guildId)) {
    guildWelcomeSettings.set(guildId, getDefaultSettings());
  }
  return guildWelcomeSettings.get(guildId)!;
}

export default {
  name: "welcome",
  description: "Configure welcome messages for new members",
  category: "admin",
  aliases: ["welcomemsg", "joinmsg"],
  slash: false,
  prefix: true,
  cooldown: 10,
  permissions: ["ManageGuild"],
  options: [
    {
      name: "enable",
      description: "Enable or disable welcome messages",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "channel",
      description: "The channel for welcome messages",
      type: "CHANNEL",
      required: false
    },
    {
      name: "message",
      description: "Custom welcome message text",
      type: "STRING",
      required: false
    },
    {
      name: "embed",
      description: "Enable or disable welcome embeds",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "color",
      description: "Embed color (hex code)",
      type: "STRING",
      required: false
    },
    {
      name: "title",
      description: "Embed title",
      type: "STRING",
      required: false
    },
    {
      name: "description",
      description: "Embed description",
      type: "STRING",
      required: false
    },
    {
      name: "image",
      description: "Set an image URL for the welcome embed",
      type: "STRING",
      required: false
    },
    {
      name: "useravatar",
      description: "Use user avatar in welcome embeds",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "servericon",
      description: "Use server icon in welcome embeds",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "dm",
      description: "Enable or disable DM welcome messages",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "dmmessage",
      description: "Custom DM welcome message",
      type: "STRING",
      required: false
    },
    {
      name: "test",
      description: "Test the welcome message",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "reset",
      description: "Reset to default settings",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Load current settings
    const settings = getSettings(guild.id);
    
    // Process slash command options
    if (interaction instanceof CommandInteraction) {
      const options = interaction.options;
      
      // Check for reset
      if (options.getBoolean("reset")) {
        guildWelcomeSettings.set(guild.id, getDefaultSettings());
        return interaction.reply({
          content: "✅ Welcome settings have been reset to defaults.",
          ephemeral: true
        });
      }
      
      // Check for test
      if (options.getBoolean("test")) {
        return testWelcomeMessage(interaction, guild, interaction.member as GuildMember);
      }
      
      // Update settings from options
      let updated = false;
      
      // Toggle enabled state
      const enable = options.getBoolean("enable");
      if (enable !== null) {
        settings.enabled = enable;
        updated = true;
      }
      
      // Update channel
      const channel = options.getChannel("channel");
      if (channel) {
        if (channel.type !== ChannelType.GuildText) {
          return interaction.reply({
            content: "❌ The welcome channel must be a text channel.",
            ephemeral: true
          });
        }
        settings.channelId = channel.id;
        updated = true;
      }
      
      // Update welcome message
      const message = options.getString("message");
      if (message !== null) {
        settings.message = message;
        updated = true;
      }
      
      // Toggle embed
      const embed = options.getBoolean("embed");
      if (embed !== null) {
        settings.embedEnabled = embed;
        updated = true;
      }
      
      // Update embed color
      const color = options.getString("color");
      if (color) {
        try {
          // Parse hex color
          const colorInt = parseInt(color.replace("#", ""), 16);
          settings.embedColor = colorInt;
          updated = true;
        } catch (error) {
          return interaction.reply({
            content: "❌ Invalid color format. Please use a hex color code like #3498DB.",
            ephemeral: true
          });
        }
      }
      
      // Update embed title
      const title = options.getString("title");
      if (title !== null) {
        settings.embedTitle = title;
        updated = true;
      }
      
      // Update embed description
      const description = options.getString("description");
      if (description !== null) {
        settings.embedDescription = description;
        updated = true;
      }
      
      // Toggle DM messages
      const dm = options.getBoolean("dm");
      if (dm !== null) {
        settings.dmEnabled = dm;
        updated = true;
      }
      
      // Update DM message
      const dmmessage = options.getString("dmmessage");
      if (dmmessage !== null) {
        settings.dmMessage = dmmessage;
        updated = true;
      }
      
      // Update image URL
      const imageUrl = options.getString("image");
      if (imageUrl !== null) {
        if (imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
          settings.embedImageUrl = imageUrl;
          settings.useUserAvatar = false;
          settings.useServerImage = false;
          updated = true;
        } else {
          return interaction.reply({
            content: "❌ Please provide a valid image URL ending with .jpg, .png, .gif, or .webp",
            ephemeral: true
          });
        }
      }
      
      // Toggle user avatar
      const useUserAvatar = options.getBoolean("useravatar");
      if (useUserAvatar !== null) {
        settings.useUserAvatar = useUserAvatar;
        if (useUserAvatar) {
          settings.useServerImage = false;
          settings.embedImageUrl = null;
        }
        updated = true;
      }
      
      // Toggle server icon
      const useServerIcon = options.getBoolean("servericon");
      if (useServerIcon !== null) {
        settings.useServerImage = useServerIcon;
        if (useServerIcon) {
          settings.useUserAvatar = false;
          settings.embedImageUrl = null;
        }
        updated = true;
      }
      
      // If no options were provided, show current settings
      if (!updated) {
        return showSettings(interaction, guild, settings);
      }
      
      // Save settings
      guildWelcomeSettings.set(guild.id, settings);
      
      // Show updated settings
      return showSettings(interaction, guild, settings, true);
    } 
    // Process message command arguments
    else {
      // If no args, show current settings
      if (!args || args.length === 0) {
        return showSettings(interaction, guild, settings);
      }
      
      // Process command arguments
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case "enable":
        case "on":
          settings.enabled = true;
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Welcome messages have been enabled.");
          
        case "disable":
        case "off":
          settings.enabled = false;
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Welcome messages have been disabled.");
          
        case "channel":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel.");
          }
          
          // Get channel from mention or ID
          const channelArg = args[1].replace(/[<#>]/g, "");
          const channel = guild.channels.cache.get(channelArg);
          
          if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply("❌ Invalid text channel specified.");
          }
          
          settings.channelId = channel.id;
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply(`✅ Welcome channel set to ${channel}.`);
          
        case "message":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a message.");
          }
          
          settings.message = args.slice(1).join(" ");
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Welcome message has been updated.");
          
        case "embed":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.embedEnabled = true;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Welcome embeds have been enabled.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.embedEnabled = false;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Welcome embeds have been disabled.");
          } else {
            return interaction.reply("❌ Invalid option. Use 'on' or 'off'.");
          }
          
        case "color":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a hex color code.");
          }
          
          try {
            const colorInt = parseInt(args[1].replace("#", ""), 16);
            settings.embedColor = colorInt;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Embed color has been updated.");
          } catch (error) {
            return interaction.reply("❌ Invalid color format. Please use a hex color code like #3498DB.");
          }
          
        case "title":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a title.");
          }
          
          settings.embedTitle = args.slice(1).join(" ");
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Embed title has been updated.");
          
        case "description":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a description.");
          }
          
          settings.embedDescription = args.slice(1).join(" ");
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Embed description has been updated.");
          
        case "dm":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.dmEnabled = true;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ DM welcome messages have been enabled.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.dmEnabled = false;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ DM welcome messages have been disabled.");
          } else {
            return interaction.reply("❌ Invalid option. Use 'on' or 'off'.");
          }
          
        case "dmmessage":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a message.");
          }
          
          settings.dmMessage = args.slice(1).join(" ");
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ DM welcome message has been updated.");
          
        case "image":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify an image URL.");
          }
          
          // Check URL
          const imageUrl = args.slice(1).join(" ");
          if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
            return interaction.reply("❌ Please provide a valid image URL ending with .jpg, .png, .gif, or .webp");
          }
          
          settings.embedImageUrl = imageUrl;
          settings.useUserAvatar = false;
          settings.useServerImage = false;
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Welcome image has been set.");
          
        case "useravatar":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.useUserAvatar = true;
            settings.useServerImage = false;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Welcome messages will now show the user's avatar.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.useUserAvatar = false;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Welcome messages will no longer show the user's avatar.");
          } else {
            return interaction.reply("❌ Invalid option. Use 'on' or 'off'.");
          }
        
        case "serverimage":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.useServerImage = true;
            settings.useUserAvatar = false;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Welcome messages will now show the server icon.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.useServerImage = false;
            guildWelcomeSettings.set(guild.id, settings);
            return interaction.reply("✅ Welcome messages will no longer show the server icon.");
          } else {
            return interaction.reply("❌ Invalid option. Use 'on' or 'off'.");
          }
          
        case "addimage":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify an image URL.");
          }
          
          // Check URL
          const randomImageUrl = args.slice(1).join(" ");
          if (!randomImageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
            return interaction.reply("❌ Please provide a valid image URL ending with .jpg, .png, .gif, or .webp");
          }
          
          // Add to random images list
          if (!settings.randomImages) {
            settings.randomImages = [];
          }
          
          settings.randomImages.push(randomImageUrl);
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply(`✅ Image added to random welcome images list. Total: ${settings.randomImages.length}`);
          
        case "clearimages":
          settings.randomImages = [];
          guildWelcomeSettings.set(guild.id, settings);
          return interaction.reply("✅ Random welcome images list has been cleared.");
        
        case "randomimages":
          if (!settings.randomImages || settings.randomImages.length === 0) {
            return interaction.reply("No random welcome images have been added yet.");
          }
          
          const embed = new EmbedBuilder()
            .setTitle("Random Welcome Images")
            .setDescription(`This server has ${settings.randomImages.length} random welcome images configured.`)
            .setColor(settings.embedColor)
            .setFooter({ text: `Use !welcome addimage <url> to add more images` });
          
          // Add some example images to the embed if available
          for (let i = 0; i < Math.min(settings.randomImages.length, 5); i++) {
            embed.addFields({ 
              name: `Image ${i + 1}`, 
              value: `[Link](${settings.randomImages[i]})`,
              inline: true
            });
          }
          
          // Show a preview of the first image
          if (settings.randomImages.length > 0) {
            embed.setImage(settings.randomImages[0]);
          }
          
          return interaction.reply({ embeds: [embed] });

        case "test":
          return testWelcomeMessage(interaction, guild, interaction.member as GuildMember);
          
        case "reset":
          guildWelcomeSettings.set(guild.id, getDefaultSettings());
          return interaction.reply("✅ Welcome settings have been reset to defaults.");
          
        default:
          return interaction.reply("❌ Unknown subcommand. Available options: enable, disable, channel, message, embed, color, title, description, dm, dmmessage, image, useravatar, serverimage, addimage, clearimages, randomimages, test, reset");
      }
    }
  }
} as DiscordCommand;

/**
 * Show current welcome settings
 */
async function showSettings(
  interaction: CommandInteraction | Message, 
  guild: Guild, 
  settings: WelcomeSettings,
  updated: boolean = false
): Promise<any> {
  // Get channel if set
  let channelMention = "Not set";
  if (settings.channelId) {
    const channel = guild.channels.cache.get(settings.channelId);
    if (channel) {
      channelMention = `<#${channel.id}>`;
    }
  }
  
  // Create embed with settings
  const embed = new EmbedBuilder()
    .setTitle(`Welcome Settings for ${guild.name}`)
    .setColor(settings.embedColor)
    .addFields(
      { name: "Status", value: settings.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Channel", value: channelMention, inline: true },
      { name: "Embeds", value: settings.embedEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Welcome Message", value: settings.message || "None", inline: false }
    )
    .setFooter({ text: "Use variables: {user}, {user.mention}, {user.tag}, {user.id}, {server}, {count}" })
    .setTimestamp();
  
  // Add embed settings if enabled
  if (settings.embedEnabled) {
    embed.addFields(
      { name: "Embed Title", value: settings.embedTitle || "None", inline: false },
      { name: "Embed Description", value: settings.embedDescription || "None", inline: false },
      { name: "Embed Color", value: `#${settings.embedColor.toString(16).padStart(6, '0')}`, inline: true }
    );
    
    // Add image settings
    let imageSettings = "None";
    if (settings.embedImageUrl) {
      imageSettings = `Custom Image: [Link](${settings.embedImageUrl})`;
    } else if (settings.useUserAvatar) {
      imageSettings = "User's Avatar";
    } else if (settings.useServerImage) {
      imageSettings = "Server Icon";
    } else if (settings.randomImages && settings.randomImages.length > 0) {
      imageSettings = `Random Images (${settings.randomImages.length})`;
    }
    
    embed.addFields(
      { name: "Image Settings", value: imageSettings, inline: false }
    );
  }
  
  // Add DM settings
  embed.addFields(
    { name: "DM Messages", value: settings.dmEnabled ? "✅ Enabled" : "❌ Disabled", inline: true }
  );
  
  if (settings.dmEnabled) {
    embed.addFields(
      { name: "DM Message", value: settings.dmMessage || "None", inline: false }
    );
  }
  
  // Add updated notice if needed
  if (updated) {
    embed.setDescription("✅ Settings have been updated!");
  }
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Test welcome message
 */
async function testWelcomeMessage(
  interaction: CommandInteraction | Message, 
  guild: Guild, 
  member: GuildMember
): Promise<any> {
  const settings = getSettings(guild.id);
  
  // Check if welcome messages are configured
  if (!settings.enabled) {
    return interaction.reply({
      content: "❌ Welcome messages are disabled. Enable them first with `!welcome enable`.",
      ephemeral: true
    });
  }
  
  if (!settings.channelId) {
    return interaction.reply({
      content: "❌ Welcome channel is not set. Set it with `!welcome channel #channel`.",
      ephemeral: true
    });
  }
  
  // Get the welcome channel
  const welcomeChannel = guild.channels.cache.get(settings.channelId) as TextChannel;
  if (!welcomeChannel || welcomeChannel.type !== ChannelType.GuildText) {
    return interaction.reply({
      content: "❌ The configured welcome channel is invalid or no longer exists.",
      ephemeral: true
    });
  }
  
  try {
    // Send test welcome message
    await sendWelcomeMessage(welcomeChannel, member, settings, true);
    
    // Send test DM if enabled
    if (settings.dmEnabled && settings.dmMessage) {
      interaction.reply({
        content: "✅ Test welcome message sent to the welcome channel. DM messages are enabled, but will not be sent during tests.",
        ephemeral: true
      });
    } else {
      interaction.reply({
        content: "✅ Test welcome message sent to the welcome channel.",
        ephemeral: true
      });
    }
  } catch (error) {
    return interaction.reply({
      content: `❌ Failed to send test welcome message: ${(error as Error).message}`,
      ephemeral: true
    });
  }
}

/**
 * Send a welcome message for a new member
 */
export async function sendWelcomeMessage(
  channel: TextChannel,
  member: GuildMember,
  settings?: WelcomeSettings,
  isTest: boolean = false
): Promise<void> {
  // Get settings if not provided
  if (!settings) {
    settings = getSettings(member.guild.id);
  }
  
  // Skip if disabled and not a test
  if (!settings.enabled && !isTest) return;
  
  // Format the message
  const formattedMessage = formatWelcomeMessage(settings.message || "", member);
  
  // Send as regular message or embed
  if (settings.embedEnabled && settings.embedDescription) {
    // Format embed
    const embed = new EmbedBuilder()
      .setColor(settings.embedColor)
      .setTimestamp();
    
    // Add title if set
    if (settings.embedTitle) {
      embed.setTitle(formatWelcomeMessage(settings.embedTitle, member));
    }
    
    // Add description
    embed.setDescription(formatWelcomeMessage(settings.embedDescription, member));
    
    // Handle different image settings
    if (settings.embedImageUrl) {
      // Use custom image URL
      embed.setImage(settings.embedImageUrl);
    } else if (settings.useUserAvatar) {
      // Use user's avatar as thumbnail
      embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    } else if (settings.useServerImage && member.guild.iconURL()) {
      // Use server icon as image
      embed.setThumbnail(member.guild.iconURL({ size: 256 }) || undefined);
    } else if (settings.randomImages && settings.randomImages.length > 0) {
      // Pick a random image from the list
      const randomIndex = Math.floor(Math.random() * settings.randomImages.length);
      embed.setImage(settings.randomImages[randomIndex]);
    } else {
      // Default to user avatar as fallback
      embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    }
    
    // Add footer with server info
    embed.setFooter({
      text: `${member.guild.name} • ${member.guild.memberCount} members`,
      iconURL: member.guild.iconURL() || undefined
    });
    
    // Send the embed with optional message
    await channel.send({
      content: formattedMessage,
      embeds: [embed]
    });
  } else {
    // Send as regular message
    await channel.send(formattedMessage);
  }
  
  // Send DM if enabled and not a test
  if (settings.dmEnabled && settings.dmMessage && !isTest) {
    try {
      // Format DM message
      const dmMessage = formatWelcomeMessage(settings.dmMessage, member);
      
      // Send DM
      await member.send(dmMessage);
    } catch (error) {
      // Silent fail - user might have DMs disabled
    }
  }
}

/**
 * Format a welcome message with variables
 */
function formatWelcomeMessage(message: string, member: GuildMember): string {
  return message
    .replace(/{user}/g, member.user.username)
    .replace(/{user.mention}/g, `<@${member.user.id}>`)
    .replace(/{user.tag}/g, member.user.tag)
    .replace(/{user.id}/g, member.user.id)
    .replace(/{server}/g, member.guild.name)
    .replace(/{count}/g, member.guild.memberCount.toString());
}

// Process new member joins
export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  // Get settings for this guild
  const settings = getSettings(member.guild.id);
  
  // Skip if disabled
  if (!settings.enabled) return;
  
  // Skip if no channel is set
  if (!settings.channelId) return;
  
  // Get the welcome channel
  const welcomeChannel = member.guild.channels.cache.get(settings.channelId) as TextChannel;
  if (!welcomeChannel || welcomeChannel.type !== ChannelType.GuildText) return;
  
  // Send welcome message
  await sendWelcomeMessage(welcomeChannel, member, settings);
}