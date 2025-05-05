import { CommandInteraction, Message, EmbedBuilder, Role } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "autorole",
  description: "Configure roles that are automatically assigned to new members",
  category: "admin",
  aliases: ["ar"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageRoles"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!interaction.guild) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !autorole <add/remove/list> [role]");
    }

    const subcommand = args[0].toLowerCase();
    const guildId = interaction.guild.id;

    if (subcommand === "list") {
      const autoroles = await storage.getAutoRoles(guildId);

      if (!autoroles || autoroles.length === 0) {
        return interaction.reply("No autoroles configured for this server");
      }

      const embed = new EmbedBuilder()
        .setTitle("📋 Auto Roles")
        .setDescription(autoroles.map(role => `<@&${role}>`).join("\n"))
        .setColor(0x3498db)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "add") {
      if (!args[1]) {
        return interaction.reply("❌ Please specify a role to add");
      }

      const role = interaction.guild.roles.cache.find(r => 
        r.name.toLowerCase() === args.slice(1).join(" ").toLowerCase() ||
        r.id === args[1].replace(/[<@&>]/g, "")
      );

      if (!role) {
        return interaction.reply("❌ Role not found");
      }

      if (role.managed || role.position >= interaction.guild.members.me!.roles.highest.position) {
        return interaction.reply("❌ I cannot manage this role");
      }

      try {
        await storage.addAutoRole(guildId, role.id);
        return interaction.reply(`✅ Added ${role.name} to autoroles`);
      } catch (error) {
        return interaction.reply("❌ This role is already in the autorole list");
      }
    }

    if (subcommand === "remove") {
      if (!args[1]) {
        return interaction.reply("❌ Please specify a role to remove");
      }

      const role = interaction.guild.roles.cache.find(r => 
        r.name.toLowerCase() === args.slice(1).join(" ").toLowerCase() ||
        r.id === args[1].replace(/[<@&>]/g, "")
      );

      if (!role) {
        return interaction.reply("❌ Role not found");
      }

      try {
        await storage.removeAutoRole(guildId, role.id);
        return interaction.reply(`✅ Removed ${role.name} from autoroles`);
      } catch (error) {
        return interaction.reply("❌ This role is not in the autorole list");
      }
    }

    return interaction.reply("❌ Invalid subcommand. Use add, remove, or list");
  }
} as DiscordCommand;