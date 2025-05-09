# Memoria - Notes & Flashcards App

Memoria is a web-only application that combines rich-text notes with Anki-style flashcards using spaced repetition.

## Core Features

1.  **Notes First**: Create, edit, and manage Markdown-like notes.
2.  **Inline Flashcards**: Mark selections within notes as flashcards using a special syntax (`[[card:UUID|q:Question|a:Answer]]`).
3.  **Spaced Repetition Review**: Cards are reviewed using the SM-2 algorithm with user feedback (Again / Hard / Good / Easy).
4.  **Context Preview**: During review, users can view the parent note with the card's context highlighted.

## Tech Stack

-   **UI**: React + Vite + TypeScript
-   **State Management**: Zustand
-   **Styling**: TailwindCSS
-   **Local Storage**: IndexedDB (via Dexie.js)

## Project Structure