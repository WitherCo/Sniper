import { CommandInteraction, Message, EmbedBuilder, Role } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "roleinfo",
  description: "Display information about a role",
  category: "utility",
  aliases: ["rinfo"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const role = interaction.mentions.roles.first() || 
                 interaction.guild?.roles.cache.find(r => r.name.toLowerCase() === args?.join(" ").toLowerCase()) ||
                 interaction.guild?.roles.cache.get(args?.[0] || "");

    if (!role) {
      return interaction.reply("❌ Please provide a valid role (mention, ID, or name)");
    }

    const permissions = role.permissions.toArray().map(perm => 
      perm.toLowerCase()
         .replace(/_/g, " ")
         .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    );

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x3498db)
      .setTitle(`Role Information: ${role.name}`)
      .addFields([
        { name: "🆔 ID", value: role.id, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "👥 Members", value: role.members.size.toString(), inline: true },
        { name: "🎨 Color", value: role.hexColor, inline: true },
        { name: "📊 Position", value: role.position.toString(), inline: true },
        { name: "🔒 Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "🎭 Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "🔑 Permissions", value: permissions.join(", ") || "None" }
      ]);

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;