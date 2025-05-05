import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Guild,
  TextChannel,
  PermissionFlagsBits,
  GuildTextBasedChannel,
  GuildChannelManager,
  ChannelType
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Store log channel IDs by guild
const guildLogSettings = new Map<string, LogSettings>();

interface LogSettings {
  enabled: boolean;
  channelId?: string;
  events: LogEvent[];
}

type LogEvent = 
  | "message" 
  | "messageDelete" 
  | "messageEdit" 
  | "memberJoin" 
  | "memberLeave" 
  | "memberUpdate" 
  | "channelCreate" 
  | "channelDelete" 
  | "channelUpdate" 
  | "roleCreate" 
  | "roleDelete" 
  | "roleUpdate" 
  | "guildUpdate" 
  | "guildBanAdd" 
  | "guildBanRemove" 
  | "all";

// Get default settings
function getDefaultSettings(): LogSettings {
  return {
    enabled: false,
    channelId: undefined,
    events: []
  };
}

// Get settings for a guild
function getSettings(guildId: string): LogSettings {
  if (!guildLogSettings.has(guildId)) {
    guildLogSettings.set(guildId, getDefaultSettings());
  }
  return guildLogSettings.get(guildId)!;
}

export default {
  name: "logs",
  description: "Configure server logs and audit trails",
  category: "admin",
  aliases: ["log", "serverlog", "auditlog"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: ["ManageGuild"],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Get current settings
    const settings = getSettings(guild.id);
    
    // Process prefix command with args
    if (interaction instanceof Message) {
      if (!args || args.length === 0) {
        return showLogStatus(interaction, guild, settings);
      }
      
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case "enable":
        case "on":
          settings.enabled = true;
          guildLogSettings.set(guild.id, settings);
          return interaction.reply("✅ Server logs have been enabled.");
          
        case "disable":
        case "off":
          settings.enabled = false;
          guildLogSettings.set(guild.id, settings);
          return interaction.reply("✅ Server logs have been disabled.");
          
        case "channel":
        case "setchannel":
        case "logchannel":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel ID or mention.");
          }
          
          const channelArg = args[1].replace(/[<#>]/g, "");
          const channel = guild.channels.cache.get(channelArg);
          
          if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply("❌ Invalid text channel specified.");
          }
          
          // Check bot permissions in the channel
          if (!channel.permissionsFor(guild.members.me!)?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
          ])) {
            return interaction.reply("❌ I don't have permission to send messages and embeds in that channel.");
          }
          
          settings.channelId = channel.id;
          settings.enabled = true; // Auto-enable when channel is set
          guildLogSettings.set(guild.id, settings);
          
          return interaction.reply(`✅ Server logs will now be sent to ${channel}.`);
          
        case "events":
        case "list":
          const allEvents: LogEvent[] = [
            "message", "messageDelete", "messageEdit", 
            "memberJoin", "memberLeave", "memberUpdate", 
            "channelCreate", "channelDelete", "channelUpdate", 
            "roleCreate", "roleDelete", "roleUpdate", 
            "guildUpdate", "guildBanAdd", "guildBanRemove"
          ];
          
          const embed = new EmbedBuilder()
            .setTitle("Server Log Events")
            .setDescription("Here are all the available log events:")
            .setColor(0x3498DB)
            .addFields(
              { name: "Message Events", value: "message, messageDelete, messageEdit", inline: false },
              { name: "Member Events", value: "memberJoin, memberLeave, memberUpdate", inline: false },
              { name: "Channel Events", value: "channelCreate, channelDelete, channelUpdate", inline: false },
              { name: "Role Events", value: "roleCreate, roleDelete, roleUpdate", inline: false },
              { name: "Server Events", value: "guildUpdate, guildBanAdd, guildBanRemove", inline: false },
              { name: "Special Events", value: "all (enables all events)", inline: false }
            )
            .setFooter({ text: "Use !logs add <event> to enable specific events" });
          
          return interaction.reply({ embeds: [embed] });
          
        case "add":
        case "addevent":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify an event to add. Use `!logs events` to see available events.");
          }
          
          const eventToAdd = args[1].toLowerCase() as LogEvent;
          
          if (eventToAdd === "all") {
            // Add all events
            settings.events = [
              "message", "messageDelete", "messageEdit", 
              "memberJoin", "memberLeave", "memberUpdate", 
              "channelCreate", "channelDelete", "channelUpdate", 
              "roleCreate", "roleDelete", "roleUpdate", 
              "guildUpdate", "guildBanAdd", "guildBanRemove"
            ];
            guildLogSettings.set(guild.id, settings);
            return interaction.reply("✅ All log events have been enabled.");
          }
          
          // Check if event is valid
          if (!isValidEvent(eventToAdd)) {
            return interaction.reply("❌ Invalid event specified. Use `!logs events` to see available events.");
          }
          
          // Add event if not already added
          if (!settings.events.includes(eventToAdd)) {
            settings.events.push(eventToAdd);
            guildLogSettings.set(guild.id, settings);
            return interaction.reply(`✅ Added ${eventToAdd} to log events.`);
          } else {
            return interaction.reply(`❌ ${eventToAdd} is already being logged.`);
          }
          
        case "remove":
        case "removeevent":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify an event to remove. Use `!logs events` to see available events.");
          }
          
          const eventToRemove = args[1].toLowerCase() as LogEvent;
          
          if (eventToRemove === "all") {
            // Clear all events
            settings.events = [];
            guildLogSettings.set(guild.id, settings);
            return interaction.reply("✅ All log events have been disabled.");
          }
          
          // Check if event is valid
          if (!isValidEvent(eventToRemove)) {
            return interaction.reply("❌ Invalid event specified. Use `!logs events` to see available events.");
          }
          
          // Remove event if present
          const eventIndex = settings.events.indexOf(eventToRemove);
          if (eventIndex !== -1) {
            settings.events.splice(eventIndex, 1);
            guildLogSettings.set(guild.id, settings);
            return interaction.reply(`✅ Removed ${eventToRemove} from log events.`);
          } else {
            return interaction.reply(`❌ ${eventToRemove} is not currently being logged.`);
          }
          
        case "test":
          if (!settings.enabled) {
            return interaction.reply("❌ Server logs are not enabled. Use `!logs enable` first.");
          }
          
          if (!settings.channelId) {
            return interaction.reply("❌ No log channel has been set. Use `!logs channel #channel` first.");
          }
          
          const logChannel = guild.channels.cache.get(settings.channelId) as TextChannel;
          if (!logChannel) {
            return interaction.reply("❌ The configured log channel no longer exists.");
          }
          
          // Send test message
          try {
            await logChannel.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Test Log Message")
                  .setDescription("This is a test log message.")
                  .setColor(0x00FF00)
                  .addFields(
                    { name: "Requested By", value: interaction.member?.toString() || "Unknown", inline: true },
                    { name: "Timestamp", value: new Date().toISOString(), inline: true }
                  )
                  .setFooter({ text: `Guild ID: ${guild.id}` })
                  .setTimestamp()
              ]
            });
            
            return interaction.reply("✅ Test log message sent successfully!");
          } catch (error) {
            return interaction.reply(`❌ Failed to send test log message: ${(error as Error).message}`);
          }
          
        case "reset":
          guildLogSettings.set(guild.id, getDefaultSettings());
          return interaction.reply("✅ Server log settings have been reset to default.");
          
        default:
          return interaction.reply("❌ Unknown subcommand. Available options: enable, disable, channel, events, add, remove, test, reset");
      }
    }
    
    // Should never reach here as we set slash: false
    return interaction.reply("This command is only available as a prefix command. Please use !logs instead.");
  }
} as DiscordCommand;

