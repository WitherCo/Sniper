import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import axios from "axios";

export default {
  name: "weather",
  description: "Get current weather information for a location",
  category: "utility",
  aliases: ["forecast", "temp"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: [],
  options: [
    {
      name: "location",
      description: "City or location to get weather for",
      type: "STRING",
      required: true
    },
    {
      name: "units",
      description: "Units of measurement",
      type: "STRING",
      required: false,
      choices: [
        { name: "Metric (°C, km/h)", value: "metric" },
        { name: "Imperial (°F, mph)", value: "imperial" }
      ]
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get API key from environment variables
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!OPENWEATHER_API_KEY) {
      return interaction.reply({
        content: "⚠️ Weather command is not configured. The bot owner needs to set up the OpenWeatherMap API key.",
        ephemeral: true
      });
    }
    
    let location = "";
    let units = "metric"; // Default to metric units
    
    if (interaction instanceof CommandInteraction) {
      // Get location and units from slash command options
      location = interaction.options.getString("location") || "";
      const unitsOption = interaction.options.getString("units");
      if (unitsOption) units = unitsOption;
    } else {
      // Parse message command arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please specify a location. Example: `!weather London` or `!weather New York, US`",
          ephemeral: true
        });
      }
      
      // Check if the last argument is a units specification
      if (args.length > 1 && ["metric", "imperial"].includes(args[args.length - 1].toLowerCase())) {
        units = args.pop()!.toLowerCase();
        location = args.join(" ");
      } else {
        location = args.join(" ");
      }
    }
    
    try {
      // Send initial response
      let response;
      if (interaction instanceof CommandInteraction) {
        await interaction.deferReply();
      } else {
        response = await interaction.reply({ content: "🔍 Looking up weather information..." });
      }
      
      // Fetch weather data
      const weather = await getWeatherData(location, units, OPENWEATHER_API_KEY);
      
      // Create weather embed
      const embed = createWeatherEmbed(weather, units);
      
      // Send or update response
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [embed] });
      } else if (response) {
        await response.edit({ content: null, embeds: [embed] });
      }
    } catch (error: any) {
      const errorMessage = error.response?.status === 404
        ? `❌ Location "${location}" not found. Please check the spelling or try a different location.`
        : `❌ Error fetching weather data: ${error.message || "Unknown error"}`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage });
      }
    }
  }
} as DiscordCommand;

/**
 * Fetches weather data from OpenWeatherMap API
 */
async function getWeatherData(location: string, units: string, apiKey: string): Promise<any> {
  const encodedLocation = encodeURIComponent(location);
  const endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${encodedLocation}&units=${units}&appid=${apiKey}`;
  
  const response = await axios.get(endpoint);
  return response.data;
}

/**
 * Creates an embed with formatted weather information
 */
function createWeatherEmbed(data: any, units: string): EmbedBuilder {
  // Extract relevant data
  const { name, sys, main, weather, wind, clouds, visibility, dt } = data;
  const weatherCondition = weather[0];
  
  // Format temperature info
  const tempUnit = units === "metric" ? "°C" : "°F";
  const speedUnit = units === "metric" ? "m/s" : "mph";
  const visibilityKm = (visibility / 1000).toFixed(1);
  const visibilityMi = (visibility / 1609).toFixed(1);
  
  // Format country
  const country = sys.country ? `, ${sys.country}` : "";
  
  // Get weather icon URL
  const iconUrl = `https://openweathermap.org/img/wn/${weatherCondition.icon}@2x.png`;
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`Weather in ${name}${country}`)
    .setColor(getWeatherColor(weatherCondition.id))
    .setThumbnail(iconUrl)
    .addFields(
      { 
        name: "Temperature", 
        value: `🌡️ **${main.temp.toFixed(1)}${tempUnit}**\nFeels like: ${main.feels_like.toFixed(1)}${tempUnit}`, 
        inline: true 
      },
      { 
        name: "Condition", 
        value: `**${weatherCondition.main}**\n${weatherCondition.description}`, 
        inline: true 
      },
      { 
        name: "Range", 
        value: `High: ${main.temp_max.toFixed(1)}${tempUnit}\nLow: ${main.temp_min.toFixed(1)}${tempUnit}`, 
        inline: true 
      },
      { 
        name: "Humidity & Pressure", 
        value: `💧 Humidity: ${main.humidity}%\n🔄 Pressure: ${main.pressure} hPa`, 
        inline: true 
      },
      { 
        name: "Wind", 
        value: `💨 Speed: ${wind.speed} ${speedUnit}\n🧭 Direction: ${getWindDirection(wind.deg)}`, 
        inline: true 
      },
      { 
        name: "Visibility & Clouds", 
        value: `👁️ Visibility: ${units === "metric" ? visibilityKm + " km" : visibilityMi + " mi"}\n☁️ Cloudiness: ${clouds.all}%`, 
        inline: true 
      }
    )
    .setFooter({ text: `Last updated` })
    .setTimestamp(dt * 1000);
  
  // Add sunrise and sunset if available
  if (sys.sunrise && sys.sunset) {
    const sunriseTime = new Date(sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    embed.addFields({
      name: "Sun",
      value: `🌅 Rise: ${sunriseTime}\n🌇 Set: ${sunsetTime}`,
      inline: false
    });
  }
  
  return embed;
}

/**
 * Determines embed color based on weather condition code
 */
function getWeatherColor(conditionCode: number): number {
  // Thunderstorm
  if (conditionCode >= 200 && conditionCode < 300) {
    return 0x5D576B; // Dark purple
  }
  // Drizzle or Rain
  else if ((conditionCode >= 300 && conditionCode < 400) || 
           (conditionCode >= 500 && conditionCode < 600)) {
    return 0x4895EF; // Blue
  }
  // Snow
  else if (conditionCode >= 600 && conditionCode < 700) {
    return 0xAFBCFF; // Light blue
  }
  // Atmosphere (fog, mist, etc)
  else if (conditionCode >= 700 && conditionCode < 800) {
    return 0x9D9D9D; // Gray
  }
  // Clear
  else if (conditionCode === 800) {
    return 0xFFC857; // Yellow
  }
  // Clouds
  else if (conditionCode > 800) {
    return 0x6B818C; // Slate gray
  }
  // Default
  else {
    return 0x3498DB; // Default blue
  }
}

/**
 * Converts wind direction in degrees to cardinal direction
 */
function getWindDirection(degrees: number): string {
  const directions = [
    "N", "NNE", "NE", "ENE", 
    "E", "ESE", "SE", "SSE", 
    "S", "SSW", "SW", "WSW", 
    "W", "WNW", "NW", "NNW"
  ];
  
  // Convert degrees to index in the directions array
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}