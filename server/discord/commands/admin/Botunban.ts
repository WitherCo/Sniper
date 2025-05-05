
import { CommandInteraction, Message, EmbedBuilder, User } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";
import { handleOwnerOnlyCommand } from "../../utils/ownerCheck";

export default {
  name: "botunban",
  description: "Unban a user from using the bot (owner only)",
  category: "admin",
  aliases: ["bub", "unbanbot"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "user",
      description: "The user to unban from using the bot",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "Reason for unbanning",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Verify this is being used by the bot owner
    const canContinue = await handleOwnerOnlyCommand(interaction, "botunban");
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
          content: "❌ You must specify a valid user to unban.",
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
              .setDescription("You must specify a user to unban from using the bot.")
              .addFields({ name: "Usage", value: "`!botunban <user> [reason]`" })
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
        // Continue even if user isn't found, as they might have left Discord
        console.log("Could not fetch user details:", error);
      }
      
      // Get reason if provided
      if (args.length > 1) {
        reason = args.slice(1).join(" ");
      }
    }
    
    try {
      // Check if user is actually banned
      const existingBan = await storage.getBotBan(targetUserId);
      if (!existingBan) {
        const notBannedEmbed = new EmbedBuilder()
          .setTitle("ℹ️ User Not Banned")
          .setDescription(`${targetUser?.tag || targetUserId} is not currently banned from using the bot.`)
          .setColor(0x3498DB);
        
        if (interaction instanceof CommandInteraction) {
          return await interaction.editReply({ embeds: [notBannedEmbed] });
        } else {
          return await interaction.reply({ embeds: [notBannedEmbed] });
        }
      }
      
      // Remove bot ban from database
      await storage.removeBotBan(targetUserId);
      
      // Build success response
      const successEmbed = new EmbedBuilder()
        .setTitle("✅ User Unbanned")
        .setDescription(`**${targetUser?.tag || targetUserId}** has been unbanned from using the bot.`)
        .addFields(
          { name: "User ID", value: targetUserId, inline: true },
          { name: "Unbanned By", value: interaction instanceof CommandInteraction ? 
            interaction.user.tag : interaction.author.tag, inline: true },
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
      
      // Optionally notify the unbanned user via DM
      try {
        if (targetUser) {
          const dmEmbed = new EmbedBuilder()
            .setTitle("🎉 You've Been Unbanned")
            .setDescription(`You have been unbanned from using **${interaction.client.user.tag}**.`)
            .addFields(
              { name: "Unbanned By", value: interaction instanceof CommandInteraction ? 
                interaction.user.tag : interaction.author.tag, inline: true },
              { name: "Reason", value: reason }
            )
            .setColor(0x2ECC71)
            .setTimestamp();
          
          await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
            // Silently fail if we can't DM the user
          });
        }
      } catch (error) {
        // Ignore errors with DMing users
      }
    } catch (error) {
      console.error("[BOT UNBAN ERROR]", error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("An error occurred while trying to unban the user from the bot.")
        .setColor(0xFF0000);
      
      if (interaction instanceof CommandInteraction) {
        return await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        return await interaction.reply({ embeds: [errorEmbed] });
      }
    }
  }
} as DiscordCommand;
