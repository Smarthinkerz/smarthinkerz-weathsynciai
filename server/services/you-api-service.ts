import fetch from 'node-fetch';

interface YouSearchResult {
  title: string;
  url: string;
  snippet: string;
  type: string;
}

interface YouNewsResult {
  title: string;
  url: string;
  snippet: string;
  published_date: string;
  source: string;
}

interface MarketIntelligence {
  marketSize: string;
  growthRate: string;
  keyPlayers: string[];
  trends: string[];
  fundingOpportunities: string[];
}

class YouApiService {
  private apiKey: string;
  private baseUrl = 'https://api.ydc-index.io';

  constructor() {
    this.apiKey = process.env.YOU_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YOU_API_KEY not found in environment variables');
    }
  }

  async searchWeb(query: string, count: number = 10): Promise<YouSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('You.com API key not configured');
    }

    try {
      const params = new URLSearchParams({
        query,
        count: count.toString(),
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`You.com API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.hits?.results || data.hits || [];
    } catch (error) {
      console.error('You.com search error:', error);
      throw error;
    }
  }

  async searchNews(query: string, count: number = 10): Promise<YouNewsResult[]> {
    if (!this.apiKey) {
      throw new Error('You.com API key not configured');
    }

    try {
      const params = new URLSearchParams({
        query,
        count: count.toString(),
      });

      const response = await fetch(`${this.baseUrl}/news?${params}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`You.com News API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.news?.results || [];
    } catch (error) {
      console.error('You.com news search error:', error);
      throw error;
    }
  }

  async getMarketIntelligence(country: string, sector: string): Promise<MarketIntelligence> {
    const queries = [
      `${country} ${sector} market size 2024 2025`,
      `${country} ${sector} funding opportunities grants 2024`,
      `${country} ${sector} growth rate CAGR market analysis`,
      `${country} ${sector} key companies market leaders`,
      `${country} ${sector} investment trends 2024 2025`
    ];

    try {
      // Run multiple searches in parallel
      const searchPromises = queries.map(query => this.searchWeb(query, 5));
      const searchResults = await Promise.all(searchPromises);

      // Extract market intelligence from search results
      const marketIntelligence: MarketIntelligence = {
        marketSize: this.extractMarketSize(searchResults[0]),
        growthRate: this.extractGrowthRate(searchResults[2]),
        keyPlayers: this.extractKeyPlayers(searchResults[3]),
        trends: this.extractTrends(searchResults[4]),
        fundingOpportunities: this.extractFundingOpportunities(searchResults[1])
      };

      return marketIntelligence;
    } catch (error) {
      console.error('Market intelligence extraction error:', error);
      throw error;
    }
  }

  async getFundingOpportunities(country: string, sector: string): Promise<any[]> {
    const queries = [
      `${country} government grants ${sector} 2024 2025`,
      `${country} startup funding ${sector} programs`,
      `${country} innovation fund ${sector} applications`,
      `${country} ${sector} business development grants`
    ];

    try {
      const searchPromises = queries.map(query => this.searchWeb(query, 8));
      const results = await Promise.all(searchPromises);
      
      // Combine and process all results
      const allResults = results.flat();
      const fundingOpportunities = [];

      for (const result of allResults) {
        if (this.isFundingOpportunity(result)) {
          const opportunity = await this.processFundingOpportunity(result, country, sector);
          if (opportunity) {
            fundingOpportunities.push(opportunity);
          }
        }
      }

      return fundingOpportunities.slice(0, 10); // Return top 10
    } catch (error) {
      console.error('Funding opportunities search error:', error);
      return [];
    }
  }

  private extractMarketSize(results: YouSearchResult[]): string {
    for (const result of results) {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      
      // Look for market size patterns
      const patterns = [
        /\$[\d.,]+\s*(billion|million|trillion)/gi,
        /€[\d.,]+\s*(billion|million|trillion)/gi,
        /£[\d.,]+\s*(billion|million|trillion)/gi,
        /([\d.,]+)\s*(billion|million|trillion)\s*(dollars|euros|pounds)/gi
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }
    return 'Data not available';
  }

  private extractGrowthRate(results: YouSearchResult[]): string {
    for (const result of results) {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      
      // Look for growth rate patterns
      const patterns = [
        /([\d.]+)%\s*(cagr|growth|annually)/gi,
        /cagr\s*of\s*([\d.]+)%/gi,
        /growing\s*at\s*([\d.]+)%/gi
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }
    return 'Data not available';
  }

  private extractKeyPlayers(results: YouSearchResult[]): string[] {
    const players = new Set<string>();
    
    for (const result of results) {
      const text = result.snippet || '';
      
      // Common patterns for company names
      const companyPatterns = [
        /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]*)*)\s+(?:Inc|Ltd|Corp|Corporation|Company|Group|Holdings)/g,
        /(?:leading|major|key)\s+(?:companies|players|firms).*?([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]*)*)/g
      ];

      for (const pattern of companyPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          if (match[1] && match[1].length > 2) {
            players.add(match[1]);
          }
        }
      }
    }

    return Array.from(players).slice(0, 5);
  }

  private extractTrends(results: YouSearchResult[]): string[] {
    const trends = new Set<string>();
    
    for (const result of results) {
      const text = (result.snippet || '').toLowerCase();
      
      // Common trend keywords
      const trendKeywords = [
        'artificial intelligence', 'ai', 'machine learning', 'digital transformation',
        'cloud computing', 'automation', 'sustainability', 'green technology',
        'renewable energy', 'fintech', 'blockchain', 'iot', 'internet of things',
        'cybersecurity', 'data analytics', 'mobile technology', 'e-commerce'
      ];

      for (const keyword of trendKeywords) {
        if (text.includes(keyword)) {
          trends.add(keyword);
        }
      }
    }

    return Array.from(trends).slice(0, 5);
  }

  private extractFundingOpportunities(results: YouSearchResult[]): string[] {
    const opportunities = [];
    
    for (const result of results) {
      if (this.isFundingOpportunity(result)) {
        opportunities.push(result.title);
      }
    }

    return opportunities.slice(0, 5);
  }

  private isFundingOpportunity(result: YouSearchResult): boolean {
    const title = result.title || '';
    const snippet = result.snippet || '';
    const text = `${title} ${snippet}`.toLowerCase();
    
    const fundingKeywords = [
      'grant', 'funding', 'investment', 'loan', 'program', 'scheme',
      'initiative', 'fund', 'support', 'subsidy', 'incentive', 'award'
    ];

    const governmentKeywords = [
      'government', 'ministry', 'department', 'agency', 'public',
      'national', 'federal', 'state', 'regional', 'municipal'
    ];

    const hasFundingKeyword = fundingKeywords.some(keyword => text.includes(keyword));
    const hasGovernmentKeyword = governmentKeywords.some(keyword => text.includes(keyword));

    return hasFundingKeyword && (hasGovernmentKeyword || text.includes('official'));
  }

  private async processFundingOpportunity(result: YouSearchResult, country: string, sector: string): Promise<any | null> {
    try {
      // Extract funding amount if available
      const snippet = result.snippet || '';
      const amountMatch = snippet.match(/\$[\d.,]+\s*(?:million|billion|thousand)?/i);
      const amount = amountMatch ? amountMatch[0] : 'Amount not specified';

      return {
        name: result.title,
        description: result.snippet,
        provider: this.extractProvider(snippet),
        amount: amount,
        type: 'grant',
        sector: sector,
        country: country,
        applicationUrl: result.url,
        status: 'active',
        source: 'you.com',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing funding opportunity:', error);
      return null;
    }
  }

  private extractProvider(text: string): string {
    // Common government agency patterns
    const agencyPatterns = [
      /(?:department|ministry|agency|bureau|office)\s+of\s+[\w\s]+/gi,
      /[\w\s]+\s+(?:government|agency|department|ministry)/gi,
      /national\s+[\w\s]+\s+(?:fund|program|initiative)/gi
    ];

    for (const pattern of agencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Government Agency';
  }
}

export const youApiService = new YouApiService();