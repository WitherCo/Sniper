import { Collection } from 'discord.js';
import { DiscordCommand } from '@shared/schema';

// Extend the Discord.js Client type
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, DiscordCommand>;
    slashCommands: Collection<string, DiscordCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}