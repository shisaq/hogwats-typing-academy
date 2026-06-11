export enum House {
  Gryffindor = 'Gryffindor',
  Slytherin = 'Slytherin',
  Ravenclaw = 'Ravenclaw',
  Hufflepuff = 'Hufflepuff',
  Unsorted = 'Unsorted'
}

export interface GameState {
  house: House;
  level: number;
  completedLevel?: number;
  isReview?: boolean;
  score: number;
  wpm: number;
  accuracy: number;
  streak: number;
  isGraduated?: boolean;
}

export interface WordChallenge {
  id: string;
  word: string;
  hint: string;
  year: number;
  lessonTitle: string;
  category: string;
  difficulty: number;
}

export type WordMastery = 'new' | 'seen' | 'learning' | 'mastered';

export interface WordPracticeStats {
  word: string;
  seenCount: number;
  completedCount: number;
  errorCount: number;
  bestAccuracy: number;
  mastery: WordMastery;
  lastPracticedAt: string;
}

export enum GameStatus {
  Menu,
  Sorting,
  Playing,
  Results
}
