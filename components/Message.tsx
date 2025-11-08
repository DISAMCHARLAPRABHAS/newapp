import React, { useState } from 'react';
import { ChatMessage, MessageRole } from '../types';
import { BotIcon, UserIcon, ChevronDownIcon, ThumbUpIcon, ThumbDownIcon, playSound, clickSound } from '../constants';
import SourceCard from './SourceCard';
import ProductCard from './ProductCard';

const parseMarkdown = (text: string) => {
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br />');

    return { __html: html };
};

interface MessageProps {
    message: ChatMessage;
    onSuggestionClick: (suggestion: string) => void;
    onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
}

const Avatar: React.FC = () => {
    return <UserIcon />;
};

const Message: React.FC<MessageProps> = ({ message, onSuggestionClick, onFeedback }) => {
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);

    const isModel = message.role === MessageRole.MODEL;
    const isUser = message.role === MessageRole.USER;
    const isError = message.role === MessageRole.ERROR;

    const wrapperClasses = `flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''} animate-fade-in-up`;
    const contentWrapperClasses = `flex flex-col ${isUser ? 'items-end' : 'items-start'}`;
    const messageBubbleClasses = `max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${
        isUser ? 'bg-cyan-500 dark:bg-cyan-600 text-white rounded-br-none' : 
        isError ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50 rounded-bl-none' : 
        'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-bl-none'
    }`;
    
    const toggleSources = () => {
        playSound(clickSound, 0.7);
        setIsSourcesOpen(prev => !prev);
    };

    const handleFeedbackClick = (feedbackType: 'like' | 'dislike') => {
        playSound(clickSound, 0.6);
        onFeedback(message.id, feedbackType);
    };

    return (
        <div className={wrapperClasses}>
            {!isUser && (
                <img src="/logo.svg" alt="Synapse logo" className="w-8 h-8 rounded-full flex-shrink-0" />
            )}
            <div className={contentWrapperClasses}>
                <div className={messageBubbleClasses}>
                    <div className="prose dark:prose-invert prose-sm leading-relaxed" dangerouslySetInnerHTML={parseMarkdown(message.content)} />
                </div>

                <div className="mt-3 w-full max-w-md md:max-w-lg lg:max-w-2xl space-y-3">
                    {isModel && message.products && message.products.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            {message.products.map((product, index) => (
                                <ProductCard key={`${product.url}-${index}`} product={product} />
                            ))}
                        </div>
                    )}
                    
                    {isModel && message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSuggestionClick(suggestion)}
                                    className="px-3 py-1.5 bg-gray-200/80 hover:bg-gray-300 text-gray-600 hover:text-gray-900 dark:bg-gray-700/80 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white text-xs font-medium rounded-full transition-colors duration-200"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {isModel && message.sources && message.sources.length > 0 && (
                        <div>
                            <button
                                onClick={toggleSources}
                                className="flex items-center justify-between w-full p-2 text-left rounded-xl bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm"
                                aria-expanded={isSourcesOpen}
                            >
                                <h4 className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                                    Sources ({message.sources.length})
                                </h4>
                                <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isSourcesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSourcesOpen && (
                                <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    {message.sources.map((source, index) => (
                                        <SourceCard key={source.web?.uri || index} source={source} index={index} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {isModel && (
                        <div className="flex items-center gap-2 pt-1">
                            <button 
                                onClick={() => handleFeedbackClick('like')}
                                className={`p-1 rounded-full transition-colors ${message.feedback === 'like' ? 'text-blue-500 bg-blue-100 dark:bg-blue-500/20' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                                aria-label="Like response"
                            >
                                <ThumbUpIcon solid={message.feedback === 'like'} className="w-4 h-4" />
                            </button>
                                <button 
                                onClick={() => handleFeedbackClick('dislike')}
                                className={`p-1 rounded-full transition-colors ${message.feedback === 'dislike' ? 'text-red-500 bg-red-100 dark:bg-red-500/20' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                                aria-label="Dislike response"
                            >
                                <ThumbDownIcon solid={message.feedback === 'dislike'} className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isUser && <Avatar />}
        </div>
    );
};

export default Message;