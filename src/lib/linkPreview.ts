import { fetchWithProxy } from './proxyConfig';
import { normalizeUrl } from '../components/link/ShareForm';

export async function getLinkPreview(url: string) {
  try {
    // Normalize the URL first
    const normalizedUrl = normalizeUrl(url);
    
    // First try to fetch metadata using a more reliable service
    try {
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          url: normalizedUrl,
          title: data.data.title || '',
          description: data.data.description || '',
          thumbnail_url: data.data.image?.url,
        };
      }
    } catch (error) {
      console.warn('Microlink API failed:', error);
    }

    // Fallback to manual scraping with proxy
    const html = await fetchWithProxy(normalizedUrl);
    
    // Basic metadata extraction
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') 
      || doc.querySelector('title')?.textContent 
      || '';
      
    const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
      || doc.querySelector('meta[name="description"]')?.getAttribute('content')
      || '';
      
    const thumbnail_url = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
      || doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
      || '';

    return {
      url: normalizedUrl,
      title: title.trim(),
      description: description.trim(),
      thumbnail_url: thumbnail_url || undefined,
    };
  } catch (error) {
    console.error('Failed to fetch link preview:', error);
    // Return basic preview with just the URL if everything fails
    return {
      url: normalizeUrl(url),
      title: new URL(normalizeUrl(url)).hostname,
      description: 'No preview available',
    };
  }
}