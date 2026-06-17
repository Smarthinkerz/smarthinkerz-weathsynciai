/**
 * Google Knowledge Graph Search API Integration
 * Provides structured data about companies, industries, and market entities
 */

import fetch from 'node-fetch';

interface KnowledgeGraphEntity {
  '@type': string[];
  name: string;
  description?: string;
  detailedDescription?: {
    articleBody: string;
    url: string;
  };
  image?: {
    contentUrl: string;
  };
  url?: string;
  resultScore: number;
}

interface KnowledgeGraphResponse {
  itemListElement: Array<{
    result: KnowledgeGraphEntity;
    resultScore: number;
  }>;
}

interface CompanyInfo {
  name: string;
  description: string;
  industry: string[];
  website?: string;
  imageUrl?: string;
  confidence: number;
  source: string;
}

/**
 * Search Google Knowledge Graph for company information
 */
export async function searchCompanyKnowledgeGraph(companyName: string): Promise<CompanyInfo | null> {
  try {
    const apiKey = process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY;
    if (!apiKey) {
      console.log('Google Knowledge Graph API key not found');
      return null;
    }

    const encodedQuery = encodeURIComponent(companyName);
    const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodedQuery}&key=${apiKey}&limit=1&indent=True`;

    console.log(`Searching Knowledge Graph for: ${companyName}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Knowledge Graph API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: KnowledgeGraphResponse = await response.json();
    
    if (!data.itemListElement || data.itemListElement.length === 0) {
      console.log(`No Knowledge Graph results found for: ${companyName}`);
      return null;
    }

    const entity = data.itemListElement[0].result;
    const score = data.itemListElement[0].resultScore;

    // Extract industry information from entity types
    const industries = entity['@type']?.filter(type => 
      type !== 'Thing' && 
      type !== 'Organization' && 
      type !== 'Corporation'
    ) || [];

    const companyInfo: CompanyInfo = {
      name: entity.name,
      description: entity.description || entity.detailedDescription?.articleBody || 'No description available',
      industry: industries,
      website: entity.url,
      imageUrl: entity.image?.contentUrl,
      confidence: Math.min(score / 1000, 1.0), // Normalize score to 0-1
      source: 'Google Knowledge Graph'
    };

    console.log(`Knowledge Graph found: ${entity.name} (confidence: ${(companyInfo.confidence * 100).toFixed(1)}%)`);
    return companyInfo;

  } catch (error) {
    console.error('Knowledge Graph API error:', error);
    return null;
  }
}

/**
 * Search Knowledge Graph for industry/market information
 */
export async function searchIndustryKnowledgeGraph(industry: string, country?: string): Promise<{
  name: string;
  description: string;
  marketData?: any;
  confidence: number;
} | null> {
  try {
    const apiKey = process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY;
    if (!apiKey) return null;

    const searchQuery = country ? `${industry} industry ${country}` : `${industry} industry`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodedQuery}&key=${apiKey}&limit=3&indent=True`;

    console.log(`Searching Knowledge Graph for industry: ${searchQuery}`);
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: KnowledgeGraphResponse = await response.json();
    
    if (!data.itemListElement || data.itemListElement.length === 0) {
      return null;
    }

    const entity = data.itemListElement[0].result;
    const score = data.itemListElement[0].resultScore;

    return {
      name: entity.name,
      description: entity.description || entity.detailedDescription?.articleBody || 'No description available',
      confidence: Math.min(score / 1000, 1.0),
    };

  } catch (error) {
    console.error('Knowledge Graph industry search error:', error);
    return null;
  }
}

/**
 * Enhanced company verification using Knowledge Graph
 */
export async function verifyCompanyWithKnowledgeGraph(companyName: string): Promise<{
  isVerified: boolean;
  verificationData?: CompanyInfo;
  confidence: number;
}> {
  const knowledgeGraphData = await searchCompanyKnowledgeGraph(companyName);
  
  if (!knowledgeGraphData) {
    return {
      isVerified: false,
      confidence: 0
    };
  }

  // Consider verified if confidence is above 50% and has substantial information
  const isVerified = knowledgeGraphData.confidence > 0.5 && 
                    knowledgeGraphData.description.length > 50;

  return {
    isVerified,
    verificationData: knowledgeGraphData,
    confidence: knowledgeGraphData.confidence
  };
}

/**
 * Get market intelligence from Knowledge Graph
 */
export async function getMarketIntelligence(query: string): Promise<{
  entities: Array<{
    name: string;
    description: string;
    type: string[];
    confidence: number;
  }>;
  marketInsights: string[];
}> {
  try {
    const apiKey = process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY;
    if (!apiKey) return { entities: [], marketInsights: [] };

    const encodedQuery = encodeURIComponent(query);
    const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodedQuery}&key=${apiKey}&limit=5&indent=True`;

    const response = await fetch(url);
    if (!response.ok) return { entities: [], marketInsights: [] };

    const data: KnowledgeGraphResponse = await response.json();
    
    const entities = data.itemListElement?.map(item => ({
      name: item.result.name,
      description: item.result.description || item.result.detailedDescription?.articleBody || '',
      type: item.result['@type'] || [],
      confidence: Math.min(item.resultScore / 1000, 1.0)
    })) || [];

    // Extract market insights from descriptions
    const marketInsights = entities
      .filter(entity => entity.confidence > 0.3)
      .map(entity => entity.description)
      .filter(desc => desc.length > 20);

    return { entities, marketInsights };

  } catch (error) {
    console.error('Knowledge Graph market intelligence error:', error);
    return { entities: [], marketInsights: [] };
  }
}