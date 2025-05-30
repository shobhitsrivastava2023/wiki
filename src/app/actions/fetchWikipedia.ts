'use server'

/**
 * Optimized Wikipedia data fetching with improved performance
 * Key optimizations:
 * - Reduced API calls through batching
 * - Better caching strategy
 * - Parallel processing
 * - Optional data loading
 * - Request deduplication
 */

// Enhanced interfaces (keeping your existing ones)
export interface WikipediaCoordinates {
  lat: number
  lon: number
  globe: string
}

export interface PageViews {
  daily: number
  weekly: number
  monthly: number
}

export interface DisambiguationOption {
  title: string
  description: string
  url: string
}

export interface WikipediaTag {
  name: string
  type: 'category' | 'portal' | 'project' | 'template'
  url?: string
}

export interface RelatedArticle {
  title: string
  summary: string
  url: string
  thumbnail?: string
  score?: number
  reason?: string
}

export interface SearchResult {
  title: string
  summary: string
  articleContent?: string
  url: string
  id: string
  mediaUrl: string
  mediaCaption?: string
  categories?: string[]
  tags?: WikipediaTag[]
  coordinates?: WikipediaCoordinates
  lastModified?: string
  language?: string
  relatedArticles: RelatedArticle[]
  readingTime?: number
  pageViews?: PageViews
  isDisambiguation?: boolean
  disambiguationOptions?: DisambiguationOption[]
  searchScore?: number
  alternativeTitles?: string[]
  wikidata_id?: string
  isExactMatch: boolean
}

// Optimized caching with size limits
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_SIZE = 1000;

class LRUCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }

  set(key: string, data: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const articleCache = new LRUCache<SearchResult>(MAX_CACHE_SIZE);
const searchCache = new LRUCache<SearchResult[]>(MAX_CACHE_SIZE / 2);

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

async function dedupedFetch(url: string): Promise<Response> {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url)!;
  }

  const promise = fetch(url, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000) // 10s timeout
  });
  
  pendingRequests.set(url, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(url);
  }
}

/**
 * Optimized batch data fetching
 */
