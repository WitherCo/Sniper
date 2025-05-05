
import { 
  Message, 
  EmbedBuilder,
  GuildMember
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { getVoiceConnection } from "@discordjs/voice";
import { musicConnections } from "../../utils/musicUtils";

export default {
  name: "skip",
  description: "Skip the current song",
  category: "music",
  aliases: ["s", "next"],
  prefix: true,
  cooldown: 5,
  permissions: [],
  
  async execute(interaction: Message) {
    try {
      // Get the member who invoked the command
      const member = interaction.member as GuildMember;
      
      // Check if member is in a voice channel
      if (!member.voice.channel) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Voice Channel Required")
              .setDescription("You need to be in a voice channel to skip music.")
              .setColor(0xFF0000)
          ]
        });
      }

      const guildId = interaction.guild.id;
      const musicConnection = musicConnections.get(guildId);

      // Check if there's an active connection
      if (!musicConnection || !musicConnection.connection) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Not Playing")
              .setDescription("There is no music currently playing.")
              .setColor(0xFF0000)
          ]
        });
      }

      // Check if there's a song playing
      if (!musicConnection.currentSong) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ No Song Playing")
              .setDescription("There is no song currently playing to skip.")
              .setColor(0xFF0000)
          ]
        });
      }

      // Store the current song info for the message
      const skippedSong = musicConnection.currentSong;

      // Stop the current song - this will trigger the 'idle' event
      // which will automatically play the next song
      musicConnection.player.stop();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("⏭️ Skipped Song")
            .setDescription(`Skipped **[${skippedSong.title}](${skippedSong.url})**`)
            .addFields(
              { name: "Requested By", value: member.user.tag, inline: true }
            )
            .setColor(0x3498DB)
        ]
      });

    } catch (error) {
      console.error("Error in skip command:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("An error occurred while trying to skip the song.")
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;
