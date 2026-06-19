export async function withGmailRetry<T>(operation: () => Promise<T>, maxRetries = 4): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit = error.code === 429 || error.status === 429 || (error.message && error.message.includes('429'));
      if (isRateLimit && attempt < maxRetries - 1) {
        attempt++;
        // Exponential backoff with jitter: 2s, 4s, 8s + jitter
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`[Gmail API] Rate limit (429) hit. Retrying in ${Math.round(delayMs)}ms... (Attempt ${attempt}/${maxRetries - 1})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Unreachable');
}
