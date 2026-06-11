import { House, WordChallenge, WordPracticeStats } from "../types";

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

type LessonWord = Omit<WordChallenge, 'id' | 'year' | 'lessonTitle'>;

interface LessonDefinition {
  level: number;
  year: number;
  title: string;
  words: LessonWord[];
}

// Curriculum-style word list inspired by the original seven-book arc.
const curriculum: LessonDefinition[] = [
  {
    level: 1,
    year: 1,
    title: 'Letters from Home',
    words: [
      { word: 'harry', hint: 'A young wizard begins the story', category: 'character', difficulty: 1 },
      { word: 'dursley', hint: 'A strict family name on Privet Drive', category: 'character', difficulty: 2 },
      { word: 'privet', hint: 'The street where the story opens', category: 'place', difficulty: 2 },
      { word: 'cupboard', hint: 'A cramped space under the stairs', category: 'place', difficulty: 2 },
      { word: 'letter', hint: 'The first invitation to a hidden world', category: 'object', difficulty: 1 },
      { word: 'hagrid', hint: 'Keeper of keys and grounds', category: 'character', difficulty: 2 },
      { word: 'birthday', hint: 'The night everything changes', category: 'event', difficulty: 2 },
      { word: 'wizard', hint: 'A person who can use magic', category: 'world', difficulty: 1 }
    ]
  },
  {
    level: 2,
    year: 1,
    title: 'Diagon Alley',
    words: [
      { word: 'diagon', hint: 'A hidden shopping street', category: 'place', difficulty: 2 },
      { word: 'gringotts', hint: 'The bank run by magical vault keepers', category: 'place', difficulty: 3 },
      { word: 'vault', hint: 'A locked room for treasure', category: 'place', difficulty: 2 },
      { word: 'wand', hint: 'The main tool for casting spells', category: 'object', difficulty: 1 },
      { word: 'ollivander', hint: 'A famous maker of wands', category: 'character', difficulty: 4 },
      { word: 'cauldron', hint: 'A pot used for brewing', category: 'object', difficulty: 2 },
      { word: 'parchment', hint: 'Paper for magical schoolwork', category: 'object', difficulty: 3 },
      { word: 'hedwig', hint: 'A snowy companion with wings', category: 'character', difficulty: 2 }
    ]
  },
  {
    level: 3,
    year: 1,
    title: 'First Term',
    words: [
      { word: 'hogwarts', hint: 'The school at the center of the adventure', category: 'place', difficulty: 2 },
      { word: 'sorting', hint: 'The ceremony that chooses houses', category: 'event', difficulty: 2 },
      { word: 'gryffindor', hint: 'A house known for courage', category: 'house', difficulty: 3 },
      { word: 'slytherin', hint: 'A house known for ambition', category: 'house', difficulty: 3 },
      { word: 'ravenclaw', hint: 'A house known for wit', category: 'house', difficulty: 3 },
      { word: 'hufflepuff', hint: 'A house known for loyalty', category: 'house', difficulty: 3 },
      { word: 'hermione', hint: 'A brilliant first-year student', category: 'character', difficulty: 3 },
      { word: 'ronald', hint: 'A loyal friend from a large family', category: 'character', difficulty: 2 }
    ]
  },
  {
    level: 4,
    year: 1,
    title: 'Stone and Secrets',
    words: [
      { word: 'quidditch', hint: 'A fast sport played on broomsticks', category: 'world', difficulty: 3 },
      { word: 'seeker', hint: 'A player who watches for the golden prize', category: 'world', difficulty: 2 },
      { word: 'snitch', hint: 'A tiny golden ball in the sport', category: 'object', difficulty: 2 },
      { word: 'fluffy', hint: 'A huge guardian near a trapdoor', category: 'creature', difficulty: 2 },
      { word: 'mirror', hint: 'It shows a deep desire', category: 'object', difficulty: 2 },
      { word: 'stone', hint: 'A legendary object guarded at school', category: 'object', difficulty: 1 },
      { word: 'quirrell', hint: 'A nervous teacher with a secret', category: 'character', difficulty: 3 },
      { word: 'voldemort', hint: 'A dark name feared by many', category: 'character', difficulty: 3 }
    ]
  },
  {
    level: 5,
    year: 2,
    title: 'Warning Signs',
    words: [
      { word: 'dobby', hint: 'A small servant who brings a warning', category: 'character', difficulty: 2 },
      { word: 'malfoy', hint: 'A rival family name', category: 'character', difficulty: 2 },
      { word: 'burrow', hint: 'A warm, crowded wizarding home', category: 'place', difficulty: 2 },
      { word: 'weasley', hint: 'A red-haired family name', category: 'character', difficulty: 3 },
      { word: 'floo', hint: 'A network using fireplaces', category: 'world', difficulty: 2 },
      { word: 'mandrake', hint: 'A plant with a dangerous cry', category: 'creature', difficulty: 3 },
      { word: 'lockhart', hint: 'A teacher famous for fame itself', category: 'character', difficulty: 3 },
      { word: 'bludger', hint: 'A ball that can cause trouble', category: 'object', difficulty: 3 }
    ]
  },
  {
    level: 6,
    year: 2,
    title: 'The Chamber',
    words: [
      { word: 'chamber', hint: 'A hidden room below the school', category: 'place', difficulty: 2 },
      { word: 'slytherin', hint: 'The founder linked to the hidden room', category: 'house', difficulty: 3 },
      { word: 'heir', hint: 'Someone who carries a legacy', category: 'world', difficulty: 1 },
      { word: 'petrified', hint: 'Frozen as if turned to stone', category: 'spell', difficulty: 4 },
      { word: 'basilisk', hint: 'A giant serpent from the old legends', category: 'creature', difficulty: 3 },
      { word: 'fawkes', hint: 'A fiery loyal companion', category: 'creature', difficulty: 2 },
      { word: 'diary', hint: 'A book that answers back', category: 'object', difficulty: 2 },
      { word: 'riddle', hint: 'A name tied to a younger darkness', category: 'character', difficulty: 2 }
    ]
  },
  {
    level: 7,
    year: 3,
    title: 'The Prisoner',
    words: [
      { word: 'azkaban', hint: 'A fortress prison at sea', category: 'place', difficulty: 3 },
      { word: 'sirius', hint: 'A wanted man with a hidden truth', category: 'character', difficulty: 2 },
      { word: 'black', hint: 'A family name with old history', category: 'character', difficulty: 1 },
      { word: 'marge', hint: 'A visit that floats out of control', category: 'character', difficulty: 1 },
      { word: 'knight', hint: 'A bus for stranded magical travelers', category: 'object', difficulty: 2 },
      { word: 'shrieking', hint: 'A noisy house near Hogsmeade', category: 'place', difficulty: 4 },
      { word: 'hogsmeade', hint: 'A village near the school', category: 'place', difficulty: 3 },
      { word: 'lupin', hint: 'A kind defense teacher', category: 'character', difficulty: 2 }
    ]
  },
  {
    level: 8,
    year: 3,
    title: 'Patronus Lessons',
    words: [
      { word: 'dementor', hint: 'A cold creature that drains happiness', category: 'creature', difficulty: 3 },
      { word: 'patronus', hint: 'A guardian made from happy memory', category: 'spell', difficulty: 3 },
      { word: 'expecto', hint: 'The first part of a protective charm', category: 'spell', difficulty: 2 },
      { word: 'marauder', hint: 'A maker of a secret map', category: 'world', difficulty: 3 },
      { word: 'map', hint: 'It shows movement inside the castle', category: 'object', difficulty: 1 },
      { word: 'buckbeak', hint: 'A proud magical creature on trial', category: 'creature', difficulty: 3 },
      { word: 'time', hint: 'A force briefly bent to rescue friends', category: 'world', difficulty: 1 },
      { word: 'animagus', hint: 'A wizard with an animal form', category: 'world', difficulty: 4 }
    ]
  },
  {
    level: 9,
    year: 4,
    title: 'Tournament Begins',
    words: [
      { word: 'goblet', hint: 'A cup that chooses champions', category: 'object', difficulty: 2 },
      { word: 'fire', hint: 'The magical flame inside the cup', category: 'world', difficulty: 1 },
      { word: 'triwizard', hint: 'A contest between three schools', category: 'event', difficulty: 4 },
      { word: 'beauxbatons', hint: 'A visiting magical school', category: 'place', difficulty: 5 },
      { word: 'durmstrang', hint: 'A northern magical school', category: 'place', difficulty: 4 },
      { word: 'cedric', hint: 'A kind champion from Hufflepuff', category: 'character', difficulty: 2 },
      { word: 'krum', hint: 'A famous seeker from abroad', category: 'character', difficulty: 1 },
      { word: 'fleur', hint: 'A graceful champion from France', category: 'character', difficulty: 2 }
    ]
  },
  {
    level: 10,
    year: 4,
    title: 'Three Tasks',
    words: [
      { word: 'dragon', hint: 'The first great tournament challenge', category: 'creature', difficulty: 2 },
      { word: 'egg', hint: 'A clue that must be opened correctly', category: 'object', difficulty: 1 },
      { word: 'lake', hint: 'The second task goes beneath it', category: 'place', difficulty: 1 },
      { word: 'gillyweed', hint: 'A plant that helps underwater', category: 'object', difficulty: 4 },
      { word: 'merpeople', hint: 'Beings who live in the lake', category: 'creature', difficulty: 4 },
      { word: 'maze', hint: 'The final tournament task', category: 'place', difficulty: 1 },
      { word: 'portkey', hint: 'An object that transports by touch', category: 'object', difficulty: 3 },
      { word: 'graveyard', hint: 'A dark place where the tone changes', category: 'place', difficulty: 3 }
    ]
  },
  {
    level: 11,
    year: 5,
    title: 'A Secret Army',
    words: [
      { word: 'phoenix', hint: 'A symbol of renewal and loyalty', category: 'creature', difficulty: 3 },
      { word: 'order', hint: 'A group resisting dark forces', category: 'world', difficulty: 1 },
      { word: 'grimmauld', hint: 'An old house used as headquarters', category: 'place', difficulty: 4 },
      { word: 'umbridge', hint: 'A pink-clad official at school', category: 'character', difficulty: 3 },
      { word: 'decree', hint: 'A rule posted by authority', category: 'world', difficulty: 2 },
      { word: 'detention', hint: 'A punishment after class', category: 'world', difficulty: 3 },
      { word: 'thestral', hint: 'A winged creature only some can see', category: 'creature', difficulty: 3 },
      { word: 'cho', hint: 'A student connected to Ravenclaw', category: 'character', difficulty: 1 }
    ]
  },
  {
    level: 12,
    year: 5,
    title: 'Ministry Night',
    words: [
      { word: 'prophecy', hint: 'A record of what may come', category: 'object', difficulty: 3 },
      { word: 'ministry', hint: 'The government of the magical world', category: 'place', difficulty: 3 },
      { word: 'department', hint: 'A section inside a large office', category: 'place', difficulty: 4 },
      { word: 'mysteries', hint: 'A place filled with strange rooms', category: 'place', difficulty: 3 },
      { word: 'veil', hint: 'A silent archway in a deep chamber', category: 'object', difficulty: 1 },
      { word: 'bellatrix', hint: 'A dangerous follower of darkness', category: 'character', difficulty: 4 },
      { word: 'dumbledore', hint: 'The headmaster enters the fight', category: 'character', difficulty: 4 },
      { word: 'legilimency', hint: 'Magic that reads the mind', category: 'spell', difficulty: 5 }
    ]
  },
  {
    level: 13,
    year: 6,
    title: 'Potions and Memories',
    words: [
      { word: 'prince', hint: 'A mysterious note writer in a textbook', category: 'character', difficulty: 2 },
      { word: 'potions', hint: 'A class about magical brewing', category: 'class', difficulty: 2 },
      { word: 'slughorn', hint: 'A teacher who collects promising students', category: 'character', difficulty: 4 },
      { word: 'felix', hint: 'The first half of a lucky potion name', category: 'object', difficulty: 2 },
      { word: 'luck', hint: 'The promise of a golden potion', category: 'world', difficulty: 1 },
      { word: 'pensieve', hint: 'A basin for viewing memories', category: 'object', difficulty: 3 },
      { word: 'memory', hint: 'A clue hidden in the past', category: 'world', difficulty: 2 },
      { word: 'horcrux', hint: 'A dark object tied to a fragment of soul', category: 'object', difficulty: 3 }
    ]
  },
  {
    level: 14,
    year: 6,
    title: 'The Tower',
    words: [
      { word: 'draco', hint: 'A student under terrible pressure', category: 'character', difficulty: 2 },
      { word: 'cabinet', hint: 'A damaged object with a hidden twin', category: 'object', difficulty: 2 },
      { word: 'necklace', hint: 'A cursed object sent by mistake', category: 'object', difficulty: 3 },
      { word: 'inferi', hint: 'Dark creatures near a hidden cave', category: 'creature', difficulty: 3 },
      { word: 'cave', hint: 'A place guarding a false prize', category: 'place', difficulty: 1 },
      { word: 'locket', hint: 'A small object worn around the neck', category: 'object', difficulty: 2 },
      { word: 'tower', hint: 'A high place where trust breaks', category: 'place', difficulty: 1 },
      { word: 'severus', hint: 'A teacher with a double-edged role', category: 'character', difficulty: 3 }
    ]
  },
  {
    level: 15,
    year: 7,
    title: 'The Hunt',
    words: [
      { word: 'hallows', hint: 'Three legendary magical objects', category: 'object', difficulty: 3 },
      { word: 'elder', hint: 'A powerful wand name begins here', category: 'object', difficulty: 2 },
      { word: 'resurrection', hint: 'A stone linked to return', category: 'object', difficulty: 5 },
      { word: 'cloak', hint: 'A gift that hides the wearer', category: 'object', difficulty: 1 },
      { word: 'horcruxes', hint: 'The dark objects must be found', category: 'object', difficulty: 4 },
      { word: 'camping', hint: 'A long search away from school', category: 'event', difficulty: 2 },
      { word: 'goblin', hint: 'A sharp negotiator near treasure', category: 'character', difficulty: 2 },
      { word: 'griphook', hint: 'A guide through a dangerous bank plan', category: 'character', difficulty: 3 }
    ]
  },
  {
    level: 16,
    year: 7,
    title: 'Final Challenge',
    words: [
      { word: 'battle', hint: 'The last stand at the school', category: 'event', difficulty: 2 },
      { word: 'hogwarts', hint: 'The school becomes a fortress', category: 'place', difficulty: 2 },
      { word: 'diadem', hint: 'A lost object from Ravenclaw', category: 'object', difficulty: 3 },
      { word: 'nagini', hint: 'A final living link to darkness', category: 'creature', difficulty: 3 },
      { word: 'fiendfyre', hint: 'A cursed flame that destroys', category: 'spell', difficulty: 4 },
      { word: 'expelliarmus', hint: 'A disarming spell with history', category: 'spell', difficulty: 5 },
      { word: 'protego', hint: 'A shield charm', category: 'spell', difficulty: 3 },
      { word: 'always', hint: 'A single word tied to lasting love', category: 'world', difficulty: 2 }
    ]
  }
];

