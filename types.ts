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
  score: number;
  wpm: number;
  accuracy: number;
  streak: number;
}

export interface WordChallenge {
  word: string;
  hint: string;
}

export enum GameStatus {
  Menu,
  Sorting,
  Playing,
  Results
}
