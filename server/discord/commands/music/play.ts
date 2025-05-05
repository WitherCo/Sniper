import { 
  Message, 
  EmbedBuilder,
  GuildMember,
  ChannelType,
  PermissionFlagsBits,
  TextChannel
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  entersState, 
  AudioPlayerStatus, 
  VoiceConnectionStatus
} from "@discordjs/voice";
import play from "play-dl";
import axios from "axios";
import { 
  musicConnections, 
  formatDuration, 
  Song,
  MusicConnection
} from "../../utils/musicUtils";

// Get YouTube API key from environment variables
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to search YouTube using the official API
async function searchYouTube(query: string): Promise<any> {
  try {
    console.log(`[DEBUG] Searching YouTube API for: "${query}"`);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 1,
        q: query,
        type: 'video',
        key: YOUTUBE_API_KEY
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const videoId = response.data.items[0].id.videoId;
      const title = response.data.items[0].snippet.title;
      const thumbnail = response.data.items[0].snippet.thumbnails.high?.url || 
                       response.data.items[0].snippet.thumbnails.default?.url;

      console.log(`[DEBUG] YouTube API found: ${title} (${videoId})`);

      // Get video details including duration
      const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'contentDetails,snippet',
          id: videoId,
          key: YOUTUBE_API_KEY
        }
      });

      // Parse duration from ISO 8601 format (PT#M#S)
      let duration = "Unknown";
      let durationInSec = 0;
      if (videoResponse.data.items && videoResponse.data.items.length > 0) {
        const isoDuration = videoResponse.data.items[0].contentDetails.duration;
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const hours = match[1] ? parseInt(match[1]) : 0;
          const minutes = match[2] ? parseInt(match[2]) : 0;
          const seconds = match[3] ? parseInt(match[3]) : 0;

          durationInSec = hours * 3600 + minutes * 60 + seconds;
          duration = formatDuration(durationInSec);
        }
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`[DEBUG] YouTube API formed URL: ${videoUrl}`);

      return {
        id: videoId,
        title: title,
        url: videoUrl,
        thumbnail: thumbnail,
        duration: duration,
        durationInSec: durationInSec
      };
    }
    return null;
  } catch (error) {
    console.error("[ERROR] YouTube API search error:", error);
    throw error;
  }
}

