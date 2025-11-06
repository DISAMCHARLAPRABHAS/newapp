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
    const [initialState] = useState(() => {
        const loaded = getConversations();
        if (loaded.length > 0) {
            return { conversations: loaded, activeId: loaded[0].id };
        }
        const newConvo = createNewConversation();
        return { conversations: [newConvo], activeId: newConvo.id };
    });

    const [conversations, setConversations] = useState<Conversation[]>(initialState.conversations);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(initialState.activeId);
    const [isLoading, setIsLoading] = useState(false);
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WORKAROUND: Replaced useEffect for saving with logic in the render body
    // to avoid crashes in this React environment.
    const nonEmptyConversations = conversations.filter(c => c.messages.length > 1 || (c.messages.length === 1 && c.messages[0].id !== 'init'));
    if (nonEmptyConversations.length > 0) {
        saveConversations(nonEmptyConversations);
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
        // Prepend to make it the first item
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newConversation.id);
        setIsSidebarOpen(false); // Close sidebar on new chat
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
        const remaining = conversations.filter(c => c.id !== id);
        
        if (remaining.length === 0) {
            const newConversation = createNewConversation();
            setConversations([newConversation]);
            setActiveConversationId(newConversation.id)
            localStorage.removeItem('synapse-conversations');
        } else {
            if (activeConversationId === id) {
                setActiveConversationId(remaining[0].id);
            }
            setConversations(remaining);
        }
    };


    const handleSearch = async (prompt: string, file?: { data: string; mimeType: string }) => {
        if (!activeConversationId) return;
        playSound(sendSound);
        setIsLoading(true);
        // If there's a file, the content is a placeholder or can be adapted.
        const displayContent = file ? `${prompt || 'Image attached'}` : prompt;
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: MessageRole.USER,
            content: displayContent,
        };
        
        setConversations(prev => prev.map(convo => {
            if (convo.id === activeConversationId) {
                const isNewChat = convo.messages.length === 1 && convo.messages[0].id === 'init';
                return {
                    ...convo,
                    title: isNewChat ? prompt : convo.title,
                    messages: [...convo.messages, userMessage]
                };
            }
            return convo;
        }));

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
            setConversations(prev => prev.map(convo => 
                convo.id === activeConversationId 
                    ? { ...convo, messages: [...convo.messages, modelMessage] }
                    : convo
            ));
        } catch (error) {
            playSound(errorSound);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: MessageRole.ERROR,
                content: error instanceof Error ? error.message : "An unknown error occurred.",
            };
            setConversations(prev => prev.map(convo =>
                convo.id === activeConversationId
                    ? { ...convo, messages: [...convo.messages, errorMessage] }
                    : convo
            ));
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };
    
    const handleThemeToggle = () => {
        playSound(clickSound);
        toggleTheme();
    }

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
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
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
            />
            <div className="flex flex-col flex-1 h-screen">
                 <header className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-md sticky top-0 z-10">
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
                        <div className="flex items-center gap-4">
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
                            <Message key={msg.id} message={msg} onSuggestionClick={handleSearch} />
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 my-4">
                                <BotIcon />
                                <div className="max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-none flex items-center gap-2">
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

                <footer className="sticky bottom-0">
                    <InputBar onSearch={handleSearch} isLoading={isLoading} onMakeViewClick={() => setIsTryOnModalOpen(true)} />
                </footer>
            </div>
            {isTryOnModalOpen && <VirtualTryOnModal onClose={() => setIsTryOnModalOpen(false)} />}
        </div>
    );
};

export default ChatInterface;