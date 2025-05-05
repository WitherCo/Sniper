import { 
  Message, 
  EmbedBuilder
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { musicConnections, Song } from "../../utils/musicUtils";

export default {
  name: "queue",
  description: "Display the current copyright-free music queue",
  category: "music",
  aliases: ["q", "list"],
  prefix: true,
  cooldown: 5,
  permissions: [],
  
  async execute(interaction: Message) {
    try {
      // Get the guild ID
      const guildId = interaction.guild?.id;
      if (!guildId) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Command Error")
              .setDescription("This command can only be used in a server.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Get the music connection for this guild
      const musicConnection = musicConnections.get(guildId);
      
      // If there's no active connection or queue is empty
      if (!musicConnection || (musicConnection.queue.length === 0 && !musicConnection.currentSong)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("📋 Queue Empty")
              .setDescription("There are no songs in the queue.")
              .setColor(0x3498DB)
          ]
        });
      }
      
      // Build the queue list
      let queueList = "";
      let totalDuration = 0;
      
      // Add the current song
      if (musicConnection.currentSong) {
        queueList += `**Now Playing:**\n`;
        queueList += `[${musicConnection.currentSong.title}](${musicConnection.currentSong.url}) | Requested by: ${musicConnection.currentSong.requestedBy}\n\n`;
        
        // Try to parse the duration and add it to the total
        const durationParts = musicConnection.currentSong.duration.split(':');
        if (durationParts.length === 2) {
          const minutes = parseInt(durationParts[0]);
          const seconds = parseInt(durationParts[1]);
          if (!isNaN(minutes) && !isNaN(seconds)) {
            totalDuration += minutes * 60 + seconds;
          }
        }
      }
      
      // Add the queued songs
      if (musicConnection.queue.length > 0) {
        queueList += `**Upcoming Songs:**\n`;
        
        // Only show up to 10 songs to avoid message length issues
        const songsToShow = musicConnection.queue.slice(0, 10);
        
        songsToShow.forEach((song: Song, index: number) => {
          queueList += `${index + 1}. [${song.title}](${song.url}) | ${song.duration} | Requested by: ${song.requestedBy}\n`;
          
          // Try to parse the duration and add it to the total
          const durationParts = song.duration.split(':');
          if (durationParts.length === 2) {
            const minutes = parseInt(durationParts[0]);
            const seconds = parseInt(durationParts[1]);
            if (!isNaN(minutes) && !isNaN(seconds)) {
              totalDuration += minutes * 60 + seconds;
            }
          }
        });
        
        // If there are more songs than we're showing
        if (musicConnection.queue.length > 10) {
          queueList += `\n... and ${musicConnection.queue.length - 10} more song(s)`;
        }
      }
      
      // Format the total duration
      const totalMinutes = Math.floor(totalDuration / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      
      let formattedDuration = "";
      if (totalHours > 0) {
        formattedDuration = `${totalHours} hour${totalHours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      } else {
        formattedDuration = `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      }
      
      // Create the embed
      const embed = new EmbedBuilder()
        .setTitle("🎵 Copyright-Free Music Queue")
        .setDescription(queueList)
        .setColor(0x3498DB)
        .setFooter({ 
          text: `⚠️ Please ensure all music played is copyright-free | ${musicConnection.queue.length + (musicConnection.currentSong ? 1 : 0)} song${musicConnection.queue.length + (musicConnection.currentSong ? 1 : 0) !== 1 ? 's' : ''} | Duration: ${formattedDuration}` 
        })
        .setTimestamp();
      
      // Send the embed
      return interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error in queue command:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("An error occurred while trying to display the queue.")
            .setFooter({ text: `Error: ${error.message}` })
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;