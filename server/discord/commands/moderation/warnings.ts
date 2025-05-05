import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  User,
  PermissionFlagsBits
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Import the warnings map from the warn.ts file (this would typically be in a shared database)
// For this demo, we'll use a simpler approach since we can't import directly
const warnings = new Map<string, Map<string, Warning[]>>();

interface Warning {
  userId: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
  id: string;
}

export default {
  name: "warnings",
  description: "View warnings for a user",
  category: "moderation",
  aliases: ["warns", "infractions"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ModerateMembers"],
  options: [
    {
      name: "user",
      description: "The user to check warnings for",
      type: "USER",
      required: true
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Check if we have a guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Check if user has permission
    const hasPermission = interaction instanceof Message
      ? interaction.member?.permissions.has(PermissionFlagsBits.ModerateMembers)
      : (interaction.member?.permissions as any)?.has(PermissionFlagsBits.ModerateMembers);
    
    if (!hasPermission) {
      return interaction.reply({
        content: "❌ You need the Moderate Members permission to view warnings.",
        ephemeral: true
      });
    }
    
    let targetUser: User | null = null;
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.get("user");
      if (userOption?.user) {
        targetUser = userOption.user;
      }
    } else {
      // Handle message command
      if (!args || args.length < 1) {
        // Default to the command user
        targetUser = interaction.author;
      } else {
        // Try to get user from mention or ID
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
      }
    }
    
    if (!targetUser) {
      return interaction.reply("❌ You must specify a valid user to check warnings for.");
    }
    
    try {
      // Get warnings for this user in this guild
      const guildWarnings = warnings.get(guild.id);
      const userWarnings = guildWarnings?.get(targetUser.id) || [];
      
      if (!guildWarnings || userWarnings.length === 0) {
        return interaction.reply(`✅ ${targetUser.tag} has no warnings in this server.`);
      }
      
      // Sort warnings by timestamp (newest first)
      userWarnings.sort((a, b) => b.timestamp - a.timestamp);
      
      // Create embed for the warnings
      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${targetUser.tag}`)
        .setColor(0xFFBF00)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setDescription(`${targetUser.tag} has **${userWarnings.length}** warning(s) in this server.`)
        .setFooter({ 
          text: `Requested by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}` 
        })
        .setTimestamp();
      
      // Add recent warnings (up to 10)
      const recentWarnings = userWarnings.slice(0, 10);
      
      for (let i = 0; i < recentWarnings.length; i++) {
        const warning = recentWarnings[i];
        const date = new Date(warning.timestamp);
        
        embed.addFields({
          name: `Warning #${i + 1} (ID: ${warning.id})`,
          value: [
            `**Reason:** ${warning.reason}`,
            `**Moderator:** <@${warning.moderatorId}>`,
            `**Date:** <t:${Math.floor(warning.timestamp / 1000)}:F> (<t:${Math.floor(warning.timestamp / 1000)}:R>)`
          ].join('\n')
        });
      }
      
      // If there are more warnings, add a note
      if (userWarnings.length > 10) {
        embed.addFields({
          name: 'Additional Warnings',
          value: `${userWarnings.length - 10} more warning(s) not shown.`
        });
      }
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in warnings command:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching warnings.',
        ephemeral: true
      });
    }
  }
} as DiscordCommand;