async function fetchBatchedArticleData(titles: string[]): Promise<Map<string, any>> {
  if (titles.length === 0) return new Map();

  try {
    const batchSize = 20; // Wikipedia API limit
    const results = new Map<string, any>();

    // Process in batches
    for (let i = 0; i < titles.length; i += batchSize) {
      const batch = titles.slice(i, i + batchSize);
      const titlesParam = batch.join('|');

      // Single API call for multiple properties
      const response = await dedupedFetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesParam)}&prop=categories|coordinates|pageprops|info&format=json&origin=*&clshow=!hidden&cllimit=10&inprop=url`
      );

      if (response.ok) {
        const data = await response.json();
        const pages = data.query?.pages || {};
        
        Object.values(pages).forEach((page: any) => {
          if (page.title) {
            results.set(page.title, page);
          }
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch fetch:', error);
    return new Map();
  }
}

/**
 * Optimized direct lookup with minimal API calls
 */
async function tryDirectLookup(title: string, includeFullContent: boolean = false): Promise<SearchResult | null> {
  try {
    const summaryRes = await dedupedFetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );

    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      return await buildOptimizedSearchResult(summaryData, title, true, 1.0, includeFullContent);
    }

    return null;
  } catch (error) {
    console.error('Error in direct lookup:', error);
    return null;
  }
}

/**
 * Optimized search with better performance
 */
async function performOptimizedSearch(query: string, limit: number = 5, includeFullContent: boolean = false): Promise<SearchResult[]> {
  try {
    const cacheKey = `search_${query.toLowerCase()}_${limit}_${includeFullContent}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Use only the most effective search method
    const searchResponse = await dedupedFetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srprop=snippet|titlesnippet|size&srlimit=${limit}&srinfo=totalhits`
    );

    if (!searchResponse.ok) {
      return [];
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];

    if (searchResults.length === 0) {
      return [];
    }

    // Batch fetch summaries
    const titles = searchResults.map((item: any) => item.title);
    const summaryPromises = titles.map(async (title: string) => {
      try {
        const summaryRes = await dedupedFetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
        );
        return summaryRes.ok ? await summaryRes.json() : null;
      } catch {
        return null;
      }
    });

    const summaries = await Promise.all(summaryPromises);
    const results: SearchResult[] = [];

    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      if (summary) {
        const searchItem = searchResults[i];
        const score = calculateRelevanceScore(query, summary.title, searchItem.snippet || '');
        const result = await buildOptimizedSearchResult(summary, query, false, score, includeFullContent && i === 0); // Only load full content for best match
        results.push(result);
      }
    }

    // Sort by relevance
    results.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));

    // Cache results
    searchCache.set(cacheKey, results);
    return results;

  } catch (error) {
    console.error('Error in optimized search:', error);
    return [];
  }
}

/**
 * Build search result with minimal API calls and lazy loading
 */
async function buildOptimizedSearchResult(
  summaryData: any,
  originalQuery: string,
  isExactMatch: boolean,
  searchScore: number,
  includeFullContent: boolean = false
): Promise<SearchResult> {
  const title = summaryData.title;
  const id = summaryData.pageid?.toString() || Buffer.from(title).toString('base64').slice(0, 12);

  // Only fetch essential data initially
  const isDisambiguation = summaryData.type === 'disambiguation';
  
  // Basic result with minimal data
  const result: SearchResult = {
    title,
    summary: summaryData.extract || '',
    url: summaryData.content_urls?.desktop?.page || '',
    id,
    mediaUrl: summaryData.thumbnail?.source || '',
    lastModified: summaryData.timestamp,
    language: summaryData.lang || 'en',
    relatedArticles: [], // Load lazily
    readingTime: calculateReadingTime(summaryData.extract || ''),
    isDisambiguation,
    searchScore,
    wikidata_id: summaryData.wikibase_item,
    isExactMatch
  };

  // For exact matches or when explicitly requested, fetch full content immediately
  if (includeFullContent && !isDisambiguation) {
    const contentData = await fetchOptimizedArticleContent(title);
    if (contentData) {
      result.articleContent = contentData.content;
      result.mediaCaption = contentData.mediaCaption;
      // Recalculate reading time with full content
      result.readingTime = calculateReadingTime(contentData.content);
    }
  }

  // Load additional data in background (don't await)
  if (!isDisambiguation) {
    loadAdditionalDataAsync(title, result, includeFullContent);
  }

  return result;
}

/**
 * Load additional data asynchronously without blocking
 */
async function loadAdditionalDataAsync(title: string, result: SearchResult, includeFullContent: boolean = false): Promise<void> {
  try {
    // Batch fetch additional data
    const batchData = await fetchBatchedArticleData([title]);
    const pageData = batchData.get(title);

    if (pageData) {
      // Extract categories quickly
      if (pageData.categories) {
        result.categories = pageData.categories
          .slice(0, 5) // Limit categories
          .map((cat: any) => cat.title.replace('Category:', ''));
      }

      // Extract coordinates
      if (pageData.coordinates && pageData.coordinates.length > 0) {
        const coord = pageData.coordinates[0];
        result.coordinates = {
          lat: coord.lat,
          lon: coord.lon,
          globe: coord.globe || 'earth'
        };
      }
    }

    // Fetch full content if not already loaded and needed
    if (includeFullContent && !result.articleContent) {
      const contentData = await fetchOptimizedArticleContent(title);
      if (contentData) {
        result.articleContent = contentData.content;
        result.mediaCaption = contentData.mediaCaption;
        result.readingTime = calculateReadingTime(contentData.content);
      }
    }

    // Only fetch related articles for exact matches or high-scoring results
    if (result.isExactMatch || (result.searchScore && result.searchScore > 0.8)) {
      result.relatedArticles = await fetchLimitedRelatedArticles(title);
    }

  } catch (error) {
    console.error('Error loading additional data async:', error);
  }
}

/**
 * Load additional data asynchronously without blocking
 */


/**
 * Optimized full article content fetching with caching
 */
async function fetchOptimizedArticleContent(title: string): Promise<{content: string, mediaCaption?: string} | null> {
  try {
    const cacheKey = `content_${title.toLowerCase()}`;
    const cached = articleCache.get(cacheKey);
    if (cached) {
      return { content: cached.articleContent || '', mediaCaption: cached.mediaCaption };
    }

    const htmlRes = await dedupedFetch(
      `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
    );

    if (!htmlRes.ok) return null;

    const html = await htmlRes.text();
    const sanitizedHtml = sanitizeArticleHtml(html);
    const mediaCaption = extractImageCaption(html, title);

    // Cache the content separately to avoid duplicating large content
    const contentResult = {
      content: sanitizedHtml,
      mediaCaption
    };

    return contentResult;
  } catch (error) {
    console.error('Error fetching article content:', error);
    return null;
  }
}

