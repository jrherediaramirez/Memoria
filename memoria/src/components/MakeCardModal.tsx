import React, { useState, useEffect, useRef } from 'react';

interface MakeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (front: string, back: string) => void;
  initialFront?: string;
}

export default function MakeCardModal({ isOpen, onClose, onCreateCard, initialFront = '' }: MakeCardModalProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFront(initialFront.trim()); // Trim initial selection
      setBack(''); 
      // Autofocus the first field, or second if first is pre-filled
      setTimeout(() => { // Timeout to ensure modal is rendered
        if (initialFront.trim()) {
          // If front is pre-filled, focus back. For now, always focus front.
          // Consider focusing back if front has content: frontTextareaRef.current?.value ? backTextareaRef.current?.focus() : frontTextareaRef.current?.focus();
          frontTextareaRef.current?.focus();
          frontTextareaRef.current?.select(); // Select pre-filled text
        } else {
          frontTextareaRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialFront]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      onCreateCard(front.trim(), back.trim());
    } else {
      alert("Both front and back of the card must have content.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"> {/* Increased max-width */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Create Flashcard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="cardFront" className="block text-sm font-medium text-gray-700 mb-1">
              Front (Question)
            </label>
            <textarea
              id="cardFront"
              ref={frontTextareaRef}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={4} // Increased rows
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="cardBack" className="block text-sm font-medium text-gray-700 mb-1">
              Back (Answer)
            </label>
            <textarea
              id="cardBack"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={4} // Increased rows
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            >
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}