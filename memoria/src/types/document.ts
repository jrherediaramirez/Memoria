// src/types/document.ts
import { Timestamp } from "firebase/firestore";
import { PartialBlock } from "@blocknote/core";

export interface DocumentData {
  id?: string; // Firestore document ID
  userId: string;
  title: string;
  content: PartialBlock[]; // Serialized BlockNote content
  createdAt: Timestamp;
  updatedAt: Timestamp;
}