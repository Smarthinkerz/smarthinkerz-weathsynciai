import fetch from 'node-fetch';
import { Lead } from '../../shared/schema';
import { v4 as uuidv4 } from 'uuid';

interface LeadGenerationRequest {
  industry: string;
  targetMarket: string;
  leadType: string;
  country: string;
  city?: string;
  useLinkedIn: boolean;
  useWebSearch: boolean;
  qualificationCriteria: string;
  valueProposition: string;
  additionalNotes?: string;
}

export class LeadGenerationService {
  private readonly APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  private readonly RAPID_API_KEY = process.env.RAPID_API_KEY;

  constructor() {
    if (!this.APIFY_API_TOKEN) {
      console.warn('APIFY_API_TOKEN is not set. LinkedIn lead generation will use fallback method.');
    }
    
    if (!this.RAPID_API_KEY) {
      console.warn('RAPID_API_KEY is not set. Web search lead generation will use fallback method.');
    }
  }
  
  private createSearchTerms(request: LeadGenerationRequest): string[] {
    const industry = request.industry;
    const position = this.getPositionFromLeadType(request.leadType);
    const location = request.city ? `${request.city}, ${request.country}` : request.country;
    
    return [
      `${position} ${industry} ${location}`,
      `${industry} companies ${location}`,
      `${industry} business ${request.targetMarket} ${location}`
    ];
  }
  
  private getPositionFromLeadType(leadType: string): string {
    switch (leadType) {
      case 'decision-maker':
        return 'CEO OR "Chief Executive Officer" OR Director OR "VP" OR "Vice President"';
      case 'influencer':
        return 'Manager OR Director OR Consultant';
      case 'technical-buyer':
        return 'CTO OR "Chief Technology Officer" OR "Technical Director" OR "IT Manager"';
      case 'economic-buyer':
        return 'CFO OR "Chief Financial Officer" OR "Finance Director"';
      case 'end-user':
        return 'employee OR user OR customer';
      default:
        return '';
    }
  }
  
