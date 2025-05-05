
import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "backup",
  description: "Create a backup of server settings",
  category: "admin",
  aliases: ["saveconfig"],
  slash: false,
  prefix: true,
  cooldown: 60,
  permissions: ["Administrator"],
  
  async execute(interaction: Message) {
    try {
      const guildSettings = await storage.getGuildSettings(interaction.guild!.id);
      const backupData = {
        timestamp: new Date().toISOString(),
        settings: guildSettings,
        roles: [],
        channels: []
      };

      // Add roles data
      interaction.guild!.roles.cache.forEach(role => {
        if (!role.managed) {
          backupData.roles.push({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions.toArray()
          });
        }
      });

      // Add channels data
      interaction.guild!.channels.cache.forEach(channel => {
        backupData.channels.push({
          name: channel.name,
          type: channel.type,
          parent: channel.parent?.name
        });
      });

      // Save backup
      await storage.createBackup(interaction.guild!.id, backupData);

      const embed = new EmbedBuilder()
        .setTitle("✅ Backup Created")
        .setDescription("Server settings have been backed up successfully.")
        .addFields([
          { name: "Timestamp", value: backupData.timestamp, inline: true },
          { name: "Roles Saved", value: backupData.roles.length.toString(), inline: true },
          { name: "Channels Saved", value: backupData.channels.length.toString(), inline: true }
        ])
        .setColor("#00ff00")
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in backup command:", error);
      return interaction.reply("❌ Failed to create backup. Please try again later.");
    }
  }
} as DiscordCommand;
