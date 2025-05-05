import { 
  CommandInteraction, 
  Message, 
  GuildMember, 
  Guild, 
  EmbedBuilder, 
  TextChannel, 
  User, 
  MessageMentions 
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "addban",
  description: "Add a user to the ban list without banning them (softban)",
  category: "admin",
  aliases: ["softban", "shadowban"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: ["Administrator", "BanMembers"],
  options: [
    {
      name: "user",
      description: "The user to add to the ban list",
      type: "USER",
      required: true
    },
    {
      name: "reason",
      description: "Reason for the ban",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: Message) {
    const args = interaction.content.split(" ").slice(1);
    if (!args.length) {
      return await interaction.reply("❌ Please specify a user to add to the ban list!");
    }

    // Get user ID from mention, ID, or username
    let userId: string | null = null;
    let targetUser: User | null = null;
    
    // Check if the first argument is a mention
    const mentionMatch = args[0].match(/<@!?(\d+)>/);
    if (mentionMatch) {
      userId = mentionMatch[1];
      try {
        targetUser = await interaction.client.users.fetch(userId);
      } catch (error) {
        return await interaction.reply("❌ Invalid user mention or ID!");
      }
    } 
    // Check if it's a raw ID
    else if (/^\d+$/.test(args[0])) {
      userId = args[0];
      try {
        targetUser = await interaction.client.users.fetch(userId);
      } catch (error) {
        return await interaction.reply("❌ Invalid user ID!");
      }
    } 
    // Otherwise try to find by username
    else {
      return await interaction.reply("❌ Please mention a user or provide a valid user ID!");
    }
    
    if (!targetUser) {
      return await interaction.reply("❌ Could not find that user!");
    }

    // Get reason (everything after the user mention/id)
    const reason = args.slice(1).join(" ") || "No reason provided";
    
    // Check if the user is in the guild
    const guild = interaction.guild;
    if (!guild) {
      return await interaction.reply("❌ This command can only be used in a server!");
    }
    
    try {
      // Check if the bot has permission to ban members
      const botMember = guild.members.cache.get(interaction.client.user.id);
      if (!botMember?.permissions.has("BanMembers")) {
        return await interaction.reply("❌ I don't have permission to ban members!");
      }
      
      // Build the ban entry while keeping the user in the server
      await guild.bans.create(targetUser.id, { 
        reason: `Softban by ${interaction.author.tag}: ${reason}`,
        deleteMessageSeconds: 0 // Don't delete any messages
      });
      
      // Create a beautiful embed for the success message
      const successEmbed = new EmbedBuilder()
        .setTitle("✅ User Added to Ban List")
        .setDescription(`**${targetUser.tag}** has been added to the ban list without being banned from the server.`)
        .addFields(
          { name: "User ID", value: targetUser.id, inline: true },
          { name: "Moderator", value: interaction.author.tag, inline: true },
          { name: "Reason", value: reason }
        )
        .setColor(0xE74C3C) // Red color
        .setTimestamp();
      
      // Send the success message
      await interaction.reply({ embeds: [successEmbed] });
      
      // Try to log the action to a mod-logs channel if it exists
      try {
        const logChannels = ["mod-logs", "mod-log", "modlogs", "moderator-logs", "admin-logs"];
        for (const channelName of logChannels) {
          const channel = guild.channels.cache.find(ch => 
            ch.name.includes(channelName) && ch.isTextBased()
          ) as TextChannel | undefined;
          
          if (channel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("User Added to Ban List")
              .setDescription(`**${targetUser.tag}** was added to the ban list by ${interaction.author.tag}`)
              .addFields(
                { name: "User ID", value: targetUser.id, inline: true },
                { name: "Moderator", value: interaction.author.tag, inline: true },
                { name: "Reason", value: reason }
              )
              .setColor(0xE74C3C) // Red color
              .setFooter({ text: `ID: ${targetUser.id}` })
              .setTimestamp();
            
            await channel.send({ embeds: [logEmbed] });
            break;
          }
        }
      } catch (error) {
        // Silently fail if we can't log
        console.error("Could not log addban action:", error);
      }
      
    } catch (error) {
      console.error("Error in addban command:", error);
      return await interaction.reply("❌ An error occurred while trying to add this user to the ban list. Make sure I have the correct permissions and that the user ID is valid.");
    }
  }
} as DiscordCommand;
