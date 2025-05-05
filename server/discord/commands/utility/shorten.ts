import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import axios from "axios";

export default {
  name: "shorten",
  description: "Shorten a long URL",
  category: "utility",
  aliases: ["shortenurl", "urlshorten", "tinyurl"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "url",
      description: "The long URL to shorten",
      type: "STRING",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let url = "";
    
    if (interaction instanceof CommandInteraction) {
      // Get URL from slash command options
      url = interaction.options.getString("url") || "";
    } else {
      // Parse message command arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please provide a URL to shorten. Example: `!shorten https://example.com/very/long/url/that/needs/shortening`",
          ephemeral: true
        });
      }
      
      url = args[0];
    }
    
    // Validate URL
    if (!isValidUrl(url)) {
      return interaction.reply({
        content: "❌ Please provide a valid URL including the protocol (http:// or https://).",
        ephemeral: true
      });
    }
    
    try {
      // Send initial response
      let response;
      if (interaction instanceof CommandInteraction) {
        await interaction.deferReply();
      } else {
        response = await interaction.reply({ content: "🔄 Shortening URL..." });
      }
      
      // Shorten the URL
      const shortenedUrl = await shortenUrl(url);
      
      // Create result embed
      const embed = createResultEmbed(url, shortenedUrl);
      
      // Send the result
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [embed] });
      } else if (response) {
        await response.edit({ content: null, embeds: [embed] });
      }
    } catch (error) {
      const errorMessage = `❌ Error shortening URL: ${(error as Error).message || "Unknown error"}`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage });
      }
    }
  }
} as DiscordCommand;

/**
 * Check if a string is a valid URL
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

/**
 * Shorten a URL using TinyURL API
 */
async function shortenUrl(longUrl: string): Promise<string> {
  try {
    // Using TinyURL's simple API
    const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to shorten URL: ${error.message}`);
    } else {
      throw error;
    }
  }
}

/**
 * Create an embed with the shortened URL result
 */
function createResultEmbed(originalUrl: string, shortenedUrl: string): EmbedBuilder {
  // Truncate original URL if too long for display
  const truncatedOriginal = originalUrl.length > 100 
    ? `${originalUrl.substring(0, 97)}...` 
    : originalUrl;
  
  return new EmbedBuilder()
    .setTitle("🔗 URL Shortened")
    .setColor(0x3498DB)
    .addFields(
      { name: "Original URL", value: `\`${truncatedOriginal}\`` },
      { name: "Shortened URL", value: shortenedUrl }
    )
    .setFooter({ text: "Powered by TinyURL" })
    .setTimestamp();
}