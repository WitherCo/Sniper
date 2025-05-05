
import { CommandInteraction, Message, Role, ColorResolvable, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "rolemanager",
  description: "Manage server roles",
  category: "admin",
  aliases: ["rolemgr"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageRoles"],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply(
        "Usage:\n" +
        "!rolemanager create <name> [color] [hoist]\n" +
        "!rolemanager delete <role>\n" +
        "!rolemanager edit <role> <color|hoist|name> <value>"
      );
    }

    const subcommand = args[0].toLowerCase();

    try {
      switch (subcommand) {
        case "create": {
          const name = args[1];
          const color = args[2] as ColorResolvable || "Default";
          const hoist = args[3]?.toLowerCase() === "true";

          const newRole = await interaction.guild?.roles.create({
            name,
            color,
            hoist,
            reason: `Role created by ${interaction.author.tag}`
          });

          return interaction.reply(`✅ Created role ${newRole?.name}`);
        }

        case "delete": {
          const role = interaction.mentions.roles.first() ||
            interaction.guild?.roles.cache.get(args[1]);

          if (!role) {
            return interaction.reply("❌ Please specify a valid role");
          }

          await role.delete(`Role deleted by ${interaction.author.tag}`);
          return interaction.reply(`✅ Deleted role ${role.name}`);
        }

        case "edit": {
          const role = interaction.mentions.roles.first() ||
            interaction.guild?.roles.cache.get(args[1]);

          if (!role) {
            return interaction.reply("❌ Please specify a valid role");
          }

          const property = args[2]?.toLowerCase();
          const value = args[3];

          if (!property || !value) {
            return interaction.reply("❌ Please specify what to edit and the new value");
          }

          switch (property) {
            case "color":
              await role.setColor(value as ColorResolvable);
              break;
            case "name":
              await role.setName(value);
              break;
            case "hoist":
              await role.setHoist(value.toLowerCase() === "true");
              break;
            default:
              return interaction.reply("❌ Invalid property. Use: color, name, or hoist");
          }

          return interaction.reply(`✅ Updated role ${role.name}`);
        }

        default:
          return interaction.reply("❌ Invalid subcommand. Use: create, delete, or edit");
      }
    } catch (error) {
      console.error("[ROLE MANAGER ERROR]", error);
      return interaction.reply("❌ Failed to manage role. Please check my permissions.");
    }
  }
} as DiscordCommand;
