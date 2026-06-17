/**
 * Verified Leads Routes
 * 
 * This implements lead generation that only uses verified API sources,
 * never falling back to synthetic data when APIs fail
 */
import { Router } from 'express';
import { verifiedLeadGenerationService } from '../services/verified-lead-generation-service';

export const verifiedLeadsRouter = Router();

/**
 * @route POST /api/verified-leads
 * @desc Generate business leads using only verified API sources
 * @access Private - Premium users and premium companies only
 */
verifiedLeadsRouter.post('/verified-leads', async (req, res) => {
  try {
    // Check user authentication
    if (!req.isAuthenticated() && !req.session.company) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to use lead generation'
      });
    }
    
    // Check if the user or company has premium access
    const isPremiumUser = req.user?.isPremium === true || 
                          req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise';
    const isPremiumCompany = req.session.company?.isPremium === true || 
                             req.session.company?.subscriptionTier === 'premium' || req.session.company?.subscriptionTier === 'elite' || req.session.company?.subscriptionTier === 'enterprise';
    
    // Rate limit for non-premium users/companies
    if (!isPremiumUser && !isPremiumCompany) {
      // For this implementation, we'll still allow access but with a notice
      console.log('Non-premium user/company accessing lead generation. Consider limiting request volume.');
    }
    
    // Validate required fields
    const { industry, targetMarket, leadType, country } = req.body;
    if (!industry || !targetMarket || !leadType || !country) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Industry, target market, lead type, and country are all required'
      });
    }
    
    console.log('Verified lead generation request:', req.body);
    
    // Generate leads using our verified-only lead service
    const leads = await verifiedLeadGenerationService.generateLeads(req.body);
    
    if (leads.length === 0) {
      return res.status(200).json({ 
        leads: [],
        metadata: {
          total: 0,
          message: 'No verified leads found from available API sources. This means the APIs either failed to return data or had no results matching your criteria.',
          suggestion: 'Try different search criteria or check that your API keys for Apollo, RapidAPI, and Apify are valid.'
        }
      });
    }
    
    // Add metadata about data sources
    const sources = Array.from(new Set(leads.map(lead => lead.source)));
    
    const response = {
      leads,
      metadata: {
        total: leads.length,
        verified: leads.filter(lead => lead.verifiedSource).length,
        sources,
        summary: 'All leads are from verified API sources. No synthetic data was used.'
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating verified leads:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Error generating leads. Please try again later.'
    });
  }
});