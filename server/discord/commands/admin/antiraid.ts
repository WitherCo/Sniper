
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "antiraid",
  description: "Configure anti-raid protection settings",
  category: "admin",
  aliases: ["raid"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!interaction.guild) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !antiraid <enable/disable/settings> [options]");
    }

    const subcommand = args[0].toLowerCase();
    const guildId = interaction.guild.id;

    if (subcommand === "enable") {
      try {
        await storage.setAntiRaidConfig(guildId, {
          enabled: true,
          joinThreshold: 5,
          joinTimeWindow: 10,
          action: "kick"
        });
        return interaction.reply("✅ Anti-raid protection enabled");
      } catch (error) {
        return interaction.reply("❌ Failed to enable anti-raid protection");
      }
    }

    if (subcommand === "disable") {
      try {
        await storage.setAntiRaidConfig(guildId, { enabled: false });
        return interaction.reply("✅ Anti-raid protection disabled");
      } catch (error) {
        return interaction.reply("❌ Failed to disable anti-raid protection");
      }
    }

    if (subcommand === "settings") {
      try {
        const config = await storage.getAntiRaidConfig(guildId);
        if (!config) {
          return interaction.reply("❌ Anti-raid configuration not found");
        }

        const embed = new EmbedBuilder()
          .setTitle("🛡️ Anti-Raid Settings")
          .addFields([
            { name: "Status", value: config.enabled ? "Enabled" : "Disabled" },
            { name: "Join Threshold", value: config.joinThreshold?.toString() || "5" },
            { name: "Time Window", value: `${config.joinTimeWindow || "10"} seconds` },
            { name: "Action", value: config.action || "kick" }
          ])
          .setColor(0x3498db)
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      } catch (error) {
        return interaction.reply("❌ Failed to fetch anti-raid settings");
      }
    }

    return interaction.reply("❌ Invalid subcommand. Use enable, disable, or settings");
  }
} as DiscordCommand;
