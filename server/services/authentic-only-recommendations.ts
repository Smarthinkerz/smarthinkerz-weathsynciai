// Authentic-Only Recommendations Service
// CRITICAL: Only verified, real funding opportunities - NO FAKE DATA

import { VerifiedFundingService } from './verified-funding-service';
import { YouApiService } from './you-api-service';

interface AuthenticRecommendation {
  name: string;
  matchScore: number;
  location: string;
  company: string;
  type: 'verified_funding' | 'research_based' | 'job_opportunity';
  description: string;
  source: string;
  verified: boolean;
}

export class AuthenticOnlyRecommendations {
  private youApiService: YouApiService;

  constructor() {
    this.youApiService = new YouApiService();
  }

  async getAuthenticRecommendations(
    userId: number,
    skills: string[],
    country: string
  ): Promise<AuthenticRecommendation[]> {
    const recommendations: AuthenticRecommendation[] = [];

    try {
      console.log(`🏛️ AUTHENTIC FUNDING ONLY: Getting verified funding for ${country}`);
      
      // 1. Get ONLY verified funding opportunities
      const verifiedStatus = VerifiedFundingService.getCountryFundingStatus(country);
      
      if (verifiedStatus.hasVerifiedData) {
        console.log(`✅ Found ${verifiedStatus.opportunities.length} verified funding opportunities for ${country}`);
        
        verifiedStatus.opportunities.forEach(opportunity => {
          // Calculate skill match score
          const skillMatch = this.calculateSkillMatch(skills, opportunity.sector);
          
          if (skillMatch > 0) {
            recommendations.push({
              name: opportunity.name,
              matchScore: skillMatch,
              location: opportunity.country,
              company: opportunity.provider,
              type: 'verified_funding',
              description: `${opportunity.description} Amount: ${opportunity.amount}`,
              source: `Verified government program - ${opportunity.website}`,
              verified: true
            });
          }
        });
      } else {
        console.log(`❌ No verified funding data for ${country}: ${verifiedStatus.message}`);
      }

      // 2. Get authentic research-based opportunities using You.com API
      try {
        const researchQuery = `government funding programs startups ${country} 2025 official`;
        const researchResults = await this.youApiService.searchNews(researchQuery);
        
        if (researchResults && researchResults.length > 0) {
          console.log(`📊 Found ${researchResults.length} research-based opportunities`);
          
          researchResults.slice(0, 3).forEach((result, index) => {
            const skillMatch = this.calculateSkillMatch(skills, result.description || '');
            
            if (skillMatch > 0) {
              recommendations.push({
                name: result.title || `Research Opportunity ${index + 1}`,
                matchScore: skillMatch,
                location: country,
                company: 'Research Source',
                type: 'research_based',
                description: result.description || 'Government funding research result',
                source: 'You.com API - News research',
                verified: false
              });
            }
          });
        }
      } catch (error) {
        console.log(`⚠️ Research API error: ${error.message}`);
      }

      // 3. If no authentic funding found, provide clear message
      if (recommendations.length === 0) {
        recommendations.push({
          name: `No Verified Funding Available for ${country}`,
          matchScore: 0,
          location: country,
          company: 'WealthSync',
          type: 'verified_funding',
          description: `We could not find any verified, authentic funding opportunities for ${country}. We only display real government and institutional programs to ensure data accuracy.`,
          source: 'Verified funding database',
          verified: true
        });
      }

      // Sort by match score and verification status
      recommendations.sort((a, b) => {
        if (a.verified !== b.verified) {
          return a.verified ? -1 : 1; // Verified first
        }
        return b.matchScore - a.matchScore; // Higher scores first
      });

      console.log(`🏆 Returning ${recommendations.length} authentic recommendations for ${country}`);
      return recommendations.slice(0, 15); // Max 15 recommendations

    } catch (error) {
      console.error(`❌ Error getting authentic recommendations: ${error.message}`);
      
      return [{
        name: 'Error Loading Authentic Data',
        matchScore: 0,
        location: country,
        company: 'System',
        type: 'verified_funding',
        description: 'Unable to load verified funding data. Please try again later.',
        source: 'Error handling',
        verified: true
      }];
    }
  }

  private calculateSkillMatch(userSkills: string[], opportunityText: string): number {
    if (!userSkills || userSkills.length === 0 || !opportunityText) {
      return 0;
    }

    const text = opportunityText.toLowerCase();
    let matches = 0;
    let totalSkills = userSkills.length;

    for (const skill of userSkills) {
      const skillLower = skill.toLowerCase();
      
      // Direct skill matches
      if (text.includes(skillLower)) {
        matches += 1;
        continue;
      }

      // Technology skill matches
      if (['software', 'programming', 'developer', 'vr', 'ar', 'xr'].includes(skillLower)) {
        if (text.includes('technology') || text.includes('innovation') || text.includes('digital') || text.includes('tech')) {
          matches += 0.5;
        }
      }

      // Web development matches
      if (['web', 'javascript', 'frontend', 'backend'].includes(skillLower)) {
        if (text.includes('digital') || text.includes('software') || text.includes('web')) {
          matches += 0.5;
        }
      }
    }

    // Return percentage match (0-100)
    return Math.min(100, Math.round((matches / totalSkills) * 100));
  }

  // Get country-specific authentic status
  async getCountryAuthenticStatus(country: string): Promise<{
    hasVerifiedFunding: boolean;
    message: string;
    availablePrograms: number;
  }> {
    const status = VerifiedFundingService.getCountryFundingStatus(country);
    
    return {
      hasVerifiedFunding: status.hasVerifiedData,
      message: status.message,
      availablePrograms: status.opportunities.length
    };
  }
}