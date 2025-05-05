import { CommandInteraction, Message, EmbedBuilder, TextChannel } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "automessage",
  description: "Configure automatic recurring messages",
  category: "admin",
  aliases: ["am"],
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
      return interaction.reply("Usage: !automessage <add/remove/list> [channel] [interval] [message]");
    }

    const subcommand = args[0].toLowerCase();
    const guildId = interaction.guild.id;

    if (subcommand === "list") {
      const messages = await storage.getAutoMessages(guildId);

      if (!messages || messages.length === 0) {
        return interaction.reply("No automatic messages configured for this server");
      }

      const embed = new EmbedBuilder()
        .setTitle("📬 Automatic Messages")
        .setColor(0x3498db)
        .setTimestamp();

      for (const msg of messages) {
        embed.addFields([{
          name: `Message in <#${msg.channelId}>`,
          value: `**Interval:** ${msg.interval} minutes\n**Message:** ${msg.content}`
        }]);
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "add") {
      if (args.length < 4) {
        return interaction.reply("❌ Please provide channel, interval (minutes), and message");
      }

      const channel = interaction.guild.channels.cache.find(c => 
        c.id === args[1].replace(/[<#>]/g, "") ||
        (c.name === args[1] && c.type === 0)
      ) as TextChannel;

      if (!channel || channel.type !== 0) {
        return interaction.reply("❌ Invalid text channel");
      }

      const interval = parseInt(args[2]);
      if (isNaN(interval) || interval < 1) {
        return interaction.reply("❌ Interval must be a positive number in minutes");
      }

      const message = args.slice(3).join(" ");
      if (message.length > 2000) {
        return interaction.reply("❌ Message cannot be longer than 2000 characters");
      }

      try {
        await storage.addAutoMessage(guildId, {
          channelId: channel.id,
          interval,
          content: message
        });
        return interaction.reply(`✅ Added automatic message in ${channel.name}`);
      } catch (error) {
        return interaction.reply("❌ Failed to add automatic message");
      }
    }

    if (subcommand === "remove") {
      if (!args[1]) {
        return interaction.reply("❌ Please specify a channel");
      }

      const channel = interaction.guild.channels.cache.find(c => 
        c.id === args[1].replace(/[<#>]/g, "") ||
        (c.name === args[1] && c.type === 0)
      );

      if (!channel) {
        return interaction.reply("❌ Channel not found");
      }

      try {
        await storage.removeAutoMessage(guildId, channel.id);
        return interaction.reply(`✅ Removed automatic message from ${channel.name}`);
      } catch (error) {
        return interaction.reply("❌ No automatic message found for this channel");
      }
    }

    return interaction.reply("❌ Invalid subcommand. Use add, remove, or list");
  }
} as DiscordCommand;