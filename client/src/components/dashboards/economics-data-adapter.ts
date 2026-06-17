/**
 * Economics Data Adapter
 * 
 * This utility converts API response data into the format expected by the 
 * economic dashboard components, ensuring consistent visualization.
 */

export interface FormattedEconomicData {
  countryName: string;
  gdp: number;
  gdpFormatted: string;
  gdpGrowth: number;
  gdpGrowthFormatted: string;
  inflation: number;
  inflationFormatted: string;
  unemployment: number;
  unemploymentFormatted: string;
  population: string;
  marketSizes: {
    industry: string;
    value: number;
    formattedValue: string;
  }[];
  historicalGDP?: {
    year: string;
    value: number;
  }[];
}

// Common industries for market size breakdown
const DEFAULT_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Energy'
];

// Industry-specific multipliers for market size calculation based on real-world data
// These values represent the approximate percentage of GDP each industry represents
const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  'Technology': 0.029,        // Technology sector is 2.9% of GDP
  'Healthcare': 0.10,         // Healthcare sector is 10% of GDP
  'Finance': 0.08,            // Financial sector is 8% of GDP
  'Manufacturing': 0.15,      // Manufacturing sector is 15% of GDP
  'Retail': 0.25,             // Retail sector is 25% of GDP
  'Energy': 0.10,             // Energy sector is 10% of GDP
  'Agriculture': 0.02,        // Agriculture sector is 2% of GDP
  'Transportation': 0.06,     // Transportation sector is 6% of GDP
  'Construction': 0.07,       // Construction sector is 7% of GDP  
  'Education': 0.05,          // Education sector is 5% of GDP
  'Telecommunications': 0.03, // Telecommunications sector is 3% of GDP
  'Tourism': 0.04,            // Tourism sector is 4% of GDP
  'Media': 0.025,             // Media sector is 2.5% of GDP
  'Pharmaceuticals': 0.04,    // Pharmaceuticals sector is 4% of GDP
  'Real Estate': 0.12,        // Real Estate sector is 12% of GDP
  'Food and Beverage': 0.08,  // Food and Beverage sector is 8% of GDP
  'Automotive': 0.05,         // Automotive sector is 5% of GDP
  'Aerospace': 0.02,          // Aerospace sector is 2% of GDP
  'Mining': 0.03,             // Mining sector is 3% of GDP
  'Chemical': 0.04            // Chemical sector is 4% of GDP
};

/**
 * Format a number as currency with appropriate unit (B/T)
 */
export const formatCurrency = (value: number): string => {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(1)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else {
    return `$${value.toLocaleString()}`;
  }
};

/**
 * Format a percentage value
 */
export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

/**
 * Calculate market size for a specific industry based on GDP and multipliers
 */
export const calculateMarketSize = (gdp: number, industry: string, countryName: string): number => {
  // Special multiplier for the US
  const usMultiplier = countryName === 'United States' || countryName === 'USA' ? 1.4 : 1.0;
  
  // Get industry multiplier or use default
  const industryMultiplier = INDUSTRY_MULTIPLIERS[industry] || 1.5;
  
  // Calculate market size
  return gdp * industryMultiplier * usMultiplier;
};

/**
 * Format API response data for use in economic dashboards
 */
export const formatEconomicData = (
  apiData: any, 
  selectedCountry: string,
  includeHistorical = false
): FormattedEconomicData => {
  // Extract basic economic data
  const gdp = typeof apiData.gdp === 'number' ? apiData.gdp : 
              parseFloat(apiData.gdp?.replace(/[^0-9.]/g, '') || '0');
  
  const gdpGrowth = typeof apiData.gdpGrowth === 'number' ? apiData.gdpGrowth : 
                    parseFloat(apiData.gdpGrowth?.replace(/[^0-9.-]/g, '') || '0');
  
  const inflation = typeof apiData.inflation === 'number' ? apiData.inflation : 
                    parseFloat(apiData.inflation?.replace(/[^0-9.-]/g, '') || '0');
  
  const unemployment = typeof apiData.unemployment === 'number' ? apiData.unemployment : 
                       parseFloat(apiData.unemployment?.replace(/[^0-9.-]/g, '') || '0');
  
  // Generate market sizes for common industries
  const industries = apiData.industries || DEFAULT_INDUSTRIES;
  const marketSizes = industries.map((industry: string) => {
    const marketSize = calculateMarketSize(gdp, industry, selectedCountry);
    return {
      industry,
      value: marketSize,
      formattedValue: formatCurrency(marketSize)
    };
  });

  // Format the result
  const result: FormattedEconomicData = {
    countryName: selectedCountry,
    gdp,
    gdpFormatted: formatCurrency(gdp),
    gdpGrowth,
    gdpGrowthFormatted: formatPercentage(gdpGrowth),
    inflation,
    inflationFormatted: `${inflation.toFixed(1)}%`,
    unemployment,
    unemploymentFormatted: `${unemployment.toFixed(1)}%`,
    population: apiData.population || '0',
    marketSizes
  };

  // Add historical GDP data if requested and available
  if (includeHistorical && apiData.historicalGDP) {
    result.historicalGDP = apiData.historicalGDP;
  }

  return result;
};