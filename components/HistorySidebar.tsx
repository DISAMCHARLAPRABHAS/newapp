import React from 'react';
import { Conversation } from '../types';
import { NewChatIcon, DeleteIcon, XIcon, playSound, clickSound } from '../constants';

interface HistorySidebarProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ conversations, activeConversationId, isOpen, isLoading, onClose, onNewChat, onSelectChat, onDeleteChat }) => {
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent onSelectChat from firing
        onDeleteChat(id);
    };

    const handleClose = () => {
        playSound(clickSound);
        onClose();
    }

    const renderConversations = () => {
        if (isLoading) {
            return (
                <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return conversations.map(convo => (
            // Don't render "New Chat" entries that haven't been started
            (convo.messages.length > 1 || (convo.messages.length === 1 && convo.messages[0].id !== 'init')) &&
            <a
                key={convo.id}
                onClick={() => onSelectChat(convo.id)}
                className={`group flex items-center justify-between p-3 rounded-xl text-sm cursor-pointer transition-colors duration-200 ${activeConversationId === convo.id ? 'bg-gray-200 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}
            >
                <span className="truncate" title={convo.title}>{convo.title}</span>
                <button
                    onClick={(e) => handleDelete(e, convo.id)}
                    className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                    aria-label="Delete chat"
                >
                    <DeleteIcon />
                </button>
            </a>
        ));
    }

    return (
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg text-gray-800 dark:text-gray-200 flex flex-col h-screen shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-2 flex items-center justify-between">
                <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center gap-3 p-3 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                    <NewChatIcon />
                    New Chat
                </button>
                 <button
                    onClick={handleClose}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close menu"
                >
                    <XIcon />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {renderConversations()}
            </nav>
        </aside>
    );
};

export default HistorySidebar;