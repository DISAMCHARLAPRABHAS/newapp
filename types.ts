// Fix: Changed to type-only import for GroundingChunk and added a type export.
import { type GroundingChunk } from "@google/genai";

export type Theme = 'light' | 'dark';

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error'
}

export interface Product {
  name: string;
  type: 'ticket' | 'product';
  url: string;
  price?: string;
  imageUrl?: string;
  sourceUrl?: string;
  reviewSummary?: string;
}

// --- NEW INTERFACE ---
export interface ComparisonItem {
  name: string;
  original_price?: string;
  discounted_price?: string;
  offers?: string;
  rating_out_of_5?: string;
  review_summary?: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: GroundingChunk[];
  products?: Product[];
  suggestions?: string[];
  feedback?: 'like' | 'dislike';
  comparison_table?: ComparisonItem[]; // --- NEW FIELD ---
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

// Fix: Exporting GroundingChunk type so other modules can import it from this file.
export type { GroundingChunk };