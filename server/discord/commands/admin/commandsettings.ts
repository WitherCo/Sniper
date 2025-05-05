import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "commandsettings",
  description: "Configure command-specific settings",
  category: "admin",
  aliases: ["cmdconfig", "cmdset"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  
  async execute(interaction: Message, args?: string[]) {
    if (!args || args.length < 2) {
      return interaction.reply("Usage: !commandsettings <command> <setting> <value>");
    }

    const [commandName, setting, ...value] = args;
    const settingValue = value.join(" ");

    try {
      const command = await storage.getCommand(commandName);
      
      if (!command) {
        return interaction.reply(`❌ Command "${commandName}" not found.`);
      }

      // Update command settings
      const validSettings = ["cooldown", "enabled", "permissions"];
      if (!validSettings.includes(setting)) {
        return interaction.reply(`❌ Invalid setting. Valid settings: ${validSettings.join(", ")}`);
      }

      const updatedSettings = { ...command };

      switch (setting) {
        case "cooldown":
          const cooldown = parseInt(settingValue);
          if (isNaN(cooldown) || cooldown < 0) {
            return interaction.reply("❌ Cooldown must be a positive number.");
          }
          updatedSettings.cooldown = cooldown;
          break;

        case "enabled":
          updatedSettings.enabled = settingValue.toLowerCase() === "true";
          break;

        case "permissions":
          const perms = settingValue.split(",").map(p => p.trim());
          const validPerms = Object.keys(PermissionFlagsBits);
          const invalidPerms = perms.filter(p => !validPerms.includes(p));
          
          if (invalidPerms.length > 0) {
            return interaction.reply(`❌ Invalid permissions: ${invalidPerms.join(", ")}`);
          }
          updatedSettings.permissions = perms;
          break;
      }

      await storage.updateCommand(commandName, updatedSettings);

      const embed = new EmbedBuilder()
        .setTitle("✅ Command Settings Updated")
        .setDescription(`Settings updated for command: ${commandName}`)
        .addFields([
          { name: "Setting", value: setting, inline: true },
          { name: "New Value", value: settingValue, inline: true }
        ])
        .setColor("#00ff00")
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in commandsettings:", error);
      return interaction.reply("❌ Failed to update command settings.");
    }
  }
} as DiscordCommand;
