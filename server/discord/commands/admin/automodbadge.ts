import { Message, EmbedBuilder, PermissionFlagsBits, GuildMember, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "automodbadge",
  description: "Get information on how to redeem the Discord Moderator Badge",
  category: "admin",
  aliases: ["modbadge", "getbadge", "discordbadge"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: ["Administrator"],
  
  async execute(interaction: Message) {
    try {
      // Only server administrators should be able to use this command
      const member = interaction.member as GuildMember;
      if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⚠️ Permission Denied")
              .setDescription("You need administrator permissions to use this command.")
              .setColor(0xE74C3C)
          ]
        });
      }

      // Create the Discord Moderator Badge information embed
      const badgeEmbed = new EmbedBuilder()
        .setTitle("🛡️ Discord Moderator Badge")
        .setDescription(`Get the exclusive Discord Moderator Badge by setting up AutoMod in your server! This badge shows your commitment to keeping Discord safe.

**How to qualify:**
1. Enable Community Features in Server Settings
2. Set up at least 5 AutoMod rules in your server 
3. Keep the rules active for at least 7 days
4. Your server must have at least 100 members

**Badge Benefits:**
• Exclusive profile badge visible across all Discord
• Recognition as a dedicated server moderator
• Shows your commitment to server safety

The badge automatically appears on your profile within 24-48 hours after meeting all requirements.`)
        .setColor(0x5865F2) // Discord Blurple
        .setImage("https://cdn.discordapp.com/attachments/534026483440222220/634944400406159370/mod.png") // Discord Moderator Badge image
        .setFooter({ text: "Discord Moderator Program" });

      // Create buttons for badge redemption and help
      // Since there's no direct redemption link for the Automod badge, we'll provide Discord's official support article
      const redeemButton = new ButtonBuilder()
        .setLabel("Setup AutoMod")
        .setURL("https://support.discord.com/hc/en-us/articles/13922213599383-AutoMod-Using-the-Rules-for-Safety-Features-Communities-")
        .setStyle(ButtonStyle.Link);

      const helpButton = new ButtonBuilder()
        .setLabel("Community Features")
        .setURL("https://support.discord.com/hc/en-us/articles/360047132851-Enabling-Your-Community-Server")
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(redeemButton, helpButton);

      // Send the embed with buttons
      return interaction.reply({ 
        embeds: [badgeEmbed],
        components: [row]
      });
    } catch (error) {
      console.error("Error in automodbadge command:", error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("There was an error processing the automod badge command. Please try again later.")
        .setColor(0xE74C3C);
      
      return interaction.reply({ embeds: [errorEmbed] });
    }
  }
} as DiscordCommand;