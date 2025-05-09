// src/components/editor/blockSchema.ts
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { FlashcardBlockSpec } from "./FlashcardBlock";

export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    flashcard: FlashcardBlockSpec,
  },
});