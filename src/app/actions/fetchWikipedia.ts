// app/actions/fetchWikipedia.ts
'use server'

export interface RelatedArticle {
  title: string
  summary: string
  url: string
}

export interface SearchResult {
  title: string
  summary: string
  articleContent?: string // now contains HTML
  url: string
  id: number
  mediaUrl: string
  relatedArticles: RelatedArticle[]
}

export async function fetchWikipediaData(searchTitle: string): Promise<SearchResult> {
  const formattedTitle = encodeURIComponent(searchTitle.trim())

  // Try fetching summary for metadata (title, thumbnail, etc.)
  const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`)
  const isExactMatch = summaryRes.ok
  const summaryData = isExactMatch ? await summaryRes.json() : null

  let articleContent = ''
  if (isExactMatch) {
    // Get full article HTML
    const htmlRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/html/${formattedTitle}`)
    if (htmlRes.ok) {
      articleContent = await htmlRes.text()
    }
  }

  // Fetch related articles
  const suggestionsRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${formattedTitle}&limit=5&namespace=0&format=json&origin=*`)
  const suggestionsData = await suggestionsRes.json()
  const relatedArticles = suggestionsData?.[1]?.map((title: string, index: number) => ({
    title,
    summary: '',
    url: suggestionsData[3][index]
  })) || []

  if (isExactMatch) {
    return {
      title: summaryData.title,
      summary: summaryData.extract,
      articleContent, // include full HTML
      url: summaryData.content_urls.desktop.page,
      id: Math.floor(Math.random() * 10000),
      mediaUrl: summaryData.thumbnail?.source || '',
      relatedArticles
    }
  }

  return {
    title: searchTitle,
    summary: '',
    url: '',
    id: Math.floor(Math.random() * 10000),
    mediaUrl: '',
    articleContent: '',
    relatedArticles
  }
}
