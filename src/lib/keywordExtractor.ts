export function keywordExtractor(text: string): string[] {
  // Remove special characters and convert to lowercase
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleanText.split(/\s+/).filter(word => word.length > 2);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
    'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
    'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
    'about', 'who', 'get', 'which', 'go', 'me'
  ]);
  
  const keywords = words.filter(word => !stopWords.has(word));
  
  // Count frequency
  const frequency: Record<string, number> = {};
  keywords.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}