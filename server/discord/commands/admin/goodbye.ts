import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  TextChannel,
  Guild,
  GuildMember,
  User,
  ChannelType
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Store goodbye settings for each guild
// Using in-memory storage for demonstration
interface GoodbyeSettings {
  enabled: boolean;
  channelId: string | null;
  message: string | null;
  embedEnabled: boolean;
  embedColor: number;
  embedTitle: string | null;
  embedDescription: string | null;
  logReason: boolean;
}

const guildGoodbyeSettings = new Map<string, GoodbyeSettings>();

// Default goodbye settings
function getDefaultSettings(): GoodbyeSettings {
  return {
    enabled: false,
    channelId: null,
    message: "Goodbye {user}! We're sad to see you go.",
    embedEnabled: false,
    embedColor: 0xE74C3C,
    embedTitle: "Member Left",
    embedDescription: "**{user.tag}** has left the server. We now have {count} members.",
    logReason: true
  };
}

// Function to get settings for a guild, creating defaults if needed
function getSettings(guildId: string): GoodbyeSettings {
  if (!guildGoodbyeSettings.has(guildId)) {
    guildGoodbyeSettings.set(guildId, getDefaultSettings());
  }
  return guildGoodbyeSettings.get(guildId)!;
}

export default {
  name: "goodbye",
  description: "Configure goodbye messages for leaving members",
  category: "admin",
  aliases: ["byemsg", "leavemsg", "farewell"],
  slash: false,
  prefix: true,
  cooldown: 10,
  permissions: ["ManageGuild"],
  options: [
    {
      name: "enable",
      description: "Enable or disable goodbye messages",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "channel",
      description: "The channel for goodbye messages",
      type: "CHANNEL",
      required: false
    },
    {
      name: "message",
      description: "Custom goodbye message text",
      type: "STRING",
      required: false
    },
    {
      name: "embed",
      description: "Enable or disable goodbye embeds",
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
      name: "logreason",
      description: "Enable or disable logging of leave reasons (kicks, bans)",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "test",
      description: "Test the goodbye message",
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
        guildGoodbyeSettings.set(guild.id, getDefaultSettings());
        return interaction.reply({
          content: "✅ Goodbye settings have been reset to defaults.",
          ephemeral: true
        });
      }
      
      // Check for test
      if (options.getBoolean("test")) {
        return testGoodbyeMessage(interaction, guild, interaction.member as GuildMember);
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
            content: "❌ The goodbye channel must be a text channel.",
            ephemeral: true
          });
        }
        settings.channelId = channel.id;
        updated = true;
      }
      
      // Update goodbye message
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
            content: "❌ Invalid color format. Please use a hex color code like #E74C3C.",
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
      
      // Toggle reason logging
      const logReason = options.getBoolean("logreason");
      if (logReason !== null) {
        settings.logReason = logReason;
        updated = true;
      }
      
      // If no options were provided, show current settings
      if (!updated) {
        return showSettings(interaction, guild, settings);
      }
      
      // Save settings
      guildGoodbyeSettings.set(guild.id, settings);
      
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
          guildGoodbyeSettings.set(guild.id, settings);
          return interaction.reply("✅ Goodbye messages have been enabled.");
          
        case "disable":
        case "off":
          settings.enabled = false;
          guildGoodbyeSettings.set(guild.id, settings);
          return interaction.reply("✅ Goodbye messages have been disabled.");
          
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
          guildGoodbyeSettings.set(guild.id, settings);
          return interaction.reply(`✅ Goodbye channel set to ${channel}.`);
          
        case "message":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a message.");
          }
          
          settings.message = args.slice(1).join(" ");
          guildGoodbyeSettings.set(guild.id, settings);
          return interaction.reply("✅ Goodbye message has been updated.");
          
        case "embed":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.embedEnabled = true;
            guildGoodbyeSettings.set(guild.id, settings);
            return interaction.reply("✅ Goodbye embeds have been enabled.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.embedEnabled = false;
            guildGoodbyeSettings.set(guild.id, settings);
            return interaction.reply("✅ Goodbye embeds have been disabled.");
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
            guildGoodbyeSettings.set(guild.id, settings);
            return interaction.reply("✅ Embed color has been updated.");
          } catch (error) {
            return interaction.reply("❌ Invalid color format. Please use a hex color code like #E74C3C.");
          }
          
        case "title":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a title.");
          }
          
          settings.embedTitle = args.slice(1).join(" ");
          guildGoodbyeSettings.set(guild.id, settings);
          return interaction.reply("✅ Embed title has been updated.");
          
        case "description":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a description.");
          }
          
          settings.embedDescription = args.slice(1).join(" ");
          guildGoodbyeSettings.set(guild.id, settings);
          return interaction.reply("✅ Embed description has been updated.");
          
        case "logreason":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.logReason = true;
            guildGoodbyeSettings.set(guild.id, settings);
            return interaction.reply("✅ Leave reason logging has been enabled.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.logReason = false;
            guildGoodbyeSettings.set(guild.id, settings);
            return interaction.reply("✅ Leave reason logging has been disabled.");
          } else {
            return interaction.reply("❌ Invalid option. Use 'on' or 'off'.");
          }
          
        case "test":
          return testGoodbyeMessage(interaction, guild, interaction.member as GuildMember);
          
        case "reset":
          guildGoodbyeSettings.set(guild.id, getDefaultSettings());
          return interaction.reply("✅ Goodbye settings have been reset to defaults.");
          
        default:
          return interaction.reply("❌ Unknown subcommand. Available options: enable, disable, channel, message, embed, color, title, description, logreason, test, reset");
      }
    }
  }
} as DiscordCommand;

