// src/types/flashcard.ts
import { Timestamp } from "firebase/firestore";

export interface FlashcardData {
  id?: string; // Firestore document ID
  userId: string;
  documentId?: string | null; // Optional link to a BlockNote document
  question: string;
  answer: string;
  dueDate: Timestamp;
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  status: "new" | "learning" | "review" | "graduated";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Props for the BlockNote flashcard block
export type FlashcardBlockProps = {
  question: string;
  answer: string;
  flashcardId: string; // Links to FlashcardData.id in Firestore
};