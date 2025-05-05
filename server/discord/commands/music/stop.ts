import { 
  Message, 
  EmbedBuilder,
  GuildMember
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { getVoiceConnection } from "@discordjs/voice";
import { musicConnections } from "../../utils/musicUtils";

export default {
  name: "stop",
  description: "Stop the copyright-free music and clear the queue",
  category: "music",
  aliases: ["disconnect", "leave", "dc"],
  prefix: true,
  cooldown: 5,
  permissions: [],
  
  async execute(interaction: Message) {
    try {
      // Get the member who invoked the command
      const member = interaction.member as GuildMember;
      
      console.log(`[DEBUG] Stop command - Member: ${member.user.tag} (${member.id})`);
      console.log(`[DEBUG] Stop command - Voice state exists: ${Boolean(member.voice)}`);
      
      // Get the guild ID
      if (!interaction.guild) {
        console.log(`[DEBUG] Stop command - Guild is null or undefined`);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Command Error")
              .setDescription("This command can only be used in a server.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      const guildId = interaction.guild.id;
      
      // Check if there's an active voice connection before requiring the user to be in a voice channel
      const existingConnection = getVoiceConnection(guildId);
      if (!existingConnection) {
        console.log(`[DEBUG] Stop command - No active voice connection found`);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Not Playing")
              .setDescription("I'm not currently playing any music in this server.")
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Since we're stopping playback, we can be more permissive about the voice channel requirement
      // Bot can be stopped from any voice channel, not just the one the user is in
      
      // We already validated and have the connection from earlier checks
      const connection = existingConnection;
      
      // Get the music connection for this guild
      const musicConnection = musicConnections.get(guildId);
      
      // Clear the queue
      if (musicConnection) {
        musicConnection.queue = [];
        musicConnection.currentSong = null;
        
        // Stop the player if it exists
        if (musicConnection.player) {
          musicConnection.player.stop();
        }
      }
      
      // Destroy the connection
      connection.destroy();
      
      // Remove the music connection for this guild
      musicConnections.delete(guildId);
      
      // Send a success message
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("👋 Disconnected")
            .setDescription("Music playback stopped and I've left the voice channel.")
            .setColor(0x3498DB)
        ]
      });
      
    } catch (error) {
      console.error("Error in stop command:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("An error occurred while trying to stop the music.")
            .setFooter({ text: `Error: ${error.message}` })
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;