// List of proxy services to try in order
export const PROXY_SERVICES = [
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
] as const;

export async function fetchWithProxy(url: string) {
  let lastError: Error | null = null;

  // Try each proxy service in order until one works
  for (const proxyService of PROXY_SERVICES) {
    try {
      const response = await fetch(proxyService + encodeURIComponent(url), {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.warn(`Proxy ${proxyService} failed:`, error);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All proxy services failed');
} 