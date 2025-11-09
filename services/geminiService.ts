// Fix: Created the geminiService.ts file with implementations for searchWithGemini and editImageWithGemini.
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { Product, GroundingChunk } from '../types';

// Per guidelines:
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

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

export const searchWithGemini = async (
    prompt: string,
    file?: { data: string; mimeType: string }
): Promise<SearchResult> => {
    
    const parts: Part[] = [];
    if (file) {
        parts.push({
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            },
        });
    }
    // Ensure prompt is not empty if a file is provided.
    parts.push({ text: prompt || "Describe this image and find relevant products or tickets." });

    const contents = { parts };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }],
        },
    });

    const responseText = response.text;
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
            console.error("Failed to parse JSON from model response:", e);
        }
    }

    return {
        text: conversationalText,
        sources,
        products,
        suggestions,
    };
};

export const editImageWithGemini = async (
    imageData: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    const imagePart: Part = {
        inlineData: {
            data: imageData,
            mimeType: mimeType,
        },
    };
    const textPart: Part = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstCandidate = response.candidates?.[0];
    if (firstCandidate) {
        for (const part of firstCandidate.content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }
    
    throw new Error("No image was generated. Please try a different prompt.");
};