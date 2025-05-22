/**
 * Initialize the reading progress indicator
 * Returns a cleanup function to remove the event listener
 */
export const initReadingProgress = () => {
  // First, create the reading progress elements if they don't exist
  let progressContainer = document.querySelector('.reading-progress-container')
  let progressBar = document.querySelector('.reading-progress-bar')
  
  if (!progressContainer) {
    progressContainer = document.createElement('div')
    progressContainer.className = 'reading-progress-container'
    document.body.appendChild(progressContainer)
    
    progressBar = document.createElement('div')
    progressBar.className = 'reading-progress-bar'
    progressContainer.appendChild(progressBar)
  }

  // Add reading time estimation to the article
  const addReadingTime = () => {
    const articleContent = document.querySelector('.article-content')
    const articleTitle = document.querySelector('.article-title')
    
    if (articleContent && articleTitle) {
      // Calculate reading time based on words (average reading speed: 200 words per minute)
      const text = articleContent.textContent || ''
      const wordCount = text.trim().split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 200)
      
      // Create reading time element if it doesn't exist
      let readingTimeEl = document.querySelector('.reading-time')
      if (!readingTimeEl) {
        readingTimeEl = document.createElement('div')
        readingTimeEl.className = 'reading-time'
        
        // Clock icon SVG
        readingTimeEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${readingTime} min read</span>
        `
        
        // Insert after the title
        articleTitle.insertAdjacentElement('afterend', readingTimeEl)
      }
    }
  }

  // Add drop cap styling to first paragraph
  const addDropCap = () => {
    const articleContent = document.querySelector('.article-content')
    if (articleContent) {
      const firstParagraph = articleContent.querySelector('p')
      if (firstParagraph) {
        // Apply drop cap effect via CSS class
        firstParagraph.classList.add('first-paragraph')
      }
    }
  }

  // Function to update the reading progress
  const updateReadingProgress = () => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight - windowHeight
    const scrollTop = window.scrollY
    const scrollPercentage = (scrollTop / documentHeight) * 100
    
    progressBar.style.width = `${scrollPercentage}%`
  }

  // Add event listener for scroll
  window.addEventListener('scroll', updateReadingProgress)
  
  // Initialize reading time and drop cap
  addReadingTime()
  addDropCap()
  
  // Initial update
  updateReadingProgress()
  
  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', updateReadingProgress)
    if (progressContainer && progressContainer.parentNode) {
      progressContainer.parentNode.removeChild(progressContainer)
    }
  }
}