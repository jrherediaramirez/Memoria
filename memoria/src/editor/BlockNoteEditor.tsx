// src/components/editor/BlockNoteEditor.tsx
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import { PartialBlock } from "@blocknote/core";
import { customSchema } from "./blockSchema";
import { useEffect, useState } from "react";
import {
  getFirestoreDoc,
  saveFirestoreDoc,
  createInitialDocContent,
} from "../firebase/firestoreService"; // We'll create this
import { useAuthStore } from "../store/authStore";
import { SuggestionMenuController } from "@blocknote/react"; // For custom slash menu

// Example: Default document ID to load/save. In a real app, this would be dynamic.
const DEFAULT_DOC_ID = "myFirstDocument";

export const BlockNoteEditor = () => {
  const user = useAuthStore((state) => state.user);
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>(undefined);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: initialContent,
    uploadFile: async (file: File) => {
      // Basic file upload placeholder, replace with actual Firebase Storage upload
      console.log("File upload attempt:", file.name);
      // Simulate upload and return a URL
      return new Promise((resolve) => {
        setTimeout(() => {
          // In a real app, upload to Firebase Storage and get the URL
          resolve(`https://example.com/uploads/${file.name}`);
          alert("File upload is a placeholder. See console.");
        }, 1000);
      });
    },
  });

  useEffect(() => {
    const loadContent = async () => {
      if (!user) {
        // Potentially set to empty or a public default if not logged in
        setInitialContent(createInitialDocContent());
        setIsLoadingContent(false);
        return;
      }
      try {
        setError(null);
        setIsLoadingContent(true);
        const content = await getFirestoreDoc(user.uid, DEFAULT_DOC_ID);
        setInitialContent(content || createInitialDocContent());
      } catch (err) {
        console.error("Error loading document:", err);
        setError("Failed to load document.");
        setInitialContent(createInitialDocContent()); // Fallback
      } finally {
        setIsLoadingContent(false);
      }
    };
    loadContent();
  }, [user]); // Reload content when user changes

  const handleSaveContent = async () => {
    if (!user || !editor) {
      setError("Cannot save: Not logged in or editor not ready.");
      return;
    }
    try {
      setError(null);
      await saveFirestoreDoc(user.uid, DEFAULT_DOC_ID, editor.document);
      alert("Document saved!"); // Simple feedback
    } catch (err) {
      console.error("Error saving document:", err);
      setError("Failed to save document.");
    }
  };

  if (isLoadingContent) {
    return <div className="p-4 text-center">Loading editor content...</div>;
  }
  if (error) {
     return <div className="p-4 text-center text-error-text bg-error-bg">{error}</div>;
  }


  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-gray-700">
        <button
          onClick={handleSaveContent}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded text-white"
        >
          Save Document
        </button>
        {/* Add more controls here if needed */}
      </div>
      <div className="flex-grow overflow-y-auto p-4 bn-container"> {/* Added bn-container for potential scoping */}
        {editor && (
           <SuggestionMenuController
            triggerCharacter={"/"}
            getItems={async (query) =>
              // Gets all default slash menu items and `image` item.
              // Returns `true` for a default item if it's not removed.
              customSchema.slashMenuItems(editor).filter((item) =>
                item.title.toLowerCase().includes(query.toLowerCase())
              )
            }
          >
            <BlockNoteView editor={editor} theme="dark" />
          </SuggestionMenuController>
        )}
      </div>
    </div>
  );
};