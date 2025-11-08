import React, { useState } from 'react';
import { saveFeedback } from '../services/storageService';
import type { Feedback } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const submit = () => {
    setIsSubmitting(true);
    try {
      const fb: Feedback = {
        id: `fb-${Date.now()}`,
        rating,
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString(),
        path: window.location.pathname,
      };
      saveFeedback(fb);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsSubmitting(false);
        setComment('');
        setRating(5);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to save feedback', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 w-11/12 max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Send feedback</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Tell us what you like or what we can improve.</p>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`px-3 py-1 rounded-md ${rating===n ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
              >
                {n}★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional notes (what you liked, what broke, suggestions...)"
            className="mt-3 w-full p-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
            rows={4}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800">Cancel</button>
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="px-4 py-1 rounded-md bg-teal-500 text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>

        {success && <div className="mt-3 text-sm text-green-600">Thanks for the feedback!</div>}
      </div>
    </div>
  );
};

export default FeedbackModal;
