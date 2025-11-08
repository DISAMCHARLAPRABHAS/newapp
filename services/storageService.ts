import { Conversation } from '../types';

const CONVERSATIONS_KEY = 'synapse_conversations';

/**
 * Retrieves all conversations from local storage.
 * @returns An array of Conversation objects.
 */
export const getConversations = (): Conversation[] => {
    try {
        const storedConversations = localStorage.getItem(CONVERSATIONS_KEY);
        if (storedConversations) {
            return JSON.parse(storedConversations);
        }
    } catch (error) {
        console.error("Failed to parse conversations from local storage:", error);
        // If parsing fails, clear the corrupted data
        localStorage.removeItem(CONVERSATIONS_KEY);
    }
    return [];
};

/**
 * Saves the entire list of conversations to local storage.
 * @param conversations The array of Conversation objects to save.
 */
export const saveConversations = (conversations: Conversation[]): void => {
    try {
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
        console.error("Failed to save conversations to local storage:", error);
    }
};

const FEEDBACK_KEY = 'synapse_feedbacks';

import type { Feedback } from '../types';

/**
 * Retrieve saved feedback entries.
 */
export const getFeedbacks = (): Feedback[] => {
    try {
        const raw = localStorage.getItem(FEEDBACK_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to parse feedbacks from localStorage', err);
        localStorage.removeItem(FEEDBACK_KEY);
    }
    return [];
};

/**
 * Save a feedback entry (appends to existing feedbacks).
 */
export const saveFeedback = (fb: Feedback): void => {
    try {
        const list = getFeedbacks();
        list.unshift(fb);
        localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
    } catch (err) {
        console.error('Failed to save feedback to localStorage', err);
    }
};