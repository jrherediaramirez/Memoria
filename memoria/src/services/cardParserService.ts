// No uuid import needed here as it's generated in NoteEditor
import { Card, ParsedCardInfo } from '../types';
import { db } from './storageService';

// Regex to find card markers: [[card:UUID|q:Question|a:Answer]]
// - UUID: [0-9a-fA-F-]{36} (standard UUID length)
// - Question (q): .*? (non-greedy match for any char)
// - Answer (a): .*? (non-greedy match for any char)
// The non-greedy match is important if q or a can contain ']]' or '|' (escaped or part of markdown)
// For simplicity, assuming q and a don't contain the raw sequence ']]' or unescaped '|' that breaks the structure.
// A more robust parser might handle escaped characters.
const CARD_MARKER_REGEX = /\[\[card:(?<id>[0-9a-fA-F-]{36})\|q:(?<q>.*?)\|a:(?<a>.*?)\]\]/g;


export const cardParserService = {
  parseContentForCardData(content: string): ParsedCardInfo[] {
    const parsedCards: ParsedCardInfo[] = [];
    let match;
    CARD_MARKER_REGEX.lastIndex = 0; 
    
    while ((match = CARD_MARKER_REGEX.exec(content)) !== null) {
      if (match.groups) {
        parsedCards.push({
          id: match.groups.id,
          question: match.groups.q,
          answer: match.groups.a,
          markerText: match[0],
          charRangeStart: match.index,
          charRangeEnd: match.index + match[0].length,
        });
      }
    }
    return parsedCards;
  },

  async syncCardsFromNoteContent(noteId: string, content: string): Promise<void> {
    const parsedCardInfos = this.parseContentForCardData(content);
    const existingCards = await db.getCardsByNoteId(noteId);

    const cardsToCreate: Card[] = [];
    const cardsToUpdate: (Partial<Card> & { id: string })[] = [];
    const parsedCardIds = new Set<string>();

    for (const parsedInfo of parsedCardInfos) {
      parsedCardIds.add(parsedInfo.id);
      const existingCard = existingCards.find(c => c.id === parsedInfo.id);

      if (existingCard) {
        if (
          existingCard.front !== parsedInfo.question ||
          existingCard.back !== parsedInfo.answer ||
          existingCard.markerText !== parsedInfo.markerText ||
          existingCard.charRangeStart !== parsedInfo.charRangeStart || // Important for highlighting
          existingCard.charRangeEnd !== parsedInfo.charRangeEnd
        ) {
          cardsToUpdate.push({
            id: existingCard.id,
            front: parsedInfo.question,
            back: parsedInfo.answer,
            markerText: parsedInfo.markerText,
            charRangeStart: parsedInfo.charRangeStart,
            charRangeEnd: parsedInfo.charRangeEnd,
            // updatedAt will be set by db.updateCard
          });
        }
      } else {
        cardsToCreate.push({
          id: parsedInfo.id, // UUID generated in NoteEditor when marker is created
          noteId,
          front: parsedInfo.question,
          back: parsedInfo.answer,
          markerText: parsedInfo.markerText,
          charRangeStart: parsedInfo.charRangeStart,
          charRangeEnd: parsedInfo.charRangeEnd,
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5, 
          nextDueDate: new Date(), // Due immediately
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const cardIdsToDelete = existingCards
      .filter(card => !parsedCardIds.has(card.id))
      .map(card => card.id);

    if (cardsToCreate.length > 0) {
      await db.bulkAddCards(cardsToCreate);
    }
    if (cardsToUpdate.length > 0) {
      await db.bulkUpdateCards(cardsToUpdate);
    }
    if (cardIdsToDelete.length > 0) {
      await db.bulkDeleteCards(cardIdsToDelete);
    }
  },
};