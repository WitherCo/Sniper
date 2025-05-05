import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Guild,
  Collection,
  GuildEmoji,
  PermissionFlagsBits
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "emojis",
  description: "View information about server emojis",
  category: "information",
  aliases: ["emoji", "emote", "emotes"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "emoji",
      description: "Specific emoji to get information about",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Process prefix command with args
    if (interaction instanceof Message) {
      if (!args || args.length === 0) {
        // Show emoji stats for the server
        return showEmojiStats(interaction, guild);
      }
      
      // Check if the first arg is a subcommand
      const firstArg = args[0].toLowerCase();
      
      if (firstArg === "list") {
        // List all emojis
        return listEmojis(interaction, guild);
      } else if (firstArg === "info" && args.length > 1) {
        // Get info about a specific emoji
        return getEmojiInfo(interaction, guild, args[1]);
      } else {
        // Assume the argument is an emoji
        return getEmojiInfo(interaction, guild, args[0]);
      }
    }
    
    // Should never reach here as we set slash: false
    return interaction.reply("This command is only available as a prefix command. Please use !emojis instead.");
  }
} as DiscordCommand;

/**
 * Show emoji statistics for the server
 */
async function showEmojiStats(interaction: CommandInteraction | Message, guild: Guild): Promise<any> {
  const emojis = guild.emojis.cache;
  
  // Count emojis by type
  const staticCount = emojis.filter(emoji => !emoji.animated).size;
  const animatedCount = emojis.filter(emoji => emoji.animated).size;
  const totalCount = emojis.size;
  
  // Calculate emoji limits based on server boost level
  const premiumTier = guild.premiumTier;
  let staticLimit = 50;
  let animatedLimit = 50;
  
  switch (premiumTier) {
    case 1:
      staticLimit = 100;
      animatedLimit = 100;
      break;
    case 2:
      staticLimit = 150;
      animatedLimit = 150;
      break;
    case 3:
      staticLimit = 250;
      animatedLimit = 250;
      break;
  }
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`Emoji Statistics for ${guild.name}`)
    .setColor(0xE74C3C)
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .addFields(
      { name: "Total Emojis", value: totalCount.toString(), inline: true },
      { name: "Static Emojis", value: `${staticCount}/${staticLimit} (${Math.floor((staticCount / staticLimit) * 100)}%)`, inline: true },
      { name: "Animated Emojis", value: `${animatedCount}/${animatedLimit} (${Math.floor((animatedCount / animatedLimit) * 100)}%)`, inline: true },
      { name: "Server Boost Level", value: `Level ${premiumTier}`, inline: true },
      { name: "Usage", value: "Use `!emojis list` to see all emojis or `!emojis info :emoji:` for details about a specific emoji.", inline: false }
    )
    .setFooter({ text: `Server ID: ${guild.id}` })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * List all emojis in the server
 */
async function listEmojis(interaction: CommandInteraction | Message, guild: Guild): Promise<any> {
  const emojis = guild.emojis.cache;
  
  if (emojis.size === 0) {
    return interaction.reply("This server doesn't have any custom emojis.");
  }
  
  // Group emojis by category (static/animated)
  const staticEmojis = emojis.filter(emoji => !emoji.animated);
  const animatedEmojis = emojis.filter(emoji => emoji.animated);
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`Emojis in ${guild.name}`)
    .setColor(0xE74C3C)
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .setFooter({ text: `Total emojis: ${emojis.size}` })
    .setTimestamp();
  
  // Add static emojis with proper formatting
  if (staticEmojis.size > 0) {
    // Display emojis with their names, grouped into chunks to avoid hitting character limits
    const staticChunks = chunkEmojis(staticEmojis, 20);
    let staticDescription = "";
    
    for (let i = 0; i < Math.min(staticChunks.length, 3); i++) {
      staticDescription += staticChunks[i].map(emoji => `${emoji} \`:${emoji.name}:\``).join(" ") + "\n";
    }
    
    if (staticChunks.length > 3) {
      staticDescription += `*...and ${staticEmojis.size - 60} more static emojis.*\n`;
    }
    
    embed.addFields({ name: `Static Emojis (${staticEmojis.size})`, value: staticDescription || "None", inline: false });
  }
  
  // Add animated emojis with proper formatting
  if (animatedEmojis.size > 0) {
    // Display emojis with their names, grouped into chunks to avoid hitting character limits
    const animatedChunks = chunkEmojis(animatedEmojis, 20);
    let animatedDescription = "";
    
    for (let i = 0; i < Math.min(animatedChunks.length, 3); i++) {
      animatedDescription += animatedChunks[i].map(emoji => `${emoji} \`:${emoji.name}:\``).join(" ") + "\n";
    }
    
    if (animatedChunks.length > 3) {
      animatedDescription += `*...and ${animatedEmojis.size - 60} more animated emojis.*\n`;
    }
    
    embed.addFields({ name: `Animated Emojis (${animatedEmojis.size})`, value: animatedDescription || "None", inline: false });
  }
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Get information about a specific emoji
 */
