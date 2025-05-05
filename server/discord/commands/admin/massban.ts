import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  User,
  PermissionFlagsBits,
  Attachment,
  TextChannel
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { handleOwnerOnlyCommand } from "../../utils/ownerCheck";
import { config } from "../../config";
import * as fs from "fs";
import * as path from "path";
import { createInterface } from "readline";

export default {
  name: "massban",
  description: "Ban multiple users at once (Bot Owner Only)",
  category: "admin",
  aliases: ["banall", "banmultiple"],
  slash: false, // Disabled for slash commands for safety
  prefix: true,
  cooldown: 60, // 1 minute cooldown
  permissions: ["BanMembers", "Administrator"],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Only works with message commands for safety
    if (!(interaction instanceof Message)) {
      return interaction.reply({ 
        content: "This command can only be used with a message command for safety reasons.",
        ephemeral: true
      });
    }
    
    // Verify this is being used by the bot owner
    const canContinue = await handleOwnerOnlyCommand(interaction, "massban");
    if (!canContinue) return;
    
    // Check if we have a guild
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("This command can only be used in a server.")
            .setColor(0xFF0000)
        ]
      });
    }
    
    // Check bot permissions
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Missing Permissions")
            .setDescription("I don't have the Ban Members permission in this server.")
            .setColor(0xFF0000)
        ]
      });
    }
    
    // Show usage if no arguments
    if (!args || args.length === 0 || args[0].toLowerCase() === "help") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📋 Mass Ban Command")
            .setDescription("This command allows you to ban multiple users at once.")
            .addFields(
              { 
                name: "Usage", 
                value: `\`${config.prefix}massban <reason> [user1] [user2] [user3]...\`\n` +
                       `\`${config.prefix}massban <reason> --file\` (with attached .txt file)\n` +
                       `\`${config.prefix}massban <reason> --ids <id1,id2,id3,...>\``
              },
              { 
                name: "Options", 
                value: [
                  "`--file` - Use with an attached .txt file containing one user ID per line",
                  "`--ids` - Provide a comma-separated list of user IDs to ban",
                  "`--dryrun` - Test the ban without actually banning anyone",
                  "`--silent` - Don't notify users that they were banned",
                  "`--clean <days>` - Delete messages from banned users (0-7 days, default 0)"
                ].join("\n")
              },
              {
                name: "Examples",
                value: [
                  `\`${config.prefix}massban Raid attempt 123456789 987654321\``,
                  `\`${config.prefix}massban Spam bots --ids 123456789,987654321,555555555\``,
                  `\`${config.prefix}massban Raiding --file --clean 1\` (with attached user list)`
                ].join("\n")
              }
            )
            .setColor(0x3498DB)
        ]
      });
    }
    
    // Parse options
    const reason = args[0];
    let userIds: string[] = [];
    let dryRun = false;
    let silent = false;
    let cleanDays = 0;
    let hasFileOption = false;
    
    // Parse flags from arguments
    for (let i = 1; i < args.length; i++) {
      const arg = args[i].toLowerCase();
      
      if (arg === "--dryrun") {
        dryRun = true;
      } else if (arg === "--silent") {
        silent = true;
      } else if (arg === "--file") {
        hasFileOption = true;
      } else if (arg === "--clean" && i + 1 < args.length) {
        const days = parseInt(args[i + 1]);
        if (!isNaN(days) && days >= 0 && days <= 7) {
          cleanDays = days;
          i++; // Skip the next argument since we've used it
        } else {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Invalid Clean Days")
                .setDescription("The clean days option must be a number between 0 and 7.")
                .setColor(0xFF0000)
            ]
          });
        }
      } else if (arg === "--ids" && i + 1 < args.length) {
        const ids = args[i + 1].split(",").map(id => id.trim());
        userIds.push(...ids);
        i++; // Skip the next argument since we've used it
      } else if (/^\d+$/.test(arg)) {
        // If it's just a number, treat it as a user ID
        userIds.push(arg);
      } else if (arg.startsWith('<@') && arg.endsWith('>')) {
        // If it's a user mention, extract the ID
        const id = arg.replace(/[<@!>]/g, '');
        if (/^\d+$/.test(id)) {
          userIds.push(id);
        }
      }
    }
    
    // Check for file attachment if --file flag is provided
    if (hasFileOption) {
      if (interaction.attachments.size === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Missing Attachment")
              .setDescription("Please attach a .txt file with the user IDs to ban (one ID per line).")
              .setColor(0xFF0000)
          ]
        });
      }
      
      const attachment = interaction.attachments.first();
      if (!attachment?.url || !attachment.name?.endsWith('.txt')) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Attachment")
              .setDescription("Please attach a .txt file with the user IDs to ban (one ID per line).")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Download and process the file
      try {
        // Inform user we're processing the file
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⏳ Processing File")
              .setDescription("Downloading and processing the user ID list...")
              .setColor(0x3498DB)
          ]
        });
        
        // Get IDs from the file
        const fileIds = await getUserIdsFromAttachment(attachment);
        if (fileIds.length === 0) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Empty File")
                .setDescription("The provided file doesn't contain any valid user IDs.")
                .setColor(0xFF0000)
            ]
          });
        }
        
        // Add file IDs to the list
        userIds.push(...fileIds);
        
        // Update the user that we've processed the file
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ File Processed")
              .setDescription(`Successfully extracted ${fileIds.length} user IDs from the file.`)
              .setColor(0x2ECC71)
          ]
        });
      } catch (error) {
        console.error("Error processing ID file:", error);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ File Processing Error")
              .setDescription("There was an error processing the user ID file.")
              .addFields({ name: "Error", value: String(error) })
              .setColor(0xFF0000)
          ]
        });
      }
    }
    
    // Ensure we have user IDs to ban
    if (userIds.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ No Users Specified")
            .setDescription("Please specify at least one user ID to ban.")
            .setColor(0xFF0000)
        ]
      });
    }
    
    // Validate all IDs are numeric
    const invalidIds = userIds.filter(id => !/^\d+$/.test(id));
    if (invalidIds.length > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Invalid User IDs")
            .setDescription("The following user IDs are invalid:")
            .addFields({ name: "Invalid IDs", value: invalidIds.join(", ") })
            .setColor(0xFF0000)
        ]
      });
    }
    
    // Remove duplicates
    userIds = [...new Set(userIds)];
    
    // Create confirmation message
    const confirmEmbed = new EmbedBuilder()
      .setTitle(dryRun ? "🔍 Mass Ban Dry Run" : "⚠️ Mass Ban Confirmation")
      .setDescription(`You are about to ${dryRun ? 'simulate banning' : 'ban'} **${userIds.length}** users from this server.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Clean Messages", value: `${cleanDays} days`, inline: true },
        { name: "Notify Users", value: silent ? "No" : "Yes", inline: true },
        { name: "Mode", value: dryRun ? "Dry Run (No actual bans)" : "REAL BAN", inline: true }
      )
      .setColor(dryRun ? 0x3498DB : 0xFF0000)
      .setTimestamp();
    
    // Add user IDs field if there aren't too many
    if (userIds.length <= 20) {
      confirmEmbed.addFields({ name: "User IDs", value: userIds.join(", ") });
    } else {
      confirmEmbed.addFields({ name: "User IDs", value: `${userIds.length} users to ban (too many to display)` });
    }
    
    // Create buttons for confirmation/cancellation
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('CANCEL')
      .setStyle(ButtonStyle.Secondary);
    
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel(dryRun ? 'SIMULATE' : 'CONFIRM BAN')
      .setStyle(dryRun ? ButtonStyle.Primary : ButtonStyle.Danger);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(cancelButton, confirmButton);
    
    // Send confirmation message
    const confirmMessage = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row]
    });
    
    // Create collector for button interactions
    const collector = confirmMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000 // 30 seconds to decide
    });
    
    collector.on('collect', async (buttonInteraction) => {
      // Only the command invoker can interact with the buttons
      if (buttonInteraction.user.id !== interaction.author.id) {
        await buttonInteraction.reply({
          content: "Only the person who initiated this command can confirm or cancel it.",
          ephemeral: true
        });
        return;
      }
      
      if (buttonInteraction.customId === 'cancel') {
        await buttonInteraction.update({
          content: "✅ Mass ban operation cancelled.",
          embeds: [],
          components: []
        });
        collector.stop('cancelled');
      } else if (buttonInteraction.customId === 'confirm') {
        // Disable buttons to prevent multiple clicks
        const disabledRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            cancelButton.setDisabled(true),
            confirmButton.setDisabled(true)
          );
        
        await buttonInteraction.update({
          content: `⏳ Processing mass ban for ${userIds.length} users...`,
          embeds: [confirmEmbed],
          components: [disabledRow]
        });
        
        // Process the bans
        const results = await processMassBan(
          guild, 
          userIds, 
          reason, 
          dryRun, 
          silent, 
          cleanDays,
          interaction.author
        );
        
        // Create results embed
        const resultsEmbed = new EmbedBuilder()
          .setTitle(dryRun ? "🔍 Mass Ban Simulation Results" : "✅ Mass Ban Results")
          .setDescription(`Operation ${dryRun ? 'simulated' : 'completed'} for ${userIds.length} users.`)
          .addFields(
            { name: "✅ Successful", value: `${results.success} users`, inline: true },
            { name: "❌ Failed", value: `${results.failed} users`, inline: true },
            { name: "⏭️ Skipped", value: `${results.skipped} users`, inline: true },
            { name: "Reason", value: reason }
          )
          .setColor(dryRun ? 0x3498DB : 0x2ECC71)
          .setTimestamp();
        
        // Add log file as an attachment if there are many users
        let logAttachment = null;
        if (userIds.length > 10 && results.log.length > 0) {
          const logContent = results.log.join('\n');
          resultsEmbed.addFields({ 
            name: "Detailed Log", 
            value: "See attached file for a detailed log of the operation."
          });
        }
        
        // Update the message with results
        await buttonInteraction.editReply({
          content: dryRun 
            ? "✅ Mass ban simulation completed." 
            : `✅ Successfully banned ${results.success} users.`,
          embeds: [resultsEmbed],
          components: []
        });
        
        // Add log as a follow-up if it's too big
        if (results.log.length > 0) {
          // If there aren't too many entries, post them directly
          if (results.log.length <= 10) {
            const logEmbed = new EmbedBuilder()
              .setTitle("📋 Operation Log")
              .setDescription(results.log.join('\n'))
              .setColor(0x3498DB);
            
            await interaction.channel.send({ embeds: [logEmbed] });
          } else {
            // Otherwise, create a log file
            const logContent = results.log.join('\n');
            
            try {
              // Create log file
              const tempFilePath = path.join('/tmp', `massban_log_${Date.now()}.txt`);
              fs.writeFileSync(tempFilePath, logContent);
              
              // Send log file
              await interaction.channel.send({
                content: "📋 Detailed operation log:",
                files: [{
                  attachment: tempFilePath,
                  name: `massban_log_${guild.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
                }]
              });
              
              // Clean up
              try {
                fs.unlinkSync(tempFilePath);
              } catch (error) {
                console.error("Error deleting temp file:", error);
              }
            } catch (error) {
              console.error("Error creating log file:", error);
              await interaction.channel.send({
                content: "❌ Failed to create log file due to an error."
              });
            }
          }
        }
        
        collector.stop('confirmed');
      }
    });
    
    collector.on('end', (_, reason) => {
      if (reason !== 'cancelled' && reason !== 'confirmed') {
        interaction.editReply({
          content: "⏱️ Mass ban operation timed out.",
          embeds: [],
          components: []
        }).catch(() => {}); // Ignore errors - message might not exist
      }
    });
  }
} as DiscordCommand;