export default {
  name: "play",
  description: "Play copyright-free music",
  category: "music",
  aliases: ["p"],
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "query",
      description: "The copyright-free song name or URL to play",
      type: "STRING",
      required: true
    }
  ],

  async execute(interaction: Message, args?: string[]) {
    try {
      // Check if we have a query to search for
      if (!args || args.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Missing Song")
              .setDescription("Please provide a song name or YouTube URL to play.")
              .setColor(0xFF0000)
          ]
        });
      }

      // Join the search terms into a single query
      const query = args.join(" ");

      // Get the member who invoked the command
      const member = interaction.member as GuildMember;

      console.log(`[DEBUG] Member: ${member.user.tag} (${member.id})`);
      console.log(`[DEBUG] Voice state exists: ${Boolean(member.voice)}`);

      // Initialize voiceChannel variable outside try block so it's accessible later
      let voiceChannel;

      // Get a fresh instance of the GuildMember to ensure we have up-to-date voice state
      try {
        const guild = interaction.guild;
        const updatedMember = guild.members.cache.get(member.id) || await guild.members.fetch(member.id);
        console.log(`[DEBUG] Updated member voice state exists: ${Boolean(updatedMember.voice)}`);

        // Check if the user is in a voice channel
        voiceChannel = updatedMember.voice.channel;
        if (!voiceChannel) {
          console.log(`[DEBUG] Voice channel not found for ${updatedMember.user.tag}`);
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Not In Voice Channel")
                .setDescription("You need to be in a voice channel to use this command. If you are already in a voice channel, try reconnecting.")
                .setColor(0xFF0000)
            ]
          });
        }

        console.log(`[DEBUG] User is in voice channel: ${voiceChannel.name} (${voiceChannel.id})`);
      } catch (error) {
        console.error(`[ERROR] Error fetching voice channel: ${error.message}`);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Voice Channel Error")
              .setDescription("There was an error detecting your voice channel. Make sure you're in a voice channel and try again.")
              .setColor(0xFF0000)
          ]
        });
      }

      // Additional fallback - if something went wrong and voiceChannel is still undefined
      if (!voiceChannel) {
        console.log(`[DEBUG] Voice channel is still undefined after all checks`);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Voice Channel Not Found")
              .setDescription("Could not detect your voice channel. Please try rejoining the voice channel.")
              .setColor(0xFF0000)
          ]
        });
      }

      // Check permissions
      const permissions = voiceChannel.permissionsFor(interaction.client.user.id);
      if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Insufficient Permissions")
              .setDescription("I need permissions to join and speak in your voice channel.")
              .setColor(0xFF0000)
          ]
        });
      }

      // Send a loading message
      const loadingMessage = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔍 Searching...")
            .setDescription(`Searching for "${query}"\n\n💡 Try searching for music from copyright-free sources like NoCopyrightSounds, Royalty Free Music, or Free Music Archive`)
            .setColor(0x3498DB)
        ]
      });

      // Search for the song
      let songInfo;
      let url = query;

      // Check if the query is a URL
      if (!query.startsWith("http")) {
        try {
          // Use play-dl directly for searching
          console.log(`[DEBUG] Searching for "${query}" using play-dl`);
          const searchResults = await play.search(query, { limit: 1 });
          if (!searchResults || searchResults.length === 0) {
            return loadingMessage.edit({
              embeds: [
                new EmbedBuilder()
                  .setTitle("❌ No Results")
                  .setDescription(`Could not find any results for "${query}".`)
                  .setColor(0xFF0000)
              ]
            });
          }

          // Get the first result
          songInfo = searchResults[0];
          url = songInfo.url;
          console.log(`[DEBUG] Found video: ${songInfo.title} (${url})`);
        } catch (error) {
          console.error(`[ERROR] play-dl search error:`, error);
          return loadingMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Search Error")
                .setDescription(`There was an error searching for your song. Please try again later.`)
                .setColor(0xFF0000)
            ]
          });
        }
      } else {
        // The query is a URL, validate it
        try {
          console.log(`[DEBUG] Processing direct URL: ${url}`);
          songInfo = await play.video_info(url);
          songInfo = songInfo.video_details;
          console.log(`[DEBUG] URL video info: ${songInfo.title}`);
        } catch (error) {
          console.error(`[ERROR] Video info error:`, error);
          return loadingMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ YouTube Rate Limit")
                .setDescription("YouTube is currently rate limiting our requests. Please try:\n\n1. Wait a few seconds and try again\n2. Use a different song\n3. Try using `l?search` instead of direct URLs")
                .setFooter({ text: "This usually resolves within a minute" })
                .setColor(0xFF0000)
            ]
          });
        }
      }

      // Get or create the music connection for this guild
      const guildId = interaction.guild.id;
      let musicConnection = musicConnections.get(guildId);

      // If there's no existing connection, create one
      if (!musicConnection) {
        musicConnection = {
          connection: null,
          player: createAudioPlayer(),
          queue: [],
          currentSong: null,
          textChannel: interaction.channel
        };

        musicConnections.set(guildId, musicConnection);
      }

      // Add the song to the queue
      let thumbnail = null;

      // Handle different structures of API responses for thumbnail
      if (songInfo.thumbnail) {
        // Our YouTube API search result
        thumbnail = songInfo.thumbnail;
      } else if (songInfo.thumbnails && Array.isArray(songInfo.thumbnails)) {
        // play-dl search result
        thumbnail = songInfo.thumbnails[0]?.url || null;
      }

      const song = {
        title: songInfo.title || "Unknown Title",
        url: url,
        duration: songInfo.duration || (songInfo.durationInSec ? formatDuration(songInfo.durationInSec) : "Unknown"),
        thumbnail: thumbnail,
        requestedBy: member.user.tag
      };

      musicConnection.queue.push(song);

      // If there's no active connection, create one
      if (!musicConnection.connection) {
        // Create a voice connection
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator
        });

        musicConnection.connection = connection;

        // Set up connection status handlers
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
          } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
            musicConnections.delete(guildId);
          }
        });

        // Listen for the music player to finish playing a song
        musicConnection.player.on(AudioPlayerStatus.Idle, () => {
          // Remove the song that just finished
          musicConnection.currentSong = null;

          // Play the next song if there is one
          if (musicConnection.queue.length > 0) {
            playSong(guildId);
          } else {
            // If there are no more songs, wait for 5 minutes then disconnect
            setTimeout(() => {
              if (musicConnection.queue.length === 0 && !musicConnection.currentSong) {
                if (musicConnection.connection) {
                  musicConnection.connection.destroy();
                }
                musicConnections.delete(guildId);

                // Send a message indicating the bot left due to inactivity
                if (musicConnection.textChannel) {
                  musicConnection.textChannel.send({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle("👋 Left Voice Channel")
                        .setDescription("Left the voice channel due to inactivity.")
                        .setColor(0x3498DB)
                    ]
                  }).catch(() => {});
                }
              }
            }, 5 * 60 * 1000);
          }
        });

        // Connect the music player to the voice connection
        connection.subscribe(musicConnection.player);
      }

      // If we're not currently playing a song, start playing
      if (!musicConnection.currentSong) {
        await playSong(guildId);
      }

      // Update the loading message
      return loadingMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎵 Added to Queue")
            .setDescription(`**[${song.title}](${song.url})** has been added to the queue.`)
            .setThumbnail(song.thumbnail)
            .addFields(
              { name: "Duration", value: song.duration, inline: true },
              { name: "Requested By", value: song.requestedBy, inline: true },
              { name: "Position in Queue", value: musicConnection.currentSong ? `${musicConnection.queue.length}` : "Now Playing", inline: true }
            )
            .setFooter({ text: "⚠️ Please ensure you only play copyright-free or properly licensed music" })
            .setColor(0x3498DB)
        ]
      });

    } catch (error) {
      console.error("Error in play command:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("An error occurred while trying to play the song.")
            .setFooter({ text: `Error: ${error.message}` })
            .setColor(0xFF0000)
        ]
      });
    }
  }
} as DiscordCommand;

