
import { CommandInteraction, Message, PresenceStatusData, ActivityType, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { handleOwnerOnlyCommand } from "../../utils/ownerCheck";
import { config } from "../../config";

export default {
  name: "status",
  description: "Change the bot status (online, idle, dnd, invisible) and activity (Bot Owner Only)",
  category: "admin",
  aliases: ["setstatus", "presence"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
    {
      name: "status",
      description: "The status to set (online, idle, dnd, invisible)",
      type: "STRING",
      required: true,
      choices: [
        { name: "Online", value: "online" },
        { name: "Idle", value: "idle" },
        { name: "Do Not Disturb", value: "dnd" },
        { name: "Invisible", value: "invisible" }
      ]
    },
    {
      name: "activity_type",
      description: "The type of activity to set",
      type: "STRING",
      required: false,
      choices: [
        { name: "Playing", value: "PLAYING" },
        { name: "Streaming", value: "STREAMING" },
        { name: "Listening", value: "LISTENING" },
        { name: "Watching", value: "WATCHING" },
        { name: "Competing", value: "COMPETING" },
        { name: "None", value: "NONE" }
      ]
    },
    {
      name: "activity_text",
      description: "The text for the activity",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Verify this is being used by the bot owner
    const canContinue = await handleOwnerOnlyCommand(interaction, "status");
    if (!canContinue) return;
    
    let status: PresenceStatusData = "online";
    let activityType: ActivityType | null = null;
    let activityText = "";
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const statusOption = interaction.options.get("status");
      if (statusOption?.value) {
        status = String(statusOption.value) as PresenceStatusData;
      }
      
      const activityTypeOption = interaction.options.get("activity_type");
      if (activityTypeOption?.value && activityTypeOption.value !== "NONE") {
        activityType = activityTypeOption.value as unknown as ActivityType;
      }
      
      const activityTextOption = interaction.options.get("activity_text");
      if (activityTextOption?.value) {
        activityText = String(activityTextOption.value);
      }
    } else {
      // Handle message command
      if (!args || args.length < 1) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❓ Bot Status Command")
              .setDescription("Change the bot's status and activity.")
              .addFields(
                { name: "Usage", value: `${config.prefix}status <online|idle|dnd|invisible> [activity_type] [activity_text]` },
                { 
                  name: "Activity Types", 
                  value: "PLAYING, STREAMING, LISTENING, WATCHING, COMPETING, NONE" 
                },
                { 
                  name: "Example", 
                  value: `${config.prefix}status online PLAYING with commands` 
                }
              )
              .setColor(0x3498DB)
          ]
        });
      }
      
      // Parse status
      status = args[0].toLowerCase() as PresenceStatusData;
      const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
      
      if (!validStatuses.includes(status)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Status")
              .setDescription("Please provide a valid status.")
              .addFields({ name: "Valid Statuses", value: validStatuses.join(", ") })
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Parse activity type and text if provided
      if (args.length > 1) {
        const activityArg = args[1].toUpperCase();
        const validActivityTypes = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING', 'NONE'];
        
        if (validActivityTypes.includes(activityArg)) {
          if (activityArg !== 'NONE') {
            activityType = activityArg as unknown as ActivityType;
            
            // Get activity text (all remaining arguments)
            if (args.length > 2) {
              activityText = args.slice(2).join(" ");
            }
          }
        } else {
          // If the second argument isn't a valid activity type, assume it's the start of activity text
          activityType = ActivityType.Playing; // Default to playing
          activityText = args.slice(1).join(" ");
        }
      }
    }
    
    try {
      // Update the status
      if (activityType !== null && activityText) {
        // Set status with activity
        await interaction.client.user?.setPresence({
          status: status,
          activities: [{
            name: activityText,
            type: activityType
          }]
        });
      } else {
        // Set status only
        await interaction.client.user?.setStatus(status);
        
        // Clear activities if no activity is specified
        if (!activityText) {
          await interaction.client.user?.setActivity(null);
        }
      }
      
      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setTitle("✅ Bot Status Updated")
        .setColor(0x2ECC71)
        .addFields({ name: "Status", value: status, inline: true });
      
      if (activityType !== null && activityText) {
        const activityName = ActivityType[activityType] || activityType.toString();
        successEmbed.addFields(
          { name: "Activity", value: activityName, inline: true },
          { name: "Text", value: activityText, inline: true }
        );
      } else if (!activityText) {
        successEmbed.addFields({ name: "Activity", value: "None", inline: true });
      }
      
      // Send response
      if (interaction instanceof CommandInteraction) {
        return interaction.reply({ embeds: [successEmbed] });
      } else {
        return interaction.reply({ embeds: [successEmbed] });
      }
    } catch (error) {
      console.error("[STATUS ERROR]", error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Failed to update bot status. Please try again later.")
        .setColor(0xFF0000);
      
      if (interaction instanceof CommandInteraction) {
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return interaction.reply({ embeds: [errorEmbed] });
      }
    }
  }
} as DiscordCommand;
