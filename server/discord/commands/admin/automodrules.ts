import { 
  Message, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  GuildMember, 
  AutoModerationRuleEventType, 
  AutoModerationRuleTriggerType, 
  AutoModerationRuleKeywordPresetType, 
  AutoModerationActionType, 
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Define interface for rule data to fix type issues
interface AutoModRuleData {
  name: string;
  eventType: AutoModerationRuleEventType;
  triggerType: AutoModerationRuleTriggerType;
  triggerMetadata?: {
    keywords?: string[];
    regexPatterns?: string[];
    presets?: AutoModerationRuleKeywordPresetType[];
    mentionTotalLimit?: number;
  };
  actions: {
    type: AutoModerationActionType;
    metadata: { customMessage: string };
  }[];
  enabled: boolean;
  reason: string;
}

export default {
  name: "automodrules",
  description: "Generate 100 automod rules to get the automod badge",
  category: "admin",
  aliases: ["automodbadge", "genrules"],
  slash: false,
  prefix: true,
  cooldown: 30, // Higher cooldown due to resource intensity
  permissions: ["Administrator"],
  
  async execute(interaction: Message) {
    try {
      // Only server administrators should be able to use this command
      const member = interaction.member as GuildMember;
      if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⚠️ Permission Denied")
              .setDescription("You need administrator permissions to use this command.")
              .setColor(0xE74C3C)
          ]
        });
      }

      // Check if we can create rules in the guild
      if (!interaction.guild) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("This command can only be used in a server.")
              .setColor(0xE74C3C)
          ]
        });
      }
      
      // Check if the bot has permission to manage automod rules
      const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
      if (!botMember?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Permission Error")
              .setDescription("I don't have the 'Manage Server' permission required to create AutoMod rules.")
              .setColor(0xE74C3C)
          ]
        });
      }

      // Ask for confirmation before creating 100 rules
      const confirmEmbed = new EmbedBuilder()
        .setTitle("🔄 Automod Rules Generator")
        .setDescription(
          "I'm about to create 100 automod rules in this server.\n\n" +
          "**⚠️ WARNING ⚠️**\n" +
          "- This will add 100 new automod rules to your server\n" +
          "- If you already have rules, they will NOT be deleted\n" +
          "- This process may take some time to complete\n" +
          "- This is intended to help you get the Discord Moderator Badge\n\n" +
          "Are you sure you want to continue?"
        )
        .setColor(0x3498DB);
      
      await interaction.reply({ embeds: [confirmEmbed] });
      
      // Create a confirmation message with buttons
      const channel = interaction.channel as TextChannel;
      const confirmMessage = await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Confirmation Required")
            .setDescription("Click below to confirm or cancel:")
            .setColor(0x3498DB)
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("create_rules")
                .setLabel("Create 100 Rules")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("cancel_create")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
            )
        ]
      });
      
      // Create a filter for the collector
      const filter = (i: any) => {
        return ["create_rules", "cancel_create"].includes(i.customId) && i.user.id === interaction.author.id;
      };
      
      try {
        // Wait for button interaction
        const confirmation = await confirmMessage.awaitMessageComponent({ 
          filter, 
          time: 30000 
        });
        
        // Handle cancel
        if (confirmation.customId === "cancel_create") {
          await confirmation.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Operation Cancelled")
                .setDescription("Rule creation cancelled.")
                .setColor(0xE74C3C)
            ],
            components: []
          });
          return;
        }
        
        // Update the message to show we're starting
        await confirmation.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("🔄 Starting Rule Creation")
              .setDescription("Beginning to create 100 AutoMod rules. This may take several minutes...")
              .setColor(0x3498DB)
          ],
          components: []
        });

        // Rule categories and examples to generate a variety of rules
        const ruleTypes = [
          {
            name: "Keyword Filter",
            description: "Blocks messages containing specific keywords",
            triggerType: AutoModerationRuleTriggerType.Keyword
          },
          {
            name: "Spam Prevention",
            description: "Prevents message spam",
            triggerType: AutoModerationRuleTriggerType.Spam
          },
          {
            name: "Mention Limit",
            description: "Prevents excessive mentions",
            triggerType: AutoModerationRuleTriggerType.MentionSpam
          },
          {
            name: "Harmful Link Filter", 
            description: "Blocks potentially dangerous links",
            triggerType: AutoModerationRuleTriggerType.Keyword
          },
          {
            name: "Preset Keyword Filter",
            description: "Filters preset categories of keywords",
            triggerType: AutoModerationRuleTriggerType.KeywordPreset
          },
          {
            name: "Scam Prevention",
            description: "Blocks common scam messages",
            triggerType: AutoModerationRuleTriggerType.Keyword
          },
          {
            name: "IP Grabber Protection",
            description: "Blocks URLs that might capture IP addresses",
            triggerType: AutoModerationRuleTriggerType.Keyword
          },
          {
            name: "Invite Link Filter",
            description: "Prevents posting Discord invite links",
            triggerType: AutoModerationRuleTriggerType.Keyword
          },
          {
            name: "Caps Lock Filter",
            description: "Filters messages with excessive caps",
            triggerType: AutoModerationRuleTriggerType.Keyword
          },
          {
            name: "Zalgo Text Filter",
            description: "Blocks messages with zalgo text",
            triggerType: AutoModerationRuleTriggerType.Keyword
          }
        ];

        // To keep track of the rules we'd create
        const generatedRules = [];
      
        // Generate 100 uniquely named rules
        for (let i = 1; i <= 100; i++) {
          const typeIndex = i % ruleTypes.length;
          const ruleName = `${ruleTypes[typeIndex].name}_${i}`;
          const ruleDescription = `${ruleTypes[typeIndex].description} (Rule ${i})`;
          
          generatedRules.push({
            name: ruleName,
            description: ruleDescription,
            triggerType: ruleTypes[typeIndex].triggerType
          });
        }
      
        // Different rule configurations to use
        const ruleConfigs = [
        // First 10 rules: Standard Keyword Filters
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Keyword_Filter_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywords: [`banned_word_${i}`, `filtered_term_${i}`],
              regexPatterns: []
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked due to containing filtered keywords (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - keyword filter`
          })
        },
        
        // Rules 11-20: Mention Spam Protection
        {
          type: AutoModerationRuleTriggerType.MentionSpam,
          createRule: (i: number) => ({
            name: `Mention_Limit_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: {
              mentionTotalLimit: 5 + (i % 5) // Vary the mention limits
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked for having too many mentions (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - mention limit`
          })
        },
        
        // Rules 21-30: Spam Protection
        {
          type: AutoModerationRuleTriggerType.Spam,
          createRule: (i: number) => ({
            name: `Spam_Filter_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Spam,
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was identified as spam and blocked (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - spam filter`
          })
        },
        
        // Rules 31-40: Preset Keyword Filters
        {
          type: AutoModerationRuleTriggerType.KeywordPreset,
          createRule: (i: number) => ({
            name: `Preset_Filter_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
              presets: [
                // Alternate between different presets
                i % 3 === 0 ? AutoModerationRuleKeywordPresetType.Profanity : 
                i % 3 === 1 ? AutoModerationRuleKeywordPresetType.SexualContent :
                              AutoModerationRuleKeywordPresetType.Slurs
              ]
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked for containing inappropriate content (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - preset filter`
          })
        },
        
        // Rules 41-50: Scam Protection Filters
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Scam_Protection_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywords: [
                `free nitro`, `nitro giveaway`,
                `steam gift`, `free gift cards`,
                `you won`, `you've been selected`, 
                `claim your prize`, `claim your reward`,
                `gift for you`, `lucky winner`
              ],
              regexPatterns: []
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked as a potential scam (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - scam protection`
          })
        },
        
        // Rules 51-60: Harmful Link Filters
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Harmful_Link_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywords: [`grabify.link`, `iplogger.org`, `2no.co`, `iplogger.com`, `ps3cfw.com`],
              regexPatterns: [`http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+${i}`]
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked for containing potentially harmful links (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - harmful link filter`
          })
        },
        
        // Rules 61-70: Discord Invite Filters
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Invite_Filter_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywords: [`discord.gg/`, `discordapp.com/invite/`],
              regexPatterns: [`discord(?:app\\.com|\\.gg)[\\/invite\\/]?(?:[a-zA-Z0-9\\-]{2,32})`]
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked for containing Discord invite links (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - invite filter`
          })
        },
        
        // Rules 71-80: Caps Lock Filters
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Caps_Filter_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              regexPatterns: [
                // Match messages with 70%+ uppercase characters
                `^[^a-z]*$`, 
                `^[A-Z\\s]{10,}$`,
                `^([A-Z]\\s*){${i % 10 + 5},}`
              ]
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked for excessive use of caps (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - caps filter`
          })
        },
        
        // Rules 81-90: Zalgo Text Filters
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Zalgo_Filter_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              regexPatterns: [
                // Match zalgo text (characters with combining diacritical marks)
                `[̀-ͯ]{2,}`,
                `[\u0300-\u036F]{2,}`,
                `[\u0300-\u036F]{${i % 3 + 2},}`
              ]
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked for containing zalgo text (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - zalgo filter`
          })
        },
        
        // Rules 91-100: Custom Moderation Rules
        {
          type: AutoModerationRuleTriggerType.Keyword,
          createRule: (i: number) => ({
            name: `Custom_Rule_${i}`,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywords: [
                `custom_block_${i}`, 
                `filtered_phrase_${i}`,
                `server_specific_block_${i}`
              ],
              regexPatterns: []
            },
            actions: [{
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: `This message was blocked by a custom server rule (Rule ${i})` }
            }],
            enabled: true,
            reason: `Automod rule ${i} - custom filter`
          })
        }
      ];
      
        // Create rules in the server
        const createdRules: { name: string; id: string; type: number }[] = [];
        const failedRules: number[] = [];
        
        // Create update message
        const progressEmbed = new EmbedBuilder()
          .setTitle("🔄 Creating Automod Rules")
          .setDescription("Starting to create 100 automod rules in your server...\nThis process will take some time, please be patient.")
          .setColor(0x3498DB);
        
        const progressMessage = await channel.send({ embeds: [progressEmbed] });
        
        // Actually create rules in the server
        for (let i = 1; i <= 100; i++) {
          try {
            // Figure out which configuration to use based on the rule number
            const configIndex = Math.floor((i - 1) / 10); // We have 10 rule types now
            const config = ruleConfigs[configIndex];
            
            // Get rule data
            const ruleData: AutoModRuleData = config.createRule(i);
            
            // Extract rule data for Discord's API
            const ruleCreateData: any = {
              name: ruleData.name,
              eventType: ruleData.eventType,
              triggerType: ruleData.triggerType,
              actions: ruleData.actions,
              enabled: ruleData.enabled,
              reason: ruleData.reason
            };
            
            // Add triggerMetadata if it exists
            if (ruleData.triggerMetadata) {
              ruleCreateData.triggerMetadata = ruleData.triggerMetadata;
            }
            
            // Create the rule in Discord
            const rule = await interaction.guild.autoModerationRules.create(ruleCreateData);
            
            createdRules.push({
              name: rule.name,
              id: rule.id,
              type: rule.triggerType
            });
            
            // Update progress every 10 rules
            if (i % 10 === 0 || i === 100) {
              const progressUpdate = new EmbedBuilder()
                .setTitle("🔄 Creating Automod Rules")
                .setDescription(`Progress: ${i}/100 rules created...\n${createdRules.length} rules created successfully so far.\n${failedRules.length} rules failed to create.`)
                .setColor(0x3498DB);
              
              await progressMessage.edit({ embeds: [progressUpdate] });
              
              // Add a small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error creating rule ${i}:`, error);
            failedRules.push(i);
            
            // Update progress with error information
            const errorUpdate = new EmbedBuilder()
              .setTitle("⚠️ Error Creating Rule")
              .setDescription(`Error creating rule ${i}. Continuing with next rule...\n${createdRules.length} rules created successfully so far.\n${failedRules.length} rules failed to create.`)
              .setColor(0xE67E22);
            
            await progressMessage.edit({ embeds: [errorUpdate] });
            
            // Add a longer delay after an error
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        // Final results
        const resultEmbed = new EmbedBuilder()
          .setTitle(failedRules.length === 0 ? "✅ Automod Rules Creation Complete" : "⚠️ Automod Rules Creation Completed with Errors")
          .setDescription(`I've created ${createdRules.length} out of 100 automod rules in your server.
           
**Rules by type:**
- Keyword Filters: ${createdRules.filter(r => r.type === AutoModerationRuleTriggerType.Keyword).length}
- Mention Limits: ${createdRules.filter(r => r.type === AutoModerationRuleTriggerType.MentionSpam).length}
- Spam Filters: ${createdRules.filter(r => r.type === AutoModerationRuleTriggerType.Spam).length}
- Preset Filters: ${createdRules.filter(r => r.type === AutoModerationRuleTriggerType.KeywordPreset).length}

${failedRules.length > 0 ? `**Failed Rules:**\nRules ${failedRules.join(', ')} failed to create. This might be due to rate limits or other restrictions.` : ''}

These rules will help you get the Discord Moderator Badge! 🎉\nYou can view and manage these rules in Server Settings > AutoMod.`)
          .setColor(failedRules.length === 0 ? 0x2ECC71 : 0xE67E22);

        return channel.send({ embeds: [resultEmbed] });
        
      } catch (buttonError) {
        console.error("Error handling button interaction:", buttonError);
        // Handle timeout or other errors
        if (confirmMessage) {
          await confirmMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Timed Out")
                .setDescription("Confirmation timed out. Please run the command again if you want to create automod rules.")
                .setColor(0xE74C3C)
            ],
            components: []
          });
        }
        return;
      }
    } catch (error) {
      console.error("Error in automodrules command:", error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("There was an error with the automod rules command. Please try again later.")
        .setColor(0xE74C3C);
      
      return interaction.reply({ embeds: [errorEmbed] });
    }
  }
} as DiscordCommand;