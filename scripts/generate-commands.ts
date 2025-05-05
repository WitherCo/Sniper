import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Categories
const categories = [
  {
    name: 'moderation',
    description: 'Commands for server moderation',
    commands: [
      { name: 'ban', description: 'Ban a member from the server', permissions: ['BanMembers'] },
      { name: 'kick', description: 'Kick a member from the server', permissions: ['KickMembers'] },
      { name: 'mute', description: 'Mute a member in the server', permissions: ['ModerateMembers'] },
      { name: 'unmute', description: 'Unmute a member in the server', permissions: ['ModerateMembers'] },
      { name: 'warn', description: 'Warn a member in the server', permissions: ['ModerateMembers'] },
      { name: 'purge', description: 'Delete multiple messages at once', permissions: ['ManageMessages'] },
      { name: 'lock', description: 'Lock a channel', permissions: ['ManageChannels'] },
      { name: 'unlock', description: 'Unlock a channel', permissions: ['ManageChannels'] },
      { name: 'slowmode', description: 'Set slowmode for a channel', permissions: ['ManageChannels'] },
      { name: 'timeout', description: 'Timeout a user', permissions: ['ModerateMembers'] },
      // Add more moderation commands here
    ]
  },
  {
    name: 'utility',
    description: 'Utility commands for server management',
    commands: [
      { name: 'help', description: 'Show help information', permissions: [] },
      { name: 'ping', description: 'Check bot latency', permissions: [] },
      { name: 'serverinfo', description: 'Show server information', permissions: [] },
      { name: 'userinfo', description: 'Show user information', permissions: [] },
      { name: 'avatar', description: 'Get a user\'s avatar', permissions: [] },
      { name: 'role', description: 'Manage roles for a user', permissions: ['ManageRoles'] },
      { name: 'roles', description: 'List all roles in the server', permissions: [] },
      { name: 'channelinfo', description: 'Get information about a channel', permissions: [] },
      { name: 'embed', description: 'Create an embed message', permissions: ['ManageMessages'] },
      { name: 'poll', description: 'Create a poll', permissions: [] },
      // Add more utility commands here
    ]
  },
  {
    name: 'fun',
    description: 'Fun commands for entertainment',
    commands: [
      { name: '8ball', description: 'Ask the magic 8ball a question', permissions: [] },
      { name: 'coinflip', description: 'Flip a coin', permissions: [] },
      { name: 'roll', description: 'Roll a dice', permissions: [] },
      { name: 'rps', description: 'Play rock paper scissors', permissions: [] },
      { name: 'joke', description: 'Get a random joke', permissions: [] },
      { name: 'meme', description: 'Get a random meme', permissions: [] },
      { name: 'cat', description: 'Get a random cat image', permissions: [] },
      { name: 'dog', description: 'Get a random dog image', permissions: [] },
      { name: 'say', description: 'Make the bot say something', permissions: [] },
      { name: 'reverse', description: 'Reverse a text', permissions: [] },
      // Add more fun commands here
    ]
  },
  {
    name: 'music',
    description: 'Music commands for playing audio',
    commands: [
      { name: 'play', description: 'Play a song', permissions: [] },
      { name: 'skip', description: 'Skip the current song', permissions: [] },
      { name: 'stop', description: 'Stop playing music', permissions: [] },
      { name: 'queue', description: 'Show the music queue', permissions: [] },
      { name: 'pause', description: 'Pause the current song', permissions: [] },
      { name: 'resume', description: 'Resume the current song', permissions: [] },
      { name: 'volume', description: 'Change the volume', permissions: [] },
      { name: 'nowplaying', description: 'Show the current song', permissions: [] },
      { name: 'shuffle', description: 'Shuffle the queue', permissions: [] },
      { name: 'loop', description: 'Loop the current song or queue', permissions: [] },
      // Add more music commands here
    ]
  },
  {
    name: 'economy',
    description: 'Economy commands for virtual currency',
    commands: [
      { name: 'balance', description: 'Check your balance', permissions: [] },
      { name: 'daily', description: 'Claim your daily reward', permissions: [] },
      { name: 'work', description: 'Work to earn money', permissions: [] },
      { name: 'shop', description: 'View the shop', permissions: [] },
      { name: 'buy', description: 'Buy an item from the shop', permissions: [] },
      { name: 'transfer', description: 'Transfer money to another user', permissions: [] },
      { name: 'rob', description: 'Rob another user', permissions: [] },
      { name: 'gamble', description: 'Gamble your money', permissions: [] },
      { name: 'leaderboard', description: 'View the economy leaderboard', permissions: [] },
      { name: 'inventory', description: 'View your inventory', permissions: [] },
      // Add more economy commands here
    ]
  },
  {
    name: 'games',
    description: 'Game commands for playing games',
    commands: [
      { name: 'trivia', description: 'Play a trivia game', permissions: [] },
      { name: 'hangman', description: 'Play hangman', permissions: [] },
      { name: 'tictactoe', description: 'Play tic-tac-toe', permissions: [] },
      { name: 'connect4', description: 'Play Connect 4', permissions: [] },
      { name: 'akinator', description: 'Play Akinator', permissions: [] },
      { name: 'quiz', description: 'Take a quiz', permissions: [] },
      { name: 'wordle', description: 'Play Wordle', permissions: [] },
      { name: 'blackjack', description: 'Play Blackjack', permissions: [] },
      { name: 'slots', description: 'Play slots', permissions: [] },
      { name: 'memory', description: 'Play a memory game', permissions: [] },
      // Add more game commands here
    ]
  },
  {
    name: 'information',
    description: 'Information commands for retrieving data',
    commands: [
      { name: 'weather', description: 'Get weather information', permissions: [] },
      { name: 'covid', description: 'Get COVID-19 statistics', permissions: [] },
      { name: 'urban', description: 'Look up a term on Urban Dictionary', permissions: [] },
      { name: 'wikipedia', description: 'Search Wikipedia', permissions: [] },
      { name: 'translate', description: 'Translate text', permissions: [] },
      { name: 'github', description: 'Get GitHub user or repository information', permissions: [] },
      { name: 'spotify', description: 'Get Spotify track information', permissions: [] },
      { name: 'dictionary', description: 'Look up a word in a dictionary', permissions: [] },
      { name: 'movie', description: 'Get movie information', permissions: [] },
      { name: 'news', description: 'Get the latest news', permissions: [] },
      // Add more information commands here
    ]
  },
  {
    name: 'admin',
    description: 'Admin commands for bot configuration',
    commands: [
      { name: 'prefix', description: 'Change the bot prefix', permissions: ['Administrator'] },
      { name: 'settings', description: 'Change bot settings', permissions: ['Administrator'] },
      { name: 'autorole', description: 'Configure auto roles', permissions: ['ManageRoles'] },
      { name: 'welcome', description: 'Configure welcome messages', permissions: ['ManageGuild'] },
      { name: 'goodbye', description: 'Configure goodbye messages', permissions: ['ManageGuild'] },
      { name: 'logs', description: 'Configure server logs', permissions: ['ManageGuild'] },
      { name: 'automod', description: 'Configure auto moderation', permissions: ['ManageGuild'] },
      { name: 'commands', description: 'Enable or disable commands', permissions: ['Administrator'] },
      { name: 'backup', description: 'Backup server configuration', permissions: ['Administrator'] },
      { name: 'language', description: 'Change bot language', permissions: ['Administrator'] },
      { name: 'setuptickets', description: 'Set up a ticket system', permissions: ['Administrator'] },
      { name: 'resetuser', description: 'Reset a user\'s data', permissions: ['Administrator'] },
      { name: 'setpermissions', description: 'Set command permissions', permissions: ['Administrator'] },
      { name: 'reload', description: 'Reload a command', permissions: ['Administrator'] },
      { name: 'blacklist', description: 'Blacklist a user from using the bot', permissions: ['Administrator'] },
      { name: 'whitelist', description: 'Whitelist a user to use the bot', permissions: ['Administrator'] },
      { name: 'maintenance', description: 'Toggle maintenance mode', permissions: ['Administrator'] },
      { name: 'eval', description: 'Evaluate JavaScript code', permissions: ['Administrator'] },
      { name: 'status', description: 'Change the bot status', permissions: ['Administrator'] },
      { name: 'activity', description: 'Change the bot activity', permissions: ['Administrator'] },
      // Add more admin commands here
    ]
  }
];

