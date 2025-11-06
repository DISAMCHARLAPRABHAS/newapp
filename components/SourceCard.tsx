import * as React from 'react';
import { GroundingChunk } from '../types';

interface SourceCardProps {
    source: GroundingChunk;
    index: number;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
    if (!source.web?.uri) {
        return null;
    }

    const { uri, title } = source.web;

    let faviconUrl = '';
    try {
        faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(uri).hostname}&sz=32`;
    } catch (e) {
        // Invalid URL, cannot generate favicon link
    }

    return (
        <a
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 bg-gray-200/50 hover:bg-gray-200 dark:bg-gray-600/50 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 text-sm"
        >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-300 text-teal-600 dark:bg-gray-700 dark:text-teal-400 rounded-md font-bold text-xs">
                {index + 1}
            </div>
            {faviconUrl && <img src={faviconUrl} alt="favicon" className="w-4 h-4 rounded-sm flex-shrink-0" />}
            <p className="text-gray-700 dark:text-gray-300 truncate hover:text-black dark:hover:text-white" title={title || uri}>{title || uri}</p>
        </a>
    );
};

export default SourceCard;