// src/components/editor/FlashcardBlock.tsx
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { createReactBlockSpec } from "@blocknote/react";
import { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { FlashcardBlockProps, FlashcardData } from '../types';
import { db, auth } from '../firebase/firebaseConfig'; // Assuming db is your Firestore instance
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';

// --- Reducer for local state ---
type FlashcardState = {
  isEditing: boolean;
  isRevealed: boolean;
  currentQuestion: string;
  currentAnswer: string;
  isLoading: boolean;
  error: string | null;
  srsStatus: FlashcardData['status'];
  srsDueDate: Timestamp | null;
};

type FlashcardAction =
  | { type: 'TOGGLE_EDIT' }
  | { type: 'TOGGLE_REVEAL' }
  | { type: 'SET_QUESTION'; payload: string }
  | { type: 'SET_ANSWER'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<FlashcardData> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SAVE_SUCCESS'; payload: { question: string; answer: string; srsStatus: FlashcardData['status']; srsDueDate: Timestamp } }
  | { type: 'UPDATE_SRS'; payload: { status: FlashcardData['status']; dueDate: Timestamp; interval: number; easeFactor: number; repetitions: number } };


const initialStateFactory = (props: FlashcardBlockProps): FlashcardState => ({
  isEditing: false,
  isRevealed: false,
  currentQuestion: props.question || "",
  currentAnswer: props.answer || "",
  isLoading: !props.flashcardId, // Load if flashcardId exists but no Q/A
  error: null,
  srsStatus: 'new',
  srsDueDate: null,
});

function flashcardReducer(state: FlashcardState, action: FlashcardAction): FlashcardState {
  switch (action.type) {
    case 'TOGGLE_EDIT':
      return { ...state, isEditing: !state.isEditing, isRevealed: false, error: null };
    case 'TOGGLE_REVEAL':
      return { ...state, isRevealed: !state.isEditing && !state.isRevealed }; // Can only reveal if not editing
    case 'SET_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'SET_ANSWER':
      return { ...state, currentAnswer: action.payload };
    case 'LOAD_DATA':
      return {
        ...state,
        currentQuestion: action.payload.question ?? state.currentQuestion,
        currentAnswer: action.payload.answer ?? state.currentAnswer,
        srsStatus: action.payload.status ?? state.srsStatus,
        srsDueDate: action.payload.dueDate ?? state.srsDueDate,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SAVE_SUCCESS':
      return {
        ...state,
        isEditing: false,
        isLoading: false,
        error: null,
        currentQuestion: action.payload.question,
        currentAnswer: action.payload.answer,
        srsStatus: action.payload.srsStatus,
        srsDueDate: action.payload.srsDueDate,
      };
    case 'UPDATE_SRS':
        return {
            ...state,
            srsStatus: action.payload.status,
            srsDueDate: action.payload.dueDate,
            // Potentially update other SRS fields in state if needed for display
        };
    default:
      return state;
  }
}

// --- React Component for the Flashcard Block ---
const FlashcardComponent = ({
  block,
  editor,
}: {
  block: Block<FlashcardBlockProps>;
  editor: BlockNoteEditor;
}) => {
  const [state, dispatch] = useReducer(flashcardReducer, block.props, initialStateFactory);
  const [internalFlashcardId, setInternalFlashcardId] = useState(block.props.flashcardId);

  const fetchFlashcardData = useCallback(async (id: string) => {
    if (!id) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const flashcardRef = doc(db, "flashcards", id);
      const docSnap = await getDoc(flashcardRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as FlashcardData;
        dispatch({ type: 'LOAD_DATA', payload: data });
        // Sync with block props if they are out of date (e.g., initial load)
        if (block.props.question !== data.question || block.props.answer !== data.answer) {
          editor.updateBlock(block, {
            props: { ...block.props, question: data.question, answer: data.answer },
          });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: "Flashcard not found in database." });
      }
    } catch (err) {
      console.error("Error fetching flashcard:", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to load flashcard data." });
    }
  }, [editor, block]);

  useEffect(() => {
    if (internalFlashcardId && (block.props.question === "" || block.props.answer === "")) {
      fetchFlashcardData(internalFlashcardId);
    } else if (internalFlashcardId) {
        // If ID exists and props have data, ensure local state matches props initially
        dispatch({type: 'LOAD_DATA', payload: {question: block.props.question, answer: block.props.answer}})
    }
  }, [internalFlashcardId, block.props.question, block.props.answer, fetchFlashcardData]);


  const handleSave = async () => {
    if (!auth.currentUser) {
      dispatch({ type: 'SET_ERROR', payload: "You must be logged in to save." });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });

    const originalProps = { ...block.props }; // For potential rollback

    // 1. Optimistically update BlockNote props
    editor.updateBlock(block, {
      props: {
        ...block.props,
        question: state.currentQuestion,
        answer: state.currentAnswer,
        flashcardId: internalFlashcardId, // Ensure ID is in props
      },
    });

    try {
      let flashcardIdToSave = internalFlashcardId;
      const now = serverTimestamp();
      const flashcardPayload: Partial<FlashcardData> = {
        userId: auth.currentUser.uid,
        question: state.currentQuestion,
        answer: state.currentAnswer,
        updatedAt: now,
      };

      if (flashcardIdToSave) { // Update existing
        const flashcardRef = doc(db, "flashcards", flashcardIdToSave);
        await updateDoc(flashcardRef, flashcardPayload);
      } else { // Create new
        const newFlashcardData: Omit<FlashcardData, 'id' | 'updatedAt' | 'createdAt'> & { createdAt: any, updatedAt: any } = { // Explicitly type for addDoc
            userId: auth.currentUser.uid,
            question: state.currentQuestion,
            answer: state.currentAnswer,
            dueDate: Timestamp.now(), // Default due date
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            status: 'new',
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await addDoc(collection(db, "flashcards"), newFlashcardData);
        flashcardIdToSave = docRef.id;
        setInternalFlashcardId(docRef.id);
        // Update block props with the new ID
        editor.updateBlock(block, {
          props: { ...block.props, flashcardId: docRef.id, question: state.currentQuestion, answer: state.currentAnswer },
        });
      }
      // Fetch the potentially updated/created SRS data to reflect in UI
      const finalDocSnap = await getDoc(doc(db, "flashcards", flashcardIdToSave));
      if (finalDocSnap.exists()) {
          const finalData = finalDocSnap.data() as FlashcardData;
          dispatch({ type: 'SAVE_SUCCESS', payload: { question: finalData.question, answer: finalData.answer, srsStatus: finalData.status, srsDueDate: finalData.dueDate } });
      }

    } catch (err) {
      console.error("Error saving flashcard:", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to save flashcard. Changes might not be persisted." });
      // 2. Rollback BlockNote props on Firestore failure
      editor.updateBlock(block, { props: originalProps });
      // Implement retry logic if desired
    }
  };

  const handleSrsInteraction = async (grade: "good" | "hard" | "again") => {
    if (!internalFlashcardId || !auth.currentUser) return;
    dispatch({ type: 'SET_LOADING', payload: true });

    // Simplified SRS Logic (Client-Side Calculation for MVP)
    let { interval, easeFactor, repetitions, status, dueDate } = state.srsStatus && state.srsDueDate ?
        (await getDoc(doc(db, "flashcards", internalFlashcardId))).data() as FlashcardData : // fetch latest if not in state
        { interval: 1, easeFactor: 2.5, repetitions: 0, status: 'new' as FlashcardData['status'], dueDate: Timestamp.now() };


    repetitions = repetitions || 0;
    easeFactor = easeFactor || 2.5;
    interval = interval || 1;
    status = status || 'new';

    if (grade === "again") {
        repetitions = 0;
        interval = 1; // Reset interval
        status = 'learning';
    } else if (grade === "hard") {
        repetitions += 1;
        interval = Math.max(1, Math.floor(interval * 0.8)); // Decrease interval
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        status = repetitions > 1 ? 'review' : 'learning';
    } else { // "good"
        repetitions += 1;
        if (status === 'learning' || status === 'new') {
            interval = repetitions === 1 ? 1 : repetitions === 2 ? 3 : interval * easeFactor;
        } else { // review
            interval = interval * easeFactor;
        }
        easeFactor = Math.min(3.5, easeFactor + 0.1); // Cap easeFactor
        status = interval > 21 ? 'graduated' : 'review'; // Example: graduate after 21 days interval
    }

    const newDueDate = Timestamp.fromMillis(Timestamp.now().toMillis() + interval * 24 * 60 * 60 * 1000);

    try {
        const flashcardRef = doc(db, "flashcards", internalFlashcardId);
        await updateDoc(flashcardRef, {
            dueDate: newDueDate,
            interval,
            easeFactor,
            repetitions,
            status,
            updatedAt: serverTimestamp(),
        });
        dispatch({ type: 'UPDATE_SRS', payload: { status, dueDate: newDueDate, interval, easeFactor, repetitions } });
        dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
        console.error("Error updating SRS:", err);
        dispatch({ type: 'SET_ERROR', payload: "Failed to update review status." });
    }
  };


  if (state.isLoading && !state.error) {
    return <div className="p-3 border border-gray-600 rounded bg-gray-700 text-sm">Loading flashcard...</div>;
  }

  return (
    <div className="p-4 my-2 border border-blue-500 rounded-lg shadow bg-gray-800 text-text">
      {state.error && <div className="p-2 mb-2 text-sm bg-error-bg text-error-text rounded">{state.error}</div>}

      {state.isEditing ? (
        <div>
          <textarea
            className="w-full p-2 mb-2 bg-gray-700 border border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="Question"
            value={state.currentQuestion}
            onChange={(e) => dispatch({ type: 'SET_QUESTION', payload: e.target.value })}
            rows={3}
          />
          <textarea
            className="w-full p-2 mb-2 bg-gray-700 border border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="Answer"
            value={state.currentAnswer}
            onChange={(e) => dispatch({ type: 'SET_ANSWER', payload: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_EDIT' })}
              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={state.isLoading}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
            >
              {state.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 prose prose-invert max-w-none"> {/* prose for basic markdown-like styling */}
            <p className="font-semibold">Q: {state.currentQuestion || "Empty Question"}</p>
          </div>
          {state.isRevealed && (
            <div className="p-2 my-2 border-t border-gray-700 prose prose-invert max-w-none">
              <p>A: {state.currentAnswer || "Empty Answer"}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div>
                Status: <span className="font-semibold">{state.srsStatus}</span>
                {state.srsDueDate && (
                    <span className="ml-2">Due: {state.srsDueDate.toDate().toLocaleDateString()}</span>
                )}
            </div>
            <div className="flex space-x-2">
                {!state.isRevealed && (
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_REVEAL' })}
                        className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 rounded"
                    >
                        Reveal Answer
                    </button>
                )}
                {state.isRevealed && internalFlashcardId && (
                    <>
                        <button onClick={() => handleSrsInteraction("again")} className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded">Again</button>
                        <button onClick={() => handleSrsInteraction("hard")} className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded">Hard</button>
                        <button onClick={() => handleSrsInteraction("good")} className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded">Good</button>
                    </>
                )}
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_EDIT' })}
                    className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-500 rounded"
                >
                    Edit
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const FlashcardBlockSpec = createReactBlockSpec({
  type: "flashcard",
  props: {
    question: { default: "" },
    answer: { default: "" },
    flashcardId: { default: "" }, // Will store Firestore document ID
  },
  content: "none", // Crucial: content is managed by custom React inputs
  render: FlashcardComponent,
});