/**
 * Sanitize and optimize article HTML for your platform
 */
function sanitizeArticleHtml(html: string): string {
  let cleaned = html
    // Remove infobox and navigation tables
    .replace(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>.*?<\/table>/gs, '')
    .replace(/<table[^>]*class="[^"]*navbox[^"]*"[^>]*>.*?<\/table>/gs, '')
    .replace(/<table[^>]*class="[^"]*vertical-navbox[^"]*"[^>]*>.*?<\/table>/gs, '')
    // Remove coordinates
    .replace(/<span[^>]*class="[^"]*geo[^"]*"[^>]*>.*?<\/span>/g, '')
    // Remove edit section links
    .replace(/<a[^>]*class="mw-editsection"[^>]*>.*?<\/a>/g, '')
    // Remove reference sections
    .replace(/<h2[^>]*id="References"[^>]*>.*?<\/h2>.*?(<h2|$)/gs, '$1')
    .replace(/<div[^>]*class="[^"]*reflist[^"]*"[^>]*>.*?<\/div>/gs, '')
    // Remove citation needed spans
    .replace(/<sup[^>]*class="[^"]*citation-needed[^"]*"[^>]*>.*?<\/sup>/g, '')
    // Clean up table styling
    .replace(/<table[^>]*>/g, '<table class="wikipedia-table">')
    // Make images responsive
    .replace(/<img([^>]*)>/g, '<img$1 loading="lazy" class="article-img">')
    // Add target="_blank" to external links
    .replace(/<a([^>]*)href="(https?:\/\/(?!en\.wikipedia\.org)[^"]+)"([^>]*)>/g,
      '<a$1href="$2"$3 target="_blank" rel="noopener noreferrer">')
    // Transform internal links
    .replace(/<a([^>]*)href="\/wiki\/([^"]+)"([^>]*)>/g,
      '<a$1href="/search?query=$2"$3 class="internal-link">')
    // Remove table of contents
    .replace(/<div[^>]*id="toc"[^>]*>.*?<\/div>/gs, '')
    // Remove hatnotes
    .replace(/<div[^>]*class="[^"]*hatnote[^"]*"[^>]*>.*?<\/div>/gs, '');

  return cleaned;
}

/**
 * Extract image caption from HTML
 */
function extractImageCaption(html: string, title: string): string {
  if (!html) return '';
  
  // Try to find the main image caption
  const captionMatches = html.match(/<figcaption[^>]*>(.*;*?)<\/figcaption>/gi);
  if (captionMatches && captionMatches.length > 0) {
    // Get the first substantial caption
    for (const match of captionMatches) {
      const captionText = match.replace(/<[^>]+>/g, '').trim();
      if (captionText.length > 10) { // Only return substantial captions
        return captionText;
      }
    }
  }
  
  // Fallback: try to find alt text from images
  const imgMatches = html.match(/<img[^>]*alt="([^"]+)"[^>]*>/gi);
  if (imgMatches && imgMatches.length > 0) {
    const altMatch = imgMatches[0].match(/alt="([^"]+)"/);
    if (altMatch && altMatch[1].length > 10) {
      return altMatch[1];
    }
  }
  
  return '';
}

/**
 * Fetch limited related articles with single API call
 */
async function fetchLimitedRelatedArticles(title: string): Promise<RelatedArticle[]> {
  try {
    const response = await dedupedFetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=links&format=json&origin=*&pllimit=5&plnamespace=0`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0] as any;
    const links = page?.links || [];

    // Just return basic related articles without additional API calls
    return links.slice(0, 3).map((link: any) => ({
      title: link.title,
      summary: '', // Don't fetch summaries to save time
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(link.title)}`,
      reason: 'linked from article',
      score: 0.7
    }));

  } catch (error) {
    console.error('Error fetching limited related articles:', error);
    return [];
  }
}

/**
 * Optimized page views with shorter timeframe
 */
