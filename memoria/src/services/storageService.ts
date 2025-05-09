import Dexie, { type Table } from 'dexie';
import { type Note, type Card } from '../types';

export class AppDB extends Dexie {
  notes!: Table<Note, string>; 
  cards!: Table<Card, string>;

  constructor() {
    super('MemoriaDB');
    this.version(1).stores({ // Initial schema, or if you had one before UUIDs
        notes: '++internalId, id, title, createdAt, updatedAt', // Example if you started with auto-inc
        cards: '++internalId, id, noteId, nextDueDate, createdAt, updatedAt',
    });
    this.version(2).stores({
        notes: 'id, title, createdAt, updatedAt', // Primary key is 'id' (UUID)
        cards: 'id, noteId, nextDueDate, createdAt, updatedAt', // Primary key 'id', index on noteId, nextDueDate
    }).upgrade(tx => {
        // This upgrade function runs if the DB exists and is on version 1.
        // If you are starting fresh with version 2, this won't run.
        // If migrating from a schema where 'id' was not the primary key:
        // return tx.table("notes").toCollection().modify(note => {
        //   if (!note.id) note.id = generateUUID(); // Ensure UUID exists if it was secondary
        // });
        // For this project, we assume 'id' (UUID) is primary from the start of v2.
        console.log("Upgrading to version 2 with UUID primary keys. No data migration needed if starting fresh or 'id' was already UUID.");
    });
  }

  // Notes CRUD
  async addNote(note: Note): Promise<string> {
    return this.notes.add(note);
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getAllNotes(): Promise<Note[]> {
    return this.notes.orderBy('updatedAt').reverse().toArray();
  }

  async updateNote(id: string, changes: Partial<Note>): Promise<number> {
    return this.notes.update(id, { ...changes, updatedAt: new Date() });
  }

  async deleteNote(id: string): Promise<void> {
    await this.cards.where('noteId').equals(id).delete();
    return this.notes.delete(id);
  }

  // Cards CRUD
  async addCard(card: Card): Promise<string> {
    return this.cards.add(card);
  }
  
  async bulkAddCards(cards: Card[]): Promise<string[]> {
    return this.cards.bulkAdd(cards, { allKeys: true }) as Promise<string[]>;
  }

  async getCard(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getCardsByNoteId(noteId: string): Promise<Card[]> {
    return this.cards.where('noteId').equals(noteId).toArray();
  }

  async getAllCards(): Promise<Card[]> {
    return this.cards.toArray();
  }
  
  async getDueCards(now: Date = new Date()): Promise<Card[]> {
    return this.cards.where('nextDueDate').belowOrEqual(now).sortBy('nextDueDate');
  }

  async updateCard(id: string, changes: Partial<Card>): Promise<number> {
    return this.cards.update(id, { ...changes, updatedAt: new Date() });
  }

  async bulkUpdateCards(cards: (Partial<Card> & { id: string })[]): Promise<number> {
    // Dexie's bulkUpdate takes a list of keys and a list of changes, or a list of objects with primary keys.
    // The latter is simpler if each object has its primary key.
    // However, Dexie's standard bulkPut is often better for "update or insert".
    // For pure updates where items are known to exist:
    const updatePromises = cards.map(card => 
        this.cards.update(card.id, { ...card, updatedAt: new Date() })
    );
    await Promise.all(updatePromises);
    return cards.length; 
  }

  async deleteCard(id: string): Promise<void> {
    return this.cards.delete(id);
  }

  async bulkDeleteCards(ids: string[]): Promise<void> {
    await this.cards.bulkDelete(ids);
  }
}

export const db = new AppDB();