export const TOTAL_LEVELS = curriculum.length;

export interface LessonInfo {
  level: number;
  year: number;
  title: string;
  challengeCount: number;
}

export interface CurriculumStats {
  totalWords: number;
  practicedWords: number;
  masteredWords: number;
  practicedPercent: number;
  masteredPercent: number;
}

export interface CurriculumLesson {
  level: number;
  year: number;
  title: string;
  words: WordChallenge[];
}

export interface YearCompletionInfo {
  year: number;
  completedLevel: number;
  lessonCount: number;
}

const toChallenge = (lesson: LessonDefinition, entry: LessonWord): WordChallenge => ({
  ...entry,
  id: `year-${lesson.year}-level-${lesson.level}-${entry.word}`,
  year: lesson.year,
  lessonTitle: lesson.title
});

export const getLevelInfo = (level: number): LessonInfo => {
  const safeLevel = Math.min(Math.max(level, 1), TOTAL_LEVELS);
  const lesson = curriculum[safeLevel - 1];

  return {
    level: lesson.level,
    year: lesson.year,
    title: lesson.title,
    challengeCount: lesson.words.length
  };
};

export const getCurriculumLessons = (): CurriculumLesson[] =>
  curriculum.map((lesson) => ({
    level: lesson.level,
    year: lesson.year,
    title: lesson.title,
    words: lesson.words.map((word) => toChallenge(lesson, word))
  }));

