import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNoteStore } from '../stores/noteStore';
import SimpleMDEEditor from 'react-simplemde-editor'; // Corrected import name
import "easymde/dist/easymde.min.css";
import { debounce } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import MakeCardModal from './MakeCardModal';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from '../services/storageService';
import EasyMDE from 'easymde'; // For type of instance

const editorToolbarOptions: EasyMDE.ToolbarIcon[] = [ // Type EasyMDE toolbar options
  "bold", "italic", "heading", "|",
  "quote", "unordered-list", "ordered-list", "|",
  "link", "image", "|", // Consider removing image if not fully supported/desired
  "preview", "side-by-side", "fullscreen", "|",
  "guide"
];

export default function NoteEditor() {
  const { activeNote, updateNoteContent, deleteNote, setActiveNote } = useNoteStore();
  const [editorContent, setEditorContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTextForCard, setSelectedTextForCard] = useState('');
  
  const simpleMdeInstanceRef = useRef<EasyMDE | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null); // For dynamic height

  const location = useLocation();
  const navigate = useNavigate();
  const { noteId: noteIdFromParams } = useParams<{ noteId: string }>();

  const getMdeInstance = useCallback((instance: EasyMDE) => {
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
          const cm = simpleMdeInstanceRef.current!.codemirror; // Assert not null
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
          
          if (!highlightSuccess && cardToHighlight.markerText) { // Fallback to markerText
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
          
          navigate(location.pathname, { replace: true, state: {} }); // Clear state
        }
      });
    }
  }, [activeNote, location.state, navigate, location.pathname]); // Removed simpleMdeInstanceRef from deps to avoid re-triggering on instance change if content is same

  const debouncedUpdate = useCallback(
    debounce((noteId: string, newContent: string) => {
      updateNoteContent(noteId, newContent);
    }, 1200), // Increased debounce time slightly
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
      // Navigate away or select next note BEFORE deleting
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
        setActiveNote(null); // Ensure activeNote is cleared if no other notes
      }
      deleteNote(idToDelete);
    }
  };

  const handleMakeCard = () => {
    if (simpleMdeInstanceRef.current) {
      const cm = simpleMdeInstanceRef.current.codemirror;
      setSelectedTextForCard(cm.getSelection());
      setIsModalOpen(true);
    }
  };

  const handleCreateCardInEditor = (front: string, back: string) => {
    if (!activeNote || !simpleMdeInstanceRef.current) return;

    const cardId = uuidv4();
    const marker = `[[card:${cardId}|q:${front}|a:${back}]]`;
    
    const cm = simpleMdeInstanceRef.current.codemirror;
    cm.replaceSelection(marker);
    
    // The content change will trigger onEditorChange, which will save and sync cards.
    setIsModalOpen(false);
    // Optionally trigger save immediately if debounce is too long for this action
    // handleManualSave(); 
  };

  const editorOptions = useMemo((): EasyMDE.Options => {
    return {
      autofocus: false, // Can be annoying, set to false
      spellChecker: false,
      placeholder: "Start writing your note here...",
      toolbar: [
        ...editorToolbarOptions,
        "|",
        {
          name: "make-card",
          action: () => handleMakeCard(), // Already memoized or stable
          className: "fa fa-clone", 
          title: "Make Flashcard (Ctrl+Alt+C)",
        }
      ],
      minHeight: "300px", // Default min height
      maxHeight: "calc(100vh - 180px)", // Adjust based on surrounding elements
      // To make it truly dynamic height based on parent:
      // You might need to set EasyMDEContainer and CodeMirror elements to height: 100% via CSS
      // and ensure the parent of SimpleMDEEditor has a defined height and is a flex container.
      // For now, maxHeight provides a good limit.
      shortcuts: {
        "toggleMakeCard": "Ctrl-Alt-C", // Custom shortcut example
      },
      // keyMap: { // For custom keymap if needed
      //   "Ctrl-Alt-C": () => handleMakeCard(),
      // }
    };
  }, []); // Removed handleMakeCard from deps as it's stable via useCallback

  if (!activeNote && noteIdFromParams) {
    // If there's a noteId in params but activeNote is null (e.g. after delete or invalid ID)
    return <div className="flex-1 p-8 flex items-center justify-center text-gray-500">Loading note or note not found...</div>;
  }
  if (!activeNote) {
    return <div className="flex-1 p-8 flex items-center justify-center text-gray-500">Select a note to edit, or create a new one.</div>;
  }

  return (
    <div className="flex-1 p-3 md:p-4 flex flex-col h-full bg-white shadow-sm overflow-hidden">
      <div className="mb-2 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg md:text-xl font-semibold truncate" title={activeNote.title}>{activeNote.title}</h2>
        <div>
          <button
            onClick={handleManualSave}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md mr-2 text-sm shadow-sm transition-colors"
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
      <div ref={editorWrapperRef} className="flex-grow relative min-h-0"> {/* Key for editor height */}
        <SimpleMDEEditor
          className="h-full w-full" // Make editor fill this div
          value={editorContent}
          onChange={onEditorChange}
          options={editorOptions}
          getMdeInstance={getMdeInstance}
        />
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