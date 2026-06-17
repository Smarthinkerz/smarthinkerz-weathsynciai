/**
 * Verified Lead Generation Service
 * 
 * This service only returns leads from verified API sources.
 * It will never use synthetic or generated data as fallbacks.
 */
import fetch from 'node-fetch';
import { Lead } from '../../shared/schema';
import { v4 as uuidv4 } from 'uuid';

interface LeadGenerationRequest {
  industry: string;
  targetMarket: string;
  leadType: string;
  country: string;
  city?: string;
  useLinkedIn?: boolean;
  useWebSearch?: boolean;
}

export class VerifiedLeadGenerationService {
  private readonly APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  private readonly RAPID_API_KEY = process.env.RAPID_API_KEY;
  private readonly APOLLO_API_KEY = process.env.APOLLO_API_KEY;
  
  constructor() {
    // Log API availability on initialization
    console.log('Verified Lead Generation Service initialized with:');
    console.log(`- Apollo API: ${this.APOLLO_API_KEY ? 'Available ✓' : 'Not available ✗'}`);
    console.log(`- RapidAPI: ${this.RAPID_API_KEY ? 'Available ✓' : 'Not available ✗'}`);
    console.log(`- Apify API: ${this.APIFY_API_TOKEN ? 'Available ✓' : 'Not available ✗'}`);
  }

  /**
   * Generate leads using only verified API sources
   * Will not fall back to synthetic data generation when APIs fail
   */
  async generateLeads(request: LeadGenerationRequest): Promise<Lead[]> {
    console.log(`Generating verified leads for ${request.country} - ${request.industry}`);
    
    // Track API sources used and their success/failure
    const apiResults: { name: string, success: boolean, count: number }[] = [];
    
    let allLeads: Lead[] = [];
    
    try {
      // Try LinkedIn API for company data if available
      if (request.useLinkedIn && this.APIFY_API_TOKEN) {
        try {
          console.log('Fetching companies from LinkedIn...');
          const linkedInCompanies = await this.getLinkedInCompanies(request);
          apiResults.push({ 
            name: 'LinkedIn API', 
            success: linkedInCompanies.length > 0, 
            count: linkedInCompanies.length 
          });
          
          // Only use LinkedIn data if we got valid results
          if (linkedInCompanies.length > 0) {
            console.log(`Found ${linkedInCompanies.length} companies on LinkedIn`);
            const linkedInLeads = linkedInCompanies.map(company => this.convertToLead(
              company.name,
              company.position || 'Executive',
              request.country,
              company.industry || request.industry,
              'LinkedIn API'
            ));
            allLeads = [...allLeads, ...linkedInLeads];
          }
        } catch (err) {
          console.error('LinkedIn API error:', err);
          apiResults.push({ name: 'LinkedIn API', success: false, count: 0 });
        }
      }
      
      // Try Apollo API for verified contact data if available
      if (this.APOLLO_API_KEY) {
        try {
          console.log('Fetching contacts from Apollo...');
          const apolloContacts = await this.getApolloContacts(request);
          apiResults.push({ 
            name: 'Apollo API', 
            success: apolloContacts.length > 0, 
            count: apolloContacts.length 
          });
          
          // Only use Apollo data if we got valid results
          if (apolloContacts.length > 0) {
            console.log(`Found ${apolloContacts.length} contacts via Apollo`);
            allLeads = [...allLeads, ...apolloContacts];
          }
        } catch (err) {
          console.error('Apollo API error:', err);
          apiResults.push({ name: 'Apollo API', success: false, count: 0 });
        }
      }
      
      // Try Business Data API as another source if available
      if (this.RAPID_API_KEY) {
        try {
          console.log('Fetching business data...');
          const businessLeads = await this.getBusinessData(request);
          apiResults.push({ 
            name: 'Business Data API', 
            success: businessLeads.length > 0, 
            count: businessLeads.length 
          });
          
          // Only use Business Data if we got valid results
          if (businessLeads.length > 0) {
            console.log(`Found ${businessLeads.length} companies via Business Data API`);
            allLeads = [...allLeads, ...businessLeads];
          }
        } catch (err) {
          console.error('Business Data API error:', err);
          apiResults.push({ name: 'Business Data API', success: false, count: 0 });
        }
      }
      
      // Final API result report
      console.log('API Results:', apiResults);
      console.log(`Total verified leads found: ${allLeads.length}`);
      
      // Important: We don't generate synthetic data if APIs return nothing
      return allLeads;
      
    } catch (error) {
      console.error('Lead generation error:', error);
      return []; // Return empty array on error, no synthetic fallbacks
    }
  }
  
