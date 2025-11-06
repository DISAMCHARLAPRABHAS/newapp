import React from 'react';
import { ChatMessage, MessageRole } from '../types';
import { BotIcon, UserIcon } from '../constants';
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
}

const Message: React.FC<MessageProps> = ({ message, onSuggestionClick }) => {
    const isModel = message.role === MessageRole.MODEL;
    const isUser = message.role === MessageRole.USER;
    const isError = message.role === MessageRole.ERROR;

    const wrapperClasses = `flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`;
    const contentWrapperClasses = `flex flex-col ${isUser ? 'items-end' : 'items-start'}`;
    const messageBubbleClasses = `max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl ${
        isUser ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-none' : 
        isError ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50 rounded-bl-none' : 
        'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'
    }`;

    return (
        <div className={wrapperClasses}>
            {!isUser && <BotIcon />}
            <div className={contentWrapperClasses}>
                <div className={messageBubbleClasses}>
                    <div className="prose dark:prose-invert prose-sm leading-relaxed" dangerouslySetInnerHTML={parseMarkdown(message.content)} />
                </div>

                {isModel && message.products && message.products.length > 0 && (
                    <div className="mt-3 w-full max-w-md md:max-w-lg lg:max-w-2xl">
                        <div className="grid grid-cols-1 gap-2">
                            {message.products.map((product, index) => (
                                <ProductCard key={`${product.url}-${index}`} product={product} />
                            ))}
                        </div>
                    </div>
                )}
                
                {isModel && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 w-full max-w-md md:max-w-lg lg:max-w-2xl flex flex-wrap gap-2">
                         {message.suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="px-3 py-1.5 bg-gray-300/50 hover:bg-gray-300 text-gray-600 hover:text-gray-900 dark:bg-gray-600/50 dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-white text-xs font-medium rounded-full transition-colors duration-200"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {isModel && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 w-full max-w-md md:max-w-lg lg:max-w-2xl">
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Sources:</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {message.sources.map((source, index) => (
                                <SourceCard key={source.web?.uri || index} source={source} index={index} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {isUser && <UserIcon />}
        </div>
    );
};

export default Message;