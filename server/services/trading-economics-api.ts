/**
 * Trading Economics API Integration
 * Simple alternative to Google Cloud APIs for authentic economic data
 */

interface TradingEconomicsData {
  country: string;
  category: string;
  value: number;
  unit: string;
  date: string;
}

/**
 * Fetch economic indicators from Trading Economics API
 */
export async function fetchTradingEconomicsData(country: string, indicator: string): Promise<number | null> {
  try {
    // Trading Economics API endpoints
    const apiKey = process.env.TRADING_ECONOMICS_API_KEY;
    if (!apiKey) {
      console.log('Trading Economics API key not found, using fallback data');
      return null;
    }

    const url = `https://api.tradingeconomics.com/country/${country}/${indicator}?c=${apiKey}&f=json`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Trading Economics API error: ${response.status}`);
      return null;
    }

    const data: TradingEconomicsData[] = await response.json();
    if (data && data.length > 0) {
      return data[0].value;
    }

    return null;
  } catch (error) {
    console.error('Trading Economics API error:', error);
    return null;
  }
}

/**
 * Get country GDP from Trading Economics
 */
export async function getTradingEconomicsGDP(country: string): Promise<number | null> {
  return await fetchTradingEconomicsData(country, 'gdp');
}

/**
 * Get country growth rate from Trading Economics
 */
export async function getTradingEconomicsGrowthRate(country: string): Promise<number | null> {
  return await fetchTradingEconomicsData(country, 'gdp-growth');
}

/**
 * Get country inflation rate from Trading Economics
 */
export async function getTradingEconomicsInflation(country: string): Promise<number | null> {
  return await fetchTradingEconomicsData(country, 'inflation-rate');
}

/**
 * Enhanced economic data with Trading Economics fallback
 */
export async function getEnhancedEconomicData(country: string): Promise<{
  gdp: number | null;
  growthRate: number | null;
  inflation: number | null;
  source: string;
}> {
  // Try Trading Economics first
  const [gdp, growthRate, inflation] = await Promise.all([
    getTradingEconomicsGDP(country),
    getTradingEconomicsGrowthRate(country),
    getTradingEconomicsInflation(country)
  ]);

  if (gdp || growthRate || inflation) {
    return {
      gdp: gdp ? gdp * 1e9 : null, // Convert billions to actual value
      growthRate,
      inflation,
      source: 'Trading Economics API'
    };
  }

  return {
    gdp: null,
    growthRate: null,
    inflation: null,
    source: 'No data available'
  };
}