// Show log status
async function showLogStatus(
  interaction: CommandInteraction | Message,
  guild: Guild,
  settings: LogSettings
): Promise<any> {
  // Find log channel if configured
  let channelName = "Not set";
  if (settings.channelId) {
    const channel = guild.channels.cache.get(settings.channelId);
    channelName = channel ? `<#${channel.id}>` : "Channel no longer exists";
  }
  
  // Create status embed
  const embed = new EmbedBuilder()
    .setTitle("Server Log Settings")
    .setColor(settings.enabled ? 0x00FF00 : 0xFF0000)
    .addFields(
      { name: "Status", value: settings.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Log Channel", value: channelName, inline: true },
      { name: "Logged Events", value: settings.events.length > 0 ? settings.events.join(", ") : "None", inline: false }
    )
    .setFooter({ text: `Use !logs events to see available events` })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

// Check if an event is valid
function isValidEvent(event: string): boolean {
  const validEvents: LogEvent[] = [
    "message", "messageDelete", "messageEdit", 
    "memberJoin", "memberLeave", "memberUpdate", 
    "channelCreate", "channelDelete", "channelUpdate", 
    "roleCreate", "roleDelete", "roleUpdate", 
    "guildUpdate", "guildBanAdd", "guildBanRemove",
    "all"
  ];
  
  return validEvents.includes(event as LogEvent);
}

// Export for use in other files
export function shouldLog(guildId: string, event: LogEvent): boolean {
  const settings = getSettings(guildId);
  return settings.enabled && 
         !!settings.channelId && 
         (settings.events.includes(event) || settings.events.includes("all"));
}

export async function logEvent(
  guild: Guild,
  event: LogEvent,
  embedBuilder: EmbedBuilder
): Promise<void> {
  const settings = getSettings(guild.id);
  
  if (!settings.enabled || !settings.channelId) {
    return;
  }
  
  if (!settings.events.includes(event) && !settings.events.includes("all")) {
    return;
  }
  
  const logChannel = guild.channels.cache.get(settings.channelId) as TextChannel;
  if (!logChannel) {
    return;
  }
  
  try {
    // Add footer with event type
    embedBuilder.setFooter({ 
      text: `Event: ${event} | Server ID: ${guild.id}`,
      iconURL: guild.iconURL() || undefined
    });
    
    // Add timestamp
    embedBuilder.setTimestamp();
    
    await logChannel.send({ embeds: [embedBuilder] });
  } catch (error) {
    console.error(`Failed to log event ${event} to channel ${logChannel.id}:`, error);
  }
}