import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNoteStore } from '../stores/noteStore';
import SimpleMDEEditor from 'react-simplemde-editor';
import "easymde/dist/easymde.min.css";
import { debounce } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import MakeCardModal from './MakeCardModal';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from '../services/storageService';
import ReactMarkdown from 'react-markdown';

// Import types safely
import type { Options } from 'easymde';

// Create a type for the EasyMDE instance
interface EasyMDEInstance {
  codemirror: {
    getDoc: () => any;
    getSelection: () => string;
    replaceSelection: (text: string) => void;
    scrollIntoView: (position: any, margin?: number) => void;
    markText: (from: any, to: any, options: any) => any;
    posFromIndex: (index: number) => any;
    getValue: () => string;
  };
  toTextArea: () => void;
}

// Define toolbar options with proper typing
const editorToolbarOptions = [
  "bold", "italic", "heading", "|",
  "quote", "unordered-list", "ordered-list", "|",
  "link", "image", "|",
  "preview", "side-by-side", "fullscreen", "|",
  "guide"
] as const;

export default function EnhancedNoteEditor() {
  const { activeNote, updateNoteContent, deleteNote, setActiveNote } = useNoteStore();
  const [editorContent, setEditorContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTextForCard, setSelectedTextForCard] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  const simpleMdeInstanceRef = useRef<EasyMDEInstance | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { noteId: noteIdFromParams } = useParams<{ noteId: string }>();

  const getMdeInstance = useCallback((instance: EasyMDEInstance) => {
    simpleMdeInstanceRef.current = instance;
  }, []);

  useEffect(() => {
    if (activeNote) {
      // Only update editor if content differs to avoid cursor jumps
      if (activeNote.content !== editorContent) {
        setEditorContent(activeNote.content);
      }
    } else {
      setEditorContent(''); // Clear editor if no active note
    }
  }, [activeNote]);

  useEffect(() => {
    if (activeNote && simpleMdeInstanceRef.current && location.state?.highlightCardId) {
      const cardIdToHighlight = location.state.highlightCardId;
      
      db.getCard(cardIdToHighlight).then(cardToHighlight => {
        if (cardToHighlight && cardToHighlight.noteId === activeNote.id) {
          const cm = simpleMdeInstanceRef.current!.codemirror;
          const doc = cm.getDoc();
          
          let highlightSuccess = false;
          if (cardToHighlight.charRangeStart !== undefined && cardToHighlight.charRangeEnd !== undefined &&
              cardToHighlight.charRangeEnd <= doc.getValue().length) {
            try {
              const from = doc.posFromIndex(cardToHighlight.charRangeStart);
              const to = doc.posFromIndex(cardToHighlight.charRangeEnd);
              
              cm.scrollIntoView({ from, to }, 150); 
              const marker = cm.markText(from, to, { className: 'bg-yellow-200 rounded p-0.5' });
              highlightSuccess = true;
              setTimeout(() => marker.clear(), 5000);
            } catch (e) {
              console.warn("Error calculating position from index for highlighting:", e);
            }
          }
          
          if (!highlightSuccess && cardToHighlight.markerText) {
            const currentContent = doc.getValue();
            const markerIdx = currentContent.indexOf(cardToHighlight.markerText);
            if (markerIdx !== -1) {
              try {
                const from = doc.posFromIndex(markerIdx);
                const to = doc.posFromIndex(markerIdx + cardToHighlight.markerText.length);
                cm.scrollIntoView({ from, to }, 150);
                const marker = cm.markText(from, to, { className: 'bg-yellow-200 rounded p-0.5' });
                setTimeout(() => marker.clear(), 5000);
              } catch (e) {
                console.warn("Error calculating position from index (fallback):", e);
              }
            } else {
                console.warn("Card marker text not found for highlighting.");
            }
          }
          
          navigate(location.pathname, { replace: true, state: {} });
        }
      });
    }
  }, [activeNote, location.state, navigate, location.pathname]);

  const debouncedUpdate = useCallback(
    debounce((noteId: string, newContent: string) => {
      updateNoteContent(noteId, newContent);
    }, 1200),
    [updateNoteContent]
  );

  const onEditorChange = useCallback((value: string) => {
    setEditorContent(value);
    if (activeNote) {
      debouncedUpdate(activeNote.id, value);
    }
  }, [activeNote, debouncedUpdate]);

  const handleManualSave = () => {
    if (activeNote) {
      debouncedUpdate.cancel();
      updateNoteContent(activeNote.id, editorContent);
    }
  };
  
  const handleDelete = () => {
    if (activeNote && window.confirm(`Are you sure you want to delete "${activeNote.title}"? This will also delete all its flashcards.`)) {
      const idToDelete = activeNote.id;
      const notes = useNoteStore.getState().notes;
      const currentIndex = notes.findIndex(n => n.id === idToDelete);
      let nextNoteId: string | null = null;
      if (notes.length > 1) {
        nextNoteId = currentIndex > 0 ? notes[currentIndex - 1].id : notes[currentIndex + 1]?.id;
      }

      if (nextNoteId) {
        navigate(`/notes/${nextNoteId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
        setActiveNote(null);
      }
      deleteNote(idToDelete);
    }
  };

  const handleMakeCard = () => {
    if (simpleMdeInstanceRef.current && viewMode === 'edit') {
      const cm = simpleMdeInstanceRef.current.codemirror;
      setSelectedTextForCard(cm.getSelection());
      setIsModalOpen(true);
    }
  };

  const handleCreateCardInEditor = (front: string, back: string) => {
    if (!activeNote || !simpleMdeInstanceRef.current || viewMode !== 'edit') return;

    const cardId = uuidv4();
    const marker = `[[card:${cardId}|q:${front}|a:${back}]]`;
    
    const cm = simpleMdeInstanceRef.current.codemirror;
    cm.replaceSelection(marker);
    
    setIsModalOpen(false);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'edit' ? 'preview' : 'edit');
  };

  // Process content for preview - replace card markers with friendly UI
  const processedContent = useMemo(() => {
    return editorContent.replace(
      /\[\[card:([0-9a-fA-F-]{36})\|q:(.*?)\|a:(.*?)\]\]/g,
      '**📝 Flashcard:** $2'
    );
  }, [editorContent]);

  const editorOptions = useMemo((): Options => {
    return {
      autofocus: false,
      spellChecker: false,
      placeholder: "Start writing your note here...",
      toolbar: [
        ...editorToolbarOptions,
        "|",
        {
          name: "make-card",
          action: () => handleMakeCard(),
          className: "fa fa-clone", 
          title: "Make Flashcard (Ctrl+Alt+C)",
        }
      ],
      minHeight: "300px",
      maxHeight: "calc(100vh - 180px)",
      shortcuts: {
        "toggleMakeCard": "Ctrl-Alt-C",
      },
    };
  }, []);

  if (!activeNote && noteIdFromParams) {
    return <div className="flex-1 p-8 flex items-center justify-center text-gray-500">Loading note or note not found...</div>;
  }
  if (!activeNote) {
    return <div className="flex-1 p-8 flex items-center justify-center text-gray-500">Select a note to edit, or create a new one.</div>;
  }

  return (
    <div className="flex-1 p-3 md:p-4 flex flex-col h-full bg-white shadow-sm overflow-hidden">
      <div className="mb-2 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg md:text-xl font-semibold truncate" title={activeNote.title}>{activeNote.title}</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleViewMode}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-sm transition-colors"
          >
            {viewMode === 'edit' ? 'Preview' : 'Edit'}
          </button>
          <button
            onClick={handleManualSave}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-sm transition-colors"
          >
            Save Note
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-sm transition-colors"
          >
            Delete Note
          </button>
        </div>
      </div>
      <div ref={editorWrapperRef} className="flex-grow relative min-h-0">
        {viewMode === 'edit' ? (
          <SimpleMDEEditor
            className="h-full w-full"
            value={editorContent}
            onChange={onEditorChange}
            options={editorOptions}
            getMdeInstance={getMdeInstance}
          />
        ) : (
          <div className="h-full w-full p-4 overflow-auto prose max-w-none">
            <ReactMarkdown>{processedContent}</ReactMarkdown>
          </div>
        )}
      </div>
      <MakeCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateCard={handleCreateCardInEditor}
        initialFront={selectedTextForCard}
      />
    </div>
  );
}