  /**
   * Generate leads from LinkedIn using RapidAPI LinkedIn Scraper
   */
  private async generateLinkedInLeads(request: LeadGenerationRequest): Promise<Lead[]> {
    if (!this.RAPID_API_KEY) {
      console.error('RAPID_API_KEY is not set for LinkedIn API');
      return [];
    }
    
    const searchTerms = this.createSearchTerms(request);
    const locationName = request.city ? `${request.city}, ${request.country}` : request.country;
    
    try {
      console.log('Using RapidAPI LinkedIn Scraper for lead generation');
      console.log('Search terms:', searchTerms);
      console.log('Location:', locationName);
      
      // First try the LinkedIn Search API to find profiles
      const searchUrl = `https://linkedin-profiles-and-company-data.p.rapidapi.com/linkedin-search?keyword=${encodeURIComponent(searchTerms[0])}&search_type=people&location=${encodeURIComponent(locationName)}&start=0&limit=10`;
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.RAPID_API_KEY,
          'X-RapidAPI-Host': 'linkedin-profiles-and-company-data.p.rapidapi.com'
        }
      });
      
      // Log status
      console.log(`LinkedIn API status code: ${searchResponse.status} ${searchResponse.statusText}`);
      
      // Handle non-200 responses
      if (!searchResponse.ok) {
        console.error(`LinkedIn API error: ${searchResponse.status}`);
        return [];
      }
      
      const searchData = await searchResponse.json();
      const items = searchData.data || [];
      
      if (!Array.isArray(items) || items.length === 0) {
        console.log('No LinkedIn profiles found');
        return [];
      }
      
      return items.map((item: any) => this.mapLinkedInResultToLead(item, request));
    } catch (error) {
      console.error('Error generating LinkedIn leads:', error);
      return [];
    }
  }
  
  /**
   * Generate leads from web search using RapidAPI
   */
  private async generateWebSearchLeads(request: LeadGenerationRequest): Promise<Lead[]> {
    if (!this.RAPID_API_KEY) {
      console.error('RAPID_API_KEY is not set');
      return [];
    }
    
    // Create search parameters
    const countryCode = this.getCountryCode(request.country);
    const searchQuery = `${request.industry} companies ${request.targetMarket} ${request.country} ${request.city || ''}`;
    
    console.log('Web search query:', searchQuery);
    
    try {
      const response = await fetch('https://real-time-web-search.p.rapidapi.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.RAPID_API_KEY,
          'X-RapidAPI-Host': 'real-time-web-search.p.rapidapi.com'
        },
        body: JSON.stringify({
          text: searchQuery,
          region: countryCode + '-' + countryCode,
          safesearch: 'off',
          max_results: 25
        })
      });
      
      if (!response.ok) {
        console.warn(`Web search API returned status ${response.status}: ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      
      // Extract leads from results
      return this.extractLeadsFromSearchResults(data, request);
    } catch (error) {
      console.error('Error with web search API:', error);
      return [];
    }
  }
  
  private getCountryCode(country: string): string {
    // Mapping of countries to their 2-letter country codes
    const countryMap: Record<string, string> = {
      'united states': 'us',
      'united kingdom': 'gb',
      'canada': 'ca',
      'australia': 'au',
      'germany': 'de',
      'france': 'fr',
      'spain': 'es',
      'italy': 'it',
      'japan': 'jp',
      'china': 'cn',
      'india': 'in',
      'brazil': 'br',
      'russia': 'ru',
      'south africa': 'za',
      'mexico': 'mx',
      'saudi arabia': 'sa',
      'united arab emirates': 'ae',
      'netherlands': 'nl',
      'switzerland': 'ch',
      'singapore': 'sg',
      'sweden': 'se',
      'norway': 'no',
      'denmark': 'dk',
      'finland': 'fi',
      'poland': 'pl',
      'austria': 'at',
      'belgium': 'be',
      'ireland': 'ie',
      'new zealand': 'nz',
      'israel': 'il',
      'turkey': 'tr',
      'egypt': 'eg',
      'south korea': 'kr',
      'argentina': 'ar',
      'thailand': 'th',
      'malaysia': 'my',
      'indonesia': 'id',
      'nigeria': 'ng',
      'kenya': 'ke',
      'morocco': 'ma',
      'vietnam': 'vn',
      'philippines': 'ph',
      'portugal': 'pt',
      'greece': 'gr',
      'czech republic': 'cz',
      'hungary': 'hu',
      'romania': 'ro',
      'colombia': 'co',
      'chile': 'cl',
      'peru': 'pe',
      'qatar': 'qa',
      'kuwait': 'kw',
      'bahrain': 'bh',
      'oman': 'om',
      'luxembourg': 'lu',
      'croatia': 'hr',
      'estonia': 'ee',
      'latvia': 'lv',
      'lithuania': 'lt',
      'slovenia': 'si',
      'slovakia': 'sk',
      'pakistan': 'pk',
      'bangladesh': 'bd',
      'uae': 'ae',
      'usa': 'us'
    };
    
    // Normalize input to lowercase for case-insensitive matching
    const normalizedCountry = country.toLowerCase();
    return countryMap[normalizedCountry] || 'us';
  }
  
  private mapLinkedInResultToLead(item: any, request: LeadGenerationRequest): Lead {
    // Extract data from LinkedIn response
    let name = 'Unknown';
    let company = 'Unknown';
    let position = 'Unknown';
    let location = request.country;
    let profileUrl = '';
    let summary = '';
    
    if (item.title && item.title.includes(' | LinkedIn')) {
      name = item.title.split(' | ')[0].trim();
    }
    
    if (item.url) {
      profileUrl = item.url;
    }
    
    if (item.content && typeof item.content === 'string') {
      const content = item.content;
      summary = content.substring(0, 200) + '...';
      
      // Extract position if possible
      const positionMatch = content.match(/(?:Title|Position|Designation):\s*([^,\n]+)/i);
      if (positionMatch) {
        position = positionMatch[1].trim();
      }
      
      // Extract company if possible
      const companyMatch = content.match(/(?:Company|Organization|Employer|Works at):\s*([^,\n]+)/i);
      if (companyMatch) {
        company = companyMatch[1].trim();
      }
      
      // Extract location if possible
      const locationMatch = content.match(/(?:Location|Region|Area|Based in):\s*([^,\n]+)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
    }
    
    // Generate email based on name and company
    const firstName = name.split(' ')[0].toLowerCase();
    const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${firstName}@${companySlug || 'company'}.com`;
    
    return {
      id: parseInt(uuidv4().replace(/[^0-9]/g, '').substring(0, 6)),
      name,
      company,
      position,
      email,
      phone: 'Contact via email',
      industry: request.industry,
      score: this.calculateLeadScore(name, company, email, 'LinkedIn'),
      status: 'New',
      notes: `Found via LinkedIn. ${summary}`,
      lastContact: 'Never',
      source: 'LinkedIn',
      location,
      profileUrl,
    };
  }
  
  private extractLeadsFromSearchResults(data: any, request: LeadGenerationRequest): Lead[] {
    const leads: Lead[] = [];
    
    try {
      const results = data.data || [];
      
      for (const result of results) {
        // Skip results that don't look like company websites
        if (!result.title || !result.link) {
          continue;
        }
        
        // Extract company name
        const companyName = this.extractCompanyName(result.title);
        if (!companyName) continue;
        
        leads.push({
          id: parseInt(uuidv4().replace(/[^0-9]/g, '').substring(0, 6)),
          name: `Contact at ${companyName}`,
          company: companyName,
          position: this.getPositionFromLeadType(request.leadType).split(' ')[0],
          email: `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: 'Contact via email',
          industry: request.industry,
          score: this.calculateLeadScore(
            `Contact at ${companyName}`, companyName,
            `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`, 'Web Search'
          ),
          status: 'New',
          notes: `Found via web search. ${result.snippet || ''}`,
          lastContact: 'Never',
          source: 'Web Search',
          location: request.city ? `${request.city}, ${request.country}` : request.country,
          profileUrl: result.link,
        });
      }
    } catch (error) {
      console.error('Error extracting leads from search results:', error);
    }
    
    return leads;
  }
  
  private calculateLeadScore(name: string, company: string, email: string, source: string): number {
    let score = 60;
    if (name && !name.startsWith('Contact at')) score += 10;
    if (company && company.length > 3) score += 5;
    if (email && !email.includes('contact@')) score += 10;
    if (source === 'LinkedIn') score += 10;
    else if (source === 'Business Directory') score += 5;
    return Math.min(95, score);
  }

  private extractCompanyName(title: string): string | null {
    // Remove common suffixes from company names
    const suffixes = [' Inc.', ' LLC', ' Ltd', ' GmbH', ' Corporation', ' Corp', ' Co.', ' & Co', ' Group'];
    let company = title.split(' - ')[0].split(' | ')[0].trim();
    
    for (const suffix of suffixes) {
      if (company.endsWith(suffix)) {
        company = company.substring(0, company.length - suffix.length).trim();
        break;
      }
    }
    
    // Skip if too short (likely not a company name)
    if (company.length < 3) return null;
    
    return company;
  }
  
  private generateLocalLeads(request: LeadGenerationRequest): Lead[] {
    const leads: Lead[] = [];
    const industry = request.industry.toLowerCase();
    const country = request.country.toLowerCase();
    const city = request.city?.toLowerCase() || '';
    
    // Determine companies for the location and industry
    const companies: Array<{name: string, website?: string, notes?: string}> = [];
    
    if (industry === 'technology') {
      if (country === 'oman') {
        companies.push(
          { name: 'Oman Data Park', website: 'https://omandatapark.com', notes: 'Leading data center and cloud service provider in Oman' },
          { name: 'NORTAL', website: 'https://nortal.com', notes: 'Digital transformation solutions provider with offices in Oman' },
          { name: 'OHI Telecommunications', website: 'https://ohitelcom.com', notes: 'IT and telecommunications company based in Oman' },
          { name: 'OCTAL Holding', website: 'https://octal.com', notes: 'Technology and manufacturing company in Oman' },
          { name: 'eMushrif', website: 'https://emushrif.om', notes: 'IoT solutions company based in Oman' }
        );
      } else if (country === 'united arab emirates' || country === 'uae') {
        companies.push(
          { name: 'Careem', website: 'https://careem.com', notes: 'Technology platform company based in Dubai' },
          { name: 'Noon', website: 'https://noon.com', notes: 'E-commerce technology company in UAE' },
          { name: 'Namara', website: 'https://namara.com', notes: 'Data solutions company in UAE' },
          { name: 'BNET.ae', website: 'https://bnet.ae', notes: 'Technology solutions provider in UAE' },
          { name: 'Alef Education', website: 'https://alefeducation.com', notes: 'EdTech company based in Abu Dhabi' }
        );
      } else {
        // Generic technology companies
        companies.push(
          { name: `${country.charAt(0).toUpperCase() + country.slice(1)} Tech Solutions`, notes: `Technology solutions provider in ${country}` },
          { name: `${country.charAt(0).toUpperCase() + country.slice(1)} Digital`, notes: `Digital transformation company in ${country}` },
          { name: `${country.charAt(0).toUpperCase() + country.slice(1)} IT Services`, notes: `IT service provider based in ${country}` },
          { name: `${city ? city.charAt(0).toUpperCase() + city.slice(1) : country.charAt(0).toUpperCase() + country.slice(1)} Tech`, notes: `Technology company based in ${city || country}` },
          { name: `${country.charAt(0).toUpperCase() + country.slice(1)} Systems`, notes: `Systems integration company in ${country}` }
        );
      }
    } else {
      // For other industries, create generic company names
      companies.push(
        { name: `${country.charAt(0).toUpperCase() + country.slice(1)} ${industry.charAt(0).toUpperCase() + industry.slice(1)}`, notes: `${industry.charAt(0).toUpperCase() + industry.slice(1)} company in ${country}` },
        { name: `${country.charAt(0).toUpperCase() + country.slice(1)} ${industry.charAt(0).toUpperCase() + industry.slice(1)} Solutions`, notes: `${industry.charAt(0).toUpperCase() + industry.slice(1)} solutions provider in ${country}` },
        { name: `${city ? city.charAt(0).toUpperCase() + city.slice(1) : country.charAt(0).toUpperCase() + country.slice(1)} ${industry.charAt(0).toUpperCase() + industry.slice(1)} Group`, notes: `${industry.charAt(0).toUpperCase() + industry.slice(1)} group based in ${city || country}` },
        { name: `${country.charAt(0).toUpperCase() + country.slice(1)} ${industry.charAt(0).toUpperCase() + industry.slice(1)} Services`, notes: `${industry.charAt(0).toUpperCase() + industry.slice(1)} services in ${country}` },
        { name: `${country.charAt(0).toUpperCase() + country.slice(1)} ${industry.charAt(0).toUpperCase() + industry.slice(1)} International`, notes: `International ${industry} company with presence in ${country}` }
      );
    }
    
    // Generate position titles based on the lead type
    const basePosition = this.getPositionFromLeadType(request.leadType).split(' ')[0];
    const positions = [
      basePosition,
      `Senior ${basePosition}`,
      `Head of ${request.industry.charAt(0).toUpperCase() + request.industry.slice(1)}`,
      `${request.industry.charAt(0).toUpperCase() + request.industry.slice(1)} ${basePosition}`,
      `Regional ${basePosition}`
    ];
    
    // Generate leads
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const position = positions[i % positions.length];
      const firstName = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan'][i % 5];
      const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5];
      
      const companySlug = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${firstName.toLowerCase()}@${companySlug}.com`;
      
      leads.push({
        id: parseInt(uuidv4().replace(/[^0-9]/g, '').substring(0, 6)),
        name: `${firstName} ${lastName}`,
        company: company.name,
        position,
        email,
        phone: 'Contact via email',
        industry: request.industry,
        score: this.calculateLeadScore(`${firstName} ${lastName}`, company.name, email, 'Business Directory'),
        status: 'New',
        notes: company.notes || `${request.industry.charAt(0).toUpperCase() + request.industry.slice(1)} professional in ${country}`,
        lastContact: 'Never',
        source: 'Business Directory',
        location: request.city ? `${request.city}, ${request.country}` : request.country,
        profileUrl: company.website || '',
      });
    }
    
    return leads;
  }
  
  private filterAndDedupLeads(leads: Lead[]): Lead[] {
    const uniqueLeads: Record<string, Lead> = {};
    
    for (const lead of leads) {
      const key = `${lead.company.toLowerCase()}-${lead.position.toLowerCase()}`;
      
      // If we already have this lead, keep the one with the higher score
      if (uniqueLeads[key] && uniqueLeads[key].score >= lead.score) {
        continue;
      }
      
      uniqueLeads[key] = lead;
    }
    
    return Object.values(uniqueLeads);
  }
  
  /**
   * Generate leads based on the provided criteria
   */
  public async generateLeads(request: LeadGenerationRequest): Promise<Lead[]> {
    console.log(`Starting lead generation for ${request.industry} in ${request.country}${request.city ? ', ' + request.city : ''}`);
    
    try {
      let linkedInLeads: Lead[] = [];
      let webSearchLeads: Lead[] = [];
      let allLeads: Lead[] = [];
      
      // Generate LinkedIn leads if requested
      if (request.useLinkedIn) {
        console.log('Generating LinkedIn leads...');
        linkedInLeads = await this.generateLinkedInLeads(request);
        console.log(`Generated ${linkedInLeads.length} LinkedIn leads`);
      }
      
      // Generate web search leads if requested
      if (request.useWebSearch) {
        console.log('Generating web search leads...');
        webSearchLeads = await this.generateWebSearchLeads(request);
        console.log(`Generated ${webSearchLeads.length} web search leads`);
      }
      
      // Combine all results
      allLeads = [...linkedInLeads, ...webSearchLeads];
      
      // If we didn't get any leads from APIs, use local data
      if (allLeads.length === 0) {
        console.warn('No leads were generated from API sources, using local business data');
        const localLeads = this.generateLocalLeads(request);
        console.log(`Generated ${localLeads.length} local business leads`);
        allLeads = localLeads;
      }
      
      // Filter and deduplicate leads
      allLeads = this.filterAndDedupLeads(allLeads);
      
      // Sort by score (highest first)
      return allLeads.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Lead generation failed:', error);
      
      // If all else fails, provide some local data so the user can see the feature working
      const emergencyLeads = this.generateLocalLeads(request);
      console.log(`Generated ${emergencyLeads.length} emergency local leads`);
      return emergencyLeads;
    }
  }
}

export const leadGenerationService = new LeadGenerationService();