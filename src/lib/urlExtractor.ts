import { createWorker } from 'tesseract.js';
import urlRegex from 'url-regex-safe';
import { getLinkPreview } from './linkPreview';
import type { ExtractedLink } from '../types';

export async function extractUrlsFromText(text: string): Promise<string[]> {
  const urls = text.match(urlRegex()) || [];
  return [...new Set(urls)].map(url => {
    // Ensure URLs have protocol
    if (!url.match(/^https?:\/\//i)) {
      return `https://${url}`;
    }
    return url;
  });
}

export async function processImage(file: File): Promise<string[]> {
  const worker = await createWorker();
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  return extractUrlsFromText(text);
}

export async function fetchLinkPreviews(urls: string[]): Promise<ExtractedLink[]> {
  const linkPreviews = await Promise.all(
    urls.map(async (url) => {
      try {
        const preview = await getLinkPreview(url);
        return {
          url,
          title: preview.title || new URL(url).hostname,
          description: preview.description || 'No description available',
          thumbnail_url: preview.thumbnail_url,
          selected: true
        };
      } catch (err) {
        console.error(`Error fetching preview for ${url}:`, err);
        return {
          url,
          title: new URL(url).hostname,
          description: 'No description available',
          selected: true
        };
      }
    })
  );

  return linkPreviews.filter((link): boolean => 
    link !== null && 
    typeof link === 'object' &&
    typeof link.url === 'string' &&
    typeof link.title === 'string' && 
    typeof link.description === 'string' &&
    typeof link.selected === 'boolean' &&
    (!('thumbnail_url' in link) || typeof link.thumbnail_url === 'string')
  ) as ExtractedLink[];
}