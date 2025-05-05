import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Client
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "ping",
  description: "Check the bot's latency and API response time",
  category: "utility",
  aliases: ["latency", "pong"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    const client = interaction.client;
    
    // Send initial message
    const initialMessage = await interaction.reply({ 
      content: "Pinging...", 
      fetchReply: true 
    });
    
    // Calculate various latencies
    const latencies = calculateLatencies(client, initialMessage, interaction);
    
    // Create ping embed
    const embed = createPingEmbed(latencies);
    
    // Edit the initial message with the complete ping information
    if (interaction instanceof CommandInteraction) {
      return interaction.editReply({ content: null, embeds: [embed] });
    } else {
      if (initialMessage instanceof Message) {
        return initialMessage.edit({ content: null, embeds: [embed] });
      }
    }
  }
} as DiscordCommand;

interface Latencies {
  messagePing: number;
  apiPing: number;
  dbPing?: number;
  uptime: string;
  serverCount: number;
}

/**
 * Calculate various latency metrics
 */
function calculateLatencies(
  client: Client, 
  initialMessage: Message | any, 
  interaction: CommandInteraction | Message
): Latencies {
  // Message ping (round trip time)
  const messagePing = initialMessage.createdTimestamp - 
    (interaction instanceof Message ? interaction.createdTimestamp : interaction.createdTimestamp);
  
  // WebSocket ping
  const apiPing = client.ws.ping;
  
  // Get server/guild count
  const serverCount = client.guilds.cache.size;
  
  // Format uptime
  const uptime = formatUptime(client.uptime || 0);
  
  return {
    messagePing,
    apiPing,
    uptime,
    serverCount
  };
}

/**
 * Create an embed with ping information
 */
function createPingEmbed(latencies: Latencies): EmbedBuilder {
  // Determine ping status colors
  const messagePingColor = getPingStatusColor(latencies.messagePing);
  const apiPingColor = getPingStatusColor(latencies.apiPing);
  
  // Calculate overall color (worst of all metrics)
  const overallColor = getWorstColor([messagePingColor, apiPingColor]);
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setColor(overallColor)
    .addFields(
      { 
        name: "Message Latency", 
        value: `${latencies.messagePing}ms ${getPingStatusEmoji(latencies.messagePing)}`, 
        inline: true 
      },
      { 
        name: "API Latency", 
        value: `${latencies.apiPing}ms ${getPingStatusEmoji(latencies.apiPing)}`, 
        inline: true 
      },
      { name: "Servers", value: `${latencies.serverCount}`, inline: true },
      { name: "Uptime", value: latencies.uptime, inline: false }
    )
    .setFooter({ text: "Bot Status Information" })
    .setTimestamp();
  
  return embed;
}

/**
 * Format uptime into a readable string
 */
function formatUptime(uptime: number): string {
  const totalSeconds = Math.floor(uptime / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor(((totalSeconds % 86400) % 3600) / 60);
  const seconds = ((totalSeconds % 86400) % 3600) % 60;
  
  const parts = [];
  
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

/**
 * Get color based on ping status
 */
function getPingStatusColor(ping: number): number {
  if (ping < 100) return 0x2ECC71; // Green (good)
  if (ping < 300) return 0xE67E22; // Orange (medium)
  return 0xE74C3C; // Red (bad)
}

/**
 * Get the worst color from a list (highest severity)
 */
function getWorstColor(colors: number[]): number {
  // Red > Orange > Green
  if (colors.includes(0xE74C3C)) return 0xE74C3C; // Red
  if (colors.includes(0xE67E22)) return 0xE67E22; // Orange
  return 0x2ECC71; // Green
}

/**
 * Get emoji based on ping status
 */
function getPingStatusEmoji(ping: number): string {
  if (ping < 100) return "🟢"; // Green (good)
  if (ping < 300) return "🟠"; // Orange (medium)
  return "🔴"; // Red (bad)
}