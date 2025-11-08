// Lightweight, browser-safe gemini service.
// NOTE: The official @google/genai SDK is intended for server-side usage. Importing/initializing
// it directly in the browser can cause runtime errors (Node-only APIs or side-effects). To
// avoid crashing the app in development without a server-side proxy/API key, this module
// returns a harmless stub response when no API key is configured.

import { Product, GroundingChunk } from '../types';

const systemInstruction = `You are Synapse, a friendly and helpful AI assistant specializing in finding tickets and products.
Your goal is to provide accurate information and a seamless shopping experience.
1.  Always use Google Search to find the most up-to-date information.
2.  Your main response should be a helpful, conversational text answer to the user's query.
3.  After the main text response, you MUST include a JSON object enclosed in a \`\`\`json ... \`\`\` block. This JSON object should not be part of your conversational response, but provided at the end.
4.  The JSON object MUST have the following structure: { "products": [...], "suggestions": [...] }.
    - "products": An array of product objects. Each object should have: "name" (string), "type" ('ticket' or 'product'), "url" (string, direct link), "price" (string, optional), "imageUrl" (string, optional), "sourceUrl" (string, optional, from search results), "reviewSummary" (string, optional, a concise summary of user reviews). Populate this with relevant items. If no products are found, provide an empty array [].
    - "suggestions": An array of 3-4 short, relevant follow-up questions the user might ask. If no suggestions are relevant, provide an empty array [].
5.  If the user provides an an image, use it as the primary context for the search.
6.  Always be friendly and engaging in your main text response.
`;

interface SearchResult {
    text: string;
    sources?: GroundingChunk[];
    products?: Product[];
    suggestions?: string[];
}

// Helper: return a safe stub response so the UI can function without a backend/API key.
const stubResponse = (prompt: string): SearchResult => ({
    text: `No Gemini API key configured. This is a placeholder response for: "${prompt}"`,
    products: [],
    suggestions: [
        'Show me similar products',
        'Find tickets near me',
        'What are the top picks for this item?'
    ],
});

export const searchWithGemini = async (
    prompt: string,
    file?: { data: string; mimeType: string }
): Promise<SearchResult> => {
    // Prefer a Vite-exposed env var. In Vite, only env vars prefixed with VITE_ are exposed
    // to the client. If you run a server-side proxy, call it from the frontend instead of
    // embedding server SDKs here.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;

    if (!apiKey) {
        // No API key configured — return a safe stub instead of trying to init the SDK in the browser.
        return stubResponse(prompt || '');
    }

    // If you really need to call the SDK from the client (not recommended), do a dynamic import
    // and initialize the client here. Preferably, call a server endpoint instead.
    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const parts: any[] = [];
        if (file) {
            parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
        }
        parts.push({ text: prompt || 'Describe this image and find relevant products or tickets.' });

        const contents = { parts };

        const response: any = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: { systemInstruction, tools: [{ googleSearch: {} }] },
        });

        const responseText = response.text || '';
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        let products: Product[] = [];
        let suggestions: string[] = [];
        let conversationalText = responseText;

        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = responseText.match(jsonRegex);

        if (match && match[1]) {
            try {
                const parsedJson = JSON.parse(match[1]);
                products = parsedJson.products || [];
                suggestions = parsedJson.suggestions || [];
                conversationalText = responseText.replace(jsonRegex, '').trim();
            } catch (e) {
                console.error('Failed to parse JSON from model response:', e);
            }
        }

        return { text: conversationalText, sources, products, suggestions };
    } catch (err) {
        console.error('Error calling Gemini SDK from client:', err);
        return stubResponse(prompt || '');
    }
};

export const editImageWithGemini = async (
    imageData: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('No Gemini API key configured. Image editing requires a server-side API key.');
    }

    try {
        const { GoogleGenAI, Modality } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const imagePart: any = { inlineData: { data: imageData, mimeType } };
        const textPart: any = { text: prompt };

        const response: any = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const firstCandidate = response.candidates?.[0];
        if (firstCandidate) {
            for (const part of firstCandidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        throw new Error('No image was generated. Please try a different prompt.');
    } catch (err) {
        console.error('Error calling Gemini SDK from client:', err);
        throw err;
    }
};