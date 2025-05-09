// src/components/layout/EditorLayout.tsx
import React from 'react';
import { Sidebar } from './Sidebar';
import { BlockNoteEditor } from '../editor/BlockNoteEditor';

export const EditorLayout = () => {
  return (
    <div className="flex h-screen bg-main-body-bg">
      <Sidebar />
      <main className="flex-grow overflow-hidden"> {/* Ensure editor can scroll if content is large */}
        <BlockNoteEditor />
      </main>
    </div>
  );
};