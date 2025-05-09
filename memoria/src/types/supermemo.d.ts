declare module 'supermemo2' {
    export interface Flashcard {
      interval: number;
      repetition: number;
      efactor: number;
    }
  
    export interface SuperMemoResult extends Flashcard {
      isRepeatAgain: boolean;
    }
  
    export function supermemo(
      flashcard: Flashcard,
      quality: 0 | 1 | 2 | 3 | 4 | 5
    ): SuperMemoResult;
  }