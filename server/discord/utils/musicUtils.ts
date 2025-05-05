import { TextChannel } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";

/**
 * IMPORTANT NOTICE:
 * This music player is intended for playing copyright-free music only.
 * Users must ensure that they have the proper rights to play any music
 * through the bot. The bot owners and developers are not responsible
 * for any copyright infringement by users.
 */

// Define the type for a song
export interface Song {
  title: string;
  url: string;
  duration: string;
  thumbnail: string | null;
  requestedBy: string;
}

// Define the type for a music connection
export interface MusicConnection {
  connection: VoiceConnection | null;
  player: AudioPlayer;
  queue: Song[];
  currentSong: Song | null;
  textChannel: TextChannel;
}

// The global map to store active music connections
export const musicConnections = new Map<string, MusicConnection>();

// Helper function to format duration in seconds to MM:SS format
export function formatDuration(durationInSeconds: number): string {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}