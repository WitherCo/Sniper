import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  GuildMember,
  User,
  PermissionFlagsBits,
  TimestampStyles,
  time
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";

export default {
  name: "mute",
  description: "Timeout/mute a user",
  category: "moderation",
  aliases: ["timeout"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["ModerateMembers"],
  options: [
    {
      name: "user",
      description: "The user to mute",
      type: "USER",
      required: true
    },
    {
      name: "duration",
      description: "Mute duration (e.g. 1m, 1h, 1d)",
      type: "STRING",
      required: true
    },
    {
      name: "reason",
      description: "The reason for the mute",
      type: "STRING",
      required: false
    },
    {
      name: "silent",
      description: "Whether to mute silently (no DM notification)",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Check if we have a guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Check if the bot has permission to moderate members
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: "❌ I don't have permission to moderate members in this server.",
        ephemeral: true
      });
    }
    
    // Check if the user has permission to moderate members
    const member = interaction instanceof Message 
      ? interaction.member as GuildMember 
      : interaction.member as GuildMember;
    
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: "❌ You don't have permission to moderate members in this server.",
        ephemeral: true
      });
    }
    
    let targetUser: User | null = null;
    let durationStr = "";
    let reason = "No reason provided";
    let silent = false;
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.getUser("user");
      const durationOption = interaction.options.getString("duration");
      const reasonOption = interaction.options.getString("reason");
      const silentOption = interaction.options.getBoolean("silent");
      
      if (userOption) {
        targetUser = userOption;
      }
      
      if (durationOption) {
        durationStr = durationOption;
      }
      
      if (reasonOption) {
        reason = reasonOption;
      }
      
      if (silentOption !== null) {
        silent = silentOption;
      }
    } else {
      // Handle message command
      if (!args || args.length < 2) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Command Usage")
              .setDescription("You must specify a user and a duration.")
              .addFields({ name: "Usage", value: `${config.prefix}mute <user> <duration> [reason] [--silent]` })
              .addFields({ name: "Example", value: `${config.prefix}mute @User 1h Spamming` })
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Parse user
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
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ User Not Found")
                .setDescription(`Could not find a user with ID \`${userId}\`.`)
                .setColor(0xFF0000)
            ]
          });
        }
      } else {
        // Try to find by username
        const members = await guild.members.fetch();
        const foundMember = members.find(m => 
          m.user.username.toLowerCase() === userArg.toLowerCase() || 
          (m.nickname && m.nickname.toLowerCase() === userArg.toLowerCase())
        );
        
        if (foundMember) {
          targetUser = foundMember.user;
        } else {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ User Not Found")
                .setDescription(`Could not find a user named "${userArg}" in this server.`)
                .setColor(0xFF0000)
            ]
          });
        }
      }
      
      // Get duration
      durationStr = args[1];
      
      // Parse reason and flags
      if (args.length > 2) {
        const flagArgs = args.slice(2);
        const flags: string[] = [];
        const reasonParts: string[] = [];
        
        for (const arg of flagArgs) {
          if (arg === "--silent") {
            flags.push(arg);
          } else {
            reasonParts.push(arg);
          }
        }
        
        // Parse reason
        if (reasonParts.length > 0) {
          reason = reasonParts.join(' ');
        }
        
        // Parse flags
        for (const flag of flags) {
          if (flag === '--silent') {
            silent = true;
          }
        }
      }
    }
    
    if (!targetUser) {
      return interaction.reply("❌ You must specify a valid user to mute.");
    }
    
    if (!durationStr) {
      return interaction.reply("❌ You must specify a duration for the mute.");
    }
    
    // Don't allow muting the bot itself
    if (targetUser.id === interaction.client.user?.id) {
      return interaction.reply("❓ I cannot mute myself.");
    }
    
    // Don't allow muting the server owner
    if (targetUser.id === guild.ownerId) {
      return interaction.reply("❌ You cannot mute the server owner.");
    }
    
    // Check if user is trying to mute themselves
    if (targetUser.id === (interaction instanceof Message ? interaction.author.id : interaction.user.id)) {
      return interaction.reply("❌ You cannot mute yourself.");
    }
    
    try {
      // Get target member
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Member Not Found")
              .setDescription(`${targetUser.tag} is not a member of this server.`)
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Check if the user can be muted (role hierarchy)
      if (
        member.roles.highest.position <= targetMember.roles.highest.position && 
        member.id !== guild.ownerId
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Cannot Mute")
              .setDescription("You cannot mute a member with the same or higher role than you.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Check if the bot can mute this member
      if (guild.members.me && guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Cannot Mute")
              .setDescription("I cannot mute a member with the same or higher role than me.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Parse duration
      const durationMs = parseDuration(durationStr);
      
      if (durationMs <= 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Duration")
              .setDescription("Please provide a valid duration (e.g. 10s, 5m, 1h, 1d).")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Check if duration exceeds maximum (28 days)
      const maxTimeout = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds
      
      if (durationMs > maxTimeout) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Duration Too Long")
              .setDescription("The maximum mute duration is 28 days.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Format the mute reason
      const formattedReason = `Muted by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}: ${reason}`;
      
      // DM the user before muting (if not silent)
      if (!silent) {
        try {
          const endTime = Date.now() + durationMs;
          
          const dmEmbed = new EmbedBuilder()
            .setTitle(`🔇 You've Been Muted in ${guild.name}`)
            .setColor(0xF39C12)
            .addFields(
              { name: "Duration", value: formatDuration(durationMs), inline: true },
              { name: "Expires", value: `${time(Math.floor(endTime / 1000), TimestampStyles.RelativeTime)}`, inline: true },
              { name: "Reason", value: reason },
              { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag }
            )
            .setFooter({ text: "You will not be able to send messages until the mute expires." })
            .setTimestamp();
          
          await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
            // If we can't DM the user, just continue with the mute
          });
        } catch (error) {
          // Ignore errors with sending DMs
        }
      }
      
      // Timeout the user
      await targetMember.timeout(durationMs, formattedReason);
      
      // Calculate when the timeout will end
      const endTime = Date.now() + durationMs;
      
      // Send mute confirmation
      const muteEmbed = new EmbedBuilder()
        .setTitle("🔇 User Muted")
        .setDescription(`Successfully muted **${targetUser.tag}** for ${formatDuration(durationMs)}.`)
        .setColor(0xF39C12)
        .addFields(
          { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag, inline: true },
          { name: "Duration", value: formatDuration(durationMs), inline: true },
          { name: "Expires", value: `${time(Math.floor(endTime / 1000), TimestampStyles.RelativeTime)}`, inline: true },
          { name: "Reason", value: reason },
          { name: "DM Notification", value: silent ? "No" : "Yes", inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setTimestamp();
      
      return interaction.reply({ embeds: [muteEmbed] });
    } catch (error) {
      console.error("Error muting user:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Mute Failed")
            .setDescription(`Failed to mute ${targetUser?.tag}. Error: ${error}`)
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;

/**
 * Parse a duration string into milliseconds
 * Supports formats like 1s, 1m, 1h, 1d
 */
function parseDuration(duration: string): number {
  // Handle different time formats
  const match = duration.match(/^(\d+)(s|m|h|d|w)$/);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': // Seconds
      return amount * 1000;
    case 'm': // Minutes
      return amount * 60 * 1000;
    case 'h': // Hours
      return amount * 60 * 60 * 1000;
    case 'd': // Days
      return amount * 24 * 60 * 60 * 1000;
    case 'w': // Weeks
      return amount * 7 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Format milliseconds into a readable duration string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}${hours % 24 > 0 ? ` ${hours % 24} hour${hours % 24 > 1 ? 's' : ''}` : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}${minutes % 60 > 0 ? ` ${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}` : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}${seconds % 60 > 0 ? ` ${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}` : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}