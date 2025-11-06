import { Conversation } from '../types';

const CONVERSATIONS_KEY = 'synapse-conversations';

export const getConversations = (): Conversation[] => {
    try {
        const stored = localStorage.getItem(CONVERSATIONS_KEY);
        if (stored) {
            // Basic validation to ensure it's an array of conversations
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to load conversations from localStorage", error);
    }
    return [];
};

export const saveConversations = (conversations: Conversation[]): void => {
    try {
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
        console.error("Failed to save conversations to localStorage", error);
    }
};
