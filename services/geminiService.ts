// --- NEW: Import ChatMessage type ---
import { Product, GroundingChunk, ComparisonItem, ChatMessage } from '../types';

// The URL of your new Python backend
const API_BASE_URL = 'http://localhost:5000';

interface SearchResult {
    text: string;
    sources?: GroundingChunk[];
    products?: Product[];
    suggestions?: string[];
    comparison_table?: ComparisonItem[];
}

export const searchWithGemini = async (
    prompt: string,
    file: { data: string; mimeType: string } | undefined,
    // --- NEW: Accept the conversation history ---
    history: ChatMessage[] 
): Promise<SearchResult> => {
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // --- NEW: Send prompt, file, and history ---
        body: JSON.stringify({
            prompt: prompt,
            file: file,
            history: history 
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch from backend.");
    }

    const data = await response.json();
    
    // The backend returns data in the exact format our app expects
    return {
        text: data.text,
        sources: data.sources || [],
        products: data.products || [],
        suggestions: data.suggestions || [],
        comparison_table: data.comparison_table || []
    };
};

export const editImageWithGemini = async (
    imageData: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    // This function is unchanged
    const response = await fetch(`${API_BASE_URL}/api/edit-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageData,
            mimeType,
            prompt
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate image.");
    }

    const data = await response.json();
    
    if (!data.imageData) {
        throw new Error("No image data received from backend.");
    }

    return data.imageData;
};