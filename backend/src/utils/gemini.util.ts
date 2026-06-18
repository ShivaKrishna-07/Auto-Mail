import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';

export async function withGeminiFallback<T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const keys = ENV.GEMINI_API_KEYS;
  if (!keys || keys.length === 0) {
    throw new Error('No Gemini API keys configured.');
  }

  let lastError: any;
  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.code || 0;
      const msg = error.message?.toLowerCase() || '';
      
      const isQuota = 
        status === 429 || 
        status === 403 || 
        msg.includes('quota') || 
        msg.includes('rate limit') || 
        msg.includes('exhausted') || 
        msg.includes('overloaded');
        
      if (!isQuota) {
        // If it's a structural error (e.g. invalid prompt), don't retry
        throw error;
      }
      console.warn('[Gemini API] Quota exceeded or rate limited. Retrying with next API key...');
    }
  }

  throw lastError || new Error('All Gemini API keys exhausted their quota.');
}
