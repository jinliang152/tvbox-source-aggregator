// 自动抓取 juwanhezi.com 源列表（私有功能）

import type { SourceEntry } from './types';

const SCRAPE_URL = 'https://www.juwanhezi.com/ajax/load';
const REFERER = 'https://www.juwanhezi.com/jsonlist';
const MAX_PAGES = 10;

/**
 * 从 juwanhezi.com 抓取 TVBox 源列表
 * 返回 SourceEntry[]（名称 + URL）
 */
export async function scrapeSourceList(): Promise<SourceEntry[]> {
  const allSources: SourceEntry[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const html = await fetchPage(page);
      if (!html || !html.trim()) break;

      const sources = parsePage(html);
      if (sources.length === 0) break;

      allSources.push(...sources);
      console.log(`[source-scraper] Page ${page}: ${sources.length} sources`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[source-scraper] Page ${page} failed: ${msg}`);
      break;
    }
  }

  console.log(`[source-scraper] Total scraped: ${allSources.length} sources`);
  return allSources;
}

async function fetchPage(page: number): Promise<string> {
  const resp = await fetch(SCRAPE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'okhttp/3.12.0',
      'Referer': REFERER,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: `action=load&page=source&type=one&paged=${page}`,
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

function parsePage(html: string): SourceEntry[] {
  const sources: SourceEntry[] = [];
  const nameRegex = /col-form-label">([^<]+)</g;
  const urlRegex = /value="([^"]+)"/g;

  const names: string[] = [];
  const urls: string[] = [];

  let m;
  while ((m = nameRegex.exec(html)) !== null) names.push(m[1].trim());
  while ((m = urlRegex.exec(html)) !== null) urls.push(m[1].trim());

  for (let i = 0; i < names.length && i < urls.length; i++) {
    const url = urls[i];
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      sources.push({ name: names[i], url });
    }
  }

  return sources;
}
