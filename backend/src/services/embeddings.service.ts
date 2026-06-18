import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';

class EmbeddingsService {
  private getAIClient() {
    return new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text?.trim();
    if (!cleanText) {
      // Return zero vector of 768 dimensions for empty content to avoid breaking DB inserts
      return new Array(768).fill(0);
    }

    try {
      const ai = this.getAIClient();
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: cleanText,
      });

      if (!response.embeddings || !response.embeddings[0] || !response.embeddings[0].values) {
        throw new Error('Failed to generate embedding: empty values returned from Gemini API');
      }

      return response.embeddings[0].values;
    } catch (error) {
      console.error('Error in EmbeddingsService.generateEmbedding:', error);
      throw error;
    }
  }
}

export const embeddingsService = new EmbeddingsService();