async function getEmojiInfo(interaction: CommandInteraction | Message, guild: Guild, emojiArg: string): Promise<any> {
  // Extract emoji ID from the argument
  const match = emojiArg.match(/<a?:([a-zA-Z0-9_]+):(\d+)>/);
  if (!match) {
    return interaction.reply("❌ Please provide a valid custom emoji. Example: `!emojis info :emoji:`");
  }
  
  const emojiName = match[1];
  const emojiId = match[2];
  const isAnimated = emojiArg.startsWith("<a:");
  
  // Try to find the emoji in the guild
  const emoji = guild.emojis.cache.get(emojiId);
  
  if (!emoji) {
    // If the emoji is not from this guild, try to fetch basic info
    const embed = new EmbedBuilder()
      .setTitle(`Emoji Information: ${emojiName}`)
      .setColor(0xE74C3C)
      .setDescription("This emoji is from another server.")
      .setThumbnail(`https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}?size=256`)
      .addFields(
        { name: "Name", value: emojiName, inline: true },
        { name: "ID", value: emojiId, inline: true },
        { name: "Animated", value: isAnimated ? "Yes" : "No", inline: true },
        { name: "URL", value: `[Link](https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}?size=256)`, inline: true }
      )
      .setFooter({ text: "Note: Limited information available for emojis from other servers" })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  }
  
  // Create embed with detailed info for guild emoji
  const embed = new EmbedBuilder()
    .setTitle(`Emoji Information: ${emoji.name}`)
    .setColor(0xE74C3C)
    .setThumbnail(emoji.url)
    .addFields(
      { name: "Name", value: emoji.name || "Unknown", inline: true },
      { name: "ID", value: emoji.id, inline: true },
      { name: "Animated", value: emoji.animated ? "Yes" : "No", inline: true },
      { name: "Created", value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Usage", value: `\`<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>\``, inline: true },
      { name: "URL", value: `[Link](${emoji.url})`, inline: true }
    )
    .setFooter({ text: `Server: ${guild.name}` })
    .setTimestamp();
  
  // Add who can use this emoji (roles with access)
  if (emoji.roles && emoji.roles.cache.size > 0) {
    const roles = emoji.roles.cache.map(role => role.name).join(", ");
    embed.addFields({ name: "Restricted to Roles", value: roles, inline: false });
  } else {
    embed.addFields({ name: "Available to", value: "Everyone", inline: false });
  }
  
  // Add server info where emoji is from
  embed.addFields({ name: "Server", value: guild.name, inline: true });
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Helper function to chunk emojis into groups
 */
function chunkEmojis(emojis: Collection<string, GuildEmoji>, size: number): GuildEmoji[][] {
  const chunks: GuildEmoji[][] = [];
  const emojiArray = Array.from(emojis.values());
  
  for (let i = 0; i < emojiArray.length; i += size) {
    chunks.push(emojiArray.slice(i, i + size));
  }
  
  return chunks;
}