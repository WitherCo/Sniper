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
  name: "kick",
  description: "Kick a user from the server",
  category: "moderation",
  aliases: ["boot"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ["KickMembers"],
  options: [
    {
      name: "user",
      description: "The user to kick",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "The reason for the kick",
      type: "STRING",
      required: false
    },
    {
      name: "silent",
      description: "Whether to kick silently (no DM notification)",
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
    
    // Check if the bot has permission to kick
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        content: "❌ I don't have permission to kick members in this server.",
        ephemeral: true
      });
    }
    
    // Check if the user has permission to kick
    const member = interaction instanceof Message 
      ? interaction.member as GuildMember 
      : interaction.member as GuildMember;
    
    if (!member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        content: "❌ You don't have permission to kick members in this server.",
        ephemeral: true
      });
    }
    
    let targetUser: User | null = null;
    let reason = "No reason provided";
    let silent = false;
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.getUser("user");
      const reasonOption = interaction.options.getString("reason");
      const silentOption = interaction.options.getBoolean("silent");
      
      if (userOption) {
        targetUser = userOption;
      }
      
      if (reasonOption) {
        reason = reasonOption;
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
              .setDescription("You must specify a user to kick.")
              .addFields({ name: "Usage", value: `${config.prefix}kick <user> [reason] [--silent]` })
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
      return interaction.reply("❌ You must specify a valid user to kick.");
    }
    
    // Don't allow kicking the bot itself
    if (targetUser.id === interaction.client.user?.id) {
      return interaction.reply("❓ I cannot kick myself.");
    }
    
    // Don't allow kicking the server owner
    if (targetUser.id === guild.ownerId) {
      return interaction.reply("❌ You cannot kick the server owner.");
    }
    
    // Check if user is trying to kick themselves
    if (targetUser.id === (interaction instanceof Message ? interaction.author.id : interaction.user.id)) {
      return interaction.reply("❌ You cannot kick yourself.");
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
      
      // Check if the user can be kicked (role hierarchy)
      if (
        member.roles.highest.position <= targetMember.roles.highest.position && 
        member.id !== guild.ownerId
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Cannot Kick")
              .setDescription("You cannot kick a member with the same or higher role than you.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Check if the bot can kick this member
      if (guild.members.me && guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Cannot Kick")
              .setDescription("I cannot kick a member with the same or higher role than me.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Format the kick reason
      const formattedReason = `Kicked by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}: ${reason}`;
      
      // DM the user before kicking (if not silent)
      if (!silent && targetUser.id !== targetUser.client.user?.id) { // Don't DM the bot itself
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(`👢 You've Been Kicked from ${guild.name}`)
            .setColor(0xE67E22)
            .addFields(
              { name: "Reason", value: reason },
              { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag }
            )
            .setFooter({ text: "You can rejoin the server with a new invite." })
            .setTimestamp();
          
          await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
            // If we can't DM the user, just continue with the kick
          });
        } catch (error) {
          // Ignore errors with sending DMs
        }
      }
      
      // Kick the user
      await targetMember.kick(formattedReason);
      
      // Send kick confirmation
      const kickEmbed = new EmbedBuilder()
        .setTitle("👢 User Kicked")
        .setDescription(`Successfully kicked **${targetUser.tag}** from the server.`)
        .setColor(0xE67E22)
        .addFields(
          { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: "Moderator", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
          { name: "DM Notification", value: silent ? "No" : "Yes", inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setTimestamp();
      
      return interaction.reply({ embeds: [kickEmbed] });
    } catch (error) {
      console.error("Error kicking user:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Kick Failed")
            .setDescription(`Failed to kick ${targetUser?.tag}. Error: ${error}`)
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;