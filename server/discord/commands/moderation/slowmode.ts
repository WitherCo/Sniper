import { CommandInteraction, Message, EmbedBuilder, TextChannel, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "slowmode",
  description: "Set slow mode in a channel to limit message frequency",
  category: "moderation",
  aliases: ["slow", "ratelimit"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageChannels"],
  options: [
    {
      name: "seconds",
      description: "The slow mode duration in seconds (0 to disable)",
      type: "INTEGER",
      required: true
    },
    {
      name: "reason",
      description: "Reason for setting slow mode",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    try {
      let seconds = 0;
      let reason = "No reason specified";
      let channel: TextChannel | null = null;
      
      // Parse arguments based on interaction type
      if (interaction instanceof CommandInteraction) {
        const secondsOption = interaction.options.get("seconds");
        if (secondsOption?.value !== undefined) {
          seconds = Number(secondsOption.value);
        }
        
        const reasonOption = interaction.options.get("reason");
        if (reasonOption?.value) {
          reason = String(reasonOption.value);
        }
        
        // Ensure channel is a text channel
        if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
          channel = interaction.channel as TextChannel;
        }
      } else {
        // Handle message command
        if (!args || args.length === 0) {
          return interaction.reply("❌ Please specify a duration in seconds. Use 0 to disable slowmode.");
        }
        
        // Parse seconds
        seconds = parseInt(args[0]);
        if (isNaN(seconds)) {
          return interaction.reply("❌ Please provide a valid number for slowmode duration.");
        }
        
        // Parse reason if provided
        if (args.length > 1) {
          reason = args.slice(1).join(" ");
        }
        
        // Ensure channel is a text channel
        if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
          channel = interaction.channel as TextChannel;
        }
      }
      
      // Check if we have a valid channel
      if (!channel) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ Invalid Channel")
          .setDescription("Slow mode can only be set in text channels within a server.")
          .setColor(0xE74C3C);
          
        if (interaction instanceof CommandInteraction) {
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        } else {
          return await interaction.reply({ embeds: [errorEmbed] });
        }
      }
      
      // Check bot permissions
      const botMember = channel.guild.members.cache.get(interaction.client.user.id);
      if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels)) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ Missing Permissions")
          .setDescription("I don't have permission to manage channels in this server.")
          .setColor(0xE74C3C);
          
        if (interaction instanceof CommandInteraction) {
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        } else {
          return await interaction.reply({ embeds: [errorEmbed] });
        }
      }
      
      // Validate the seconds value (Discord limits: 0-21600 seconds)
      if (seconds < 0 || seconds > 21600) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ Invalid Duration")
          .setDescription("Slow mode can be set between 0 and 21600 seconds (6 hours).")
          .setColor(0xE74C3C);
          
        if (interaction instanceof CommandInteraction) {
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        } else {
          return await interaction.reply({ embeds: [errorEmbed] });
        }
      }
      
      // Format duration for the response
      const formattedDuration = formatDuration(seconds);

      // Apply the slow mode to the channel
      await channel.setRateLimitPerUser(seconds, reason);
      
      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setTitle(seconds === 0 ? "🕒 Slow Mode Disabled" : "🕒 Slow Mode Enabled")
        .setColor(0x2ECC71);
      
      if (seconds === 0) {
        successEmbed.setDescription(`Slow mode has been disabled in ${channel}.`);
      } else {
        successEmbed
          .setDescription(`Slow mode has been set to **${formattedDuration}** in ${channel}.`)
          .addFields({ name: "Reason", value: reason });
      }
      
      // Send response
      if (interaction instanceof CommandInteraction) {
        await interaction.reply({ embeds: [successEmbed] });
      } else {
        await interaction.reply({ embeds: [successEmbed] });
      }
      
      // Log the action to the channel
      if (seconds > 0) {
        const notificationEmbed = new EmbedBuilder()
          .setTitle("🕒 Slow Mode Activated")
          .setDescription(`A moderator has set slow mode in this channel.`)
          .addFields(
            { name: "Duration", value: formattedDuration, inline: true },
            { name: "Moderator", value: interaction instanceof CommandInteraction ? interaction.user.tag : interaction.author.tag, inline: true },
            { name: "Reason", value: reason }
          )
          .setColor(0x3498DB)
          .setTimestamp();
        
        // Only send notification if it's not already the response to a prefix command
        if (interaction instanceof CommandInteraction) {
          await channel.send({ embeds: [notificationEmbed] });
        }
      }
    } catch (error) {
      console.error("Error in slowmode command:", error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("There was an error setting the slow mode. Please try again later.")
        .setColor(0xE74C3C);
      
      if (interaction instanceof CommandInteraction) {
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return await interaction.reply({ embeds: [errorEmbed] });
      }
    }
  }
} as DiscordCommand;

// Helper function to format duration in a human-readable format
function formatDuration(seconds: number): string {
  if (seconds === 0) return "0 seconds";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  if (remainingSeconds > 0) {
    parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
  }
  
  return parts.join(', ');
}
