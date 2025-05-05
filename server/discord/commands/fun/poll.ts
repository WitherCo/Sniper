import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "poll",
  description: "Create a poll for others to vote on",
  category: "fun",
  aliases: ["vote", "survey"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: [],
  options: [
    {
      name: "question",
      description: "The poll question",
      type: "STRING",
      required: true
    },
    {
      name: "duration",
      description: "How long the poll should run (in minutes, max 60)",
      type: "INTEGER",
      required: false,
      minValue: 1,
      maxValue: 60
    },
    {
      name: "options",
      description: "Options to vote on, separated by '|' (e.g., 'Yes|No|Maybe')",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let question = "";
    let duration = 5; // Default duration in minutes
    let options: string[] = ["👍 Yes", "👎 No"]; // Default options
    
    if (interaction instanceof CommandInteraction) {
      // Get options from slash command
      question = interaction.options.getString("question") || "Poll";
      
      const durationOption = interaction.options.getInteger("duration");
      if (durationOption) duration = Math.min(durationOption, 60); // Cap at 60 minutes
      
      const optionsString = interaction.options.getString("options");
      if (optionsString) {
        // Split by pipe character and trim
        const customOptions = optionsString.split("|").map(opt => opt.trim());
        
        // Use custom options if valid and not empty
        if (customOptions.length >= 2 && customOptions.every(opt => opt.length > 0)) {
          options = customOptions;
        }
      }
    } else {
      // Parse message command arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ You need to provide a poll question! Example: `!poll \"Do you like pizza?\" 10 \"Yes|No|Maybe\"`",
          ephemeral: true
        });
      }
      
      // Parse more complex format with quotes
      const fullText = (args.join(" ")).trim();
      
      // Extract question (in quotes)
      const questionMatch = fullText.match(/^"([^"]+)"/);
      if (questionMatch) {
        question = questionMatch[1];
        
        // Remove question from fullText to parse the rest
        let remainingText = fullText.slice(questionMatch[0].length).trim();
        
        // Look for duration (number)
        const durationMatch = remainingText.match(/^(\d+)/);
        if (durationMatch) {
          duration = Math.min(parseInt(durationMatch[1]), 60);
          remainingText = remainingText.slice(durationMatch[0].length).trim();
        }
        
        // Look for options (in quotes)
        const optionsMatch = remainingText.match(/^"([^"]+)"/);
        if (optionsMatch) {
          const customOptions = optionsMatch[1].split("|").map(opt => opt.trim());
          if (customOptions.length >= 2 && customOptions.every(opt => opt.length > 0)) {
            options = customOptions;
          }
        }
      } else {
        // Simple format: first arg is question, rest are ignored
        question = fullText;
      }
    }
    
    // Setup poll data
    const pollData = {
      question,
      options,
      votes: new Map<number, Set<string>>(), // Map option index to set of user IDs who voted
      voters: new Set<string>(), // Set of user IDs who voted (to track total votes)
      startTime: Date.now(),
      endTime: Date.now() + (duration * 60 * 1000)
    };
    
    // Initialize vote counts for each option
    options.forEach((_, index) => {
      pollData.votes.set(index, new Set());
    });
    
    // Create embed for the poll
    const embed = createPollEmbed(pollData);
    
    // Create buttons for voting
    const buttons = createVoteButtons(pollData.options);
    
    // Send initial poll message
    const response = await interaction.reply({
      embeds: [embed],
      components: [buttons],
      fetchReply: true
    });
    
    // Set up collector for vote button interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: duration * 60 * 1000, // Duration in ms
    });
    
    // Handle votes
    collector.on("collect", async (i) => {
      // Validate that the interaction is for this poll
      if (!i.customId.startsWith("poll-vote-")) return;
      
      // Extract option index from button custom ID
      const optionIndex = parseInt(i.customId.replace("poll-vote-", ""));
      
      // Get user ID
      const userId = i.user.id;
      
      // Check if user already voted for this option
      if (pollData.votes.get(optionIndex)?.has(userId)) {
        // Remove vote if already voted for this option (toggle)
        pollData.votes.get(optionIndex)?.delete(userId);
        
        // Check if user has any votes left
        let hasOtherVotes = false;
        for (const [idx, voters] of pollData.votes.entries()) {
          if (idx !== optionIndex && voters.has(userId)) {
            hasOtherVotes = true;
            break;
          }
        }
        
        // If no other votes, remove from voters list
        if (!hasOtherVotes) {
          pollData.voters.delete(userId);
        }
      } else {
        // Add vote for this option
        pollData.votes.get(optionIndex)?.add(userId);
        pollData.voters.add(userId);
      }
      
      // Update embed with new vote counts
      const updatedEmbed = createPollEmbed(pollData);
      
      // Respond to the interaction
      await i.update({
        embeds: [updatedEmbed],
        components: [buttons]
      });
    });
    
    // When poll ends
    collector.on("end", async () => {
      // Create final results embed
      const finalEmbed = createPollEmbed(pollData, true);
      
      // Update message with final results and remove buttons
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({
          embeds: [finalEmbed],
          components: []
        }).catch(() => {}); // Ignore errors if message is too old
      } else {
        try {
          const msg = await response.fetch();
          await msg.edit({
            embeds: [finalEmbed],
            components: []
          }).catch(() => {}); // Ignore errors if message is too old
        } catch (error) {
          // Message might have been deleted or is too old
        }
      }
    });
  }
} as DiscordCommand;

