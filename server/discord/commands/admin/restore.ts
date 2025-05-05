
import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "restore",
  description: "Restore a server backup",
  category: "admin",
  aliases: ["loadbackup"],
  slash: false,
  prefix: true,
  cooldown: 60,
  permissions: ["Administrator"],
  
  async execute(interaction: Message) {
    try {
      const backup = await storage.getLatestBackup(interaction.guild!.id);
      
      if (!backup) {
        return interaction.reply("❌ No backup found for this server.");
      }

      // Confirm restore
      const confirmEmbed = new EmbedBuilder()
        .setTitle("⚠️ Confirm Restore")
        .setDescription("Are you sure you want to restore the server settings from backup? This will overwrite current settings.")
        .addFields([
          { name: "Backup Date", value: backup.timestamp, inline: true },
          { name: "Roles", value: backup.roles.length.toString(), inline: true },
          { name: "Channels", value: backup.channels.length.toString(), inline: true }
        ])
        .setColor("#ff9900")
        .setFooter({ text: "Reply with 'confirm' within 30 seconds to proceed" });

      const confirmMsg = await interaction.reply({ embeds: [confirmEmbed] });
      
      try {
        const collected = await interaction.channel!.awaitMessages({
          filter: m => m.author.id === interaction.author.id && m.content.toLowerCase() === 'confirm',
          max: 1,
          time: 30000
        });

        if (collected.size === 0) {
          return interaction.reply("❌ Restore cancelled - No confirmation received.");
        }

        // Restore settings
        await storage.setGuildSettings(interaction.guild!.id, backup.settings);

        const embed = new EmbedBuilder()
          .setTitle("✅ Backup Restored")
          .setDescription("Server settings have been restored successfully.")
          .setColor("#00ff00")
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      } catch (error) {
        return interaction.reply("❌ Restore cancelled - Timed out.");
      }
    } catch (error) {
      console.error("Error in restore command:", error);
      return interaction.reply("❌ Failed to restore backup. Please try again later.");
    }
  }
} as DiscordCommand;
