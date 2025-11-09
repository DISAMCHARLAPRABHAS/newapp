import React, { useState, useRef } from 'react';
import { ChatMessage, MessageRole, Conversation, Theme } from '../types';
import { searchWithGemini } from '../services/geminiService';
import { getConversations, saveConversations } from '../services/storageService';
import InputBar from './InputBar';
import Message from './Message';
import HistorySidebar from './HistorySidebar';
import VirtualTryOnModal from './VirtualTryOnModal';
import { BotIcon, SunIcon, MoonIcon, MenuIcon, playSound, sendSound, receiveSound, errorSound, clickSound, deleteSound } from '../constants';

interface ChatInterfaceProps {
    theme: Theme;
    toggleTheme: () => void;
}

const createNewConversation = (): Conversation => {
    const newId = `convo-${Date.now()}`;
    return {
        id: newId,
        title: 'New Chat',
        messages: [{
            id: 'init',
            role: MessageRole.MODEL,
            content: "Welcome to Synapse! How can I help you find tickets or products today?",
        }]
    };
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ theme, toggleTheme }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasFetchedConversations = useRef(false);

    // WORKAROUND: Use ref and logic in render body to fetch data once, avoiding useEffect.
    if (!hasFetchedConversations.current) {
        const loadedConversations = getConversations();
        if (loadedConversations.length > 0) {
            setConversations(loadedConversations);
            setActiveConversationId(loadedConversations[0].id);
        } else {
            const newConvo = createNewConversation();
            setConversations([newConvo]);
            setActiveConversationId(newConvo.id);
        }
        setIsHistoryLoading(false);
        hasFetchedConversations.current = true;
    }

    const scrollToBottom = () => {
        // The timeout ensures scrolling happens after the DOM update.
        setTimeout(() => {
             messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const messages = activeConversation ? activeConversation.messages : [];

    const handleNewChat = () => {
        playSound(clickSound);
        const newConversation = createNewConversation();
        const updatedConversations = [newConversation, ...conversations];
        setConversations(updatedConversations);
        setActiveConversationId(newConversation.id);
        setIsSidebarOpen(false); // Close sidebar on new chat
        saveConversations(updatedConversations);
        scrollToBottom();
    };

    const handleSelectChat = (id: string) => {
        playSound(clickSound);
        setActiveConversationId(id);
        setIsSidebarOpen(false); // Close sidebar on chat selection
        scrollToBottom();
    };

    const handleDeleteChat = (id: string) => {
        playSound(deleteSound);
        
        let remaining = conversations.filter(c => c.id !== id);
        
        if (remaining.length === 0) {
            const newConversation = createNewConversation();
            remaining = [newConversation];
            setActiveConversationId(newConversation.id)
        } else {
            if (activeConversationId === id) {
                setActiveConversationId(remaining[0].id);
            }
        }
        setConversations(remaining);
        saveConversations(remaining);
    };


    const handleSearch = async (prompt: string, file?: { data: string; mimeType: string }) => {
        if (!activeConversationId) return;
        playSound(sendSound);
        setIsLoading(true);

        const displayContent = file ? `${prompt || 'Image attached'}` : prompt;
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: MessageRole.USER,
            content: displayContent,
        };
        
        const currentConvo = conversations.find(c => c.id === activeConversationId);
        const isFirstMessage = currentConvo ? currentConvo.messages.length === 1 && currentConvo.messages[0].id === 'init' : false;
        
        // Optimistically update UI
        let updatedConversations = conversations.map(convo => {
            if (convo.id === activeConversationId) {
                return {
                    ...convo,
                    title: isFirstMessage ? prompt : convo.title,
                    messages: [...convo.messages, userMessage]
                };
            }
            return convo;
        });
        setConversations(updatedConversations);
        scrollToBottom();

        try {
            const result = await searchWithGemini(prompt, file);
            const modelMessage: ChatMessage = {
                id: `model-${Date.now()}`,
                role: MessageRole.MODEL,
                content: result.text,
                sources: result.sources,
                products: result.products,
                suggestions: result.suggestions,
            };
            playSound(receiveSound);
            
            updatedConversations = updatedConversations.map(convo => 
                convo.id === activeConversationId 
                    ? { ...convo, messages: [...convo.messages, modelMessage] }
                    : convo
            );
            setConversations(updatedConversations);

        } catch (error) {
            playSound(errorSound);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: MessageRole.ERROR,
                content: error instanceof Error ? error.message : "An unknown error occurred.",
            };
            
            updatedConversations = updatedConversations.map(convo =>
                convo.id === activeConversationId
                    ? { ...convo, messages: [...convo.messages, errorMessage] }
                    : convo
            );
            setConversations(updatedConversations);
        } finally {
            setIsLoading(false);
            saveConversations(updatedConversations);
            scrollToBottom();
        }
    };
    
    const handleThemeToggle = () => {
        playSound(clickSound);
        toggleTheme();
    }

    const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
        if (!activeConversationId) return;

        const updatedConversations = conversations.map(convo => {
            if (convo.id === activeConversationId) {
                const updatedMessages = convo.messages.map(msg => {
                    if (msg.id === messageId) {
                        // If the same feedback is clicked again, toggle it off. Otherwise, set the new feedback.
                        const newFeedback = msg.feedback === feedback ? undefined : feedback;
                        return { ...msg, feedback: newFeedback };
                    }
                    return msg;
                });
                return { ...convo, messages: updatedMessages };
            }
            return convo;
        });

        setConversations(updatedConversations);
        saveConversations(updatedConversations); // Persist feedback
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 font-sans">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => { playSound(clickSound); setIsSidebarOpen(false); }}
                    aria-hidden="true"
                />
            )}
            <HistorySidebar 
                conversations={conversations}
                activeConversationId={activeConversationId}
                isOpen={isSidebarOpen}
                isLoading={isHistoryLoading}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
            />
            <div className="flex flex-col flex-1 h-screen">
                 <header className="p-4 bg-gray-50/70 dark:bg-black/70 backdrop-blur-md sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { playSound(clickSound); setIsSidebarOpen(true); }}
                                className="p-2 -ml-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
                                aria-label="Open chat history"
                            >
                                <MenuIcon />
                            </button>
                            <BotIcon />
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Synapse</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleThemeToggle}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                            </button>
                        </div>
                    </div>
                </header>
            
                <main className="flex-grow overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto">
                        {messages.map(msg => (
                            <Message key={msg.id} message={msg} onSuggestionClick={handleSearch} onFeedback={handleFeedback} />
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 my-4 animate-fade-in-up">
                                <BotIcon />
                                <div className="max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none flex items-center gap-2 shadow-md">
                                    <div className="animate-pulse flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Searching...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                <footer className="sticky bottom-0 bg-gradient-to-t from-gray-50 dark:from-black to-transparent">
                    <InputBar onSearch={handleSearch} isLoading={isLoading} onMakeViewClick={() => setIsTryOnModalOpen(true)} />
                </footer>
            </div>
            {isTryOnModalOpen && <VirtualTryOnModal onClose={() => setIsTryOnModalOpen(false)} />}
        </div>
    );
};

export default ChatInterface;