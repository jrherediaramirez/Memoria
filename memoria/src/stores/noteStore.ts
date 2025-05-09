import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types';
import { db } from '../services/storageService';
// CardParserService will be created later. For now, updateNote is simple.
// import { cardParserService } from '../services/cardParserService';


interface NoteState {
  notes: Note[];
  activeNote: Note | null;
  isLoading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  loadNote: (id: string) => Promise<void>; // Sets activeNote
  createNote: () => Promise<string | null>; // Returns new note ID
  updateNoteContent: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  getNoteTitle: (content: string) => string;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  isLoading: false,
  error: null,
  
  getNoteTitle: (content: string) => {
    const firstLine = content.split('\n')[0] || 'Untitled Note';
    return firstLine.substring(0, 50); // Max 50 chars for title
  },

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await db.getAllNotes();
      set({ notes, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  loadNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const note = await db.getNote(id);
      if (note) {
        set({ activeNote: note, isLoading: false });
      } else {
        throw new Error('Note not found');
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, activeNote: null });
    }
  },

  createNote: async () => {
    set({ isLoading: true, error: null });
    const newNote: Note = {
      id: uuidv4(),
      title: 'New Note',
      content: '# New Note\n\nStart writing...',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await db.addNote(newNote);
      set((state) => ({
        notes: [newNote, ...state.notes], // Add to top
        activeNote: newNote,
        isLoading: false,
      }));
      return newNote.id;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateNoteContent: async (id: string, content: string) => {
    const { activeNote, notes, getNoteTitle } = get();
    const title = getNoteTitle(content);
    set({ isLoading: true, error: null });

    try {
      // Placeholder for card parsing logic later
      // const existingCards = await db.getCardsByNoteId(id);
      // const { cardsToCreate, cardsToUpdate, cardIdsToDelete } = cardParserService.syncCardsFromNoteContent(id, content, existingCards);
      // await db.bulkAddCards(cardsToCreate);
      // await db.bulkUpdateCards(cardsToUpdate); // Ensure this method exists and works
      // await db.bulkDeleteCards(cardIdsToDelete);

      await db.updateNote(id, { content, title });
      const updatedNote = { ...activeNote, content, title, updatedAt: new Date() } as Note;
      
      set((state) => ({
        activeNote: state.activeNote?.id === id ? updatedNote : state.activeNote,
        notes: state.notes.map(n => n.id === id ? updatedNote : n),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteNote(id); // This also deletes associated cards in DB
      set((state) => ({
        notes: state.notes.filter(n => n.id !== id),
        activeNote: state.activeNote?.id === id ? null : state.activeNote,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  
  setActiveNote: (note: Note | null) => {
    set({ activeNote: note });
  },
}));