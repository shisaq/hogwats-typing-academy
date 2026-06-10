import { House, WordChallenge } from "../types";

// Local sorting logic based on keyword matching
const houseKeywords = {
  [House.Gryffindor]: {
    keywords: ['brave', 'courage', 'adventure', 'bold', 'hero', 'daring', 'fierce', 'loyal', 'strong', 'lion', 'gryffindor', 'risk', 'fearless', 'determined', 'noble'],
    animals: ['lion', 'tiger', 'eagle', 'phoenix', 'dragon'],
    reason: 'Your bravery and courageous spirit shine brightly!'
  },
  [House.Slytherin]: {
    keywords: ['cunning', 'ambitious', 'clever', 'sly', 'strategic', 'power', 'determined', 'resourceful', 'ambitious', 'snake', 'slytherin', 'ambitious', 'intelligent', 'leadership', 'success'],
    animals: ['snake', 'basilisk', 'serpent'],
    reason: 'Your ambition and cunning mind mark you as a true Slytherin!'
  },
  [House.Ravenclaw]: {
    keywords: ['wisdom', 'intelligent', 'clever', 'learning', 'creative', 'thoughtful', 'curious', 'analytical', 'logic', 'eagle', 'ravenclaw', 'knowledge', 'wit', 'mystery', 'riddle'],
    animals: ['eagle', 'owl', 'raven'],
    reason: 'Your wisdom and intellectual curiosity place you in Ravenclaw!'
  },
  [House.Hufflepuff]: {
    keywords: ['kind', 'patient', 'fair', 'loyal', 'friendly', 'hardworking', 'honest', 'dedicated', 'humble', 'badger', 'hufflepuff', 'justice', 'loyal', 'compassion', 'growth'],
    animals: ['badger', 'honey badger'],
    reason: 'Your loyalty and kind heart make you a true Hufflepuff!'
  }
};

export interface SortingResult {
  house: House;
  reason: string;
  matchedKeywords: string[];
}

/**
 * Acts as the Sorting Hat to assign a house based on a user's trait (local version).
 * Returns the house, reason, and matched keywords.
 */
export const sortUserIntoHouse = async (trait: string): Promise<SortingResult> => {
  const lowerTrait = trait.toLowerCase();
  
  // Count keyword matches for each house
  const scores: Record<House, { score: number; matched: string[] }> = {
    [House.Gryffindor]: { score: 0, matched: [] },
    [House.Slytherin]: { score: 0, matched: [] },
    [House.Ravenclaw]: { score: 0, matched: [] },
    [House.Hufflepuff]: { score: 0, matched: [] }
  };

  // Match keywords and track which ones were matched
  for (const [houseStr, houseData] of Object.entries(houseKeywords)) {
    const house = houseStr as House;
    const allKeywords = [...houseData.keywords, ...houseData.animals];
    
    for (const keyword of allKeywords) {
      if (lowerTrait.includes(keyword)) {
        scores[house].score += 1;
        scores[house].matched.push(keyword);
      }
    }
  }

  // Find the house with the most matches
  let selectedHouse = House.Gryffindor;
  let maxScore = 0;
  let reason = houseKeywords[House.Gryffindor].reason;
  let matchedKeywords: string[] = [];
  
  for (const [house, data] of Object.entries(scores)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      selectedHouse = house as House;
      reason = houseKeywords[selectedHouse].reason;
      matchedKeywords = [...new Set(data.matched)]; // Remove duplicates
    }
  }

  // If no matches, suggest based on sentence sentiment and complexity
  if (maxScore === 0) {
    const wordCount = trait.split(' ').length;
    const hasQuestionMark = trait.includes('?');
    
    // If thoughtful/questioning -> Ravenclaw
    if (hasQuestionMark) {
      selectedHouse = House.Ravenclaw;
      reason = 'Your thoughtful questions suggest a Ravenclaw mind!';
    }
    // If longer, more complex input -> Ravenclaw
    else if (wordCount > 4) {
      selectedHouse = House.Ravenclaw;
      reason = 'Your thoughtfulness places you in Ravenclaw!';
    }
    // Random from remaining
    else {
      const houses = [House.Gryffindor, House.Slytherin, House.Hufflepuff];
      selectedHouse = houses[Math.floor(Math.random() * houses.length)];
      reason = houseKeywords[selectedHouse].reason;
    }
    matchedKeywords = [];
  }

  return {
    house: selectedHouse,
    reason,
    matchedKeywords
  };
};

