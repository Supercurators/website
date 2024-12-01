import { parse } from 'node-html-parser';
import * as cheerio from 'cheerio';

interface LinkMetadata {
  title: string;
  description: string;
  thumbnail_url?: string;
}


// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
];

const getYouTubeVideoId = (url: string): string | null => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const getYouTubeMetadata = async (videoId: string): Promise<LinkMetadata> => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!response.ok) throw new Error('Failed to fetch YouTube metadata');
    
    const data = await response.json();
    return {
      title: data.title,
      description: data.author_name,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  } catch (error) {
    console.error('YouTube metadata fetch error:', error);
    return {
      title: 'YouTube Video',
      description: 'Video description unavailable',
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
};

export async function getLinkPreview(url: string): Promise<LinkMetadata> {
  try {
    // Ensure URL has protocol
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      throw new Error('Invalid URL');
    }

    // Check if it's a YouTube URL
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return getYouTubeMetadata(youtubeId);
    }

    // Try multiple CORS proxies in case one fails
    const corsProxies = [
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    let html = '';
    let proxyError = null;

    // Try each proxy until one works
    for (const getProxyUrl of corsProxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(getProxyUrl(url), {
          signal: controller.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        html = await response.text();
        if (html) break;
      } catch (err) {
        proxyError = err;
        continue;
      }
    }

    if (!html) {
      throw proxyError || new Error('Failed to fetch URL content');
    }

    const root = parse(html);
    const $ = cheerio.load(html);

    // Extract metadata with fallbacks
    const metadata: LinkMetadata = {
      title: 
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text() ||
        root.querySelector('title')?.text ||
        new URL(url).hostname,

      description:
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        root.querySelector('meta[name="description"]')?.getAttribute('content') ||
        $('p').first().text() ||
        'No description available',

      thumbnail_url:
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        $('img[src^="http"]').first().attr('src') ||
        undefined
    };

    // Clean up metadata
    metadata.title = metadata.title?.trim() || new URL(url).hostname;
    metadata.description = metadata.description?.trim() || 'No description available';

    // Handle relative image URLs
    if (metadata.thumbnail_url && !metadata.thumbnail_url.startsWith('http')) {
      const urlObj = new URL(url);
      metadata.thumbnail_url = new URL(metadata.thumbnail_url, urlObj.origin).toString();
    }

    // Validate thumbnail URL
    if (metadata.thumbnail_url) {
      try {
        new URL(metadata.thumbnail_url);
      } catch (e) {
        metadata.thumbnail_url = undefined;
      }
    }

    return metadata;
  } catch (error) {
    console.error('Error fetching link preview:', error);
    
    // Return basic metadata on error
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname,
        description: 'No description available'
      };
    } catch {
      return {
        title: url,
        description: 'No description available'
      };
    }
  }
}