/**
 * Show current goodbye settings
 */
async function showSettings(
  interaction: CommandInteraction | Message, 
  guild: Guild, 
  settings: GoodbyeSettings,
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
    .setTitle(`Goodbye Settings for ${guild.name}`)
    .setColor(settings.embedColor)
    .addFields(
      { name: "Status", value: settings.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Channel", value: channelMention, inline: true },
      { name: "Embeds", value: settings.embedEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Goodbye Message", value: settings.message || "None", inline: false }
    )
    .setFooter({ text: "Use variables: {user}, {user.mention}, {user.tag}, {user.id}, {server}, {count}, {reason}" })
    .setTimestamp();
  
  // Add embed settings if enabled
  if (settings.embedEnabled) {
    embed.addFields(
      { name: "Embed Title", value: settings.embedTitle || "None", inline: false },
      { name: "Embed Description", value: settings.embedDescription || "None", inline: false },
      { name: "Embed Color", value: `#${settings.embedColor.toString(16).padStart(6, '0')}`, inline: true }
    );
  }
  
  // Add reason logging setting
  embed.addFields(
    { name: "Log Leave Reasons", value: settings.logReason ? "✅ Enabled" : "❌ Disabled", inline: true }
  );
  
  // Add updated notice if needed
  if (updated) {
    embed.setDescription("✅ Settings have been updated!");
  }
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Test goodbye message
 */
async function testGoodbyeMessage(
  interaction: CommandInteraction | Message, 
  guild: Guild, 
  member: GuildMember
): Promise<any> {
  const settings = getSettings(guild.id);
  
  // Check if goodbye messages are configured
  if (!settings.enabled) {
    return interaction.reply({
      content: "❌ Goodbye messages are disabled. Enable them first with `/goodbye enable:true`.",
      ephemeral: true
    });
  }
  
  if (!settings.channelId) {
    return interaction.reply({
      content: "❌ Goodbye channel is not set. Set it with `/goodbye channel:#channel`.",
      ephemeral: true
    });
  }
  
  // Get the goodbye channel
  const goodbyeChannel = guild.channels.cache.get(settings.channelId) as TextChannel;
  if (!goodbyeChannel || goodbyeChannel.type !== ChannelType.GuildText) {
    return interaction.reply({
      content: "❌ The configured goodbye channel is invalid or no longer exists.",
      ephemeral: true
    });
  }
  
  try {
    // Send test goodbye message with simulated leave reason
    await sendGoodbyeMessage(goodbyeChannel, member.user, guild, "[Test Leave]", true);
    
    interaction.reply({
      content: "✅ Test goodbye message sent to the goodbye channel.",
      ephemeral: true
    });
  } catch (error) {
    return interaction.reply({
      content: `❌ Failed to send test goodbye message: ${(error as Error).message}`,
      ephemeral: true
    });
  }
}

/**
 * Send a goodbye message for a leaving member
 */
export async function sendGoodbyeMessage(
  channel: TextChannel,
  user: User,
  guild: Guild,
  reason?: string,
  isTest: boolean = false
): Promise<void> {
  // Get settings
  const settings = getSettings(guild.id);
  
  // Skip if disabled and not a test
  if (!settings.enabled && !isTest) return;
  
  // Format the message
  const formattedMessage = formatGoodbyeMessage(settings.message || "", user, guild, reason);
  
  // Send as regular message or embed
  if (settings.embedEnabled && settings.embedDescription) {
    // Format embed
    const embed = new EmbedBuilder()
      .setColor(settings.embedColor)
      .setTimestamp();
    
    // Add title if set
    if (settings.embedTitle) {
      embed.setTitle(formatGoodbyeMessage(settings.embedTitle, user, guild, reason));
    }
    
    // Add description
    embed.setDescription(formatGoodbyeMessage(settings.embedDescription, user, guild, reason));
    
    // Add user avatar if available
    embed.setThumbnail(user.displayAvatarURL({ size: 256 }));
    
    // Add reason if available and enabled
    if (settings.logReason && reason && reason !== "[Test Leave]") {
      embed.addFields({ name: "Reason", value: reason });
    }
    
    // Add footer with server info
    embed.setFooter({
      text: `${guild.name} • ${guild.memberCount} members`,
      iconURL: guild.iconURL() || undefined
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
}

/**
 * Format a goodbye message with variables
 */
function formatGoodbyeMessage(
  message: string, 
  user: User, 
  guild: Guild, 
  reason?: string
): string {
  return message
    .replace(/{user}/g, user.username)
    .replace(/{user.mention}/g, `<@${user.id}>`)
    .replace(/{user.tag}/g, user.tag)
    .replace(/{user.id}/g, user.id)
    .replace(/{server}/g, guild.name)
    .replace(/{count}/g, guild.memberCount.toString())
    .replace(/{reason}/g, reason || "Unknown");
}

// Process member leave events
export async function handleGuildMemberRemove(
  member: GuildMember, 
  reason?: string
): Promise<void> {
  // Get settings for this guild
  const settings = getSettings(member.guild.id);
  
  // Skip if disabled
  if (!settings.enabled) return;
  
  // Skip if no channel is set
  if (!settings.channelId) return;
  
  // Get the goodbye channel
  const goodbyeChannel = member.guild.channels.cache.get(settings.channelId) as TextChannel;
  if (!goodbyeChannel || goodbyeChannel.type !== ChannelType.GuildText) return;
  
  // Send goodbye message
  await sendGoodbyeMessage(goodbyeChannel, member.user, member.guild, reason);
}