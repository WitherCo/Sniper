import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "fact",
  description: "Get a random interesting fact",
  category: "fun",
  aliases: ["facts", "randomfact"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "category",
      description: "Category of fact (science, history, animal, space, tech)",
      type: "STRING",
      required: false,
      choices: [
        { name: "Science", value: "science" },
        { name: "History", value: "history" },
        { name: "Animal", value: "animal" },
        { name: "Space", value: "space" },
        { name: "Technology", value: "tech" }
      ]
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    try {
      let category = "random";
      
      // Parse category from interaction or args
      if (interaction instanceof CommandInteraction) {
        const categoryOption = interaction.options.get("category");
        if (categoryOption?.value) category = String(categoryOption.value);
      } else if (args && args.length > 0) {
        const validCategories = ["science", "history", "animal", "space", "tech"];
        const requestedCategory = args[0].toLowerCase();
        if (validCategories.includes(requestedCategory)) {
          category = requestedCategory;
        }
      }
      
      // Collection of facts by category
      const facts: Record<string, string[]> = {
        science: [
          "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
          "Octopuses have three hearts, nine brains, and blue blood.",
          "A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate once on its axis, and 225 Earth days to orbit the Sun.",
          "Human DNA is 99.9% identical from person to person.",
          "The coldest temperature theoretically possible is -273.15°C, known as 'absolute zero.' It's the point where all molecular motion stops.",
          "Humans share 50% of their DNA with bananas.",
          "The average adult human body contains approximately 100 trillion cells.",
          "A bolt of lightning is about 54,000°F (30,000°C), which is six times hotter than the surface of the sun.",
          "The only letter that doesn't appear in the periodic table is the letter J.",
          "Water can exist in three states at once - solid, liquid, and gas - at a temperature of 0.01°C and a pressure of 0.006 atm."
        ],
        history: [
          "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
          "Ancient Romans used to clean and whiten their teeth with urine. The ammonia in urine was the cleaning agent.",
          "The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years until Lincoln Cathedral was built in England in 1311 AD.",
          "Cleopatra lived closer in time to the invention of the iPhone than to the building of the Great Pyramid of Giza.",
          "Vikings used the bones of slain animals when smithing new weapons believing this would enchant the weapon with the animals' spirit.",
          "The first recorded use of 'OMG' was in a 1917 letter to Winston Churchill.",
          "During WWI, a Canadian soldier made a black bear his pet and named her Winnipeg. 'Winnie' was later a resident of the London Zoological Gardens where she was visited by A.A. Milne and his son, Christopher Robin, who named his teddy after her - creating 'Winnie the Pooh'.",
          "Ancient Egyptians used to use crocodile dung as a contraceptive and for ancient medicinal purposes.",
          "In 1386, a pig in France was executed by public hanging for the murder of a child.",
          "Edison didn't invent the lightbulb. He improved upon a 50-year-old idea and created the first commercially practical incandescent light."
        ],
        animal: [
          "Flamingos are born with gray feathers, not pink ones. Their diet of brine shrimp and algae turns them pink over time.",
          "The heart of a shrimp is located in its head.",
          "Elephants are the only mammals that can't jump.",
          "A snail can sleep for three years at a time.",
          "The fingerprints of a koala are so similar to humans that they have on occasion been confused at crime scenes.",
          "Cows have best friends and get stressed when separated from them.",
          "A cockroach can live for several weeks without its head. It only dies because it can't drink water.",
          "The mantis shrimp can strike with the force of a .22 caliber bullet and see polarized light as well as 16 distinct color channels (humans see three).",
          "Otters have a pouch where they store their favorite rocks used for breaking open shells.",
          "Hummingbirds are the only birds that can fly backwards."
        ],
        space: [
          "There are more stars in the universe than grains of sand on all the beaches on Earth.",
          "The tallest mountain known to man is on an asteroid called Vesta. Rheasilvia is almost 14 miles high, which makes Mount Everest seem tiny in comparison at 5.5 miles.",
          "A year on Mercury is just 88 days long.",
          "One day on Mercury is equivalent to 176 Earth days.",
          "The footprints on the Moon will be there for at least 100 million years since there is no atmosphere to erode them.",
          "If two pieces of the same type of metal touch in space, they will bond and be permanently stuck together, a phenomenon called 'cold welding'.",
          "The largest volcano in our solar system, Olympus Mons on Mars, is nearly 3 times the height of Mount Everest.",
          "Because of lower gravity on Mars, you could jump nearly three times higher there than you can on Earth.",
          "A neutron star can spin up to 600 times per second.",
          "The Great Red Spot on Jupiter is a storm that has been raging for over 350 years and is about 2-3 times the size of Earth."
        ],
        tech: [
          "The first computer mouse was made of wood.",
          "The first commercial computer was the UNIVAC I, delivered to the US Census Bureau in 1951.",
          "The first webpage is still online at http://info.cern.ch/hypertext/WWW/TheProject.html",
          "The first computer bug was an actual real-life bug. A moth was found trapped in a Mark II computer at Harvard University in 1947.",
          "The word 'robot' comes from the Czech word 'robota', meaning forced labor or drudgery.",
          "In 1971, the first ever internet message sent was 'LO'. It was supposed to be 'LOGIN' but the computer crashed after the first two letters.",
          "The first ever domain name registered was Symbolics.com on March 15, 1985.",
          "The first item sold on eBay was a broken laser pointer for $14.83.",
          "The USB symbol is modeled after Neptune's trident, representing power, simplicity, and connectivity.",
          "The first known computer programmer was Ada Lovelace, who wrote the first algorithm designed to be processed by a machine (Charles Babbage's Analytical Engine) in the 1840s."
        ],
        random: [] // Will be filled from other categories
      };
      
      // Fill the random category with facts from all categories
      for (const cat in facts) {
        if (cat !== "random") {
          facts.random.push(...facts[cat]);
        }
      }
      
      // Make sure we have facts for the requested category
      if (!facts[category]) {
        category = "random";
      }
      
      // Get a random fact from the appropriate category
      const randomFact = facts[category][Math.floor(Math.random() * facts[category].length)];
      
      // Create an appropriate emoji and color based on category
      let emoji = '🤔';
      let color = 0x3498DB; // Default blue
      
      switch (category) {
        case 'science':
          emoji = '🧪';
          color = 0x2ECC71; // Green
          break;
        case 'history':
          emoji = '📜';
          color = 0xE67E22; // Orange
          break;
        case 'animal':
          emoji = '🐾';
          color = 0xF1C40F; // Yellow
          break;
        case 'space':
          emoji = '🚀';
          color = 0x9B59B6; // Purple
          break;
        case 'tech':
          emoji = '💻';
          color = 0x34495E; // Dark blue
          break;
      }
      
      // Create an embed for the fact
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} Fact`)
        .setDescription(randomFact)
        .setFooter({ text: `Try another category with /fact [category] or !fact [category]` });
      
      if (interaction instanceof CommandInteraction) {
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in fact command:', error);
      const errorMessage = "Sorry, I couldn't retrieve a fact right now. Please try again later.";
      
      if (interaction instanceof CommandInteraction) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
} as DiscordCommand;