/**
 * Creates an embed for the poll with current results
 */
function createPollEmbed(pollData: any, isEnded = false): EmbedBuilder {
  const { question, options, votes, voters, startTime, endTime } = pollData;
  
  // Calculate time remaining
  const timeNow = Date.now();
  const timeRemaining = Math.max(0, endTime - timeNow);
  const timeElapsed = timeNow - startTime;
  
  // Format times
  const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
  const secondsRemaining = Math.ceil(timeRemaining / 1000);
  
  // Choose appropriate time format
  let timeText = isEnded ? "Poll has ended" : 
                minutesRemaining > 1 ? `${minutesRemaining} minutes remaining` :
                secondsRemaining > 0 ? `${secondsRemaining} seconds remaining` :
                "Poll ending now";
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(question)
    .setColor(isEnded ? 0xE74C3C : 0x3498DB)
    .setFooter({ 
      text: `${voters.size} ${voters.size === 1 ? 'vote' : 'votes'} • ${timeText}`
    })
    .setTimestamp();
  
  // Add description with options and vote counts
  let description = "";
  
  // Find option with most votes for calculating percentage bars
  const maxVotes = Math.max(...Array.from(votes.values()).map(voters => voters.size), 1);
  
  // Build results display
  options.forEach((option, index) => {
    const voteCount = votes.get(index)?.size || 0;
    const percentage = voters.size > 0 ? (voteCount / voters.size) * 100 : 0;
    const barLength = Math.round((voteCount / maxVotes) * 15);
    
    // Create progress bar
    const bar = barLength > 0 ? '█'.repeat(barLength) + '░'.repeat(15 - barLength) : '░'.repeat(15);
    
    description += `**${option}**\n`;
    description += `${bar} **${voteCount}** vote${voteCount !== 1 ? 's' : ''} (${percentage.toFixed(1)}%)\n\n`;
  });
  
  embed.setDescription(description);
  
  // Add status field
  if (isEnded) {
    embed.addFields({
      name: "🏁 Poll Ended",
      value: "The voting period has ended. Final results are displayed above."
    });
  } else {
    embed.addFields({
      name: "📊 Poll Active",
      value: "Click the buttons below to vote. You can vote for multiple options."
    });
  }
  
  return embed;
}

/**
 * Creates vote buttons for the options
 */
function createVoteButtons(options: string[]): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
  // Add buttons for each option (limit to 5 due to Discord's UI constraints)
  const maxButtons = Math.min(options.length, 5);
  
  for (let i = 0; i < maxButtons; i++) {
    const option = options[i];
    const label = option.length > 20 ? option.substring(0, 17) + "..." : option;
    
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll-vote-${i}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Primary)
    );
  }
  
  return row;
}