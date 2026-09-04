import images from '@/data/portfolio-images.json';

let warming: Promise<void> | undefined;

// Warm small image/entry assets after the study is ready, or on the first
// click. This starts no iframe or second renderer while the room animates.
export function preloadPortfolio() {
  if (warming) return;
  warming = (async () => {
    const urls = images.map(image => `/portfolio-template/gallery/${image.file}`);
    try {
      const response = await fetch('/portfolio-template/entry.json');
      if (response.ok) {
        const entries: unknown = await response.json();
        if (Array.isArray(entries)) urls.push(...entries.filter((url): url is string => typeof url === 'string' && url.startsWith('/portfolio-template/assets/')));
      }
      await Promise.all(urls.map(async url => {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error('Portfolio asset unavailable');
        await response.arrayBuffer();
      }));
    } catch {
      // Normal navigation can still load assets, and a later click can retry.
      warming = undefined;
    }
  })();
}