// Function to download and process a file attachment containing user IDs
async function getUserIdsFromAttachment(attachment: any): Promise<string[]> {
  try {
    // Download the file
    const response = await fetch(attachment.url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Process the file line by line
    const userIds: string[] = [];
    
    // Split by newlines and process each line
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (trimmed && !trimmed.startsWith('#') && /^\d+$/.test(trimmed)) {
        userIds.push(trimmed);
      }
    }
    
    return userIds;
  } catch (error) {
    console.error("Error processing user ID file:", error);
    throw error;
  }
}

// Function to process the mass ban operation
async function processMassBan(
  guild: any,
  userIds: string[],
  reason: string,
  dryRun: boolean,
  silent: boolean,
  cleanDays: number,
  moderator: User
): Promise<{ success: number, failed: number, skipped: number, log: string[] }> {
  const log: string[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  // Log the action for audit purposes
  const actionType = dryRun ? "Simulated mass ban" : "Mass ban";
  const logPrefix = dryRun ? "[SIMULATION]" : "";
  console.log(`[ADMIN] ${actionType} initiated by ${moderator.tag} (${moderator.id}) in server ${guild.name} (${guild.id}). Banning ${userIds.length} users.`);
  
  // Process each user ID
  for (const userId of userIds) {
    try {
      // Check if it's the bot itself
      if (userId === guild.client.user.id) {
        log.push(`${logPrefix} ⏭️ Skipped bot's own ID (${userId})`);
        skipped++;
        continue;
      }
      
      // Check if it's the server owner
      if (userId === guild.ownerId) {
        log.push(`${logPrefix} ⏭️ Skipped server owner (${userId})`);
        skipped++;
        continue;
      }
      
      // Check if it's the moderator performing the ban
      if (userId === moderator.id) {
        log.push(`${logPrefix} ⏭️ Skipped command invoker (${userId})`);
        skipped++;
        continue;
      }
      
      // Check if the user is already banned
      try {
        const ban = await guild.bans.fetch(userId);
        if (ban) {
          log.push(`${logPrefix} ⏭️ User already banned: ${userId}`);
          skipped++;
          continue;
        }
      } catch (error) {
        // User is not banned, continue
      }
      
      // Try to get user info for better logging
      let userName = userId;
      try {
        const user = await guild.client.users.fetch(userId);
        if (user) {
          userName = `${user.tag} (${userId})`;
          
          // Send DM if not silent
          if (!silent && !dryRun) {
            try {
              await user.send({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(`🚫 You have been banned from ${guild.name}`)
                    .setDescription(`You have been banned by a moderator.`)
                    .addFields({ name: "Reason", value: reason })
                    .setColor(0xFF0000)
                    .setTimestamp()
                ]
              });
            } catch (error) {
              // Couldn't send DM, continue anyway
            }
          }
        }
      } catch (error) {
        // Couldn't fetch user, just use the ID
      }
      
      // Perform the ban if not a dry run
      if (!dryRun) {
        try {
          await guild.members.ban(userId, { 
            reason: `Mass ban by ${moderator.tag}: ${reason}`,
            deleteMessageSeconds: cleanDays * 86400 // Convert days to seconds
          });
          log.push(`${logPrefix} ✅ Banned user: ${userName}`);
          success++;
        } catch (error) {
          log.push(`${logPrefix} ❌ Failed to ban user: ${userName} - Error: ${error}`);
          failed++;
        }
      } else {
        // Just log the simulated ban
        log.push(`${logPrefix} 🔍 Would ban user: ${userName}`);
        success++; // Count as success for simulation purposes
      }
    } catch (error) {
      log.push(`${logPrefix} ❌ Error processing user ${userId}: ${error}`);
      failed++;
    }
  }
  
  return {
    success,
    failed,
    skipped,
    log
  };
}