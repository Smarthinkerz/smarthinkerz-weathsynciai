import fetch from 'node-fetch';

interface WebScraperResult {
  url: string;
  title: string;
  description: string;
  content: string;
  metadata: {
    links?: string[];
    images?: string[];
    technologies?: string[];
    contactInfo?: {
      emails?: string[];
      phones?: string[];
      socialProfiles?: string[];
    };
  };
  status: string;
  error?: string;
}

/**
 * Web Scraper Service using Apify's Web Scraper
 * Used to extract content from websites for AI analysis
 */
export async function scrapeWebsiteWithApify(url: string): Promise<WebScraperResult> {
  try {
    // Normalize URL format
    if (!url.match(/^(http|https):\/\//)) {
      url = 'https://' + url;
    }

    console.log(`Scraping website with Apify: ${url}`);
    
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      throw new Error('APIFY_API_TOKEN is not set in environment variables');
    }

    // Use Apify's Cheerio Scraper instead of Web Scraper for better compatibility
    // We'll directly run an actor without checking first - if it fails, we'll fall back to our simple scraper
    const actorId = 'apify/cheerio-scraper';
    
    console.log(`Using Apify actor: ${actorId}`);

    // Start the crawler run
    const startRunOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyToken}`
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxCrawlPages: 10,  // Limit the crawl to avoid excessive usage
        // Cheerio scraper uses a different function format
        pageFunction: `async function pageFunction({ request, $, body, enqueueRequest, log }) {
          log.info('Page loaded', { url: request.url });
          
          // Extract title and description
          const title = $('title').text().trim() || 'Unknown Title';
          const description = $('meta[name="description"]').attr('content') || 'No description available';
          
          // Extract main content
          // Remove scripts and styles before getting text
          $('script, style').remove();
          const content = $('body').text().trim().replace(/\\s+/g, ' ');
          
          // Extract links
          const links = [];
          $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
              links.push(href);
            }
          });
          
          // Extract images
          const images = [];
          $('img[src]').each((i, el) => {
            const src = $(el).attr('src');
            if (src && !src.startsWith('data:')) {
              images.push(src);
            }
          });
          
          // Extract contact info using regex
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
          const phoneRegex = /(?:\\+\\d{1,3}\\s?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}/g;
          
          const bodyText = $('body').text();
          const emails = bodyText.match(emailRegex) || [];
          const phones = bodyText.match(phoneRegex) || [];
          
          // Look for social profiles
          const socialProfiles = [];
          const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com'];
          
          socialDomains.forEach(domain => {
            $('a[href*="' + domain + '"]').each((i, el) => {
              const href = $(el).attr('href');
              if (href) socialProfiles.push(href);
            });
          });
          
          // Detect technologies
          const technologies = [];
          
          // Basic technology detection
          if ($('script[src*="jquery"]').length) technologies.push('jQuery');
          if ($('div[data-reactroot], div[data-reactid]').length) technologies.push('React');
          if ($('[ng-app], [ng-controller], [ng-model]').length) technologies.push('Angular');
          if ($('[data-v-]').length) technologies.push('Vue.js');
          
          // CMS detection
          if ($('meta[name="generator"][content*="WordPress"]').length) technologies.push('WordPress');
          if ($('meta[name="generator"][content*="Drupal"]').length) technologies.push('Drupal');
          if ($('meta[name="generator"][content*="Joomla"]').length) technologies.push('Joomla');
          
          return {
            url: request.url,
            title,
            description,
            content,
            metadata: {
              links,
              images,
              technologies,
              contactInfo: {
                emails,
                phones,
                socialProfiles
              }
            }
          };
        }`
      })
    };

    // Run the actor directly instead of using actor-tasks
    const startRunResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`, startRunOptions);
    
    if (!startRunResponse.ok) {
      // Try to get error details
      let errorDetails = '';
      try {
        const errorResponse = await startRunResponse.text();
        errorDetails = errorResponse;
      } catch (e) {
        errorDetails = 'Could not get error details';
      }
      
      throw new Error(`Apify actor run failed: ${startRunResponse.status} ${errorDetails}`);
    }
    
    const runInfo = await startRunResponse.json() as any;
    const runId = runInfo.data?.id;
    
    if (!runId) {
      throw new Error('Failed to get run ID from Apify');
    }
    
    // Poll for the run to complete (with timeout)
    const maxAttempts = 20; 
    let attempts = 0;
    let runFinished = false;
    
    while (!runFinished && attempts < maxAttempts) {
      attempts++;
      
      // Wait 3 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check run status
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      
      if (!statusResponse.ok) {
        console.warn(`Failed to check run status. Attempt ${attempts}/${maxAttempts}`);
        continue;
      }
      
      const statusData = await statusResponse.json() as any;
      const status = statusData.data?.status;
      
      if (status === 'SUCCEEDED' || status === 'FINISHED') {
        runFinished = true;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Apify run failed with status: ${status}`);
      }
      
      console.log(`Waiting for Apify run to complete. Status: ${status}, attempt ${attempts}/${maxAttempts}`);
    }
    
    if (!runFinished) {
      throw new Error('Timed out waiting for Apify run to complete');
    }
    
    // Get the results from the default dataset
    const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
    
    if (!resultsResponse.ok) {
      const errorText = await resultsResponse.text();
      throw new Error(`Failed to get Apify results: ${resultsResponse.status} ${errorText}`);
    }
    
    const results = await resultsResponse.json() as any[];
    
    if (!results || results.length === 0) {
      throw new Error('No results returned from Apify');
    }
    
    // Use the first result
    const data = results[0];
    
    // Parse and structure the response
    return {
      url: data.url || url,
      title: data.title || 'Unknown Title',
      description: data.description || 'No description available',
      content: data.content || 'No content available',
      metadata: {
        links: data.metadata?.links || [],
        images: data.metadata?.images || [],
        technologies: data.metadata?.technologies || [],
        contactInfo: data.metadata?.contactInfo || {}
      },
      status: 'success'
    };
  } catch (error) {
    console.error('Apify web scraping error:', error);
    return {
      url: url,
      title: 'Error',
      description: 'Failed to scrape website',
      content: 'An error occurred while trying to scrape the website content with Apify.',
      metadata: {
        links: [],
        images: [],
        technologies: [],
        contactInfo: {}
      },
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Simpler fallback scraper for basic content extraction
export async function simpleScrapeWebsite(url: string): Promise<WebScraperResult> {
  try {
    if (!url.match(/^(http|https):\/\//)) {
      url = 'https://' + url;
    }
    
    console.log(`Using simple scraper for: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Simple HTML parsing using regex
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Unknown Title';
    
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i);
    const description = descriptionMatch ? descriptionMatch[1] : 'No description available';
    
    // Extract text content by removing HTML tags
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    content = content.replace(/<[^>]*>/g, ' ');
    content = content.replace(/\s+/g, ' ').trim();
    
    // Extract links
    const linkMatches = html.match(/<a[^>]*href=["'](https?:\/\/[^"']*?)["'][^>]*>/gi) || [];
    const links = linkMatches.map(link => {
      const hrefMatch = link.match(/href=["'](https?:\/\/[^"']*?)["']/i);
      return hrefMatch ? hrefMatch[1] : null;
    }).filter(Boolean) as string[];
    
    return {
      url: url,
      title: title,
      description: description,
      content: content.substring(0, 5000), // Limit to reasonable size
      metadata: {
        links: links
      },
      status: 'success'
    };
  } catch (error) {
    console.error('Simple web scraping error:', error);
    return {
      url: url,
      title: 'Error',
      description: 'Failed to scrape website using simple method',
      content: 'An error occurred while trying to fetch the website content.',
      metadata: {
        links: []
      },
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export a function that tries both scrapers in sequence
export async function getWebsiteContent(url: string): Promise<WebScraperResult> {
  try {
    // Try Apify scraper first
    const result = await scrapeWebsiteWithApify(url);
    
    // If successful, return the result
    if (result.status === 'success' && result.content && result.content.length > 100) {
      return result;
    }
    
    console.log('Apify scraper failed or returned insufficient data, trying simple fallback scraper...');
    
    // If Apify scraper fails, try simple scraper
    const simpleResult = await simpleScrapeWebsite(url);
    return simpleResult;
  } catch (error) {
    console.error('All web scraping methods failed:', error);
    return {
      url: url,
      title: 'Error',
      description: 'All scraping methods failed',
      content: 'Unable to retrieve content from this website after multiple attempts.',
      metadata: {
        links: []
      },
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}