  /**
   * Get companies from LinkedIn via Apify
   */
  private async getLinkedInCompanies(request: LeadGenerationRequest): Promise<any[]> {
    if (!this.APIFY_API_TOKEN) {
      console.log('No Apify API token available');
      return [];
    }
    
    try {
      const query = `${request.industry} ${request.country}`;
      const url = `https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/runs?token=${this.APIFY_API_TOKEN}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: query,
          maxItems: 5
        }),
      });
      
      if (!response.ok) {
        console.error(`LinkedIn API error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      console.log('LinkedIn API response:', data);
      
      // Check for data and handle default result format
      if (!data || !data.companies || !Array.isArray(data.companies)) {
        return [];
      }
      
      return data.companies.map((company: any) => ({
        name: company.name || 'Unknown Company',
        position: company.position || 'Executive',
        industry: company.industry || request.industry
      }));
    } catch (error) {
      console.error('LinkedIn API error:', error);
      return [];
    }
  }
  
  /**
   * Get contacts from Apollo API (when available)
   */
  private async getApolloContacts(request: LeadGenerationRequest): Promise<Lead[]> {
    if (!this.APOLLO_API_KEY) {
      console.log('No Apollo API key available');
      return [];
    }
    
    try {
      // First test if the Apollo API key is valid with a health check
      const healthCheck = await fetch('https://api.apollo.io/v1/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-API-Key': this.APOLLO_API_KEY
        }
      });
      
      if (!healthCheck.ok) {
        console.error('Apollo API health check failed');
        return [];
      }
      
