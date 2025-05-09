import { create } from 'zustand';
import { Card } from '../types';
import { db } from '../services/storageService';
import { reviewEngine } from '../services/reviewEngine';

interface ReviewState {
  dueCards: Card[];
  // currentCardIndex: number; // Replaced by currentReviewCard for simplicity
  isAnswerShown: boolean;
  isLoading: boolean;
  error: string | null;
  currentReviewCard: Card | null;

  fetchDueCardsAndSetCurrent: () => Promise<void>;
  showAnswer: () => void;
  submitReview: (quality: 0 | 1 | 2 | 3) => Promise<void>;
  skipCard: () => void;
  resetReviewState: () => void; // For unmounting or explicit reset
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  dueCards: [],
  isAnswerShown: false,
  isLoading: false,
  error: null,
  currentReviewCard: null,

  fetchDueCardsAndSetCurrent: async () => {
    set({ isLoading: true, error: null, isAnswerShown: false });
    try {
      const now = new Date();
      const due = await db.getDueCards(now);
      // Optional: Shuffle 'due' array here for randomness
      // due.sort(() => Math.random() - 0.5); 
      set({
        dueCards: due,
        currentReviewCard: due.length > 0 ? due[0] : null,
        isLoading: false,
        isAnswerShown: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, currentReviewCard: null, dueCards: [] });
    }
  },

  showAnswer: () => {
    set({ isAnswerShown: true });
  },

  submitReview: async (quality: 0 | 1 | 2 | 3) => {
    const { currentReviewCard, dueCards } = get();
    if (!currentReviewCard) return;

    set({ isLoading: true }); // Indicate processing review
    try {
      const updatedSm2Fields = reviewEngine.processReview(currentReviewCard, quality);
      await db.updateCard(currentReviewCard.id, {
        ...updatedSm2Fields,
        // updatedAt will be set by db.updateCard
      });

      // Remove reviewed card from this session's due list and pick next
      const remainingDueCards = dueCards.filter(c => c.id !== currentReviewCard.id);
      
      set({
        dueCards: remainingDueCards,
        currentReviewCard: remainingDueCards.length > 0 ? remainingDueCards[0] : null,
        isAnswerShown: false,
        isLoading: false,
      });

    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  
  skipCard: () => { // Moves current card to end of due list for this session
    set(state => {
      if (!state.currentReviewCard || state.dueCards.length <= 1) {
        return {}; // No change if no card or only one card
      }

      const currentIndex = state.dueCards.findIndex(c => c.id === state.currentReviewCard!.id);
      if (currentIndex === -1) return {}; // Should not happen

      const newDueCards = [...state.dueCards];
      const skippedCard = newDueCards.splice(currentIndex, 1)[0];
      newDueCards.push(skippedCard); 

      return {
        dueCards: newDueCards,
        currentReviewCard: newDueCards[0], // Go to the new first card
        isAnswerShown: false,
      };
    });
  },

  resetReviewState: () => {
    set({
      dueCards: [],
      currentReviewCard: null,
      isAnswerShown: false,
      isLoading: false,
      error: null,
    });
  }
}));