export const getYearCompletionInfo = (completedLevel?: number): YearCompletionInfo | null => {
  if (!completedLevel) return null;

  const completedLesson = curriculum.find((lesson) => lesson.level === completedLevel);
  if (!completedLesson) return null;

  const yearLessons = curriculum.filter((lesson) => lesson.year === completedLesson.year);
  const lastLesson = yearLessons[yearLessons.length - 1];

  if (lastLesson.level !== completedLevel) return null;

  return {
    year: completedLesson.year,
    completedLevel,
    lessonCount: yearLessons.length
  };
};

export const getCurriculumStats = (wordStats: Record<string, WordPracticeStats> = {}): CurriculumStats => {
  const allWordIds = new Set(curriculum.flatMap((lesson) => lesson.words.map((word) => toChallenge(lesson, word).id)));
  let practicedWords = 0;
  let masteredWords = 0;

  for (const [wordId, stats] of Object.entries(wordStats)) {
    if (!allWordIds.has(wordId)) continue;
    if (stats.completedCount > 0) practicedWords += 1;
    if (stats.mastery === 'mastered') masteredWords += 1;
  }

  const totalWords = allWordIds.size;

  return {
    totalWords,
    practicedWords,
    masteredWords,
    practicedPercent: totalWords > 0 ? Math.round((practicedWords / totalWords) * 100) : 0,
    masteredPercent: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0
  };
};