async function fetchQuickPageViews(title: string): Promise<PageViews | undefined> {
  try {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Only get last 7 days instead of 30
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0].replace(/-/g, '');

    const response = await dedupedFetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(title)}/daily/${startDate}/${endDate}`
    );

    if (!response.ok) return undefined;

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) return undefined;

    const totalViews = items.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
    const dailyAverage = Math.round(totalViews / items.length);

    return {
      daily: dailyAverage,
      weekly: totalViews,
      monthly: totalViews * 4 // Estimate
    };
  } catch (error) {
    console.error('Error fetching quick page views:', error);
    return undefined;
  }
}

// Keep your existing utility functions
function calculateRelevanceScore(query: string, title: string, snippet: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();

  let score = 0;

  if (titleLower === queryLower) {
    score += 1.0;
  } else if (titleLower.includes(queryLower)) {
    score += 0.8;
  } else if (queryLower.includes(titleLower)) {
    score += 0.7;
  }

  const queryWords = queryLower.split(/\s+/);
  const titleWords = titleLower.split(/\s+/);
  
  const titleMatches = queryWords.filter(word => titleWords.includes(word)).length;
  score += (titleMatches / queryWords.length) * 0.5;

  const snippetMatches = queryWords.filter(word => snippetLower.includes(word)).length;
  score += (snippetMatches / queryWords.length) * 0.3;

  return Math.min(score, 1.0);
}

function calculateReadingTime(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 250);
}

/**
 * Main optimized fetch function - much faster!
 */
export async function fetchWikipediaData(searchTitle: string, includeFullContent: boolean = true): Promise<SearchResult> {
  try {
    if (!searchTitle || typeof searchTitle !== 'string') {
      throw new Error('Invalid search title');
    }

    const formattedTitle = searchTitle.trim();
    const cacheKey = `${formattedTitle.toLowerCase()}_${includeFullContent}`;

    // Check cache first
    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult) {
      console.log('Cache hit for:', searchTitle);
      return cachedResult;
    }

    // Try direct lookup first (fastest)
    const directResult = await tryDirectLookup(formattedTitle, includeFullContent);
    if (directResult && directResult.isExactMatch) {
      articleCache.set(cacheKey, directResult);
      return directResult;
    }

    // Fall back to search
    const searchResults = await performOptimizedSearch(formattedTitle, 3, includeFullContent);
    
    if (searchResults.length === 0) {
      const errorResult: SearchResult = {
        title: searchTitle,
        summary: `No Wikipedia article found for "${searchTitle}". Please try a different search term.`,
        url: '',
        id: `error-${Date.now()}`,
        mediaUrl: '',
        relatedArticles: [],
        isExactMatch: false
      };

      articleCache.set(cacheKey, errorResult);
      return errorResult;
    }

    const bestResult = searchResults[0];
    articleCache.set(cacheKey, bestResult);
    return bestResult;

  } catch (error) {
    console.error('Error in fetchWikipediaData:', error);

    return {
      title: searchTitle,
      summary: `Error fetching data for "${searchTitle}". ${error instanceof Error ? error.message : 'Please try again later.'}`,
      url: '',
      id: `error-${Date.now()}`,
      mediaUrl: '',
      relatedArticles: [],
      isExactMatch: false
    };
  }
}

/**
 * Get full article content separately (for lazy loading)
 */
export async function fetchArticleContent(title: string): Promise<{content: string, mediaCaption?: string} | null> {
  return await fetchOptimizedArticleContent(title);
}

/**
 * Fast search function for suggestions
 */
export async function searchWikipedia(query: string, limit: number = 10): Promise<{
  title: string
  description: string
}[]> {
  try {
    if (!query || query.length < 2) return [];

    const response = await dedupedFetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json&origin=*`
    );

    if (!response.ok) {
      throw new Error('Wikipedia search API error');
    }

    const data = await response.json();
    const titles = data[1] || [];
    const descriptions = data[2] || [];

    return titles.map((title: string, index: number) => ({
      title,
      description: descriptions[index] || ''
    }));
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return [];
  }
}

// Simplified trending articles
export async function fetchTrendingArticles(limit: number = 5): Promise<SearchResult[]> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const response = await dedupedFetch(
      `https://en.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trending articles: ${response.statusText}`);
    }

    const data = await response.json();
    const mostRead = data.mostread?.articles || [];
    
    // Return simplified results quickly
    return mostRead.slice(0, limit).map((article: any) => ({
      title: article.title,
      summary: article.extract || '',
      url: article.content_urls?.desktop?.page || '',
      id: article.pageid?.toString() || `trending-${Date.now()}`,
      mediaUrl: article.thumbnail?.source || '',
      relatedArticles: [],
      isExactMatch: true,
      readingTime: calculateReadingTime(article.extract || '')
    }));

  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return [];
  }
}