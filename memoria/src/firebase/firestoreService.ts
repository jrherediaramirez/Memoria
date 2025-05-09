// src/firebase/firestoreService.ts
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc, Timestamp } from "firebase/firestore";
import { PartialBlock } from "@blocknote/core";
import { db } from "./firebaseConfig";
import { DocumentData, FlashcardData } from "../types";

export const createInitialDocContent = (): PartialBlock[] => [
  { type: "paragraph", content: "Start typing your notes here..." },
];

// --- Document Operations ---
export const getFirestoreDoc = async (
  userId: string,
  docId: string
): Promise<PartialBlock[] | null> => {
  const docRef = doc(db, "users", userId, "documents", docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as DocumentData;
    return data.content;
  }
  return null;
};

export const saveFirestoreDoc = async (
  userId: string,
  docId: string,
  content: PartialBlock[]
): Promise<void> => {
  const docRef = doc(db, "users", userId, "documents", docId);
  const docSnap = await getDoc(docRef);

  const data: Partial<DocumentData> = {
    userId,
    content,
    updatedAt: serverTimestamp() as Timestamp, // Cast for type safety
  };

  if (docSnap.exists()) {
    await updateDoc(docRef, data);
  } else {
    data.title = "Untitled Document"; // Or prompt user for title
    data.createdAt = serverTimestamp() as Timestamp; // Cast for type safety
    await setDoc(docRef, data);
  }
};


// --- Flashcard Operations (already partially in FlashcardBlock.tsx, can be centralized more later) ---
// Example: Get a specific flashcard (could be used by FlashcardBlock or a global review page)
export const getFlashcard = async (flashcardId: string): Promise<FlashcardData | null> => {
    const flashcardRef = doc(db, "flashcards", flashcardId);
    const docSnap = await getDoc(flashcardRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FlashcardData;
    }
    return null;
};

// createFlashcard and updateFlashcard are good candidates to be here,
// but for now, they are closely tied to the FlashcardBlock component's logic.
// Consider refactoring if they need to be called from elsewhere.