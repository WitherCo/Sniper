import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  version as discordJSVersion,
  Client
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import os from "os";

export default {
  name: "botinfo",
  description: "Display information about the bot",
  category: "utility",
  aliases: ["bot", "info", "stats"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    const client = interaction.client;
    
    // Create and send bot info embed
    const botInfoEmbed = createBotInfoEmbed(client);
    
    return interaction.reply({ embeds: [botInfoEmbed] });
  }
} as DiscordCommand;

/**
 * Create a detailed embed with bot information
 */
function createBotInfoEmbed(client: Client): EmbedBuilder {
  // Get bot user
  const botUser = client.user;
  
  if (!botUser) {
    return new EmbedBuilder()
      .setTitle("Bot Information")
      .setDescription("Error: Bot user information is unavailable.")
      .setColor(0xFF0000);
  }
  
  // Calculate uptime
  const uptime = formatUptime(client.uptime || 0);
  
  // Format creation date
  const createdTimestamp = Math.floor(botUser.createdTimestamp / 1000);
  
  // Get system information
  const osInfo = {
    platform: formatPlatform(os.platform()),
    version: os.release(),
    arch: os.arch(),
    memory: {
      total: formatBytes(os.totalmem()),
      free: formatBytes(os.freemem()),
      used: formatBytes(os.totalmem() - os.freemem())
    },
    cpuCores: os.cpus().length,
    uptime: formatUptime(os.uptime() * 1000)
  };
  
  // Calculate RAM usage percentage
  const ramPercentage = ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2);
  
  // Get Discord.js version
  const djsVersion = discordJSVersion;
  
  // Get Node.js version
  const nodeVersion = process.version;
  
  // Get guild and user count
  const guildCount = client.guilds.cache.size;
  const channelCount = client.channels.cache.size;
  const userCount = client.users.cache.size;
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`${botUser.username} - Bot Information`)
    .setColor(0x3498DB)
    .setThumbnail(botUser.displayAvatarURL({ size: 256 }))
    .addFields(
      // Bot info
      { name: "Bot ID", value: botUser.id, inline: true },
      { name: "Created", value: `<t:${createdTimestamp}:R>`, inline: true },
      { name: "Uptime", value: uptime, inline: true },
      
      // Stats
      { name: "Servers", value: `${guildCount}`, inline: true },
      { name: "Channels", value: `${channelCount}`, inline: true },
      { name: "Users", value: `${userCount}`, inline: true },
      
      // Technical info
      { name: "Discord.js", value: `v${djsVersion}`, inline: true },
      { name: "Node.js", value: nodeVersion, inline: true },
      
      // System info
      { 
        name: "System", 
        value: [
          `📟 **Platform**: ${osInfo.platform} (${osInfo.arch})`,
          `🖥️ **CPU Cores**: ${osInfo.cpuCores}`,
          `💾 **Memory**: ${osInfo.memory.used} / ${osInfo.memory.total} (${ramPercentage}%)`
        ].join("\n"), 
        inline: false 
      }
    )
    .setFooter({ text: `System Uptime: ${osInfo.uptime}` })
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
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Format bytes into a readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format platform name to be more readable
 */
function formatPlatform(platform: string): string {
  const platforms: Record<string, string> = {
    'win32': 'Windows',
    'darwin': 'macOS',
    'linux': 'Linux',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'SunOS',
    'aix': 'AIX'
  };
  
  return platforms[platform] || platform;
}