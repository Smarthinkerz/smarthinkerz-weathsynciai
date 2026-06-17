/**
 * Contact Verification Service
 * 
 * This service integrates with Apollo.io to provide verified company contacts
 * when available, and clearly indicates when contact information is from
 * a verified source vs. when it's not available.
 */
import { ApolloApiService } from './apollo-api-service';

export interface ContactInfo {
  firstName: string;
  lastName: string;
  position: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  isVerified: boolean;
  source: string;
}

export class ContactVerificationService {
  private readonly apolloService: ApolloApiService;
  
  constructor() {
    this.apolloService = new ApolloApiService();
  }
  
  /**
   * Get contacts for a specific company, using verified API sources when available
   * 
   * @param companyName The name of the company to get contacts for
   * @param industry The industry of the company
   * @param country The country of the company 
   * @param leadType The type of lead (determines positions to look for)
   * @returns Array of contacts with verification status
   */
  public async getCompanyContacts(
    companyName: string,
    industry: string,
    country: string,
    leadType: string
  ): Promise<ContactInfo[]> {
    try {
      // Check if Apollo API is available
      const isApolloAvailable = await this.apolloService.isReady();
      
      if (isApolloAvailable) {
        try {
          // Try to get verified contacts from Apollo
          const apolloContacts = await this.apolloService.searchContactsByCompany(
            companyName, 
            this.getApolloPositions(leadType),
            country
          );
          
          if (apolloContacts && apolloContacts.length > 0) {
            // Convert Apollo contacts to our internal format
            const verifiedContacts = apolloContacts.map(contact => ({
              firstName: contact.first_name,
              lastName: contact.last_name,
              position: contact.title,
              email: contact.email,
              phone: contact.phone_number,
              linkedIn: contact.linkedin_url,
              isVerified: true,
              source: 'Apollo.io'
            }));
            
            console.log(`Found ${verifiedContacts.length} verified contacts for ${companyName} via Apollo.io`);
            return verifiedContacts;
          }
        } catch (error) {
          console.error(`Error getting Apollo contacts for ${companyName}:`, error);
        }
      }
      
      // If we reach here, we couldn't get verified contacts
      // Return an empty array - lead generation service will handle this case
      console.log(`No verified contacts available for ${companyName}`);
      return [];
    } catch (error) {
      console.error('Error in contact verification service:', error);
      return [];
    }
  }
  
  private getApolloPositions(leadType: string): string[] {
    // Map lead types to specific positions for Apollo search
    const positionMap: Record<string, string[]> = {
      'decision-maker': ['CEO', 'Chief Executive Officer', 'Director', 'VP', 'Vice President'],
      'influencer': ['Manager', 'Director', 'Consultant'],
      'technical-buyer': ['CTO', 'Chief Technology Officer', 'Technical Director', 'IT Manager'],
      'economic-buyer': ['CFO', 'Chief Financial Officer', 'Finance Director'],
      'end-user': ['employee', 'user', 'customer'],
      'sales': ['Sales Manager', 'Sales Director', 'Business Development'],
      'marketing': ['Marketing Manager', 'Marketing Director', 'CMO'],
      'executive': ['CEO', 'President', 'Managing Director', 'Partner'],
      'default': ['Manager', 'Director']
    };
    
    return positionMap[leadType.toLowerCase()] || positionMap['default'];
  }
}