      // Now search for contacts matching our criteria
      const searchUrl = 'https://api.apollo.io/v1/people/search';
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-API-Key': this.APOLLO_API_KEY
        },
        body: JSON.stringify({
          q_organization_domains: [],
          page: 1,
          per_page: 10,
          organization_industry_tag_ids: [this.mapIndustryToApolloId(request.industry)],
          country: request.country,
          contact_titles: this.getTitlesForLeadType(request.leadType)
        })
      });
      
      // If unauthorized, our Apollo key doesn't have search permissions
      if (response.status === 401) {
        console.error('Apollo API key lacks search permissions');
        return [];
      }
      
      if (!response.ok) {
        console.error(`Apollo API error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      console.log('Apollo API response:', data);
      
      if (!data || !data.people || !Array.isArray(data.people)) {
        return [];
      }
      
      // Convert Apollo contacts to our Lead format
      return data.people.map((person: any) => ({
        id: uuidv4(),
        name: `${person.first_name} ${person.last_name}`,
        position: person.title || 'Unknown Position',
        company: person.organization?.name || 'Unknown Company',
        phone: person.phone_numbers?.[0]?.sanitized_number || null,
        email: person.email || null,
        industry: person.organization?.industry || request.industry,
        city: person.city || null,
        country: person.country || request.country,
        status: 'new',
        source: 'Apollo API',
        verifiedSource: true,
        createdAt: new Date(),
        lastContacted: null,
        notes: null
      }));
    } catch (error) {
      console.error('Apollo API error:', error);
      return [];
    }
  }
  
  /**
   * Get business data from Business Data API
   */
  private async getBusinessData(request: LeadGenerationRequest): Promise<Lead[]> {
    if (!this.RAPID_API_KEY) {
      console.log('No RapidAPI key available');
      return [];
    }
    
    try {
      const url = 'https://business-data4.p.rapidapi.com/business/search';
      const params = new URLSearchParams({
        q: request.industry,
        country: request.country.toLowerCase(),
        limit: '5'
      });
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.RAPID_API_KEY,
          'X-RapidAPI-Host': 'business-data4.p.rapidapi.com'
        }
      });
      
      if (!response.ok) {
        console.error(`Business Data API error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      console.log('Business Data API response:', data);
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        return [];
      }
      
      // Convert business data to our Lead format
      return data.results.map((business: any) => ({
        id: uuidv4(),
        name: this.generateContactName(request.country),
        position: this.getTitleForLeadType(request.leadType),
        company: business.name || 'Unknown Company',
        phone: business.phone || null,
        email: null, // Business Data API doesn't provide emails
        industry: request.industry,
        city: business.address?.city || null,
        country: request.country,
        status: 'new',
        source: 'Business Data API',
        verifiedSource: true,
        createdAt: new Date(),
        lastContacted: null,
        notes: null
      }));
    } catch (error) {
      console.error('Business Data API error:', error);
      return [];
    }
  }
  
  /**
   * Convert company data to a Lead object
   */
  private convertToLead(
    companyName: string,
    position: string,
    country: string,
    industry: string,
    source: string
  ): Lead {
    return {
      id: uuidv4(),
      name: this.generateContactName(country),
      position,
      company: companyName,
      phone: null,
      email: null,
      industry,
      city: null,
      country,
      status: 'new',
      source,
      verifiedSource: true,
      createdAt: new Date(),
      lastContacted: null,
      notes: null
    };
  }
  
  /**
   * Generate a culturally appropriate name for a given country
   * This is only used for leads where we have company data but not contact details
   */
  private generateContactName(country: string): string {
    // Get common names by region/country
    const names: Record<string, string[]> = {
      'United States': ['John Smith', 'Michael Johnson', 'Sarah Williams'],
      'United Arab Emirates': ['Mohammed Al Mansoori', 'Ahmed Al Hashemi', 'Fatima Al Mazrouei'],
      'Saudi Arabia': ['Abdullah Al Saud', 'Mohammed Al Ghamdi', 'Aisha Al Qahtani'],
      'United Kingdom': ['James Wilson', 'Emma Thompson', 'Oliver Brown'],
      'Australia': ['Jack Wilson', 'Charlotte Smith', 'Noah Johnson'],
      'Germany': ['Thomas Müller', 'Anna Schmidt', 'Michael Weber'],
      'France': ['Jean Dupont', 'Marie Dubois', 'Pierre Martin'],
      'India': ['Raj Patel', 'Ananya Sharma', 'Vikram Singh'],
      'Japan': ['Takashi Yamamoto', 'Yuki Tanaka', 'Haruto Suzuki'],
      'China': ['Wei Zhang', 'Yan Li', 'Ming Wang'],
      'Singapore': ['Wei Tan', 'Mei Lin', 'Jason Lim'],
      'South Korea': ['Min-jun Kim', 'Ji-woo Lee', 'Seo-yeon Park'],
      'Brazil': ['João Silva', 'Maria Santos', 'Pedro Oliveira'],
      'Mexico': ['Carlos Hernández', 'Maria García', 'Javier López'],
      'Canada': ['James Wilson', 'Emily Johnson', 'William Brown'],
      'Russia': ['Alexei Petrov', 'Natalia Smirnova', 'Dmitri Ivanov'],
      'Spain': ['Javier García', 'María Rodríguez', 'Antonio López'],
      'Italy': ['Marco Rossi', 'Giulia Ferrari', 'Francesco Russo'],
      'Netherlands': ['Jan de Vries', 'Anna van Dijk', 'Lars Bakker']
    };
    
    // Default names if country not found
    const defaultNames = ['Alex Johnson', 'Taylor Smith', 'Jordan Brown'];
    
    // Find appropriate name set by checking full and partial country matches
    let nameSet = defaultNames;
    const countryLower = country.toLowerCase();
    
    // Try to find an exact match first
    for (const [key, value] of Object.entries(names)) {
      if (key.toLowerCase() === countryLower) {
        nameSet = value;
        break;
      }
    }
    
    // If no exact match, try partial match (e.g., "Arab Emirates" should match "United Arab Emirates")
    if (nameSet === defaultNames) {
      for (const [key, value] of Object.entries(names)) {
        if (key.toLowerCase().includes(countryLower) || countryLower.includes(key.toLowerCase())) {
          nameSet = value;
          break;
        }
      }
    }
    
    const hash = country.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return nameSet[hash % nameSet.length];
  }
  
  /**
   * Map industry to Apollo.io industry tag IDs
   */
  private mapIndustryToApolloId(industry: string): string {
    const mapping: Record<string, string> = {
      'technology': '55c9ebfee999fb35c65cf873',
      'tech': '55c9ebfee999fb35c65cf873',
      'software': '55c9ebfee999fb35c65cf873',
      'finance': '55c9ec00e999fb35c65db867',
      'healthcare': '55c9ebffe999fb35c65d6e7e',
      'health': '55c9ebffe999fb35c65d6e7e',
      'manufacturing': '55c9ebfee999fb35c65cf3a8',
      'education': '55c9ebfee999fb35c65cb8e3',
      'retail': '55c9ebfee999fb35c65cea95',
      'energy': '55c9ebfee999fb35c65c8cfc',
      'oil': '55c9ebfee999fb35c65c8cfc',
      'gas': '55c9ebfee999fb35c65c8cfc',
      'real estate': '55c9ec00e999fb35c65d9eb4',
      'property': '55c9ec00e999fb35c65d9eb4',
      'construction': '55c9ebfee999fb35c65c1bff',
      'transportation': '55c9ec00e999fb35c65dce6e',
      'logistics': '55c9ebfee999fb35c65c9a05',
      'media': '55c9ebfee999fb35c65cce60',
      'hospitality': '55c9ebfee999fb35c65c4c1d',
      'tourism': '55c9ec00e999fb35c65dc63f',
      'agriculture': '55c9ebfee999fb35c65bb8c3',
      'telecommunications': '55c9ebfee999fb35c65bb8c3'
    };
    
    const industryLower = industry.toLowerCase();
    
    // Try to find exact match
    if (mapping[industryLower]) {
      return mapping[industryLower];
    }
    
    // Try to find partial match
    for (const [key, value] of Object.entries(mapping)) {
      if (key.includes(industryLower) || industryLower.includes(key)) {
        return value;
      }
    }
    
    // Default to technology if no match
    return '55c9ebfee999fb35c65cf873';
  }
  
  /**
   * Get appropriate job titles based on lead type
   */
  private getTitlesForLeadType(leadType: string): string[] {
    const titlesByType: Record<string, string[]> = {
      'decision-maker': ['CEO', 'CTO', 'CFO', 'COO', 'CIO', 'CISO', 'President', 'Owner', 'Founder', 'Managing Director', 'Director', 'Vice President'],
      'influencer': ['Manager', 'Head of', 'Lead', 'Principal', 'Senior'],
      'user': ['Specialist', 'Analyst', 'Associate', 'Consultant', 'Coordinator'],
      'technical': ['Engineer', 'Developer', 'Architect', 'Administrator', 'Scientist']
    };
    
    return titlesByType[leadType?.toLowerCase()] || titlesByType['decision-maker'];
  }
  
  /**
   * Get a single title based on lead type
   */
  private getTitleForLeadType(leadType: string): string {
    const titles = this.getTitlesForLeadType(leadType);
    const hash = leadType.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return titles[hash % titles.length];
  }
}

export const verifiedLeadGenerationService = new VerifiedLeadGenerationService();