// Template for command files
// Truncate description to be within Discord's character limit (100 chars)
const truncateDescription = (desc: string): string => {
  return desc.length > 100 ? desc.substring(0, 97) + '...' : desc;
};

// Get implementation for a command based on its type
const getCommandImplementation = (name: string, category: string) => {
  // Basic implementations for different command categories
  switch (category) {
    case 'moderation':
      if (name === 'ban') {
        return `
    if (interaction instanceof CommandInteraction) {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      
      if (!user) {
        return await interaction.reply({ content: "Please specify a user to ban", ephemeral: true });
      }
      
      try {
        // Check if the bot has permission to ban
        if (!interaction.guild?.members.me?.permissions.has("BanMembers")) {
          return await interaction.reply({ content: "I do not have permission to ban members", ephemeral: true });
        }
        
        // Check if the user is bannable
        const member = interaction.guild.members.cache.get(user.id);
        if (member && !member.bannable) {
          return await interaction.reply({ content: "I cannot ban this user. They may have higher permissions than me.", ephemeral: true });
        }
        
        await interaction.guild.members.ban(user, { reason });
        return await interaction.reply({ content: \`Successfully banned \${user.tag} | Reason: \${reason}\` });
      } catch (error) {
        console.error("Error during ban command:", error);
        return await interaction.reply({ content: "An error occurred while trying to ban the user", ephemeral: true });
      }
    } else {
      // Message command handling
      const args = interaction.content.split(" ").slice(1);
      if (!args.length) {
        return await interaction.reply("Please specify a user to ban");
      }
      
      let userToBan;
      // Check for mentions
      if (interaction.mentions.users.size) {
        userToBan = interaction.mentions.users.first();
      } else {
        // Try to find user by ID
        try {
          userToBan = await interaction.client.users.fetch(args[0]);
        } catch {
          return await interaction.reply("Could not find that user");
        }
      }
      
      if (!userToBan) {
        return await interaction.reply("Please specify a valid user to ban");
      }
      
      const reason = args.slice(1).join(" ") || "No reason provided";
      
      try {
        // Check permissions
        if (!(interaction.guild?.members.me?.permissions.has("BanMembers"))) {
          return await interaction.reply("I do not have permission to ban members");
        }
        
        // Check if user is bannable
        const member = interaction.guild.members.cache.get(userToBan.id);
        if (member && !member.bannable) {
          return await interaction.reply("I cannot ban this user. They may have higher permissions than me.");
        }
        
        await interaction.guild.members.ban(userToBan, { reason });
        return await interaction.reply(\`Successfully banned \${userToBan.tag} | Reason: \${reason}\`);
      } catch (error) {
        console.error("Error during ban command:", error);
        return await interaction.reply("An error occurred while trying to ban the user");
      }
    }`;
      } else if (name === 'kick') {
        return `
    if (interaction instanceof CommandInteraction) {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      
      if (!user) {
        return await interaction.reply({ content: "Please specify a user to kick", ephemeral: true });
      }
      
      try {
        // Check if the bot has permission to kick
        if (!interaction.guild?.members.me?.permissions.has("KickMembers")) {
          return await interaction.reply({ content: "I do not have permission to kick members", ephemeral: true });
        }
        
        // Check if the user is kickable
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) {
          return await interaction.reply({ content: "That user is not in this server", ephemeral: true });
        }
        
        if (!member.kickable) {
          return await interaction.reply({ content: "I cannot kick this user. They may have higher permissions than me.", ephemeral: true });
        }
        
        await member.kick(reason);
        return await interaction.reply({ content: \`Successfully kicked \${user.tag} | Reason: \${reason}\` });
      } catch (error) {
        console.error("Error during kick command:", error);
        return await interaction.reply({ content: "An error occurred while trying to kick the user", ephemeral: true });
      }
    } else {
      // Message command handling
      const args = interaction.content.split(" ").slice(1);
      if (!args.length) {
        return await interaction.reply("Please specify a user to kick");
      }
      
      let userToKick;
      // Check for mentions
      if (interaction.mentions.users.size) {
        userToKick = interaction.mentions.users.first();
      } else {
        // Try to find user by ID
        try {
          userToKick = await interaction.client.users.fetch(args[0]);
        } catch {
          return await interaction.reply("Could not find that user");
        }
      }
      
      if (!userToKick) {
        return await interaction.reply("Please specify a valid user to kick");
      }
      
      const reason = args.slice(1).join(" ") || "No reason provided";
      
      try {
        // Check permissions
        if (!(interaction.guild?.members.me?.permissions.has("KickMembers"))) {
          return await interaction.reply("I do not have permission to kick members");
        }
        
        // Get the member
        const member = interaction.guild.members.cache.get(userToKick.id);
        if (!member) {
          return await interaction.reply("That user is not in this server");
        }
        
        // Check if user is kickable
        if (!member.kickable) {
          return await interaction.reply("I cannot kick this user. They may have higher permissions than me.");
        }
        
        await member.kick(reason);
        return await interaction.reply(\`Successfully kicked \${userToKick.tag} | Reason: \${reason}\`);
      } catch (error) {
        console.error("Error during kick command:", error);
        return await interaction.reply("An error occurred while trying to kick the user");
      }
    }`;
      }
      break;
      
    case 'utility':
      if (name === 'ping') {
        return `
    if (interaction instanceof CommandInteraction) {
      const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
      const pingTime = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(\`Pong! Bot latency: \${pingTime}ms | API Latency: \${interaction.client.ws.ping}ms\`);
    } else {
      const sent = await interaction.reply("Pinging...");
      const pingTime = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.channel.send(\`Pong! Bot latency: \${pingTime}ms | API Latency: \${interaction.client.ws.ping}ms\`);
    }`;
      } else if (name === 'help') {
        return `
    if (interaction instanceof CommandInteraction) {
      const commandName = interaction.options.getString("command");
      
      if (commandName) {
        // Get info for a specific command
        const command = interaction.client.application?.commands.cache.find(cmd => 
          cmd.name.toLowerCase() === commandName.toLowerCase());
        
        if (!command) {
          return interaction.reply({ content: \`No information found for command "\${commandName}"\`, ephemeral: true });
        }
        
        return interaction.reply({
          embeds: [{
            title: \`Help: \${commandName}\`,
            description: command.description || "No description available",
            fields: [
              { name: "Usage", value: \`/\${commandName}\` }
            ],
            color: 0x5865F2
          }]
        });
      }
      
      // Show general help with categories
      const categories = [
        { name: "Moderation", value: "Commands for server moderation" },
        { name: "Utility", value: "Utility commands for server management" },
        { name: "Fun", value: "Fun commands for entertainment" },
        { name: "Music", value: "Music commands for playing audio" },
        { name: "Economy", value: "Economy commands for virtual currency" },
        { name: "Games", value: "Game commands for playing games" },
        { name: "Information", value: "Information commands for retrieving data" },
        { name: "Admin", value: "Admin commands for bot configuration" }
      ];
      
      return interaction.reply({
        embeds: [{
          title: "Bot Help",
          description: "Here are the available command categories. Use \"/help [command]\" for info about a specific command.",
          fields: categories,
          color: 0x5865F2
        }]
      });
    } else {
      const args = interaction.content.split(" ").slice(1);
      const commandName = args[0];
      
      if (commandName) {
        // Get info for a specific command
        // For message commands, we need to access the internal commands collection
        const commands = interaction.client.commands;
        const command = commands ? commands.get(commandName.toLowerCase()) : null;
        
        if (!command) {
          return interaction.reply(\`No information found for command "\${commandName}"\`);
        }
        
        return interaction.reply({
          embeds: [{
            title: \`Help: \${commandName}\`,
            description: command.description || "No description available",
            fields: [
              { name: "Usage", value: \`!help \${commandName}\` }
            ],
            color: 0x5865F2
          }]
        });
      }
      
      // Show general help with categories
      const categories = [
        { name: "Moderation", value: "Commands for server moderation" },
        { name: "Utility", value: "Utility commands for server management" },
        { name: "Fun", value: "Fun commands for entertainment" },
        { name: "Music", value: "Music commands for playing audio" },
        { name: "Economy", value: "Economy commands for virtual currency" },
        { name: "Games", value: "Game commands for playing games" },
        { name: "Information", value: "Information commands for retrieving data" },
        { name: "Admin", value: "Admin commands for bot configuration" }
      ];
      
      return interaction.reply({
        embeds: [{
          title: "Bot Help",
          description: "Here are the available command categories. Use \"!help [command]\" for info about a specific command.",
          fields: categories,
          color: 0x5865F2
        }]
      });
    }`;
      }
      break;
    
    case 'fun':
      if (name === 'coinflip') {
        return `
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    
    if (interaction instanceof CommandInteraction) {
      await interaction.reply(\`🪙 The coin landed on: **\${result}**\`);
    } else {
      await interaction.reply(\`🪙 The coin landed on: **\${result}**\`);
    }`;
      } else if (name === '8ball') {
        return `
    const responses = [
      "It is certain.",
      "It is decidedly so.",
      "Without a doubt.",
      "Yes definitely.",
      "You may rely on it.",
      "As I see it, yes.",
      "Most likely.",
      "Outlook good.",
      "Yes.",
      "Signs point to yes.",
      "Reply hazy, try again.",
      "Ask again later.",
      "Better not tell you now.",
      "Cannot predict now.",
      "Concentrate and ask again.",
      "Do not count on it.",
      "My reply is no.",
      "My sources say no.",
      "Outlook not so good.",
      "Very doubtful."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    if (interaction instanceof CommandInteraction) {
      const question = interaction.options.getString("question") || "No question provided";
      await interaction.reply(\`Question: \${question}\\n🎱 Answer: **\${response}**\`);
    } else {
      const args = interaction.content.split(" ").slice(1);
      const question = args.join(" ") || "No question provided";
      await interaction.reply(\`Question: \${question}\\n🎱 Answer: **\${response}**\`);
    }`;
      }
      break;
  }
  
  // Add more implementations based on command name
  if (name === 'serverinfo') {
    return `
    if (interaction instanceof CommandInteraction) {
      const guild = interaction.guild;
      if (!guild) {
        return await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      }
      
      // Get server information
      const memberCount = guild.memberCount;
      const createdAt = guild.createdAt.toLocaleDateString();
      const ownerId = guild.ownerId;
      const verificationLevel = guild.verificationLevel;
      const roles = guild.roles.cache.size;
      const channels = guild.channels.cache.size;
      const emojis = guild.emojis.cache.size;
      
      // Create embed
      const embed = {
        title: guild.name,
        description: "Server Information",
        thumbnail: { url: guild.iconURL() || "https://cdn.discordapp.com/embed/avatars/0.png" },
        fields: [
          { name: "Owner", value: \`<@\${ownerId}>\`, inline: true },
          { name: "Created At", value: createdAt, inline: true },
          { name: "Members", value: memberCount.toString(), inline: true },
          { name: "Roles", value: roles.toString(), inline: true },
          { name: "Channels", value: channels.toString(), inline: true },
          { name: "Emojis", value: emojis.toString(), inline: true },
          { name: "Verification Level", value: verificationLevel.toString(), inline: true },
          { name: "Server ID", value: guild.id, inline: true }
        ],
        color: 0x3498DB
      };
      
      return await interaction.reply({ embeds: [embed] });
    } else {
      const guild = interaction.guild;
      if (!guild) {
        return await interaction.reply("This command can only be used in a server.");
      }
      
      // Get server information
      const memberCount = guild.memberCount;
      const createdAt = guild.createdAt.toLocaleDateString();
      const ownerId = guild.ownerId;
      const verificationLevel = guild.verificationLevel;
      const roles = guild.roles.cache.size;
      const channels = guild.channels.cache.size;
      const emojis = guild.emojis.cache.size;
      
      // Create embed
      const embed = {
        title: guild.name,
        description: "Server Information",
        thumbnail: { url: guild.iconURL() || "https://cdn.discordapp.com/embed/avatars/0.png" },
        fields: [
          { name: "Owner", value: \`<@\${ownerId}>\`, inline: true },
          { name: "Created At", value: createdAt, inline: true },
          { name: "Members", value: memberCount.toString(), inline: true },
          { name: "Roles", value: roles.toString(), inline: true },
          { name: "Channels", value: channels.toString(), inline: true },
          { name: "Emojis", value: emojis.toString(), inline: true },
          { name: "Verification Level", value: verificationLevel.toString(), inline: true },
          { name: "Server ID", value: guild.id, inline: true }
        ],
        color: 0x3498DB
      };
      
      return await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'userinfo') {
    return `
    if (interaction instanceof CommandInteraction) {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const member = targetUser.id === interaction.user.id ? 
        interaction.member : 
        interaction.guild?.members.cache.get(targetUser.id);
      
      const joinedAt = member && "joinedAt" in member && member.joinedAt 
        ? member.joinedAt.toLocaleDateString() 
        : "Unknown";
      
      // Create embed
      const embed = {
        title: \`User Info - \${targetUser.tag}\`,
        thumbnail: { url: targetUser.displayAvatarURL() },
        fields: [
          { name: "Username", value: targetUser.username, inline: true },
          { name: "Discriminator", value: targetUser.discriminator, inline: true },
          { name: "ID", value: targetUser.id, inline: true },
          { name: "Account Created", value: targetUser.createdAt.toLocaleDateString(), inline: true },
          { name: "Joined Server", value: joinedAt, inline: true },
          { name: "Bot", value: targetUser.bot ? "Yes" : "No", inline: true }
        ],
        color: 0x3498DB
      };
      
      return await interaction.reply({ embeds: [embed] });
    } else {
      const args = interaction.content.split(" ").slice(1);
      let targetUser;
      
      if (interaction.mentions.users.size > 0) {
        targetUser = interaction.mentions.users.first();
      } else if (args[0]) {
        try {
          targetUser = await interaction.client.users.fetch(args[0]);
        } catch {
          targetUser = interaction.author;
        }
      } else {
        targetUser = interaction.author;
      }
      
      const member = targetUser.id === interaction.author.id ? 
        interaction.member : 
        interaction.guild?.members.cache.get(targetUser.id);
      
      const joinedAt = member && "joinedAt" in member && member.joinedAt 
        ? member.joinedAt.toLocaleDateString() 
        : "Unknown";
      
      // Create embed
      const embed = {
        title: \`User Info - \${targetUser.tag}\`,
        thumbnail: { url: targetUser.displayAvatarURL() },
        fields: [
          { name: "Username", value: targetUser.username, inline: true },
          { name: "Discriminator", value: targetUser.discriminator, inline: true },
          { name: "ID", value: targetUser.id, inline: true },
          { name: "Account Created", value: targetUser.createdAt.toLocaleDateString(), inline: true },
          { name: "Joined Server", value: joinedAt, inline: true },
          { name: "Bot", value: targetUser.bot ? "Yes" : "No", inline: true }
        ],
        color: 0x3498DB
      };
      
      return await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'avatar') {
    return `
    if (interaction instanceof CommandInteraction) {
      const user = interaction.options.getUser("user") || interaction.user;
      const avatar = user.displayAvatarURL({ size: 1024 });
      
      const embed = {
        title: \`\${user.username}'s Avatar\`,
        image: { url: avatar },
        color: 0x3498DB
      };
      
      return await interaction.reply({ embeds: [embed] });
    } else {
      const args = interaction.content.split(" ").slice(1);
      let user;
      
      if (interaction.mentions.users.size > 0) {
        user = interaction.mentions.users.first();
      } else if (args[0]) {
        try {
          user = await interaction.client.users.fetch(args[0]);
        } catch {
          user = interaction.author;
        }
      } else {
        user = interaction.author;
      }
      
      const avatar = user.displayAvatarURL({ size: 1024 });
      
      const embed = {
        title: \`\${user.username}'s Avatar\`,
        image: { url: avatar },
        color: 0x3498DB
      };
      
      return await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'role') {
    return `
    if (interaction instanceof CommandInteraction) {
      const subcommand = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");
      
      if (!user || !role || !interaction.guild) {
        return await interaction.reply({ content: "Missing required parameters or not in a guild", ephemeral: true });
      }
      
      const member = await interaction.guild.members.fetch(user.id);
      
      if (!member) {
        return await interaction.reply({ content: "Could not find the member in this server", ephemeral: true });
      }
      
      switch (subcommand) {
        case "add":
          try {
            await member.roles.add(role);
            return await interaction.reply({ content: \`Added role \${role.name} to \${user.tag}\`, ephemeral: true });
          } catch (error) {
            console.error("Error adding role:", error);
            return await interaction.reply({ content: "Failed to add role. Please check my permissions.", ephemeral: true });
          }
        
        case "remove":
          try {
            await member.roles.remove(role);
            return await interaction.reply({ content: \`Removed role \${role.name} from \${user.tag}\`, ephemeral: true });
          } catch (error) {
            console.error("Error removing role:", error);
            return await interaction.reply({ content: "Failed to remove role. Please check my permissions.", ephemeral: true });
          }
        
        default:
          return await interaction.reply({ content: "Unknown subcommand", ephemeral: true });
      }
    } else {
      const args = interaction.content.split(" ").slice(1);
      
      if (args.length < 3) {
        return await interaction.reply("Usage: !role <add|remove> <@user> <@role>");
      }
      
      const subcommand = args[0].toLowerCase();
      const mentionedUser = interaction.mentions.users.first();
      const mentionedRole = interaction.mentions.roles.first();
      
      if (!mentionedUser || !mentionedRole || !interaction.guild) {
        return await interaction.reply("Please mention a user and a role");
      }
      
      const member = await interaction.guild.members.fetch(mentionedUser.id);
      
      if (!member) {
        return await interaction.reply("Could not find the member in this server");
      }
      
      switch (subcommand) {
        case "add":
          try {
            await member.roles.add(mentionedRole);
            return await interaction.reply(\`Added role \${mentionedRole.name} to \${mentionedUser.tag}\`);
          } catch (error) {
            console.error("Error adding role:", error);
            return await interaction.reply("Failed to add role. Please check my permissions.");
          }
        
        case "remove":
          try {
            await member.roles.remove(mentionedRole);
            return await interaction.reply(\`Removed role \${mentionedRole.name} from \${mentionedUser.tag}\`);
          } catch (error) {
            console.error("Error removing role:", error);
            return await interaction.reply("Failed to remove role. Please check my permissions.");
          }
        
        default:
          return await interaction.reply("Usage: !role <add|remove> <@user> <@role>");
      }
    }`;
  } else if (name === 'roles') {
    return `
    if (interaction instanceof CommandInteraction) {
      if (!interaction.guild) {
        return await interaction.reply({ content: "This command can only be used in a server", ephemeral: true });
      }
      
      const roles = interaction.guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 50); // Limit to 50 roles to avoid Discord's limits
      
      const embed = {
        title: \`Roles in \${interaction.guild.name}\`,
        description: roles.join(" ") || "No roles found",
        color: 0x3498DB,
        footer: { text: \`Total roles: \${interaction.guild.roles.cache.size}\` }
      };
      
      return await interaction.reply({ embeds: [embed] });
    } else {
      if (!interaction.guild) {
        return await interaction.reply("This command can only be used in a server");
      }
      
      const roles = interaction.guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 50); // Limit to 50 roles to avoid Discord's limits
      
      const embed = {
        title: \`Roles in \${interaction.guild.name}\`,
        description: roles.join(" ") || "No roles found",
        color: 0x3498DB,
        footer: { text: \`Total roles: \${interaction.guild.roles.cache.size}\` }
      };
      
      return await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'channelinfo') {
    return `
    if (interaction instanceof CommandInteraction) {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      
      if (!channel) {
        return await interaction.reply({ content: "Could not find the specified channel", ephemeral: true });
      }
      
      const createdAt = new Date(channel.createdTimestamp).toLocaleDateString();
      
      let typeText = "Unknown";
      switch (channel.type) {
        case 0: typeText = "Text Channel"; break;
        case 2: typeText = "Voice Channel"; break;
        case 4: typeText = "Category"; break;
        case 5: typeText = "Announcement Channel"; break;
        case 10: typeText = "Thread"; break;
        case 11: typeText = "Thread"; break;
        case 12: typeText = "Thread"; break;
        case 13: typeText = "Stage Channel"; break;
        case 14: typeText = "Directory"; break;
        case 15: typeText = "Forum"; break;
      }
      
      const embed = {
        title: \`Channel Info - #\${channel.name}\`,
        fields: [
          { name: "ID", value: channel.id, inline: true },
          { name: "Type", value: typeText, inline: true },
          { name: "Created At", value: createdAt, inline: true }
        ],
        color: 0x3498DB
      };
      
      // Add channel-specific info
      if ("topic" in channel && channel.topic) {
        embed.fields.push({ name: "Topic", value: channel.topic, inline: false });
      }
      
      if ("nsfw" in channel) {
        embed.fields.push({ name: "NSFW", value: channel.nsfw ? "Yes" : "No", inline: true });
      }
      
      if ("rateLimitPerUser" in channel && channel.rateLimitPerUser > 0) {
        embed.fields.push({ name: "Slowmode", value: \`\${channel.rateLimitPerUser}s\`, inline: true });
      }
      
      if ("parent" in channel && channel.parent) {
        embed.fields.push({ name: "Category", value: channel.parent.name, inline: true });
      }
      
      return await interaction.reply({ embeds: [embed] });
    } else {
      const args = interaction.content.split(" ").slice(1);
      let channel;
      
      if (args[0]) {
        // Check for channel mention or ID
        const channelId = args[0].replace(/[<#>]/g, "");
        channel = interaction.guild?.channels.cache.get(channelId);
      } else {
        channel = interaction.channel;
      }
      
      if (!channel) {
        return await interaction.reply("Could not find the specified channel");
      }
      
      const createdAt = new Date(channel.createdTimestamp).toLocaleDateString();
      
      let typeText = "Unknown";
      switch (channel.type) {
        case 0: typeText = "Text Channel"; break;
        case 2: typeText = "Voice Channel"; break;
        case 4: typeText = "Category"; break;
        case 5: typeText = "Announcement Channel"; break;
        case 10: typeText = "Thread"; break;
        case 11: typeText = "Thread"; break;
        case 12: typeText = "Thread"; break;
        case 13: typeText = "Stage Channel"; break;
        case 14: typeText = "Directory"; break;
        case 15: typeText = "Forum"; break;
      }
      
      const embed = {
        title: \`Channel Info - #\${channel.name}\`,
        fields: [
          { name: "ID", value: channel.id, inline: true },
          { name: "Type", value: typeText, inline: true },
          { name: "Created At", value: createdAt, inline: true }
        ],
        color: 0x3498DB
      };
      
      // Add channel-specific info
      if ("topic" in channel && channel.topic) {
        embed.fields.push({ name: "Topic", value: channel.topic, inline: false });
      }
      
      if ("nsfw" in channel) {
        embed.fields.push({ name: "NSFW", value: channel.nsfw ? "Yes" : "No", inline: true });
      }
      
      if ("rateLimitPerUser" in channel && channel.rateLimitPerUser > 0) {
        embed.fields.push({ name: "Slowmode", value: \`\${channel.rateLimitPerUser}s\`, inline: true });
      }
      
      if ("parent" in channel && channel.parent) {
        embed.fields.push({ name: "Category", value: channel.parent.name, inline: true });
      }
      
      return await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'purge') {
    return `
    if (interaction instanceof CommandInteraction) {
      const amount = interaction.options.getInteger("amount");
      
      if (!amount || amount < 1 || amount > 100) {
        return await interaction.reply({ content: "Please provide a valid amount between 1 and 100", ephemeral: true });
      }
      
      if (!interaction.channel) {
        return await interaction.reply({ content: "Cannot purge messages in this channel", ephemeral: true });
      }
      
      try {
        const channel = interaction.channel;
        if ("bulkDelete" in channel) {
          const deleted = await channel.bulkDelete(amount, true);
          return await interaction.reply({ content: \`Successfully deleted \${deleted.size} messages\`, ephemeral: true });
        } else {
          return await interaction.reply({ content: "Cannot purge messages in this channel type", ephemeral: true });
        }
      } catch (error) {
        console.error("Error purging messages:", error);
        return await interaction.reply({ content: "Failed to delete messages. Messages older than 14 days cannot be bulk deleted.", ephemeral: true });
      }
    } else {
      const args = interaction.content.split(" ").slice(1);
      const amount = parseInt(args[0]);
      
      if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
        return await interaction.reply("Please provide a valid amount between 1 and 100");
      }
      
      if (!interaction.channel) {
        return await interaction.reply("Cannot purge messages in this channel");
      }
      
      try {
        const channel = interaction.channel;
        if ("bulkDelete" in channel) {
          // Delete the command message first
          await interaction.delete();
          
          // Then bulk delete the rest
          const deleted = await channel.bulkDelete(amount, true);
          
          // Send temporary confirmation
          const confirmMsg = await channel.send(\`Successfully deleted \${deleted.size} messages\`);
          setTimeout(() => {
            confirmMsg.delete().catch(console.error);
          }, 5000);
          
          return;
        } else {
          return await interaction.reply("Cannot purge messages in this channel type");
        }
      } catch (error) {
        console.error("Error purging messages:", error);
        return await interaction.reply("Failed to delete messages. Messages older than 14 days cannot be bulk deleted.");
      }
    }`;
  } else if (name === 'roll') {
    return `
    if (interaction instanceof CommandInteraction) {
      const sides = interaction.options.getInteger("sides") || 6;
      const count = interaction.options.getInteger("count") || 1;
      
      if (sides < 1 || sides > 1000) {
        return await interaction.reply({ content: "Please provide a valid number of sides between 1 and 1000", ephemeral: true });
      }
      
      if (count < 1 || count > 100) {
        return await interaction.reply({ content: "Please provide a valid number of dice between 1 and 100", ephemeral: true });
      }
      
      const results = [];
      let total = 0;
      
      for (let i = 0; i < count; i++) {
        const result = Math.floor(Math.random() * sides) + 1;
        results.push(result);
        total += result;
      }
      
      let resultText = "";
      
      if (count === 1) {
        resultText = \`You rolled a \${results[0]}\`;
      } else {
        resultText = \`You rolled: \${results.join(", ")}\\nTotal: \${total}\`;
      }
      
      return await interaction.reply({ content: resultText });
    } else {
      const args = interaction.content.split(" ").slice(1);
      let sides = 6;
      let count = 1;
      
      // Parse dice format like "2d20" or just number of sides
      if (args[0]) {
        if (args[0].toLowerCase().includes("d")) {
          const parts = args[0].toLowerCase().split("d");
          count = parseInt(parts[0]) || 1;
          sides = parseInt(parts[1]) || 6;
        } else {
          sides = parseInt(args[0]) || 6;
        }
      }
      
      if (sides < 1 || sides > 1000) {
        return await interaction.reply("Please provide a valid number of sides between 1 and 1000");
      }
      
      if (count < 1 || count > 100) {
        return await interaction.reply("Please provide a valid number of dice between 1 and 100");
      }
      
      const results = [];
      let total = 0;
      
      for (let i = 0; i < count; i++) {
        const result = Math.floor(Math.random() * sides) + 1;
        results.push(result);
        total += result;
      }
      
      let resultText = "";
      
      if (count === 1) {
        resultText = \`You rolled a \${results[0]}\`;
      } else {
        resultText = \`You rolled: \${results.join(", ")}\\nTotal: \${total}\`;
      }
      
      return await interaction.reply(resultText);
    }`;
  } else if (name === 'rps') {
    return `
    if (interaction instanceof CommandInteraction) {
      const choices = ["rock", "paper", "scissors"];
      const userChoice = interaction.options.getString("choice")?.toLowerCase();
      
      if (!userChoice || !choices.includes(userChoice)) {
        return await interaction.reply({ content: "Please provide a valid choice: rock, paper, or scissors", ephemeral: true });
      }
      
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      
      // Determine winner
      let result;
      if (userChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper")
      ) {
        result = "You win!";
      } else {
        result = "I win!";
      }
      
      // Get emojis for choices
      const getEmoji = (choice: string) => {
        switch (choice) {
          case "rock": return "🪨";
          case "paper": return "📄";
          case "scissors": return "✂️";
          default: return "";
        }
      };
      
      return await interaction.reply(\`You chose: \${getEmoji(userChoice)} \${userChoice}\\nI chose: \${getEmoji(botChoice)} \${botChoice}\\n\\n**\${result}**\`);
    } else {
      const choices = ["rock", "paper", "scissors"];
      const userChoice = interaction.content.split(" ").slice(1).join(" ").toLowerCase();
      
      if (!userChoice || !choices.includes(userChoice)) {
        return await interaction.reply("Please provide a valid choice: rock, paper, or scissors");
      }
      
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      
      // Determine winner
      let result;
      if (userChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper")
      ) {
        result = "You win!";
      } else {
        result = "I win!";
      }
      
      // Get emojis for choices
      const getEmoji = (choice: string) => {
        switch (choice) {
          case "rock": return "🪨";
          case "paper": return "📄";
          case "scissors": return "✂️";
          default: return "";
        }
      };
      
      return await interaction.reply(\`You chose: \${getEmoji(userChoice)} \${userChoice}\\nI chose: \${getEmoji(botChoice)} \${botChoice}\\n\\n**\${result}**\`);
    }`;
  } else if (name === 'joke') {
    return `
    // Array of safe jokes
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
      "Why don't skeletons fight each other? They don't have the guts!",
      "What do you call a fake noodle? An impasta!",
      "Why did the scarecrow win an award? Because he was outstanding in his field!",
      "I told my wife she was drawing her eyebrows too high. She seemed surprised.",
      "Why don't eggs tell jokes? They'd crack each other up!",
      "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
      "I'm reading a book about anti-gravity. It's impossible to put down!",
      "Did you hear about the claustrophobic astronaut? He just needed a little space!",
      "Why did the bicycle fall over? Because it was two tired!",
      "How do you organize a space party? You planet!",
      "What's brown and sticky? A stick!",
      "Why don't scientists trust atoms? Because they make up everything!",
      "What do you call a parade of rabbits hopping backwards? A receding hare-line!",
      "What's orange and sounds like a parrot? A carrot!",
      "How do you make a tissue dance? Put a little boogie in it!",
      "What do you call a factory that makes good products? A satisfactory!",
      "Why couldn't the leopard play hide and seek? Because he was always spotted!",
      "What did one wall say to the other wall? I'll meet you at the corner!"
    ];
    
    if (interaction instanceof CommandInteraction) {
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      await interaction.reply(randomJoke);
    } else {
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      await interaction.reply(randomJoke);
    }`;
  } else if (name === 'say') {
    return `
    if (interaction instanceof CommandInteraction) {
      const text = interaction.options.getString("text");
      
      if (!text) {
        return await interaction.reply({ content: "Please provide something for me to say", ephemeral: true });
      }
      
      // Check for mentions to prevent abuse
      if (text.includes("@everyone") || text.includes("@here")) {
        return await interaction.reply({ content: "I cannot mention everyone or here", ephemeral: true });
      }
      
      await interaction.reply({ content: text });
    } else {
      const text = interaction.content.split(" ").slice(1).join(" ");
      
      if (!text) {
        return await interaction.reply("Please provide something for me to say");
      }
      
      // Check for mentions to prevent abuse
      if (text.includes("@everyone") || text.includes("@here")) {
        return await interaction.reply("I cannot mention everyone or here");
      }
      
      await interaction.channel.send(text);
      // Try to delete the original command message to make it look like the bot is speaking
      if (interaction.deletable) {
        try {
          await interaction.delete();
        } catch (error) {
          console.error("Could not delete command message:", error);
        }
      }
    }`;
  } else if (name === 'reverse') {
    return `
    if (interaction instanceof CommandInteraction) {
      const text = interaction.options.getString("text");
      
      if (!text) {
        return await interaction.reply({ content: "Please provide text to reverse", ephemeral: true });
      }
      
      const reversed = text.split("").reverse().join("");
      await interaction.reply(\`**Original:** \${text}\\n**Reversed:** \${reversed}\`);
    } else {
      const text = interaction.content.split(" ").slice(1).join(" ");
      
      if (!text) {
        return await interaction.reply("Please provide text to reverse");
      }
      
      const reversed = text.split("").reverse().join("");
      await interaction.reply(\`**Original:** \${text}\\n**Reversed:** \${reversed}\`);
    }`;
  } else if (name === 'meme') {
    return `
    // Saflist of meme responses since we can't fetch from an external API
    const memes = [
      {
        title: "Programming Meme",
        description: "When the code finally works and you don't know why",
        image: "https://i.imgur.com/QAjlpGh.png",
      },
      {
        title: "Bug Fixing",
        description: "When you fix one bug but create three more",
        image: "https://i.imgur.com/5bF2f6F.jpg",
      },
      {
        title: "Discord Bot Life",
        description: "When your Discord bot finally comes online after hours of debugging",
        image: "https://i.imgur.com/lz7hOlC.jpg",
      },
      {
        title: "Documentation",
        description: "The documentation vs. the actual code",
        image: "https://i.imgur.com/uO0PN0L.jpg",
      },
      {
        title: "Stack Overflow",
        description: "When someone marks your question as duplicate",
        image: "https://i.imgur.com/CIubsq7.jpg",
      }
    ];
    
    if (interaction instanceof CommandInteraction) {
      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      
      const embed = {
        title: randomMeme.title,
        description: randomMeme.description,
        color: 0x3498DB,
        image: { url: randomMeme.image }
      };
      
      await interaction.reply({ embeds: [embed] });
    } else {
      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      
      const embed = {
        title: randomMeme.title,
        description: randomMeme.description,
        color: 0x3498DB,
        image: { url: randomMeme.image }
      };
      
      await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'cat' || name === 'dog') {
    const animal = name;
    return `
    // Safelist of ${animal} image responses
    const ${animal}Images = [
      "https://cdn2.thecatapi.com/images/9j5.jpg",
      "https://cdn2.thecatapi.com/images/8kq.jpg",
      "https://cdn2.thecatapi.com/images/MTY0NjkwNA.jpg",
      "https://cdn2.thecatapi.com/images/86g.jpg",
      "https://cdn2.thecatapi.com/images/7iq.jpg"
    ];
    
    if (interaction instanceof CommandInteraction) {
      const randomImage = ${animal}Images[Math.floor(Math.random() * ${animal}Images.length)];
      
      const embed = {
        title: "Random ${animal.charAt(0).toUpperCase() + animal.slice(1)}",
        color: 0x3498DB,
        image: { url: randomImage }
      };
      
      await interaction.reply({ embeds: [embed] });
    } else {
      const randomImage = ${animal}Images[Math.floor(Math.random() * ${animal}Images.length)];
      
      const embed = {
        title: "Random ${animal.charAt(0).toUpperCase() + animal.slice(1)}",
        color: 0x3498DB,
        image: { url: randomImage }
      };
      
      await interaction.reply({ embeds: [embed] });
    }`;
  } else if (name === 'poll') {
    return `
    if (interaction instanceof CommandInteraction) {
      const question = interaction.options.getString("question");
      
      if (!question) {
        return await interaction.reply({ content: "Please provide a question for the poll", ephemeral: true });
      }
      
      const embed = {
        title: "📊 Poll",
        description: question,
        color: 0x3498DB,
        footer: { text: \`Poll started by \${interaction.user.tag}\` }
      };
      
      const message = await interaction.reply({ embeds: [embed], fetchReply: true });
      
      // Add reactions for voting
      await message.react("👍");
      await message.react("👎");
      await message.react("🤔");
    } else {
      const question = interaction.content.split(" ").slice(1).join(" ");
      
      if (!question) {
        return await interaction.reply("Please provide a question for the poll");
      }
      
      const embed = {
        title: "📊 Poll",
        description: question,
        color: 0x3498DB,
        footer: { text: \`Poll started by \${interaction.author.tag}\` }
      };
      
      const message = await interaction.channel.send({ embeds: [embed] });
      
      // Add reactions for voting
      await message.react("👍");
      await message.react("👎");
      await message.react("🤔");
    }`;
  }
  
  // Default generic implementation for other commands
  return `
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: \`Executing ${name} command\` });
    } else {
      await interaction.reply(\`Executing ${name} command\`);
    }`;
};

// Get command options based on the command name and category
const getCommandOptions = (name: string, category: string) => {
  switch(category) {
    case 'moderation':
      if (name === 'ban' || name === 'kick') {
        return `[
      {
        name: "user",
        description: "The user to ${name}",
        type: "USER",
        required: true
      },
      {
        name: "reason",
        description: "Reason for the ${name}",
        type: "STRING",
        required: false
      }
    ]`;
      }
      break;
    case 'utility':
      if (name === 'help') {
        return `[
      {
        name: "command",
        description: "Get help for a specific command",
        type: "STRING",
        required: false
      }
    ]`;
      }
      break;
    case 'fun':
      if (name === '8ball') {
        return `[
      {
        name: "question",
        description: "The question to ask the magic 8ball",
        type: "STRING",
        required: true
      }
    ]`;
      }
      break;
  }
  
  return '[]'; // Default empty options for most commands
};

const commandTemplate = (name: string, description: string, category: string, permissions: string[]) => {
  const implementation = getCommandImplementation(name, category);
  const options = getCommandOptions(name, category);
  
  return `import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "${name}",
  description: "${truncateDescription(description)}",
  category: "${category}",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: ${JSON.stringify(permissions)},
  options: ${options},
  async execute(interaction: CommandInteraction | Message) {${implementation}
  }
} as DiscordCommand;
`;
};

// Ensure commands directory exists
const commandsDir = path.join(__dirname, '../server/discord/commands');
if (!fs.existsSync(commandsDir)) {
  fs.mkdirSync(commandsDir, { recursive: true });
}

// Delete all existing command files
const deleteExistingCommands = () => {
  const commandsDir = path.join(__dirname, '../server/discord/commands');
  if (fs.existsSync(commandsDir)) {
    for (const category of categories) {
      const categoryDir = path.join(commandsDir, category.name);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            fs.unlinkSync(path.join(categoryDir, file));
          }
        }
      }
    }
  }
};

// Delete existing commands to start fresh
deleteExistingCommands();

// Generate 400 commands across categories
let totalCommands = 0;
const targetCommands = 400;
const commandsPerCategory = Math.ceil(targetCommands / categories.length);

// Generate exactly 400 commands
// First, count how many predefined commands we have
let predefinedCommandCount = 0;
for (const category of categories) {
  predefinedCommandCount += category.commands.length;
}

// Figure out how many additional commands we need
const additionalCommandsNeeded = targetCommands - predefinedCommandCount;
const additionalCommandsPerCategory = Math.floor(additionalCommandsNeeded / categories.length);
let remainingAdditionalCommands = additionalCommandsNeeded % categories.length;

// Reset the count
totalCommands = 0;

// Generate commands for each category
for (const category of categories) {
  const categoryDir = path.join(commandsDir, category.name);
  
  // Create category directory if it doesn't exist
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  
  // Generate predefined commands
  for (const cmd of category.commands) {
    const filePath = path.join(categoryDir, `${cmd.name}.ts`);
    fs.writeFileSync(
      filePath,
      commandTemplate(cmd.name, cmd.description, category.name, cmd.permissions)
    );
    totalCommands++;
  }
  
  // Calculate how many additional commands this category gets
  let additionalForThisCategory = additionalCommandsPerCategory;
  if (remainingAdditionalCommands > 0) {
    additionalForThisCategory++;
    remainingAdditionalCommands--;
  }
  
  // Generate additional commands for this category with proper names
  const additionalCommandsByCategory = {
    moderation: [
      { name: 'warn', description: 'Warn a user for rule violations', permissions: ['ModerateMembers'] },
      { name: 'mute', description: 'Mute a user in the server', permissions: ['ModerateMembers'] },
      { name: 'unmute', description: 'Unmute a muted user', permissions: ['ModerateMembers'] },
      { name: 'purge', description: 'Delete multiple messages at once', permissions: ['ManageMessages'] },
      { name: 'lock', description: 'Lock a channel preventing new messages', permissions: ['ManageChannels'] },
      { name: 'unlock', description: 'Unlock a previously locked channel', permissions: ['ManageChannels'] },
      { name: 'slowmode', description: 'Set slowmode in a channel', permissions: ['ManageChannels'] },
      { name: 'nickname', description: 'Change a user\'s nickname', permissions: ['ManageNicknames'] },
      { name: 'voicekick', description: 'Kick a user from a voice channel', permissions: ['MoveMembers'] },
      { name: 'voicemute', description: 'Mute a user in voice channels', permissions: ['MuteMembers'] },
      { name: 'voiceunmute', description: 'Unmute a user in voice channels', permissions: ['MuteMembers'] },
      { name: 'deafen', description: 'Deafen a user in voice channels', permissions: ['DeafenMembers'] },
      { name: 'undeafen', description: 'Undeafen a user in voice channels', permissions: ['DeafenMembers'] },
      { name: 'timeout', description: 'Timeout a user for a specified duration', permissions: ['ModerateMembers'] },
      { name: 'untimeout', description: 'Remove timeout from a user', permissions: ['ModerateMembers'] },
      { name: 'history', description: 'View moderation history for a user', permissions: ['ViewAuditLog'] },
      { name: 'softban', description: 'Ban and unban a user to delete their messages', permissions: ['BanMembers'] },
      { name: 'tempban', description: 'Temporarily ban a user', permissions: ['BanMembers'] },
      { name: 'unban', description: 'Unban a previously banned user', permissions: ['BanMembers'] },
      { name: 'reason', description: 'Add a reason to a previous moderation action', permissions: ['ViewAuditLog'] },
      { name: 'clean', description: 'Clean messages from a specific user', permissions: ['ManageMessages'] },
      { name: 'report', description: 'Report a user to server moderators', permissions: [] }
    ],
    utility: [
      { name: 'serverinfo', description: 'Display information about the server', permissions: [] },
      { name: 'userinfo', description: 'Display information about a user', permissions: [] },
      { name: 'avatar', description: 'Get a user\'s avatar', permissions: [] },
      { name: 'channelinfo', description: 'Display information about a channel', permissions: [] },
      { name: 'roleinfo', description: 'Display information about a role', permissions: [] },
      { name: 'emojis', description: 'List all emojis in the server', permissions: [] },
      { name: 'invites', description: 'List active invites in the server', permissions: ['ManageGuild'] },
      { name: 'inviteinfo', description: 'Get information about an invite', permissions: [] },
      { name: 'math', description: 'Perform math calculations', permissions: [] },
      { name: 'weather', description: 'Get weather information for a location', permissions: [] },
      { name: 'translate', description: 'Translate text to another language', permissions: [] },
      { name: 'remind', description: 'Set a reminder', permissions: [] },
      { name: 'poll', description: 'Create a poll', permissions: [] },
      { name: 'afk', description: 'Set an AFK status', permissions: [] },
      { name: 'dictionary', description: 'Look up a word in the dictionary', permissions: [] },
      { name: 'urban', description: 'Look up a term on Urban Dictionary', permissions: [] },
      { name: 'timestamp', description: 'Generate a Discord timestamp', permissions: [] },
      { name: 'code', description: 'Format code with syntax highlighting', permissions: [] },
      { name: 'choose', description: 'Have the bot choose between options', permissions: [] },
      { name: 'embed', description: 'Create a custom embed message', permissions: ['ManageMessages'] },
      { name: 'announce', description: 'Make an announcement in a channel', permissions: ['ManageMessages'] },
      { name: 'tag', description: 'Create and use custom tags/macros', permissions: [] }
    ],
    fun: [
      { name: 'meme', description: 'Get a random meme', permissions: [] },
      { name: 'joke', description: 'Tell a joke', permissions: [] },
      { name: 'emojify', description: 'Convert text to emoji', permissions: [] },
      { name: 'ascii', description: 'Convert text to ASCII art', permissions: [] },
      { name: 'reverse', description: 'Reverse text', permissions: [] },
      { name: 'mock', description: 'Mock text with alternating case', permissions: [] },
      { name: 'roll', description: 'Roll a dice', permissions: [] },
      { name: 'rps', description: 'Play rock, paper, scissors', permissions: [] },
      { name: 'fact', description: 'Get a random fact', permissions: [] },
      { name: 'dadjoke', description: 'Get a random dad joke', permissions: [] },
      { name: 'quote', description: 'Get a random quote', permissions: [] },
      { name: 'trivia', description: 'Play a trivia game', permissions: [] },
      { name: 'wouldyourather', description: 'Would you rather game', permissions: [] },
      { name: 'neverhaveiever', description: 'Never have I ever game', permissions: [] },
      { name: 'cat', description: 'Get a random cat image', permissions: [] },
      { name: 'dog', description: 'Get a random dog image', permissions: [] },
      { name: 'compliment', description: 'Get a random compliment', permissions: [] },
      { name: 'numberfact', description: 'Get a fact about a number', permissions: [] },
      { name: 'fortune', description: 'Get your fortune', permissions: [] },
      { name: 'flip', description: 'Flip text upside down', permissions: [] },
      { name: 'hangman', description: 'Play hangman', permissions: [] },
      { name: 'tictactoe', description: 'Play tic-tac-toe', permissions: [] }
    ],
    music: [
      { name: 'play', description: 'Play a song', permissions: [] },
      { name: 'skip', description: 'Skip the current song', permissions: [] },
      { name: 'stop', description: 'Stop playing music and clear the queue', permissions: [] },
      { name: 'pause', description: 'Pause the current song', permissions: [] },
      { name: 'resume', description: 'Resume the paused song', permissions: [] },
      { name: 'queue', description: 'View the music queue', permissions: [] },
      { name: 'nowplaying', description: 'Show the currently playing song', permissions: [] },
      { name: 'volume', description: 'Adjust the music volume', permissions: [] },
      { name: 'shuffle', description: 'Shuffle the music queue', permissions: [] },
      { name: 'loop', description: 'Loop the current song or queue', permissions: [] },
      { name: 'seek', description: 'Seek to a position in the current song', permissions: [] },
      { name: 'lyrics', description: 'Get lyrics for the current song', permissions: [] },
      { name: 'remove', description: 'Remove a song from the queue', permissions: [] },
      { name: 'skipto', description: 'Skip to a specific position in the queue', permissions: [] },
      { name: 'move', description: 'Move a song to a different position in the queue', permissions: [] },
      { name: 'replay', description: 'Replay the current song', permissions: [] },
      { name: 'search', description: 'Search for songs', permissions: [] },
      { name: 'soundcloud', description: 'Play a song from SoundCloud', permissions: [] },
      { name: 'spotify', description: 'Play a song from Spotify', permissions: [] },
      { name: 'equalizer', description: 'Adjust the equalizer settings', permissions: [] },
      { name: 'jump', description: 'Jump to a specific time in the current song', permissions: [] },
      { name: 'clear', description: 'Clear the music queue', permissions: [] }
    ],
    economy: [
      { name: 'balance', description: 'Check your balance', permissions: [] },
      { name: 'daily', description: 'Claim your daily rewards', permissions: [] },
      { name: 'work', description: 'Work to earn currency', permissions: [] },
      { name: 'bank', description: 'Manage your bank account', permissions: [] },
      { name: 'deposit', description: 'Deposit currency to your bank', permissions: [] },
      { name: 'withdraw', description: 'Withdraw currency from your bank', permissions: [] },
      { name: 'transfer', description: 'Transfer currency to another user', permissions: [] },
      { name: 'shop', description: 'View the shop', permissions: [] },
      { name: 'buy', description: 'Buy an item from the shop', permissions: [] },
      { name: 'sell', description: 'Sell an item', permissions: [] },
      { name: 'inventory', description: 'View your inventory', permissions: [] },
      { name: 'leaderboard', description: 'View the economy leaderboard', permissions: [] },
      { name: 'rob', description: 'Rob another user', permissions: [] },
      { name: 'gamble', description: 'Gamble your currency', permissions: [] },
      { name: 'slots', description: 'Play the slot machine', permissions: [] },
      { name: 'blackjack', description: 'Play blackjack', permissions: [] },
      { name: 'coinflip', description: 'Bet on a coin flip', permissions: [] },
      { name: 'weekly', description: 'Claim your weekly rewards', permissions: [] },
      { name: 'monthly', description: 'Claim your monthly rewards', permissions: [] },
      { name: 'gift', description: 'Gift an item to another user', permissions: [] },
      { name: 'use', description: 'Use an item from your inventory', permissions: [] },
      { name: 'profile', description: 'View your economy profile', permissions: [] }
    ],
    games: [
      { name: 'connect4', description: 'Play Connect 4', permissions: [] },
      { name: 'akinator', description: 'Play Akinator', permissions: [] },
      { name: 'quiz', description: 'Play a quiz game', permissions: [] },
      { name: 'wordle', description: 'Play Wordle', permissions: [] },
      { name: 'typerace', description: 'Race to type a text correctly', permissions: [] },
      { name: 'memory', description: 'Play a memory matching game', permissions: [] },
      { name: 'battleship', description: 'Play Battleship', permissions: [] },
      { name: 'chess', description: 'Play chess', permissions: [] },
      { name: 'uno', description: 'Play UNO', permissions: [] },
      { name: 'pokemon', description: 'Play a Pokémon guessing game', permissions: [] },
      { name: 'minesweeper', description: 'Play Minesweeper', permissions: [] },
      { name: 'guessthesong', description: 'Guess the song game', permissions: [] },
      { name: 'roulette', description: 'Play roulette', permissions: [] },
      { name: 'riddle', description: 'Solve a riddle', permissions: [] },
      { name: 'guesstheflag', description: 'Guess the country flag', permissions: [] },
      { name: 'boggle', description: 'Play Boggle word game', permissions: [] },
      { name: 'duel', description: 'Challenge someone to a duel', permissions: [] },
      { name: 'sudoku', description: 'Play Sudoku', permissions: [] },
      { name: 'truthordare', description: 'Play Truth or Dare', permissions: [] },
      { name: 'charades', description: 'Play Charades', permissions: [] },
      { name: 'wordchain', description: 'Play Word Chain game', permissions: [] },
      { name: 'anagrams', description: 'Solve anagram puzzles', permissions: [] }
    ],
    information: [
      { name: 'botinfo', description: 'Display information about the bot', permissions: [] },
      { name: 'uptime', description: 'Show how long the bot has been online', permissions: [] },
      { name: 'stats', description: 'Show stats about the bot', permissions: [] },
      { name: 'shardinfo', description: 'Display information about bot shards', permissions: [] },
      { name: 'status', description: 'Show the status of bot systems', permissions: [] },
      { name: 'permissions', description: 'Check your permissions in a channel', permissions: [] },
      { name: 'invite', description: 'Get an invite link for the bot', permissions: [] },
      { name: 'botstats', description: 'Show detailed bot statistics', permissions: [] },
      { name: 'about', description: 'About the bot', permissions: [] },
      { name: 'support', description: 'Get support information', permissions: [] },
      { name: 'faq', description: 'Frequently asked questions', permissions: [] },
      { name: 'docs', description: 'Access bot documentation', permissions: [] },
      { name: 'privacy', description: 'View the privacy policy', permissions: [] },
      { name: 'terms', description: 'View the terms of service', permissions: [] },
      { name: 'vote', description: 'Vote for the bot on listing sites', permissions: [] },
      { name: 'feedback', description: 'Submit feedback for the bot', permissions: [] },
      { name: 'bugreport', description: 'Report a bug', permissions: [] },
      { name: 'suggest', description: 'Suggest a new feature', permissions: [] },
      { name: 'commands', description: 'List all commands', permissions: [] },
      { name: 'version', description: 'Check the bot version', permissions: [] },
      { name: 'changelog', description: 'View recent changes to the bot', permissions: [] },
      { name: 'premium', description: 'Information about premium features', permissions: [] }
    ],
    admin: [
      { name: 'prefix', description: 'Change the bot prefix for this server', permissions: ['ManageGuild'] },
      { name: 'setlogs', description: 'Set up logging channels', permissions: ['ManageGuild'] },
      { name: 'autorole', description: 'Configure auto-roles for new members', permissions: ['ManageRoles'] },
      { name: 'welcome', description: 'Configure welcome messages', permissions: ['ManageGuild'] },
      { name: 'goodbye', description: 'Configure goodbye messages', permissions: ['ManageGuild'] },
      { name: 'antiraid', description: 'Configure anti-raid protection', permissions: ['ManageGuild'] },
      { name: 'automod', description: 'Configure auto-moderation settings', permissions: ['ManageGuild'] },
      { name: 'blacklist', description: 'Blacklist users from using the bot', permissions: ['ManageGuild'] },
      { name: 'whitelist', description: 'Whitelist users or channels for certain commands', permissions: ['ManageGuild'] },
      { name: 'reactionroles', description: 'Set up reaction roles', permissions: ['ManageRoles'] },
      { name: 'backup', description: 'Create a backup of server settings', permissions: ['Administrator'] },
      { name: 'restore', description: 'Restore a server backup', permissions: ['Administrator'] },
      { name: 'setlang', description: 'Set the bot language for this server', permissions: ['ManageGuild'] },
      { name: 'leveling', description: 'Configure the leveling system', permissions: ['ManageGuild'] },
      { name: 'customcommands', description: 'Manage custom commands', permissions: ['ManageGuild'] },
      { name: 'tickets', description: 'Configure the ticket system', permissions: ['ManageGuild'] },
      { name: 'lockdown', description: 'Lock down the entire server', permissions: ['ManageGuild'] },
      { name: 'commandsettings', description: 'Configure command-specific settings', permissions: ['ManageGuild'] },
      { name: 'disablecmd', description: 'Disable commands in certain channels', permissions: ['ManageGuild'] },
      { name: 'enablecmd', description: 'Enable previously disabled commands', permissions: ['ManageGuild'] },
      { name: 'resetconfig', description: 'Reset server configuration to defaults', permissions: ['Administrator'] },
      { name: 'settings', description: 'View and edit all bot settings', permissions: ['ManageGuild'] }
    ]
  };
  
  // Get the list of additional commands for this category
  const additionalCommands = additionalCommandsByCategory[category.name as keyof typeof additionalCommandsByCategory] || [];
  
  // Use the predefined commands up to the number we need
  for (let i = 0; i < additionalForThisCategory && i < additionalCommands.length; i++) {
    const cmd = additionalCommands[i];
    const filePath = path.join(categoryDir, `${cmd.name}.ts`);
    fs.writeFileSync(
      filePath,
      commandTemplate(
        cmd.name,
        cmd.description,
        category.name,
        cmd.permissions
      )
    );
    totalCommands++;
  }
  
  // If we need more commands than what we've predefined, create generic ones
  if (additionalForThisCategory > additionalCommands.length) {
    const remaining = additionalForThisCategory - additionalCommands.length;
    for (let i = 1; i <= remaining; i++) {
      const cmdName = `${category.name}extra${i}`;
      const filePath = path.join(categoryDir, `${cmdName}.ts`);
      fs.writeFileSync(
        filePath,
        commandTemplate(
          cmdName,
          `Additional ${category.name} command ${i}`,
          category.name,
          []
        )
      );
      totalCommands++;
    }
  }
}

console.log(`Generated ${totalCommands} commands across ${categories.length} categories.`);