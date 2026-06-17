/**
 * Apollo.io API Service for accurate business contact information
 * This service provides verified company executive data
 */
import fetch from 'node-fetch';

export interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title: string;
  email?: string;
  phone_number?: string;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    location?: string;
    industry?: string;
  };
}

export interface ApolloSearchOptions {
  q_organization_name?: string;
  page?: number;
  person_titles?: string[];
  organization_domains?: string[];
  country?: string;
  industry?: string;
  limit?: number;
}

export class ApolloApiService {
  private readonly API_KEY: string;
  private readonly API_BASE_URL = 'https://api.apollo.io/v1';

  constructor() {
    this.API_KEY = process.env.APOLLO_API_KEY || '';
    
    if (!this.API_KEY) {
      console.warn('Apollo API key not set. Contact information will be limited.');
    }
  }

  /**
   * Check if the Apollo API key is valid and ready to use
   */
  public async isReady(): Promise<boolean> {
    if (!this.API_KEY) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Api-Key ${this.API_KEY}`
        }
      });
      
      if (!response.ok) {
        console.warn('Apollo API health check failed:', response.status);
        return false;
      }
      
      const data = await response.json() as { healthy?: boolean };
      return data.healthy === true;
    } catch (error) {
      console.error('Error checking Apollo API health:', error);
      return false;
    }
  }

  /**
   * Search for contacts by company name and title
   */
  public async searchContactsByCompany(
    companyName: string, 
    titles: string[] = ['CEO', 'Chief Executive Officer', 'CTO', 'Chief Technology Officer'], 
    country?: string,
    industry?: string
  ): Promise<ApolloContact[]> {
    if (!this.isReady()) {
      console.warn('Apollo API key not set. Cannot search for contacts.');
      return [];
    }

    try {
      const options: ApolloSearchOptions = {
        q_organization_name: companyName,
        person_titles: titles,
        limit: 5, // Limit to 5 contacts per company to conserve API calls
        page: 1
      };

      if (country) {
        options.country = country;
      }

      if (industry) {
        options.industry = industry;
      }

      const response = await fetch(`${this.API_BASE_URL}/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Api-Key ${this.API_KEY}`
        },
        body: JSON.stringify(options)
      });

      console.log(`Apollo API response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Apollo API error: ${errorBody}`);
        return [];
      }

      const responseData = await response.json() as { people?: ApolloContact[] };
      console.log(`Apollo API returned ${responseData?.people?.length || 0} contacts`);
      
      return responseData?.people || [];
    } catch (error) {
      console.error('Error searching Apollo contacts:', error);
      return [];
    }
  }

  /**
   * Search for contacts by domain
   */
  public async searchContactsByDomain(
    domain: string,
    titles: string[] = ['CEO', 'Chief Executive Officer', 'CTO', 'Chief Technology Officer']
  ): Promise<ApolloContact[]> {
    if (!this.isReady()) {
      console.warn('Apollo API key not set. Cannot search for contacts by domain.');
      return [];
    }

    try {
      const options: ApolloSearchOptions = {
        organization_domains: [domain],
        person_titles: titles,
        limit: 5,
        page: 1
      };

      const response = await fetch(`${this.API_BASE_URL}/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Api-Key ${this.API_KEY}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Apollo API error: ${errorBody}`);
        return [];
      }

      const responseData = await response.json() as { people?: ApolloContact[] };
      return responseData?.people || [];
    } catch (error) {
      console.error('Error searching Apollo contacts by domain:', error);
      return [];
    }
  }
  
  /**
   * Enrich a company with verified contacts
   */
  public async enrichCompany(
    companyName: string,
    domain?: string,
    country?: string,
    industry?: string
  ): Promise<ApolloContact[]> {
    // Try domain search first if we have a domain
    if (domain) {
      const domainContacts = await this.searchContactsByDomain(domain);
      if (domainContacts.length > 0) {
        return domainContacts;
      }
    }
    
    // Fall back to company name search
    return this.searchContactsByCompany(companyName, undefined, country, industry);
  }
}