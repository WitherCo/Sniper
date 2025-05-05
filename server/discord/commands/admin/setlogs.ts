
import { CommandInteraction, Message, TextChannel, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "setlogs",
  description: "Configure logging channels",
  category: "admin",
  aliases: ["logs"],
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

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !setlogs <moderation/server/member/message> <#channel/disable>");
    }

    const logType = args[0].toLowerCase();
    const channelArg = args[1].toLowerCase();
    const guildId = interaction.guild.id;

    const validTypes = ["moderation", "server", "member", "message"];
    if (!validTypes.includes(logType)) {
      return interaction.reply("❌ Invalid log type. Use moderation, server, member, or message");
    }

    if (channelArg === "disable") {
      try {
        const config = await storage.getLogConfig(guildId) || {};
        delete config[logType];
        await storage.setLogConfig(guildId, config);
        return interaction.reply(`✅ ${logType} logs disabled`);
      } catch (error) {
        return interaction.reply("❌ Failed to disable logs");
      }
    }

    const channel = interaction.guild.channels.cache.find(c => 
      c.id === channelArg.replace(/[<#>]/g, "") ||
      (c.name === channelArg && c.type === 0)
    ) as TextChannel;

    if (!channel || channel.type !== 0) {
      return interaction.reply("❌ Invalid text channel");
    }

    try {
      const config = await storage.getLogConfig(guildId) || {};
      config[logType] = channel.id;
      await storage.setLogConfig(guildId, config);

      const embed = new EmbedBuilder()
        .setTitle("📝 Log Channel Set")
        .setDescription(`${logType} logs will now be sent to ${channel}`)
        .setColor(0x3498db)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply("❌ Failed to set log channel");
    }
  }
} as DiscordCommand;