// Function to play a song from the queue (moved to the top from below)

// Function to play a song from the queue
async function playSong(guildId: string): Promise<void> {
  const musicConnection = musicConnections.get(guildId);
  if (!musicConnection || musicConnection.queue.length === 0) return;

  // Get the first song in the queue
  const song = musicConnection.queue.shift();
  if (!song || !song.url) {
    console.error("[ERROR] Invalid song or missing URL in queue");
    if (musicConnection.textChannel) {
      musicConnection.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Playback Error")
            .setDescription("There was an error with the song in queue. Missing or invalid URL.")
            .setColor(0xFF0000)
        ]
      }).catch(() => {});
    }

    // Try the next song
    if (musicConnection.queue.length > 0) {
      return playSong(guildId);
    }
    return;
  }

  musicConnection.currentSong = song;

  try {
    console.log(`[DEBUG] Starting playback of: ${song.title} (${song.url})`);

    // Additional URL validation
    if (!song.url.startsWith("http")) {
      throw new Error("Invalid URL format: " + song.url);
    }

    // Get the stream for the song
    const stream = await play.stream(song.url);

    console.log(`[DEBUG] Successfully obtained stream for: ${song.title}`);

    // Create an audio resource from the stream
    const resource = createAudioResource(stream.stream, { 
      inputType: stream.type,
      inlineVolume: true
    });

    // Set the volume to 80%
    if (resource.volume) {
      resource.volume.setVolume(0.8);
    }

    // Play the song
    musicConnection.player.play(resource);

    // Notify the text channel
    musicConnection.textChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎵 Now Playing")
          .setDescription(`**[${song.title}](${song.url})**`)
          .setThumbnail(song.thumbnail)
          .addFields(
            { name: "Duration", value: song.duration, inline: true },
            { name: "Requested By", value: song.requestedBy, inline: true }
          )
          .setFooter({ text: "⚠️ Please ensure you only play copyright-free or properly licensed music" })
          .setColor(0x3498DB)
      ]
    }).catch(() => {});

  } catch (error) {
    console.error("Error playing song:", error);

    // Check if it's a YouTube verification issue
    const errorMessage = error.message || "";
    if (errorMessage.includes("Sign in to confirm") || errorMessage.includes("verify") || errorMessage.includes("confirmation")) {
      musicConnection.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ YouTube Verification Required")
            .setDescription(`YouTube is requiring verification to play "${song.title}". Try one of these solutions:\n\n• Try using a direct link to a copyright-free song\n• Try again in a few minutes\n• Use the \`l?freesongs\` command to find copyright-free music sources`)
            .setFooter({ text: "YouTube sometimes blocks automated requests to prevent abuse" })
            .setColor(0xFF0000)
        ]
      }).catch(() => {});
    } else {
      musicConnection.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Playback Error")
            .setDescription(`An error occurred while trying to play ${song.title}.`)
            .setFooter({ text: `Error: ${errorMessage.substring(0, 100)}` })
            .setColor(0xFF0000)
        ]
      }).catch(() => {});
    }

    // Try playing the next song
    if (musicConnection.queue.length > 0) {
      return playSong(guildId);
    }
  }
}