export const getWeakPracticeChallenges = (wordStats: Record<string, WordPracticeStats> = {}): WordChallenge[] => {
  const challenges = getCurriculumLessons().flatMap((lesson) => lesson.words);
  const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const practicedEntries = Object.entries(wordStats)
    .filter(([wordId, stats]) => challengeById.has(wordId) && stats.completedCount > 0 && stats.mastery !== 'mastered');

  const weakEntries = practicedEntries
    .filter(([, stats]) => stats.errorCount > 0)
    .sort(([, a], [, b]) => b.errorCount - a.errorCount || a.bestAccuracy - b.bestAccuracy);

  const reviewEntries = weakEntries.length > 0
    ? weakEntries
    : practicedEntries.sort(([, a], [, b]) => a.completedCount - b.completedCount || a.bestAccuracy - b.bestAccuracy);

  return reviewEntries
    .slice(0, 10)
    .map(([wordId]) => challengeById.get(wordId))
    .filter((challenge): challenge is WordChallenge => !!challenge);
};

/**
 * Generates typing challenges based on the current level (local version).
 */
export const generateChallenges = async (level: number): Promise<WordChallenge[]> => {
  const safeLevel = Math.min(Math.max(level, 1), TOTAL_LEVELS);
  const lesson = curriculum[safeLevel - 1];
  const challenges = lesson.words.map((word) => toChallenge(lesson, word));
  
  // Shuffle the challenges
  return challenges.slice().sort(() => Math.random() - 0.5);
};

/**
 * Generates audio for a given text using Web Speech API (local version).
 */
export const getSnapeVoice = async (text: string): Promise<AudioBuffer | null> => {
  return null; // Return null to use fallback Web Speech API in the component
};
