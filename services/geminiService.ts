// Fix: Removed FunctionDeclaration and Type as they are no longer used.
import { GoogleGenAI, Modality } from "@google/genai";
import { GroundingChunk, Product } from '../types';

if (!process.env.API_KEY) {
    // This is a safeguard; the environment is expected to have the API key.
    console.warn("API_KEY environment variable not found. App may not function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Fix: Updated system instruction to be a more focused shopping assistant.
// It now asks for an ImageURL and SourceURL.
// It now requires prices to be in Indian Rupees (INR).
// It now asks for follow-up suggestions.
const systemInstruction = `You are Synapse, an expert shopping and booking assistant. Your ONLY job is to find products and tickets for users.
- Focus ONLY on finding items the user can buy or book.
- NEVER provide definitions, explanations, or conversational filler. Get straight to the products.
- If you find items, give a very brief introductory sentence, then list all items using the structured format below.
- If you can't find anything, just say "I couldn't find any products or tickets matching your search."
- For each item, you MUST provide the Name, Type ('ticket' or 'product'), and URL.
- All prices MUST be in Indian Rupees (INR) and prefixed with '₹'. Do not use any other currency. Include Price if available.
- If you can find a direct URL to a representative thumbnail image for the product, you MUST include it as ImageURL.
- You MUST also include the specific SourceURL from the web where you found the item.
- After your main response, you MUST provide 2-3 short, relevant follow-up questions or suggestions in the format: [SUGGESTION]your suggestion here[/SUGGESTION]

Example of the structured format:
[PRODUCT]
Name: Taylor Swift Concert Ticket
Type: ticket
Price: ₹15,999
URL: https://example.com/taylor-swift-ticket
ImageURL: https://example.com/taylor-swift-image.jpg
SourceURL: https://example.com/source-for-ticket
[/PRODUCT]
[PRODUCT]
Name: Official Tour T-Shirt
Type: product
Price: ₹3,500
URL: https://example.com/tour-t-shirt
SourceURL: https://example.com/source-for-shirt
[/PRODUCT]
[SUGGESTION]Are there any VIP packages?[/SUGGESTION]
[SUGGESTION]Show me other merchandise.[/SUGGESTION]`;


interface GeminiSearchResult {
    text: string;
    sources: GroundingChunk[];
    products: Product[];
    suggestions: string[];
}

interface ImagePart {
    inlineData: {
        data: string;
        mimeType: string;
    }
}

export async function searchWithGemini(prompt: string, image?: { data: string; mimeType: string }): Promise<GeminiSearchResult> {
    try {
        const contents: (string | ImagePart)[] = [prompt];
        if (image) {
            contents.unshift({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contents.map(part => typeof part === 'string' ? { text: part } : part) },
            config: {
                systemInstruction,
                tools: [
                    { googleSearch: {} },
                ],
            },
        });

        const rawText = response.text;
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources: GroundingChunk[] = groundingMetadata?.groundingChunks?.filter(chunk => chunk.web) ?? [];
        const products: Product[] = [];
        const suggestions: string[] = [];

        const productBlockRegex = /\[PRODUCT\]\r?\nName: (.*)\r?\nType: (ticket|product)\r?\n(?:Price: (.*)\r?\n)?URL: (.*)\r?\n(?:ImageURL: (.*)\r?\n)?(?:SourceURL: (.*)\r?\n)?\[\/PRODUCT\]/g;
        const suggestionBlockRegex = /\[SUGGESTION\](.*?)\[\/SUGGESTION\]/g;

        let summary = rawText;
        
        summary = summary.replace(productBlockRegex, (match, name, type, price, url, imageUrl, sourceUrl) => {
            products.push({
                name: name.trim(),
                type: type as 'ticket' | 'product',
                url: url.trim(),
                price: price ? price.trim() : undefined,
                imageUrl: imageUrl ? imageUrl.trim() : undefined,
                sourceUrl: sourceUrl ? sourceUrl.trim() : undefined,
            });
            return '';
        });

        summary = summary.replace(suggestionBlockRegex, (match, suggestion) => {
            suggestions.push(suggestion.trim());
            return '';
        }).trim();

        const responseText = summary || (products.length > 0 ? `I found ${products.length} item(s) you can act on.` : "");

        if (!responseText && products.length === 0) {
             return { text: "I couldn't find anything matching your search. Try describing it differently.", sources, products, suggestions };
        }

        return { text: responseText, sources, products, suggestions };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get response from AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the AI.");
    }
}


export async function editImageWithGemini(base64ImageData: string, mimeType: string, prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("API did not return an image.");

    } catch (error) {
        console.error("Error calling Gemini Image Edit API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to edit image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while editing the image.");
    }
}