
import { CommandInteraction, Message, EmbedBuilder, PermissionsBitField } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "setpermissions",
  description: "Set command permissions",
  category: "admin",
  aliases: ["setperms"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !setpermissions <command> <role/user> [allow/deny]");
    }

    const commandName = args[0].toLowerCase();
    const targetId = args[1].replace(/[<@&>]/g, "");
    const action = args[2]?.toLowerCase() || "allow";

    try {
      const command = await storage.getCommand(commandName);
      if (!command) {
        return interaction.reply("❌ Command not found");
      }

      const permissions = await storage.getCommandPermissions(commandName) || {
        allowed: [],
        denied: [],
      };

      if (action === "allow") {
        if (permissions.allowed.includes(targetId)) {
          return interaction.reply("❌ Target already has permission");
        }
        permissions.allowed.push(targetId);
        permissions.denied = permissions.denied.filter(id => id !== targetId);
      } else if (action === "deny") {
        if (permissions.denied.includes(targetId)) {
          return interaction.reply("❌ Target already denied permission");
        }
        permissions.denied.push(targetId);
        permissions.allowed = permissions.allowed.filter(id => id !== targetId);
      } else {
        return interaction.reply("❌ Invalid action. Use allow or deny");
      }

      await storage.setCommandPermissions(commandName, permissions);

      const embed = new EmbedBuilder()
        .setTitle("✅ Command Permissions Updated")
        .setDescription(`Updated permissions for ${commandName}`)
        .addFields(
          { name: "Target", value: `<@&${targetId}>` },
          { name: "Action", value: action },
        )
        .setColor(0x00ff00)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[SETPERMISSIONS ERROR]", error);
      return interaction.reply("❌ Failed to update command permissions");
    }
  }
} as DiscordCommand;
