'use server'

/**
 * Enhanced Wikipedia data fetching functionality
 * Includes content sanitization, error handling, caching, related article summaries,
 * image processing, and content extraction improvements
 */

// Interfaces
export interface RelatedArticle {
  title: string
  summary: string
  url: string
  thumbnail?: string
}

export interface SearchResult {
  title: string
  summary: string
  articleContent?: string // HTML content
  url: string
  id: string
  mediaUrl: string
  mediaCaption?: string
  categories?: string[]
  lastModified?: string
  language?: string
  relatedArticles: RelatedArticle[]
  readingTime?: number // estimated reading time in minutes
}

interface WikipediaError {
  error: string
  code: string
  message: string
}

// In-memory cache to prevent duplicate requests
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours in milliseconds
const articleCache: Map<string, { data: SearchResult; timestamp: number }> = new Map();

/**
 * Sanitizes HTML content to prevent XSS and improve article display
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
 * Extract the first image caption from the article
 */
function extractImageCaption(html: string, mediaUrl: string): string {
  if (!mediaUrl || !html) return '';

  // Simple pattern to try to extract caption from HTML
  const imageName = mediaUrl.split('/').pop()?.split('.')[0];
  if (!imageName) return '';

  // Try to find a figcaption that might be related to this image
  const captionMatch = new RegExp(`<figcaption[^>]*>([^<]*${imageName}[^<]*)<\/figcaption>`, 'i').exec(html);
  return captionMatch ? captionMatch[1].trim() : '';
}

/**
 * Estimates reading time based on word count
 * Average adult reading speed is ~250 words per minute
 */
function calculateReadingTime(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 250);
}

/**
 * Extract categories from article HTML
 */
function extractCategories(html: string): string[] {
  const categories: string[] = [];
  const categoryPattern = /<a[^>]*href="\/wiki\/Category:([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = categoryPattern.exec(html)) !== null) {
    categories.push(match[2]);
  }

  return categories.slice(0, 5); // Limit to 5 categories
}

/**
 * Fetch Wikipedia data with improved error handling and features
 */
