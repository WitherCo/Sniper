import { 
  Message, 
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "freesongs",
  description: "Get a list of recommended copyright-free music sources",
  category: "music",
  aliases: ["free", "copyrightfree", "freemusic"],
  prefix: true,
  cooldown: 5,
  permissions: [],
  
  async execute(interaction: Message) {
    try {
      const embed = new EmbedBuilder()
        .setTitle("🎵 Copyright-Free Music Sources")
        .setDescription("Here are some recommended sources for copyright-free music that you can safely play through the bot:")
        .addFields(
          { 
            name: "NoCopyrightSounds (NCS)", 
            value: "A label that releases free-to-use music\n[Website](https://ncs.io/) | [YouTube](https://www.youtube.com/c/NoCopyrightSounds)",
            inline: false
          },
          {
            name: "Free Music Archive",
            value: "A library of high-quality, legal audio downloads\n[Website](https://freemusicarchive.org/)",
            inline: false
          },
          {
            name: "Incompetech (Kevin MacLeod)",
            value: "Royalty-free music composer with a huge library\n[Website](https://incompetech.com/)",
            inline: false
          },
          {
            name: "Bensound",
            value: "Free stock music for content creators\n[Website](https://www.bensound.com/)",
            inline: false
          },
          {
            name: "YouTube Audio Library",
            value: "YouTube's official free music collection\n[Website](https://www.youtube.com/audiolibrary)",
            inline: false
          }
        )
        .setFooter({ text: "⚠️ Always check the specific license terms for each track you use" })
        .setColor(0x3498DB);
      
      return interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error in freesongs command:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("An error occurred while trying to show copyright-free music sources.")
            .setFooter({ text: `Error: ${error.message}` })
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;