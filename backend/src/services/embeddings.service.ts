import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';
import { withGeminiFallback } from '../utils/gemini.util';

class EmbeddingsService {

  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text?.trim();
    if (!cleanText) {
      // Return zero vector of 768 dimensions for empty content to avoid breaking DB inserts
      return new Array(768).fill(0);
    }

    try {
      const response = await withGeminiFallback(ai => ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: cleanText,
        config: {
          outputDimensionality: 768,
        },
      }));

      if (!response.embeddings || !response.embeddings[0] || !response.embeddings[0].values) {
        throw new Error('Failed to generate embedding: empty values returned from Gemini API');
      }

      return response.embeddings[0].values;
    } catch (error: any) {
      console.error('Error in EmbeddingsService.generateEmbedding:', error);
      const errorStr = String(error.message || error);
      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      }
      throw error;
    }
  }
}

export const embeddingsService = new EmbeddingsService();
