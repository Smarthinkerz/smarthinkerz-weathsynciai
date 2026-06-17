import { getComprehensiveEconomicData } from './enhanced-market-data';

interface MarketAnalysisRequest {
  industry: string;
  regions: string[];
  timeframe: string;
}

interface MarketData {
  marketSize: Record<string, { size: string; growth: string; source: string }>;
  investmentActivity: Record<string, { deals: number; amount: string }>;
  competitorDensity: Record<string, string>;
}

/**
 * Verified market data - prioritize authentic data over calculations
 */
const VERIFIED_MARKET_DATA: Record<string, Record<string, { size: string; growth: string; source: string }>> = {
  'New Zealand': {
    'technology': { 
      size: '$17.95B', 
      growth: '8.5%',
      source: 'NZTech 2024 verified data (sector revenue with $9.8B exports)'
    }
  },
  'Taiwan': {
    'healthcare': {
      size: '$41.86B',
      growth: '3.9%',
      source: 'Taiwan Healthcare Providers market 2025 projection (US$41.86B to US$48.86B by 2029)'
    },
    'technology': {
      size: '$189.4B',
      growth: '8.1%',
      source: 'Taiwan ICT industry 2024 (semiconductor + tech services)'
    }
  },
  'Oman': {
    'technology': { 
      size: '$5.96B', 
      growth: '8.88%',
      source: 'ICT market 2025 verified data'
    }
  },
  'Botswana': {
    'technology': { 
      size: '$310M', 
      growth: '7.2%',
      source: 'Statista verified segments breakdown'
    }
  }
};

/**
 * Generate market analysis using verified data when available
 */
export async function generateMarketAnalysis(request: MarketAnalysisRequest): Promise<MarketData> {
  const { industry, regions, timeframe } = request;
  
  console.log('Generating market analysis for:', { industry, regions, timeframe });
  
  const marketSize: Record<string, { size: string; growth: string; source: string }> = {};
  const investmentActivity: Record<string, { deals: number; amount: string }> = {};
  const competitorDensity: Record<string, string> = {};
  
  for (const region of regions) {
    // First priority: Use verified market data
    const verifiedData = VERIFIED_MARKET_DATA[region]?.[industry.toLowerCase()];
    if (verifiedData) {
      console.log(`Using verified data for ${region} ${industry}:`, verifiedData);
      marketSize[region] = verifiedData;
    } else {
      // Fallback: Calculate from economic data with clear attribution
      try {
        const countryCode = getCountryCode(region);
        const economicData = await getComprehensiveEconomicData(region, countryCode);
        
        if (economicData.gdp && economicData.gdp > 0) {
          const industryShare = getIndustryShare(industry);
          const calculatedSize = economicData.gdp * industryShare;
          const growth = economicData.growthRate || 4.5;
          
          marketSize[region] = {
            size: formatCurrency(calculatedSize),
            growth: `${growth.toFixed(1)}%`,
            source: `Calculated from ${economicData.source} (${industryShare * 100}% industry share)`
          };
        } else {
          marketSize[region] = {
            size: 'Data unavailable',
            growth: 'N/A',
            source: 'No authentic data available'
          };
        }
      } catch (error) {
        console.error(`Error calculating market size for ${region}:`, error);
        marketSize[region] = {
          size: 'Data unavailable',
          growth: 'N/A',
          source: 'Calculation error'
        };
      }
    }
    
    // Generate investment activity and competitor density
    const marketSizeValue = parseMarketSize(marketSize[region].size);
    investmentActivity[region] = generateInvestmentActivity(marketSizeValue, region);
    competitorDensity[region] = generateCompetitorDensity(marketSizeValue);
  }
  
  return {
    marketSize,
    investmentActivity,
    competitorDensity
  };
}

/**
 * Get country code for API calls
 */
function getCountryCode(country: string): string {
  const countryCodes: Record<string, string> = {
    'New Zealand': 'NZL',
    'Taiwan': 'TWN',
    'Oman': 'OMN',
    'United States': 'USA',
    'United Kingdom': 'GBR',
    'Germany': 'DEU',
    'France': 'FRA',
    'Australia': 'AUS',
    'Canada': 'CAN',
    'Japan': 'JPN',
    'Singapore': 'SGP'
  };
  
  return countryCodes[country] || 'UNKNOWN';
}

/**
 * Get industry share of GDP
 */
function getIndustryShare(industry: string): number {
  const industryShares: Record<string, number> = {
    'technology': 0.08, // 8% of GDP typical for tech sector
    'healthcare': 0.10,
    'finance': 0.20,
    'manufacturing': 0.16,
    'retail': 0.11,
    'energy': 0.08
  };
  
  return industryShares[industry.toLowerCase()] || 0.08;
}

/**
 * Format currency in billions or millions
 */
function formatCurrency(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(0)}M`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}

/**
 * Parse market size string to number
 */
function parseMarketSize(sizeStr: string): number {
  if (sizeStr === 'Data unavailable' || sizeStr === 'N/A') {
    return 0;
  }
  
  const match = sizeStr.match(/\$([0-9.]+)([BMT]?)/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'T': return value * 1e12;
    case 'B': return value * 1e9;
    case 'M': return value * 1e6;
    default: return value;
  }
}

/**
 * Generate realistic investment activity based on market size
 */
function generateInvestmentActivity(marketSize: number, region: string): { deals: number; amount: string } {
  if (marketSize === 0) {
    return { deals: 0, amount: '$0' };
  }
  
  // Investment activity typically 1-3% of market size
  const investmentRate = 0.02;
  const investmentAmount = marketSize * investmentRate;
  
  // Deal count based on market size
  const avgDealSize = 5000000; // $5M average
  const dealCount = Math.max(1, Math.round(investmentAmount / avgDealSize));
  
  return {
    deals: dealCount,
    amount: formatCurrency(investmentAmount)
  };
}

/**
 * Generate competitor density based on market size
 */
function generateCompetitorDensity(marketSize: number): string {
  if (marketSize === 0) return 'Unknown';
  if (marketSize > 50e9) return 'Very High';
  if (marketSize > 10e9) return 'High';
  if (marketSize > 1e9) return 'Medium';
  return 'Low';
}