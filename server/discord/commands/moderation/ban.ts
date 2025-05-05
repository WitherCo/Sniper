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

export default {
  name: "ban",
  description: "Ban a user from the server",
  category: "moderation",
  aliases: ["banish"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["BanMembers"],
  options: [
    {
      name: "user",
      description: "The user to ban",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "The reason for the ban",
      type: "STRING",
      required: false
    },
    {
      name: "delete_days",
      description: "Number of days of messages to delete (0-7)",
      type: "INTEGER",
      required: false,
      choices: [
        { name: "Don't delete any", value: 0 },
        { name: "1 day", value: 1 },
        { name: "2 days", value: 2 },
        { name: "3 days", value: 3 },
        { name: "4 days", value: 4 },
        { name: "5 days", value: 5 },
        { name: "6 days", value: 6 },
        { name: "7 days", value: 7 }
      ]
    },
    {
      name: "silent",
      description: "Whether to ban the user silently (no DM notification)",
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
    
    // Check if the bot has permission to ban
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: "❌ I don't have permission to ban members in this server.",
        ephemeral: true
      });
    }
    
    // Check if the user has permission to ban
    const member = interaction instanceof Message 
      ? interaction.member as GuildMember 
      : interaction.member as GuildMember;
    
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: "❌ You don't have permission to ban members in this server.",
        ephemeral: true
      });
    }
    
    let targetUser: User | null = null;
    let reason = "No reason provided";
    let deleteDays = 0;
    let silent = false;
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.getUser("user");
      const reasonOption = interaction.options.getString("reason");
      const deleteDaysOption = interaction.options.getInteger("delete_days");
      const silentOption = interaction.options.getBoolean("silent");
      
      if (userOption) {
        targetUser = userOption;
      }
      
      if (reasonOption) {
        reason = reasonOption;
      }
      
      if (deleteDaysOption !== null) {
        deleteDays = deleteDaysOption;
      }
      
      if (silentOption !== null) {
        silent = silentOption;
      }
    } else {
      // Handle message command
      if (!args || args.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Command Usage")
              .setDescription("You must specify a user to ban.")
              .addFields({ name: "Usage", value: `${config.prefix}ban <user> [reason] [--days=<0-7>] [--silent]` })
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
      
      // Parse reason and flags
      if (args.length > 1) {
        const flagArgs = args.slice(1);
        const flags: string[] = [];
        const reasonParts: string[] = [];
        
        for (const arg of flagArgs) {
          if (arg.startsWith('--')) {
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
          } else if (flag.startsWith('--days=')) {
            const daysMatch = flag.match(/--days=(\d+)/);
            if (daysMatch) {
              const days = parseInt(daysMatch[1]);
              if (days >= 0 && days <= 7) {
                deleteDays = days;
              } else {
                return interaction.reply("❌ Days flag must be between 0 and 7.");
              }
            }
          }
        }
      }
    }
    
    if (!targetUser) {
      return interaction.reply("❌ You must specify a valid user to ban.");
    }
    
    // Don't allow banning the bot itself
    if (targetUser.id === interaction.client.user?.id) {
      return interaction.reply("❓ I cannot ban myself.");
    }
    
    // Don't allow banning the server owner
    if (targetUser.id === guild.ownerId) {
      return interaction.reply("❌ You cannot ban the server owner.");
    }
    
    // Check if user is trying to ban themselves
    if (targetUser.id === (interaction instanceof Message ? interaction.author.id : interaction.user.id)) {
      return interaction.reply("❌ You cannot ban yourself.");
    }
    
    try {
      // Check if the user is already banned
      try {
        const existingBan = await guild.bans.fetch(targetUser.id);
        if (existingBan) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Already Banned")
                .setDescription(`${targetUser.tag} is already banned from this server.`)
                .setColor(0xFF0000)
            ]
          });
        }
      } catch (error) {
        // User is not banned, continue
      }
      
      // Get target member if they're in the guild
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      
      // Check if the user can be banned (role hierarchy)
      if (targetMember) {
        // Check if the target has higher roles
        if (
          member.roles.highest.position <= targetMember.roles.highest.position && 
          member.id !== guild.ownerId
        ) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Cannot Ban")
                .setDescription("You cannot ban a member with the same or higher role than you.")
                .setColor(0xFF0000)
            ]
          });
        }
        
        // Check if the bot can ban this member
        if (guild.members.me && guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Cannot Ban")
                .setDescription("I cannot ban a member with the same or higher role than me.")
                .setColor(0xFF0000)
            ]
          });
        }
      }
      
      // Format the ban reason
      const formattedReason = `Banned by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}: ${reason}`;
      
      // DM the user before banning (if not silent)
      if (!silent && targetUser.id !== targetUser.client.user?.id) { // Don't DM the bot itself
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(`🔨 You've Been Banned from ${guild.name}`)
            .setColor(0xFF0000)
            .addFields(
              { name: "Reason", value: reason },
              { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag }
            )
            .setTimestamp();
          
          await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
            // If we can't DM the user, just continue with the ban
          });
        } catch (error) {
          // Ignore errors with sending DMs
        }
      }
      
      // Ban the user
      await guild.members.ban(targetUser, { 
        reason: formattedReason,
        deleteMessageSeconds: deleteDays * 86400 // Convert days to seconds
      });
      
      // Send ban confirmation
      const banEmbed = new EmbedBuilder()
        .setTitle("🔨 User Banned")
        .setDescription(`Successfully banned **${targetUser.tag}** from the server.`)
        .setColor(0xFF0000)
        .addFields(
          { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
          { name: "Deleted Messages", value: `${deleteDays} day(s)`, inline: true },
          { name: "DM Notification", value: silent ? "No" : "Yes", inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setTimestamp();
      
      return interaction.reply({ embeds: [banEmbed] });
    } catch (error) {
      console.error("Error banning user:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Ban Failed")
            .setDescription(`Failed to ban ${targetUser.tag}. Error: ${error}`)
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;