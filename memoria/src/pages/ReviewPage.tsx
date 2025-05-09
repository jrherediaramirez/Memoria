import React, { useEffect } from 'react';
import { useReviewStore } from '../stores/reviewStore';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function ReviewPage() {
  const {
    currentReviewCard,
    isAnswerShown,
    isLoading,
    error,
    fetchDueCardsAndSetCurrent,
    showAnswer,
    submitReview,
    skipCard,
    // resetReviewState // Call this if you want to clear state on unmount
  } = useReviewStore();

  useEffect(() => {
    fetchDueCardsAndSetCurrent();
    // return () => {
    //   resetReviewState(); // Optional: reset state when leaving review page
    // };
  }, [fetchDueCardsAndSetCurrent]);

  if (isLoading && !currentReviewCard) {
    return <div className="text-center p-8">Loading review cards...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!currentReviewCard) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold mb-4">All Done!</h2>
        <p className="text-gray-600">You have no cards due for review right now.</p>
        <button 
          onClick={fetchDueCardsAndSetCurrent}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check for more cards
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Review Flashcards</h2>
      
      <div className="bg-white shadow-xl rounded-lg p-6 min-h-[20rem] flex flex-col justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Front (Question):</p>
          <div className="text-xl prose max-w-none">
            <ReactMarkdown>{currentReviewCard.front}</ReactMarkdown>
          </div>
        </div>

        {isAnswerShown ? (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Back (Answer):</p>
            <div className="text-xl prose max-w-none mb-6">
              <ReactMarkdown>{currentReviewCard.back}</ReactMarkdown>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => submitReview(0)} className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75">Again</button>
              <button onClick={() => submitReview(1)} className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75">Hard</button>
              <button onClick={() => submitReview(2)} className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">Good</button>
              <button onClick={() => submitReview(3)} className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">Easy</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={showAnswer}
              className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
            >
              Show Answer
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <Link
          to={`/notes/${currentReviewCard.noteId}`}
          state={{ highlightCardId: currentReviewCard.id }}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Show Note Context
        </Link>
        <button
          onClick={skipCard}
          disabled={isLoading}
          className="text-sm text-gray-600 hover:text-gray-800 hover:underline disabled:opacity-50"
        >
          Skip Card
        </button>
      </div>
      {isLoading && currentReviewCard && <p className="text-center mt-4 text-sm text-gray-500">Processing...</p>}
    </div>
  );
}