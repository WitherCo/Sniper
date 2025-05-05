import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  GuildMember,
  User,
  PermissionFlagsBits
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";

// Define a simple in-memory storage for warnings
// In a production bot, this would be stored in a database
const warnings = new Map<string, Map<string, Warning[]>>();

interface Warning {
  userId: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
  id: string;
}

export default {
  name: "warn",
  description: "Warn a user for breaking rules",
  category: "moderation",
  aliases: ["warning"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ModerateMembers"],
  options: [
    {
      name: "user",
      description: "The user to warn",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "The reason for the warning",
      type: "STRING",
      required: true
    },
    {
      name: "silent",
      description: "Whether to send the warning silently (no DM to user)",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Check if we have a guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Check permissions
    const member = interaction instanceof Message 
      ? interaction.member as GuildMember
      : interaction.member as GuildMember;
    
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: "❌ You need the Moderate Members permission to use this command.",
        ephemeral: true
      });
    }
    
    let targetUser: User | null = null;
    let reason = "";
    let silent = false;
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.get("user");
      const reasonOption = interaction.options.get("reason");
      const silentOption = interaction.options.get("silent");
      
      if (userOption?.user) {
        targetUser = userOption.user;
      }
      
      if (reasonOption?.value) {
        reason = String(reasonOption.value);
      }
      
      if (silentOption?.value) {
        silent = Boolean(silentOption.value);
      }
    } else {
      // Handle message command
      if (!args || args.length < 2) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Command Usage")
              .setDescription("You must specify a user and a reason.")
              .addFields({ name: "Usage", value: `${config.prefix}warn <user> <reason> [--silent]` })
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Check for silent flag
      if (args.includes("--silent")) {
        silent = true;
        args = args.filter(arg => arg !== "--silent");
      }
      
      // Parse user mention or ID
      const userArg = args[0];
      let userId: string | null = null;
      
      // Check if it's a mention
      const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
      if (mentionMatch) {
        userId = mentionMatch[1];
      } 
      // Check if it's a raw ID
      else if (/^\d+$/.test(userArg)) {
        userId = userArg;
      }
      
      if (userId) {
        try {
          targetUser = await interaction.client.users.fetch(userId);
        } catch (error) {
          return interaction.reply(`❌ Could not find a user with ID \`${userId}\`.`);
        }
      } else {
        // Try to find by name
        const members = await guild.members.fetch();
        const foundMember = members.find(m => 
          m.user.username.toLowerCase() === userArg.toLowerCase() || 
          (m.nickname && m.nickname.toLowerCase() === userArg.toLowerCase())
        );
        
        if (foundMember) {
          targetUser = foundMember.user;
        } else {
          return interaction.reply(`❌ Could not find a user named "${userArg}" in this server.`);
        }
      }
      
      // Get reason (all remaining arguments)
      reason = args.slice(1).join(" ");
    }
    
    if (!targetUser) {
      return interaction.reply("❌ You must specify a valid user to warn.");
    }
    
    if (!reason) {
      return interaction.reply("❌ You must provide a reason for the warning.");
    }
    
    // Don't allow warning the bot itself
    if (targetUser.id === interaction.client.user?.id) {
      return interaction.reply("❓ I cannot warn myself.");
    }
    
    // Don't allow warning the server owner
    if (targetUser.id === guild.ownerId) {
      return interaction.reply("❌ You cannot warn the server owner.");
    }
    
    try {
      // Get target member
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      
      // Check if the moderator can moderate the target
      if (targetMember) {
        // Check if the target has higher roles
        if (
          member.roles.highest.position <= targetMember.roles.highest.position && 
          member.id !== guild.ownerId
        ) {
          return interaction.reply({
            content: "❌ You cannot warn a member with the same or higher role than you.",
            ephemeral: true
          });
        }
      }
      
      // Create the warning
      const warning: Warning = {
        userId: targetUser.id,
        moderatorId: interaction instanceof Message ? interaction.author.id : interaction.user.id,
        reason: reason,
        timestamp: Date.now(),
        id: generateWarningId()
      };
      
      // Save the warning
      if (!warnings.has(guild.id)) {
        warnings.set(guild.id, new Map());
      }
      
      const guildWarnings = warnings.get(guild.id)!;
      if (!guildWarnings.has(targetUser.id)) {
        guildWarnings.set(targetUser.id, []);
      }
      
      const userWarnings = guildWarnings.get(targetUser.id)!;
      userWarnings.push(warning);
      
      // Create embed for the warning
      const warningEmbed = new EmbedBuilder()
        .setTitle("⚠️ Warning Issued")
        .setColor(0xFFBF00)
        .addFields(
          { name: "User", value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
          { name: "Moderator", value: `<@${warning.moderatorId}>`, inline: true },
          { name: "Warning ID", value: warning.id, inline: true },
          { name: "Reason", value: reason },
          { name: "Total Warnings", value: `${userWarnings.length}`, inline: true },
          { name: "Timestamp", value: `<t:${Math.floor(warning.timestamp / 1000)}:F>`, inline: true }
        )
        .setTimestamp();
      
      // Send warning to moderator
      await interaction.reply({ embeds: [warningEmbed] });
      
      // Send warning to user in DM (unless silent)
      if (!silent) {
        try {
          const userEmbed = new EmbedBuilder()
            .setTitle(`⚠️ You've Been Warned in ${guild.name}`)
            .setColor(0xFFBF00)
            .addFields(
              { name: "Reason", value: reason },
              { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag },
              { name: "Warning ID", value: warning.id },
              { name: "Total Warnings", value: `${userWarnings.length}` }
            )
            .setTimestamp();
          
          await targetUser.send({ embeds: [userEmbed] });
        } catch (error) {
          // User might have DMs closed, send a follow-up message
          if (interaction instanceof CommandInteraction) {
            await interaction.followUp({
              content: "⚠️ The user could not be messaged directly about their warning.",
              ephemeral: true
            });
          } else {
            await interaction.channel.send("⚠️ The user could not be messaged directly about their warning.");
          }
        }
      }
    } catch (error) {
      console.error("Error in warn command:", error);
      await interaction.reply({
        content: "❌ An error occurred while trying to warn the user.",
        ephemeral: true
      });
    }
  }
} as DiscordCommand;

/**
 * Generate a unique ID for a warning
 */
function generateWarningId(): string {
  // Simple ID generation - in a real bot this would use a more robust method
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}