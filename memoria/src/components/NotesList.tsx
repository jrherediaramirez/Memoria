import React, { useEffect } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { useNavigate, useParams } from 'react-router-dom';

export default function NotesList() {
  const { notes, fetchNotes, createNote, setActiveNote, activeNote, isLoading } = useNoteStore();
  const navigate = useNavigate();
  const { noteId: noteIdFromParams } = useParams<{ noteId: string }>();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    // This effect handles setting the active note based on URL or first available
    if (isLoading || notes.length === 0) return; // Wait for notes to load

    const currentActiveId = activeNote?.id;

    if (noteIdFromParams) {
      if (noteIdFromParams !== currentActiveId) {
        const noteToActivate = notes.find(n => n.id === noteIdFromParams);
        if (noteToActivate) {
          setActiveNote(noteToActivate);
        } else {
          // Note ID from URL not found, navigate to first note or root
          if (notes.length > 0) {
            navigate(`/notes/${notes[0].id}`, { replace: true });
            setActiveNote(notes[0]);
          } else {
            navigate('/', { replace: true });
            setActiveNote(null);
          }
        }
      }
    } else if (!currentActiveId && notes.length > 0) {
      // No noteId in URL and no active note, select first note
      navigate(`/notes/${notes[0].id}`, { replace: true });
      setActiveNote(notes[0]);
    } else if (!currentActiveId && notes.length === 0) {
      // No note in URL, no active note, and no notes available
      setActiveNote(null); // Ensure active note is cleared
      // Optionally navigate to '/' if not already there, though index route should handle this
    }
  }, [noteIdFromParams, notes, activeNote, setActiveNote, navigate, isLoading]);


  const handleSelectNote = (note: typeof notes[0]) => {
    // setActiveNote(note); // This will be handled by the effect listening to URL change
    if (note.id !== activeNote?.id) {
      navigate(`/notes/${note.id}`);
    }
  };

  const handleCreateNote = async () => {
    const newNoteId = await createNote();
    if (newNoteId) {
      navigate(`/notes/${newNoteId}`);
    }
  };

  return (
    <div className="w-72 border-r border-gray-300 p-2 flex flex-col h-full bg-gray-50 flex-shrink-0"> {/* Increased width */}
      <button
        onClick={handleCreateNote}
        className="mb-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm transition-colors"
      >
        New Note
      </button>
      <div className="overflow-y-auto flex-grow">
        {isLoading && notes.length === 0 && <p className="p-3 text-gray-500">Loading notes...</p>}
        {!isLoading && notes.length === 0 && <p className="p-3 text-gray-500">No notes yet. Create one!</p>}
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-3 mb-1.5 cursor-pointer rounded-md transition-colors ${
              activeNote?.id === note.id ? 'bg-blue-100 border-blue-300 border' : 'hover:bg-gray-200'
            }`}
            onClick={() => handleSelectNote(note)}
            title={note.title}
          >
            <h3 className="font-semibold truncate text-sm text-gray-800">{note.title}</h3>
            <p className="text-xs text-gray-500">
              {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}