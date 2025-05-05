
import { CommandInteraction, Message, EmbedBuilder, User } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "userinfo",
  description: "Get information about a user",
  category: "utility",
  aliases: ["whois", "user"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    try {
      let targetUser: User | null = null;

      if (interaction instanceof Message) {
        targetUser = args && args.length > 0 
          ? await interaction.client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null)
          : interaction.author;
      } else {
        targetUser = interaction.options.getUser("user") || interaction.user;
      }

      if (!targetUser) {
        const errorMsg = "❌ Could not find that user";
        return interaction instanceof Message 
          ? interaction.reply(errorMsg)
          : interaction.reply({ content: errorMsg, ephemeral: true });
      }

      const member = interaction.guild?.members.cache.get(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setTitle(`User Information - ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .setColor(0x3498db)
        .addFields([
          { name: "Username", value: targetUser.username, inline: true },
          { name: "User ID", value: targetUser.id, inline: true },
          { name: "Account Created", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Bot", value: targetUser.bot ? "Yes" : "No", inline: true }
        ]);

      if (member) {
        embed.addFields([
          { name: "Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
          { name: "Nickname", value: member.nickname || "None", inline: true },
          { name: "Roles", value: member.roles.cache.size > 1 
            ? member.roles.cache.filter(r => r.id !== interaction.guild?.id).map(r => `<@&${r.id}>`).join(", ")
            : "None" 
          }
        ]);
      }

      if (interaction instanceof Message) {
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: false });
      }
    } catch (error) {
      console.error("Error in userinfo command:", error);
      const errorMsg = "❌ Failed to fetch user information";
      if (interaction instanceof Message) {
        await interaction.reply(errorMsg);
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    }
  }
} as DiscordCommand;