// Local word challenges database - 10 levels with progressive difficulty
const wordChallenges = {
  1: [
    { word: "wand", hint: "Used to cast spells" },
    { word: "owl", hint: "Delivers mail" },
    { word: "cat", hint: "A common pet" },
    { word: "rat", hint: "Scabbers was one" },
    { word: "frog", hint: "Chocolate treat" },
    { word: "hat", hint: "The sorting one" },
    { word: "bat", hint: "Flying mammal" },
    { word: "pot", hint: "Cauldron" },
    { word: "box", hint: "Magical container" },
    { word: "cup", hint: "The Triwizard one" }
  ],
  2: [
    { word: "potter", hint: "The boy who lived" },
    { word: "castle", hint: "Hogwarts is one" },
    { word: "potion", hint: "Brewed by Snape" },
    { word: "dragon", hint: "Fire-breathing creature" },
    { word: "wizard", hint: "A magical person" },
    { word: "spell", hint: "Magical incantation" },
    { word: "magic", hint: "Supernatural power" },
    { word: "broom", hint: "For flying" },
    { word: "scroll", hint: "Rolled parchment" },
    { word: "candle", hint: "Source of light" }
  ],
  3: [
    { word: "dumbledore", hint: "Headmaster of Hogwarts" },
    { word: "hermione", hint: "Brightest student" },
    { word: "severus", hint: "Potions master" },
    { word: "hagrid", hint: "Keeper of keys" },
    { word: "expecto", hint: "Patronus spell" },
    { word: "lumos", hint: "Light spell" },
    { word: "patronus", hint: "Guardian charm" },
    { word: "diagon", hint: "Famous alley" }
  ],
  4: [
    { word: "avada", hint: "Killing curse" },
    { word: "invisibility", hint: "Potter's cloak" },
    { word: "horcrux", hint: "Dark object" },
    { word: "phoenix", hint: "Dumbledore's bird" },
    { word: "basilisk", hint: "Serpent creature" },
    { word: "transfiguration", hint: "Changing form" },
    { word: "legilimency", hint: "Mind reading" },
    { word: "apparition", hint: "Instant teleport" }
  ],
  5: [
    { word: "thunderbolt", hint: "Racing broomstick" },
    { word: "pensieve", hint: "Memory storage device" },
    { word: "butterbeer", hint: "Hogsmeade drink" },
    { word: "dementor", hint: "Dark creature" },
    { word: "cryptic", hint: "Mysterious and puzzling" },
    { word: "wandering", hint: "Moving aimlessly" },
    { word: "enchanted", hint: "Magically affected" },
    { word: "prophecy", hint: "Future prediction" },
    { word: "alchemy", hint: "Ancient magic" },
    { word: "goblet", hint: "Fire cup" }
  ],
  6: [
    { word: "quidditch", hint: "Wizarding sport" },
    { word: "chaperone", hint: "Yule ball escort" },
    { word: "werewolf", hint: "Lupin's condition" },
    { word: "petrified", hint: "Turned to stone" },
    { word: "sanctuary", hint: "Safe place" },
    { word: "treachery", hint: "Betrayal" },
    { word: "malediction", hint: "Evil curse" },
    { word: "benevolent", hint: "Kind-hearted" },
    { word: "labyrinth", hint: "Maze puzzle" },
    { word: "vindicate", hint: "Prove innocent" }
  ],
  7: [
    { word: "fortitude", hint: "Courageous strength" },
    { word: "hexapod", hint: "Six-legged creature" },
    { word: "enigmatic", hint: "Mysterious nature" },
    { word: "imperious", hint: "Commanding tone" },
    { word: "abjuration", hint: "Defensive spell type" },
    { word: "conjuration", hint: "Summoning magic" },
    { word: "illuminated", hint: "Brightly lit" },
    { word: "nefarious", hint: "Evil scheme" },
    { word: "resplendent", hint: "Brilliantly shining" },
    { word: "ubiquitous", hint: "Everywhere present" }
  ],
  8: [
    { word: "infallible", hint: "Cannot make mistakes" },
    { word: "obliviation", hint: "Memory erasure charm" },
    { word: "defenestration", hint: "Throwing out window" },
    { word: "incarcerate", hint: "Lock in prison" },
    { word: "resuscitate", hint: "Bring back to life" },
    { word: "preposterous", hint: "Utterly absurd" },
    { word: "anachronism", hint: "Out of time period" },
    { word: "belligerent", hint: "Aggressive fighter" },
    { word: "melancholic", hint: "Deep sadness" },
    { word: "serendipity", hint: "Lucky coincidence" }
  ],
  9: [
    { word: "irredeemable", hint: "Cannot be saved" },
    { word: "metamorphic", hint: "Shape-changing" },
    { word: "oscillating", hint: "Swinging back-forth" },
    { word: "ameliorate", hint: "Make things better" },
    { word: "perspicacity", hint: "Sharp understanding" },
    { word: "obfuscate", hint: "Make confusing" },
    { word: "antithetical", hint: "Completely opposite" },
    { word: "conflagration", hint: "Large fire" },
    { word: "ephemeral", hint: "Short-lived" },
    { word: "multifarious", hint: "Many-fold variety" }
  ],
  10: [
    { word: "indiscriminate", hint: "Without distinction" },
    { word: "phantasmagoria", hint: "Dream-like vision" },
    { word: "cacophonous", hint: "Harsh sound mixture" },
    { word: "magnanimous", hint: "Noble generous spirit" },
    { word: "inscrutable", hint: "Cannot be understood" },
    { word: "perspicuity", hint: "Clear understanding" },
    { word: "tergiversation", hint: "Evasive shifting" },
    { word: "sesquipedalian", hint: "Long-winded words" },
    { word: "verisimilitude", hint: "Appearance of truth" },
    { word: "infinitesimal", hint: "Impossibly small" }
  ]
};

/**
 * Generates typing challenges based on the current level (local version).
 */
export const generateChallenges = async (level: number): Promise<WordChallenge[]> => {
  // Return challenges for this level, or fallback to level 1 if level not found
  const challenges = wordChallenges[level as keyof typeof wordChallenges] || wordChallenges[1];
  
  // Shuffle the challenges
  return challenges.sort(() => Math.random() - 0.5);
};

/**
 * Generates audio for a given text using Web Speech API (local version).
 */
export const getSnapeVoice = async (text: string): Promise<AudioBuffer | null> => {
  return null; // Return null to use fallback Web Speech API in the component
};
