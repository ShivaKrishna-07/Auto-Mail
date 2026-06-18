/**
 * Helper to strip HTML tags, script, and style blocks to yield clean plain text.
 */
export function cleanHtml(html: string): string {
  if (!html) return '';
  
  // 1. Remove style and script tags content
  let text = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  text = text.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  
  // 2. Replace common line-breaking elements with line breaks
  text = text.replace(/<\/p>|<\/div>|<br\s*\/?>/gi, '\n');
  
  // 3. Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // 4. Unescape HTML entities
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  };
  
  text = text.replace(/&[a-z0-9#]+;/gi, (match) => {
    return entities[match.toLowerCase()] || match;
  });
  
  // 5. Clean up multiple empty lines and excessive spaces
  text = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
    
  return text.trim();
}

/**
 * Retrieves a header value from the Google API message headers list by case-insensitive name.
 */
export function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined,
  name: string
): string {
  if (!headers) return '';
  const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}
