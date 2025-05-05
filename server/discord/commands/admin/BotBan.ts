
import { CommandInteraction, Message, EmbedBuilder, User } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";
import { isOwner, handleOwnerOnlyCommand } from "../../utils/ownerCheck";
import { config } from "../../config";

export default {
  name: "botban",
  description: "Ban a user from using the bot (owner only)",
  category: "admin",
  aliases: ["banbot"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "user",
      description: "The user to ban from using the bot",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "Reason for the bot ban",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Verify this is being used by the bot owner
    const canContinue = await handleOwnerOnlyCommand(interaction, "botban");
    if (!canContinue) return;
    
    let targetUserId: string = "";
    let targetUser: User | null = null;
    let reason = "No reason provided";
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.get("user");
      if (userOption?.user) {
        targetUser = userOption.user;
        targetUserId = targetUser.id;
      } else {
        return interaction.reply({
          content: "❌ You must specify a valid user to ban.",
          ephemeral: true
        });
      }
      
      const reasonOption = interaction.options.get("reason");
      if (reasonOption?.value) {
        reason = String(reasonOption.value);
      }
      
      // Defer reply since storage operations might take time
      await interaction.deferReply();
    } else {
      // Handle message command
      if (!args || args.length < 1) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Command Usage")
              .setDescription("You must specify a user to ban from using the bot.")
              .addFields({ name: "Usage", value: "`!botban <user> [reason]`" })
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Parse user ID from mention or raw ID
      const userArg = args[0];
      
      // Check if it's a mention
      const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
      if (mentionMatch) {
        targetUserId = mentionMatch[1];
      } 
      // Check if it's a raw ID
      else if (/^\d+$/.test(userArg)) {
        targetUserId = userArg;
      } else {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid User")
              .setDescription("Please provide a valid user mention or ID.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Try to fetch user info
      try {
        targetUser = await interaction.client.users.fetch(targetUserId);
      } catch (error) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ User Not Found")
              .setDescription("Could not find a user with that ID.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Get reason if provided
      if (args.length > 1) {
        reason = args.slice(1).join(" ");
      }
    }
    
    // Prevent banning the bot owner
    if (isOwner(targetUser as User)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Cannot Ban Bot Owner")
        .setDescription("You cannot ban the bot owner from using the bot.")
        .setColor(0xFF0000);
      
      if (interaction instanceof CommandInteraction) {
        return await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        return await interaction.reply({ embeds: [errorEmbed] });
      }
    }
    
    // Prevent banning the bot itself
    if (targetUserId === interaction.client.user.id) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Cannot Ban Bot")
        .setDescription("You cannot ban the bot from using itself. That would be paradoxical!")
        .setColor(0xFF0000);
      
      if (interaction instanceof CommandInteraction) {
        return await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        return await interaction.reply({ embeds: [errorEmbed] });
      }
    }
    
    try {
      // Check if user is already banned
      const existingBan = await storage.getBotBan(targetUserId);
      if (existingBan) {
        const alreadyBannedEmbed = new EmbedBuilder()
          .setTitle("⚠️ User Already Banned")
          .setDescription(`${targetUser?.tag || targetUserId} is already banned from using the bot.`)
          .addFields(
            { name: "Banned By", value: `<@${existingBan.bannedBy}>`, inline: true },
            { name: "Banned At", value: new Date(existingBan.bannedAt).toLocaleString(), inline: true },
            { name: "Reason", value: existingBan.reason }
          )
          .setColor(0xFFA500);
        
        if (interaction instanceof CommandInteraction) {
          return await interaction.editReply({ embeds: [alreadyBannedEmbed] });
        } else {
          return await interaction.reply({ embeds: [alreadyBannedEmbed] });
        }
      }
      
      // Store bot ban in database
      const banningUser = interaction instanceof CommandInteraction ? 
        interaction.user : interaction.author;
      
      await storage.createBotBan({
        userId: targetUserId,
        reason: reason,
        bannedBy: banningUser.id,
        bannedAt: new Date()
      });
      
      // Build success response
      const successEmbed = new EmbedBuilder()
        .setTitle("✅ User Bot Banned")
        .setDescription(`**${targetUser?.tag || targetUserId}** has been banned from using the bot.`)
        .addFields(
          { name: "User ID", value: targetUserId, inline: true },
          { name: "Banned By", value: banningUser.tag, inline: true },
          { name: "Reason", value: reason }
        )
        .setColor(0x2ECC71)
        .setTimestamp();
      
      if (targetUser?.avatar) {
        successEmbed.setThumbnail(targetUser.displayAvatarURL({ size: 128 }));
      }
      
      // Send response
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [successEmbed] });
      } else {
        await interaction.reply({ embeds: [successEmbed] });
      }
      
      // Optionally notify the banned user via DM
      try {
        if (targetUser) {
          const dmEmbed = new EmbedBuilder()
            .setTitle("🚫 You've Been Banned From Using the Bot")
            .setDescription(`You have been banned from using **${interaction.client.user.tag}**.`)
            .addFields(
              { name: "Banned By", value: banningUser.tag, inline: true },
              { name: "Reason", value: reason },
              { name: "Appeal", value: "If you believe this is a mistake, you can contact the bot owner." }
            )
            .setColor(0xFF0000)
            .setTimestamp();
          
          await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
            // Silently fail if we can't DM the user
          });
        }
      } catch (error) {
        // Ignore errors with DMing users
      }
    } catch (error) {
      console.error("[BOT BAN ERROR]", error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("An error occurred while trying to ban the user from the bot.")
        .setColor(0xFF0000);
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed] });
      }
    }
  }
} as DiscordCommand;
