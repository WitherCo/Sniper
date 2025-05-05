export type Command = {
  id?: number;
  name: string;
  description: string;
  category: string;
  usage: string;
  example?: string;
  slash: boolean;
  prefix: boolean;
  cooldown: number;
  permissions: string[];
};

export type Category = {
  id?: number;
  name: string;
  description?: string;
  commandCount: number;
};

export type ServerStats = {
  id?: number;
  totalCommands: number;
  slashCommands: number;
  prefixCommands: number;
  activeServers: number;
};

export type BotConfig = {
  id?: number;
  prefix: string;
  ownerId: string;
  presence: string;
  status: string;
};

export type BotStatus = {
  status: "online" | "offline";
  username: string | null;
  guilds: number;
};