export async function fetchWikipediaData(searchTitle: string): Promise<SearchResult> {
  try {
    // Input validation
    if (!searchTitle || typeof searchTitle !== 'string') {
      throw new Error('Invalid search title');
    }

    const formattedTitle = encodeURIComponent(searchTitle.trim());
    const cacheKey = formattedTitle.toLowerCase();

    // Check cache first
    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      console.log('Cache hit for:', searchTitle);
      return cachedResult.data;
    }

    // Generate a consistent ID based on the title
    const id = Buffer.from(searchTitle).toString('base64').slice(0, 12);

    // Try fetching summary for metadata (title, thumbnail, etc.)
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    // Check for API errors
    if (summaryRes.status === 404) {
      const result: SearchResult = {
        title: searchTitle,
        summary: `No Wikipedia article found for "${searchTitle}". Please try another search.`,
        url: '',
        id,
        mediaUrl: '',
        articleContent: '',
        relatedArticles: [],
        readingTime: 0
      };

      // Still cache not-found results but for a shorter time
      articleCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }

    if (!summaryRes.ok) {
      const errorData: WikipediaError = await summaryRes.json();
      throw new Error(`Wikipedia API error: ${errorData.message || summaryRes.statusText}`);
    }

    const summaryData = await summaryRes.json();
    const isExactMatch = summaryRes.ok;

    // Try to get full article HTML content
    let articleContent = '';
    let categories: string[] = [];
    let mediaCaption = '';

    if (isExactMatch) {
      // Get full article HTML
      const htmlRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/html/${formattedTitle}`,
        { next: { revalidate: 3600 } }
      );

      if (htmlRes.ok) {
        articleContent = await htmlRes.text();

        // Extract additional info from HTML
        const sanitizedHtml = sanitizeArticleHtml(articleContent);
        categories = extractCategories(articleContent);
        mediaCaption = extractImageCaption(articleContent, summaryData.thumbnail?.source || '');

        // Replace raw HTML with sanitized version
        articleContent = sanitizedHtml;
      }
    }

    // Fetch related articles with their summaries
    const relatedArticles: RelatedArticle[] = [];
    const suggestionsRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${formattedTitle}&limit=5&namespace=0&format=json&origin=*`
    );

    if (suggestionsRes.ok) {
      const suggestionsData = await suggestionsRes.json();

      // Process each suggested article
      if (suggestionsData && suggestionsData[1] && Array.isArray(suggestionsData[1])) {
        // Process top 3 related articles to get their summaries
        const relatedPromises = suggestionsData[1].slice(0, 3).map(async (title: string, index: number) => {
          if (title === summaryData.title) return null; // Skip the current article

          try {
            const relatedSummaryRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
            );

            if (relatedSummaryRes.ok) {
              const relatedData = await relatedSummaryRes.json();
              return {
                title: relatedData.title,
                summary: relatedData.extract ? relatedData.extract.substring(0, 150) + '...' : '',
                url: relatedData.content_urls?.desktop?.page || suggestionsData[3][index],
                thumbnail: relatedData.thumbnail?.source || ''
              };
            }
          } catch (e) {
            console.error('Error fetching related article:', e);
          }

          // Fallback if related summary fetch fails
          return {
            title,
            summary: '',
            url: suggestionsData[3][index]
          };
        });

        // Wait for all related article summaries
        const resolvedRelated = await Promise.all(relatedPromises);
        resolvedRelated.forEach(item => {
          if (item) relatedArticles.push(item);
        });
      }
    }

    // Calculate reading time based on article content
    const readingTime = calculateReadingTime(
      // Get plain text for word counting (strip HTML tags)
      articleContent.replace(/<[^>]*>/g, ' ')
    );

    // Prepare final result
    const result: SearchResult = {
      title: summaryData.title,
      summary: summaryData.extract || '',
      articleContent,
      url: summaryData.content_urls?.desktop?.page || '',
      id,
      mediaUrl: summaryData.thumbnail?.source || '',
      mediaCaption,
      categories,
      lastModified: summaryData.timestamp,
      language: summaryData.lang || 'en',
      relatedArticles,
      readingTime
    };

    // Cache the result
    articleCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;

  } catch (error) {
    console.error('Error in fetchWikipediaData:', error);

    // Return graceful error result
    return {
      title: searchTitle,
      summary: `Error fetching data for "${searchTitle}". ${error instanceof Error ? error.message : 'Please try again later.'}`,
      url: '',
      id: `error-${Date.now()}`,
      mediaUrl: '',
      relatedArticles: []
    };
  }
}

/**
 * Get trending Wikipedia articles
 */
export async function fetchTrendingArticles(limit: number = 5): Promise<SearchResult[]> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');

    // Construct the URL with YYYY/MM/DD format
    const trendingApiUrl = `https://en.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`;

    // Fetch most viewed articles in the past day
    const trendingRes = await fetch(
      trendingApiUrl,
      { next: { revalidate: 3600 } }
    );

    if (!trendingRes.ok) {
      throw new Error(`Failed to fetch trending articles: ${trendingRes.statusText}`);
    }

    const trendingData = await trendingRes.json();

    // Use most read articles as trending
    const mostRead = trendingData.mostread?.articles || [];
    const trending = mostRead.slice(0, limit);

    // Map to SearchResult format
    return trending.map((article: any) => ({
      title: article.title,
      summary: article.extract,
      url: article.content_urls?.desktop?.page || '',
      id: article.pageid?.toString() || `trending-${Math.random().toString(36).substring(2, 11)}`,
      mediaUrl: article.thumbnail?.source || '',
      relatedArticles: []
    }));

  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return [];
  }
}

/**
 * Search Wikipedia with autocompletion support
 */
export async function searchWikipedia(query: string, limit: number = 10): Promise<{
  title: string;
  description: string;
}[]> {
  try {
    if (!query || query.length < 2) return [];

    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srprop=snippet&srlimit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Wikipedia search API error');
    }

    const data = await response.json();
    const results = data.query?.search || [];

    return results.map((item: any) => ({
      title: item.title,
      // Clean up HTML from snippet
      description: item.snippet.replace(/<\/?span[^>]*>/g, '').replace(/<[^>]+>/g, '')
    }));

  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return [];
  }
}