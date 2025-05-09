export interface Note {
    id: string; // UUID
    title: string;
    content: string; // Markdown content
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Card {
    id: string; // UUID, same as in marker [[card:id|...]]
    noteId: string; // Parent note
    front: string; // Question
    back: string; // Answer
    markerText: string; // The full "[[card:...]]" marker text
    
    // For highlighting in note:
    charRangeStart?: number; // Start index of markerText in note.content
    charRangeEnd?: number;   // End index of markerText in note.content
  
    // SM-2 fields
    interval: number; // In days
    repetitions: number;
    easeFactor: number; // Easiness factor (typically starts at 2.5)
    nextDueDate: Date;
  
    createdAt: Date;
    updatedAt: Date;
  }
  
  // For parsing note content
  export interface ParsedCardInfo {
    id: string;
    question: string;
    answer: string;
    markerText: string;
    charRangeStart: number;
    charRangeEnd: number;
  }
  
  // For SM-2 calculation input (matching supermemo2 library)
  export interface Sm2ReviewInput {
    interval: number;
    repetition: number; 
    efactor: number;    
  }
  
  // For SM-2 calculation output (matching supermemo2 library)
  export interface Sm2ProcessedOutput extends Sm2ReviewInput {
    isRepeatAgain: boolean;
  }