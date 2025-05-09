import { supermemo, Flashcard as Sm2FlashcardInputInternal } from 'supermemo2';
import { Card, Sm2ReviewInput, Sm2ProcessedOutput } from '../types'; // Using our defined types

// Map UI quality (0-3) to SM-2 quality (0-5)
// 0: Again -> SM-2 quality 0 (no recall)
// 1: Hard  -> SM-2 quality 3 (correct, but with difficulty)
// 2: Good  -> SM-2 quality 4 (correct, after some hesitation)
// 3: Easy  -> SM-2 quality 5 (correct, easy)
const qualityMap: Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3 | 4 | 5> = {
  0: 0, // Again
  1: 3, // Hard
  2: 4, // Good
  3: 5, // Easy
};

export const reviewEngine = {
  processReview(
    card: Pick<Card, 'interval' | 'repetitions' | 'easeFactor'>, // Only needs SM-2 fields
    uiQuality: 0 | 1 | 2 | 3
  ): Pick<Card, 'interval' | 'repetitions' | 'easeFactor' | 'nextDueDate'> {
    const sm2Quality = qualityMap[uiQuality];

    const sm2Input: Sm2ReviewInput = { // Use our type that matches library's expectation
      interval: card.interval,
      repetition: card.repetitions, // Our 'repetitions' maps to library's 'repetition'
      efactor: card.easeFactor,     // Our 'easeFactor' maps to library's 'efactor'
    };

    // The supermemo2 library's Flashcard type might be slightly different,
    // so we cast our Sm2ReviewInput. Ensure properties match.
    const result = supermemo(sm2Input as Sm2FlashcardInputInternal, sm2Quality) as Sm2ProcessedOutput;

    const nextDueDate = new Date();
    // Ensure interval is at least 1 if not "repeat again", or 0 if "repeat again"
    const actualInterval = result.isRepeatAgain ? 0 : Math.max(1, result.interval);
    nextDueDate.setDate(nextDueDate.getDate() + actualInterval);
    nextDueDate.setHours(5, 0, 0, 0); // Set to early morning for "due today"

    return {
      interval: result.interval,      // This is the new interval from SM-2
      repetitions: result.repetition, // This is the new repetition count
      easeFactor: result.efactor,     // This is the new ease factor
      nextDueDate,
    };
  },
};