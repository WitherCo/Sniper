import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "tag",
  description: "Create or display custom response tags",
  category: "utility",
  aliases: ["tags"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage:\n!tag create <name> <content>\n!tag delete <name>\n!tag <name>\n!tag list");
    }

    const subcommand = args[0].toLowerCase();
    const guildId = interaction.guild?.id;

    if (!guildId) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    if (subcommand === "list") {
      const tags = await storage.getTags(guildId);
      
      if (!tags || tags.length === 0) {
        return interaction.reply("No tags found in this server");
      }

      const embed = new EmbedBuilder()
        .setTitle("📑 Server Tags")
        .setDescription(tags.map(t => `\`${t.name}\``).join(", "))
        .setColor(0x3498db)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "create") {
      if (!interaction.member?.permissions.has("ManageMessages")) {
        return interaction.reply("❌ You need the Manage Messages permission to create tags");
      }

      if (args.length < 3) {
        return interaction.reply("Usage: !tag create <name> <content>");
      }

      const name = args[1].toLowerCase();
      const content = args.slice(2).join(" ");

      if (name.length > 32) {
        return interaction.reply("❌ Tag name cannot be longer than 32 characters");
      }

      if (content.length > 2000) {
        return interaction.reply("❌ Tag content cannot be longer than 2000 characters");
      }

      try {
        await storage.createTag(guildId, name, content);
        return interaction.reply(`✅ Created tag: ${name}`);
      } catch (error) {
        return interaction.reply("❌ A tag with that name already exists");
      }
    }

    if (subcommand === "delete") {
      if (!interaction.member?.permissions.has("ManageMessages")) {
        return interaction.reply("❌ You need the Manage Messages permission to delete tags");
      }

      if (args.length < 2) {
        return interaction.reply("Usage: !tag delete <name>");
      }

      const name = args[1].toLowerCase();

      try {
        await storage.deleteTag(guildId, name);
        return interaction.reply(`✅ Deleted tag: ${name}`);
      } catch (error) {
        return interaction.reply("❌ Tag not found");
      }
    }

    // Display tag
    const name = args[0].toLowerCase();
    const tag = await storage.getTag(guildId, name);

    if (!tag) {
      return interaction.reply("❌ Tag not found");
    }

    return interaction.reply(tag.content);
  }
} as DiscordCommand;
