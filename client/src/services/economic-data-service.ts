// Economic Data Service
// Connects to official data sources to provide real-time economic metrics
// Data sources: World Bank, IMF, OECD, UN Comtrade, National Statistical Offices (2023-2024)

import axios from 'axios';
import type { CountryData } from '@/components/business-map/country-data';
import { defaultData, countryData } from '@/components/business-map/country-data';

// APIs for official economic data (2024-2025)
const WORLD_BANK_API = 'https://api.worldbank.org/v2';
const IMF_API = 'https://www.imf.org/-/media/Files/API/v2'; // Updated IMF API version
const OECD_API = 'https://sdmx.oecd.org/public/rest/data/v2'; // Updated OECD API version
const UN_COMTRADE_API = 'https://api.comtrade.un.org/data/v2'; // Updated UN API version
const IMF_WEO_API = 'https://www.imf.org/external/datamapper/api/v1'; // IMF World Economic Outlook API for forecasts
const IMF_SDMX_API = 'https://www.imf.org/external/datamapper/api/v1'; // IMF Data API for economic indicators
const NATIONAL_STATS_APIS: Record<string, string> = {
  'usa': 'https://api.bea.gov/data/v1',
  'uk': 'https://api.ons.gov.uk/v1',
  'eu': 'https://ec.europa.eu/eurostat/api/v1',
  'japan': 'https://api.e-stat.go.jp/rest/v1',
  'china': 'https://data.stats.gov.cn/english/api/v1'
};

// Service to fetch economy data from all official sources
export class EconomicDataService {
  private static instance: EconomicDataService;
  private apiKeys: Record<string, string> = {};
  private initialized: boolean = false;
  private cache: Record<string, any> = {}; // In-memory cache for API responses
  private lastRateLimitHit: number = 0; // Timestamp when we last hit rate limit
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // Cache for 24 hours by default
  private rateLimitCooldown: number = 60 * 1000; // 60 second cooldown after hitting rate limit

  constructor() {
    // Initialize API keys from environment variables
    this.apiKeys = {
      worldBank: import.meta.env.VITE_WORLD_BANK_API_KEY || '',
      imf: import.meta.env.VITE_IMF_API_KEY || '',
      oecd: import.meta.env.VITE_OECD_API_KEY || '',
      unComtrade: import.meta.env.VITE_UN_COMTRADE_API_KEY || '',
      rapidApi: import.meta.env.RAPID_API_KEY || '',
      alphaVantage: '' // This will be set from server API
    };
    
    // Try to load cached data from localStorage if available
    try {
      const cachedData = localStorage.getItem('economicDataCache');
      if (cachedData) {
        this.cache = JSON.parse(cachedData);
        console.log('[EconomicDataService] Loaded cached economic data');
      }
    } catch (error) {
      console.warn('[EconomicDataService] Error loading cached data:', error);
      this.cache = {};
    }
    
    // Load API keys from server on initialization
    this.loadApiKeysFromServer();
  }
  
  /**
   * Save current cache to localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem('economicDataCache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[EconomicDataService] Error saving cache:', error);
    }
  }
  
  /**
   * Get value from cache with support for cache expiry
   * @param key Cache key
   * @returns Cached value or undefined if not in cache or expired
   */
  private getCachedValue(key: string): any {
    const cacheEntry = this.cache[key];
    if (!cacheEntry) return undefined;
    
    // Check if cache entry has expired
    if (cacheEntry.timestamp && (Date.now() - cacheEntry.timestamp > this.cacheExpiry)) {
      console.log(`[EconomicDataService] Cache expired for ${key}`);
      delete this.cache[key];
      this.saveCache();
      return undefined;
    }
    
    return cacheEntry.data;
  }
  
  /**
   * Store value in cache with timestamp
   * @param key Cache key
   * @param value Value to cache
   */
  private setCachedValue(key: string, value: any): void {
    this.cache[key] = {
      data: value,
      timestamp: Date.now()
    };
    this.saveCache();
  }
  
  /**
   * Check if we're in rate limit cooldown period
   */
  private isRateLimited(): boolean {
    return (Date.now() - this.lastRateLimitHit) < this.rateLimitCooldown;
  }

  /**
   * Load API keys from the server's secure endpoint
   * This ensures that sensitive API keys are not exposed in client-side code
   */
  private async loadApiKeysFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/business-map/api-config');
      if (!response.ok) {
        throw new Error('Failed to fetch API configuration');
      }
      
      const config = await response.json();
      
      // Set the Alpha Vantage API key
      if (config.alphaVantage) {
        this.apiKeys.alphaVantage = config.alphaVantage;
        console.log('[EconomicDataService] Alpha Vantage API key loaded from server ✓');
      } else {
        console.warn('[EconomicDataService] Alpha Vantage API key not available');
      }
      
      // Log available API keys for debugging (without exposing the actual keys)
      console.log('[EconomicDataService] API Key Availability:');
      Object.keys(this.apiKeys).forEach(key => {
        console.log(`- ${key}: ${this.apiKeys[key] ? 'Available ✓' : 'Not available ✗'}`);
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('[EconomicDataService] Error loading API keys from server:', error);
    }
  }
  
  /**
   * Public method to set an API key from outside
   * @param key The API key name
   * @param value The API key value
   */
  public setApiKey(key: string, value: string): void {
    this.apiKeys[key] = value;
    console.log(`[EconomicDataService] API key ${key} updated`);
  }

  // Singleton pattern to ensure we only have one instance
  public static getInstance(): EconomicDataService {
    if (!EconomicDataService.instance) {
      EconomicDataService.instance = new EconomicDataService();
    }
    return EconomicDataService.instance;
  }

  // Get real-time GDP data from World Bank API
  async getGDP(countryCode: string, countryName: string): Promise<string> {
    try {
      const normalizedName = countryName.replace(/-fixed|-Updated/g, '');
      
      // 1. Check static country data first
      const staticData = countryData[normalizedName];
      if (staticData?.gdp) {
        return staticData.gdp;
      }

      // 2. Try World Bank API
      try {
        const response = await axios.get(
          `${WORLD_BANK_API}/country/${countryCode}/indicator/NY.GDP.MKTP.CD?format=json&per_page=1&source=2`,
          { 
            headers: this.getAuthHeaders('worldBank'),
            params: {
              date: new Date().getFullYear() - 1,
              source: 'wb'
            }
          }
        );

        if (response.data?.[1]?.[0]?.value) {
          return this.formatCurrency(response.data[1][0].value);
        }
      } catch (apiError) {
        console.warn('World Bank GDP API error:', apiError);
      }

      // 3. Try IMF WEO API
      try {
        const imfResponse = await axios.get(
          `${IMF_WEO_API}/v1/imf/NGDP_RPCH/${countryCode}`,
          { 
            headers: this.getAuthHeaders('imf'),
            params: {
              latest: true
            }
          }
        );

        if (imfResponse.data?.values?.[0]?.value) {
          const gdpValue = imfResponse.data.values[0].value;
          return this.formatCurrency(gdpValue * 1e9); // Convert to billions
        }
      } catch (imfError) {
        console.warn('IMF GDP API error:', imfError);
      }

      // 4. Try national statistics API
      try {
        const nationalApi = NATIONAL_STATS_APIS[countryCode.toLowerCase()];
        if (nationalApi) {
          const nationalResponse = await axios.get(
            `${nationalApi}/gdp`,
            { headers: this.getAuthHeaders(countryCode.toLowerCase()) }
          );
          if (nationalResponse.data?.value) {
            return this.formatCurrency(nationalResponse.data.value);
          }
        }
      } catch (nationalError) {
        console.warn('National statistics GDP error:', nationalError);
      }

      // 5. Final fallback to default data
      return defaultData.gdp;
    } catch (error) {
      console.error('Error fetching World Bank GDP data:', error);
      // Fallback to national statistics if available
      try {
        const nationalApi = NATIONAL_STATS_APIS[countryCode.toLowerCase()];
        if (nationalApi) {
          const nationalResponse = await axios.get(
            `${nationalApi}/gdp`,
            { headers: this.getAuthHeaders(countryCode.toLowerCase()) }
          );
          if (nationalResponse.data) {
            return this.formatCurrency(nationalResponse.data.value);
          }
        }
        throw error;
      } catch (fallbackError) {
        console.error('Error fetching national GDP data:', fallbackError);
        throw error;
      }
    }
  }

  // Get population data from World Bank API
  async getPopulation(countryCode: string): Promise<string> {
    try {
      const response = await axios.get(
        `${WORLD_BANK_API}/country/${countryCode}/indicator/SP.POP.TOTL?format=json&date=2023`,
        { headers: this.getAuthHeaders('worldBank') }
      );

      if (response.data && response.data[1] && response.data[1][0]) {
        const population = response.data[1][0].value;
        return this.formatPopulation(population);
      }

      throw new Error('Population data not available');
    } catch (error) {
      console.error('Error fetching population data:', error);
      throw error;
    }
  }

  // Get GDP growth rate data from IMF API
  async getGDPGrowth(countryCode: string): Promise<string> {
    try {
      const response = await axios.get(
        `${IMF_API}/v1/imf/NGDP_RPCH/${countryCode}`,
        { headers: this.getAuthHeaders('imf') }
      );

      if (response.data && response.data.values && response.data.values.length > 0) {
        const growthRate = response.data.values[0].value;
        return growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`;
      }

      throw new Error('GDP growth data not available');
    } catch (error) {
      console.error('Error fetching GDP growth data:', error);
      throw error;
    }
  }

  // Get unemployment rate from OECD API
  async getUnemployment(countryCode: string): Promise<string> {
    try {
      const response = await axios.get(
        `${OECD_API}/STLABOUR/UNR.${countryCode}.STSA.M/all?startTime=2023-01`,
        { headers: this.getAuthHeaders('oecd') }
      );

      if (response.data && response.data.dataSets && response.data.dataSets[0].series) {
        const seriesKey = Object.keys(response.data.dataSets[0].series)[0];
        const observations = response.data.dataSets[0].series[seriesKey].observations;
        const latestObservation = observations[Object.keys(observations).pop() || '0'];
        return `${latestObservation[0]}%`;
      }

      throw new Error('Unemployment data not available');
    } catch (error) {
      console.error('Error fetching unemployment data:', error);
      throw error;
    }
  }

  // Get business data from RapidAPI business data API
  async getBusinessData(countryCode: string): Promise<{
    totalBusinesses: string;
    newStartups: string;
  }> {
    try {
      const response = await axios.get(
        `https://business-data.p.rapidapi.com/country/${countryCode}`,
        { 
          headers: {
            'X-RapidAPI-Key': this.apiKeys.rapidApi,
            'X-RapidAPI-Host': 'business-data.p.rapidapi.com'
          }
        }
      );

      if (response.data && response.data.data) {
        return {
          totalBusinesses: this.formatNumber(response.data.data.registered_companies),
          newStartups: this.formatNumber(response.data.data.new_startups_last_year)
        };
      }

      throw new Error('Business data not available');
    } catch (error) {
      console.error('Error fetching business data:', error);
      throw error;
    }
  }

  // Get all country data from multiple sources
  // Get inflation rate from World Bank API
  async getInflation(countryCode: string): Promise<string> {
    try {
      const response = await axios.get(
        `${WORLD_BANK_API}/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&date=2023`,
        { headers: this.getAuthHeaders('worldBank') }
      );

      if (response.data && response.data[1] && response.data[1][0]) {
        const inflationRate = response.data[1][0].value;
        return `${inflationRate.toFixed(1)}%`;
      }

      throw new Error('Inflation data not available');
    } catch (error) {
      console.error('Error fetching inflation data:', error);
      throw error;
    }
  }

  // Get business confidence data
  async getBusinessConfidence(countryCode: string): Promise<string> {
    try {
      const response = await axios.get(
        `${OECD_API}/MEI/BCI.${countryCode}.BLSA.M/all?startTime=2023-01`,
        { headers: this.getAuthHeaders('oecd') }
      );

      if (response.data && response.data.dataSets && response.data.dataSets[0].series) {
        const seriesKey = Object.keys(response.data.dataSets[0].series)[0];
        const observations = response.data.dataSets[0].series[seriesKey].observations;
        const latestObservation = observations[Object.keys(observations).pop() || '0'];
        const confidence = Math.round((latestObservation[0] + 100) / 2); // Convert OECD range to 0-100
        return `${confidence}/100`;
      }

      throw new Error('Business confidence data not available');
    } catch (error) {
      console.error('Error fetching business confidence data:', error);
      throw error;
    }
  }

  // Get market size estimation based on GDP and consumer spending
  async getMarketSize(countryCode: string): Promise<string> {
    try {
      const cacheKey = `marketSize-${countryCode}`;
      const cachedValue = this.getCachedValue(cacheKey);
      if (cachedValue) {
        console.log(`[EconomicDataService] Using cached market size for ${countryCode}: ${cachedValue}`);
        return cachedValue;
      }
      
      // Track which sources we're trying
      let sourceAttempted = { worldBank: false, alphaVantage: false, imf: false };
      
      // First try World Bank GDP API (free, no API key needed)
      try {
        sourceAttempted.worldBank = true;
        console.log(`[EconomicDataService] Fetching World Bank GDP data for ${countryCode}`);
        const worldBankResponse = await axios.get(
          `${WORLD_BANK_API}/country/${countryCode}/indicator/NY.GDP.MKTP.CD?format=json&per_page=1`,
          { 
            params: {
              date: new Date().getFullYear() - 1,
            }
          }
        );

        // World Bank API returns array where index 1 contains the actual data
        if (worldBankResponse.data && 
            worldBankResponse.data[1] && 
            worldBankResponse.data[1].length > 0 && 
            worldBankResponse.data[1][0].value) {
          const gdpValue = parseFloat(worldBankResponse.data[1][0].value);
          console.log(`[EconomicDataService] Got World Bank GDP for ${countryCode}: ${gdpValue}`);
          const formattedValue = this.formatCurrency(gdpValue);
          this.setCachedValue(cacheKey, formattedValue);
          return formattedValue;
        }
      } catch (worldBankError) {
        console.warn('[EconomicDataService] World Bank GDP API error:', worldBankError);
      }

      // Try Alpha Vantage API for real-time economic data
      if (this.apiKeys.alphaVantage) {
        try {
          sourceAttempted.alphaVantage = true;
          console.log(`[EconomicDataService] Fetching Alpha Vantage data for ${countryCode}`);
          
          // Alpha Vantage only supports certain countries by 3-letter code
          const alphaVantageResponse = await axios.get(
            `https://www.alphavantage.co/query`, {
              params: {
                function: 'REAL_GDP',
                interval: 'annual',
                outputsize: 'compact',
                apikey: this.apiKeys.alphaVantage
              }
            }
          );

          if (alphaVantageResponse.data && 
              !alphaVantageResponse.data.Note && // Check for rate limit message
              alphaVantageResponse.data.data && 
              alphaVantageResponse.data.data.length > 0) {
            const latestData = alphaVantageResponse.data.data[0];
            if (latestData.value) {
              // Alpha Vantage returns GDP in millions, convert to full currency
              const marketSize = parseFloat(latestData.value) * 1000000;
              console.log(`[EconomicDataService] Got Alpha Vantage market size for ${countryCode}: ${marketSize}`);
              const formattedValue = this.formatCurrency(marketSize);
              this.setCachedValue(cacheKey, formattedValue);
              return formattedValue;
            }
          } else if (alphaVantageResponse.data.Note) {
            console.warn('[EconomicDataService] Alpha Vantage API rate limit:', alphaVantageResponse.data.Note);
            this.lastRateLimitHit = Date.now();
          }
        } catch (alphaVantageError) {
          console.warn('[EconomicDataService] Alpha Vantage API error:', alphaVantageError);
        }
      }

      // Try IMF World Economic Outlook API
      try {
        sourceAttempted.imf = true;
        console.log(`[EconomicDataService] Fetching IMF World Economic Outlook data for ${countryCode}`);
        
        // IMF API is free and doesn't need an API key
        const imfResponse = await axios.get(
          `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/${countryCode}`,
          { timeout: 5000 } // Add timeout to prevent long waits
        );

        if (imfResponse.data && imfResponse.data.values && imfResponse.data.values[countryCode]) {
          // Get the most recent year with data
          const years = Object.keys(imfResponse.data.values[countryCode])
            .sort((a, b) => parseInt(b) - parseInt(a));
          
          if (years.length > 0) {
            const latestYear = years[0];
            const gdpValue = imfResponse.data.values[countryCode][latestYear];
            
            // IMF data might be in different scales, assume billions
            const marketSize = parseFloat(gdpValue) * 1e9;
            console.log(`[EconomicDataService] Got IMF GDP for ${countryCode} (${latestYear}): ${marketSize}`);
            const formattedValue = this.formatCurrency(marketSize);
            this.setCachedValue(cacheKey, formattedValue);
            return formattedValue;
          }
        }
      } catch (imfError) {
        console.warn('[EconomicDataService] IMF WEO API error:', imfError);
      }

      // Log which sources were attempted
      console.log(`[EconomicDataService] Market size data sources attempted for ${countryCode}:`, sourceAttempted);
      
      // If all sources failed, return an informative message
      const message = 'Market size data not available from official sources';
      this.setCachedValue(cacheKey, message);
      return message;
    } catch (error) {
      console.error('[EconomicDataService] Error fetching market size data:', error);
      return 'Error retrieving market data';
    }
  }

  // Get real-time industry data with RapidAPI
  async getIndustryData(countryCode: string): Promise<Array<{name: string; growth: string; value: number}>> {
    try {
      const response = await axios.get(
        `https://industry-growth.p.rapidapi.com/country/${countryCode}`,
        { 
          headers: {
            'X-RapidAPI-Key': this.apiKeys.rapidApi,
            'X-RapidAPI-Host': 'industry-growth.p.rapidapi.com'
          }
        }
      );

      if (response.data && response.data.industries) {
        return response.data.industries.map((industry: any) => ({
          name: industry.name,
          growth: `${industry.growth_rate}%`,
          value: Math.round(industry.performance_score)
        })).slice(0, 10);
      }

      throw new Error('Industry data not available');
    } catch (error) {
      console.error('Error fetching industry data:', error);
      // Return fallback data for now
      return [];
    }
  }

  async getGDPForecast(countryCode: string): Promise<string | null> {
    // Check cache first
    const cacheKey = `gdpForecast_${countryCode}`;
    const cachedData = this.getCachedValue(cacheKey);
    if (cachedData) {
      console.log(`[EconomicDataService] Using cached GDP forecast for ${countryCode}`);
      return cachedData;
    }
    
    try {
      console.log(`[EconomicDataService] Fetching GDP forecast for ${countryCode}`);
      const response = await axios.get(`${IMF_WEO_API}/sdmx-json/data/WEO/WEO.NGDP_RPCH.${countryCode}.A`, {
          params: {
            startPeriod: '2024',
            endPeriod: '2025'
          }
      });

      if(response.data && response.data.dataSets && response.data.dataSets[0].series){
        const series = response.data.dataSets[0].series;
        const forecast = Object.values(series)[0].observations;
        const result = Object.values(forecast).map(x => `${x[0]}%`).join(' | ');
        
        // Store in cache
        this.setCachedValue(cacheKey, result);
        
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error fetching GDP forecast data:', error);
      return null;
    }
  }

  async getInflationForecast(countryCode: string): Promise<string | null> {
    // Check cache first
    const cacheKey = `inflationForecast_${countryCode}`;
    const cachedData = this.getCachedValue(cacheKey);
    if (cachedData) {
      console.log(`[EconomicDataService] Using cached inflation forecast for ${countryCode}`);
      return cachedData;
    }
    
    try {
      console.log(`[EconomicDataService] Fetching inflation forecast for ${countryCode}`);
      const response = await axios.get(`${IMF_WEO_API}/sdmx-json/data/WEO/WEO.PCPIPCH.${countryCode}.A`, {
          params: {
            startPeriod: '2024',
            endPeriod: '2025'
          }
      });

      if(response.data && response.data.dataSets && response.data.dataSets[0].series){
        const series = response.data.dataSets[0].series;
        const forecast = Object.values(series)[0].observations;
        const result = Object.values(forecast).map(x => `${x[0]}%`).join(' | ');
        
        // Store in cache
        this.setCachedValue(cacheKey, result);
        
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error fetching inflation forecast data:', error);
      return null;
    }
  }

  async getEmploymentForecast(countryCode: string): Promise<string | null> {
    // Check cache first
    const cacheKey = `employmentForecast_${countryCode}`;
    const cachedData = this.getCachedValue(cacheKey);
    if (cachedData) {
      console.log(`[EconomicDataService] Using cached employment forecast for ${countryCode}`);
      return cachedData;
    }
    
    try {
      console.log(`[EconomicDataService] Fetching employment forecast for ${countryCode}`);
      const response = await axios.get(`${IMF_WEO_API}/sdmx-json/data/WEO/WEO.LUR.${countryCode}.A`, {
          params: {
            startPeriod: '2024',
            endPeriod: '2025'
          }
      });

      if(response.data && response.data.dataSets && response.data.dataSets[0].series){
        const series = response.data.dataSets[0].series;
        const forecast = Object.values(series)[0].observations;
        const result = Object.values(forecast).map(x => `${x[0]}%`).join(' | ');
        
        // Store in cache
        this.setCachedValue(cacheKey, result);
        
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error fetching employment forecast data:', error);
      return null;
    }
  }
  
  /**
   * Fetch data from IMF SDMX API using the standardized SDMX format
   * @param datasetId The IMF dataset ID (e.g., BOP for Balance of Payments, IFS for International Financial Statistics)
   * @param countryCode ISO country code
   * @param indicator The specific data indicator code
   * @param startPeriod Optional start period in YYYY-MM format
   * @param endPeriod Optional end period in YYYY-MM format
   * @returns Processed economic data from the IMF
   */
  async fetchIMFData(datasetId: string, countryCode: string, indicator: string, startPeriod?: string, endPeriod?: string): Promise<any> {
    try {
      // Construct the SDMX API URL following IMF standards
      // Format: /data/{datasetId}/{frequencyDimension}.{countryCodes}.{indicatorCodes}
      const url = `${IMF_SDMX_API}/data/${datasetId}/A.${countryCode}.${indicator}`;
      
      const params: Record<string, string> = {};
      if (startPeriod) params.startPeriod = startPeriod;
      if (endPeriod) params.endPeriod = endPeriod || new Date().getFullYear().toString();
      
      console.log(`Fetching IMF SDMX data from: ${url}`);
      
      const response = await axios.get(url, { 
        params,
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders('imf')
        }
      });
      
      // Process SDMX-JSON response format
      if (response.data && response.data.data && response.data.data.dataSets) {
        const dataset = response.data.data.dataSets[0];
        if (dataset && dataset.series) {
          // Get the first series in the dataset
          const seriesKey = Object.keys(dataset.series)[0];
          if (!seriesKey) {
            console.warn('No series found in the IMF SDMX response');
            return null;
          }
          
          const series = dataset.series[seriesKey];
          if (!series || !series.observations) {
            console.warn('No observations found in the IMF SDMX series');
            return null;
          }
          
          // Extract observations (the actual data points)
          const observations = series.observations;
          
          // Get dimension metadata to interpret the observation values
          const dimensions = response.data.data.structure.dimensions.observation || [];
          const timeDimension = dimensions.find((d: any) => d.id === 'TIME_PERIOD');
          
          // Process and return the data
          return Object.entries(observations).map(([key, value]: [string, any]) => {
            // Find the time period for this observation
            const timePeriodIndex = parseInt(key.split(':')[0]);
            const timePeriod = timeDimension?.values[timePeriodIndex]?.id || 'Unknown';
            
            // The observation value is typically the first element in the array
            const observationValue = value[0];
            
            return {
              date: timePeriod,
              value: observationValue
            };
          });
        }
      }
      
      console.warn('IMF SDMX data format not as expected:', response.data);
      return null;
    } catch (error) {
      console.error(`Error fetching IMF SDMX data (${datasetId}/${indicator}):`, error);
      return null;
    }
  }
  
  /**
   * Get global economic indicators using IMF's International Financial Statistics (IFS) dataset
   * @param countryCode ISO country code
   * @returns Object containing economic indicators
   */
  async getGlobalEconomicIndicators(countryCode: string): Promise<{
    gdp?: number;
    inflation?: number;
    unemployment?: number;
    exports?: number;
    imports?: number;
    exchange_rate?: number;
    interest_rate?: number;
  }> {
    try {
      // Define a type for our IMF data return
      interface IMFDataPoint {
        date: string;
        value: number;
      }

      // Function to safely extract the latest value from IMF data
      const getLatestValue = (data: IMFDataPoint[] | null): number | undefined => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          return undefined;
        }
        return data[data.length - 1].value;
      };

      // Fetch multiple indicators in parallel from IMF
      const [gdpData, inflationData, unemploymentData, exportsData, importsData, exchangeRateData, interestRateData] = 
        await Promise.all([
          // GDP in national currency (NGDP_R)
          this.fetchIMFData('IFS', countryCode, 'NGDP_R') as Promise<IMFDataPoint[] | null>,
          // Consumer Price Index (PCPI)
          this.fetchIMFData('IFS', countryCode, 'PCPI_PC_CP_A_PT') as Promise<IMFDataPoint[] | null>,
          // Unemployment rate (LUR)
          this.fetchIMFData('IFS', countryCode, 'LUR') as Promise<IMFDataPoint[] | null>,
          // Exports of goods and services (BXG_BP6_USD)  
          this.fetchIMFData('IFS', countryCode, 'BXG_BP6_USD') as Promise<IMFDataPoint[] | null>,
          // Imports of goods and services (BMG_BP6_USD)
          this.fetchIMFData('IFS', countryCode, 'BMG_BP6_USD') as Promise<IMFDataPoint[] | null>,
          // National Currency per US Dollar (ENDE_XDC_USD_RATE)
          this.fetchIMFData('IFS', countryCode, 'ENDE_XDC_USD_RATE') as Promise<IMFDataPoint[] | null>,
          // Interest Rates, (FPOLM_PA)
          this.fetchIMFData('IFS', countryCode, 'FPOLM_PA') as Promise<IMFDataPoint[] | null>
        ]);
      
      // Create the result object with properly typed values
      const result = {
        gdp: getLatestValue(gdpData),
        inflation: getLatestValue(inflationData),
        unemployment: getLatestValue(unemploymentData),
        exports: getLatestValue(exportsData),
        imports: getLatestValue(importsData),
        exchange_rate: getLatestValue(exchangeRateData),
        interest_rate: getLatestValue(interestRateData)
      };
      
      // If we have the Alpha Vantage key and IMF data is not available,
      // try getting GDP and other indicators from Alpha Vantage as a premium feature
      if (this.apiKeys.alphaVantage && (!result.gdp || !result.inflation)) {
        try {
          console.log(`[EconomicDataService] Trying Alpha Vantage for ${countryCode} GDP and inflation data`);
          
          // Get GDP from Alpha Vantage
          const alphaVantageGDP = await this.getAlphaVantageData('GDP', countryCode);
          if (alphaVantageGDP && alphaVantageGDP.data && alphaVantageGDP.data.length > 0) {
            // Get the most recent data
            const latestData = alphaVantageGDP.data.sort((a: any, b: any) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })[0];
            
            if (latestData && latestData.value) {
              // Alpha Vantage returns GDP in millions, convert to full value
              const gdpValue = parseFloat(latestData.value) * 1000000;
              result.gdp = gdpValue;
            }
          }
          
          // Get inflation from Alpha Vantage
          const alphaVantageInflation = await this.getAlphaVantageData('INFLATION', countryCode);
          if (alphaVantageInflation && alphaVantageInflation.data && alphaVantageInflation.data.length > 0) {
            // Get the most recent data
            const latestData = alphaVantageInflation.data.sort((a: any, b: any) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })[0];
            
            if (latestData && latestData.value) {
              result.inflation = parseFloat(latestData.value) / 100; // Convert percent to decimal
            }
          }
        } catch (avError) {
          console.warn(`Error getting Alpha Vantage data: ${avError}`);
        }
      }
      
      // Optionally log the result
      console.log(`[EconomicDataService] Global economic indicators for ${countryCode}:`, result);
      
      return result;
    } catch (error) {
      console.error('Error getting global economic indicators:', error);
      return {};
    }
  }

  /**
   * Get real-time economic data from Alpha Vantage API (Premium feature)
   * @param symbol The economic indicator symbol to fetch
   * @param countryCode ISO country code
   * @returns Economic data from Alpha Vantage
   */
  async getAlphaVantageData(symbol: string, countryCode: string): Promise<any> {
    // Create a unique cache key for this request
    const cacheKey = `alphaVantage_${symbol}_${countryCode}`;
    
    // First check if we have this data in the cache
    const cachedData = this.getCachedValue(cacheKey);
    if (cachedData) {
      console.log(`[EconomicDataService] Using cached data for ${symbol} (${countryCode})`);
      return cachedData;
    }
    
    // Check if we're currently rate limited
    if (this.isRateLimited()) {
      console.warn(`[EconomicDataService] Alpha Vantage rate limit cooldown in effect for ${symbol}`);
      throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
    }
    
    // Check if API keys have been loaded
    if (!this.initialized) {
      try {
        await this.loadApiKeysFromServer();
      } catch (error) {
        console.error('[EconomicDataService] Failed to load API keys:', error);
        throw new Error('Failed to load API configuration');
      }
    }
    
    // Verify Alpha Vantage API key availability
    if (!this.apiKeys.alphaVantage) {
      console.warn('[EconomicDataService] Alpha Vantage API key not available');
      throw new Error('Alpha Vantage API key not available');
    }

    try {
      console.log(`[EconomicDataService] Fetching Alpha Vantage data for ${countryCode}, symbol: ${symbol}`);
      
      // Alpha Vantage API has different endpoints for different data types
      let endpoint = 'https://www.alphavantage.co/query';
      let params: Record<string, string> = {
        apikey: this.apiKeys.alphaVantage,
        datatype: 'json'
      };
      
      // Configure request based on what economic data we need
      switch (symbol) {
        case 'GDP':
          params.function = 'REAL_GDP';
          // Some countries use different codes for Alpha Vantage
          if (countryCode === 'USA') {
            params.country = 'United States';
          } else if (countryCode === 'GBR') {
            params.country = 'United Kingdom';  
          } else if (countryCode === 'ARE') {
            params.country = 'United Arab Emirates';
          } else if (countryCode === 'SAU') {
            params.country = 'Saudi Arabia';
          } else {
            // For other countries, try the country name directly
            params.country = this.getCountryNameFromCode(countryCode);
          }
          break;
        case 'INFLATION':
          params.function = 'INFLATION';
          if (countryCode === 'USA') {
            params.country = 'United States';
          } else if (countryCode === 'GBR') {
            params.country = 'United Kingdom';  
          } else {
            params.country = this.getCountryNameFromCode(countryCode);
          }
          break;
        case 'UNEMPLOYMENT':
          params.function = 'UNEMPLOYMENT';
          if (countryCode === 'USA') {
            params.country = 'United States';
          } else if (countryCode === 'GBR') {
            params.country = 'United Kingdom';  
          } else {
            params.country = this.getCountryNameFromCode(countryCode);
          }
          break;
        case 'RETAIL_SALES':
          params.function = 'RETAIL_SALES';
          if (countryCode === 'USA') {
            params.country = 'United States';
          }
          break;
        case 'INTEREST_RATE':
          params.function = 'TREASURY_YIELD';
          params.interval = 'monthly';
          params.maturity = '10year';
          break;
        default:
          params.function = 'GLOBAL_QUOTE';
          params.symbol = symbol;
      }
      
      console.log(`[EconomicDataService] Alpha Vantage request params:`, params);
      const response = await axios.get(endpoint, { params });
      
      if (response.data) {
        console.log(`[EconomicDataService] Alpha Vantage data received for ${symbol}`);
        
        // Check for error messages in the response
        if (response.data.Information) {
          console.warn(`[EconomicDataService] Alpha Vantage information:`, response.data.Information);
          throw new Error(response.data.Information);
        }
        
        if (response.data.Note && response.data.Note.includes('API call frequency')) {
          // Record when we hit the rate limit
          this.lastRateLimitHit = Date.now();
          console.warn(`[EconomicDataService] Alpha Vantage API rate limit reached, cooling down for 60 seconds`);
          throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
        }
        
        if (response.data.Error) {
          console.error(`[EconomicDataService] Alpha Vantage error:`, response.data.Error);
          throw new Error(response.data.Error);
        }
        
        // Store the successful response in cache
        this.setCachedValue(cacheKey, response.data);
        
        // Handle different response formats
        if (symbol === 'GDP' && response.data.data) {
          console.log(`[EconomicDataService] GDP data:`, response.data.data.slice(0, 2));
          return response.data;
        } else if (symbol === 'INFLATION' && response.data.data) {
          console.log(`[EconomicDataService] Inflation data:`, response.data.data.slice(0, 2));
          return response.data;
        } else if (symbol === 'UNEMPLOYMENT' && response.data.data) {
          console.log(`[EconomicDataService] Unemployment data:`, response.data.data.slice(0, 2));
          return response.data;
        }
        
        // Return full response if we can't parse specific data format
        return response.data;
      }
      
      throw new Error('No data received from Alpha Vantage API');
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[EconomicDataService] Error fetching Alpha Vantage data for ${symbol}:`, error.message);
        
        // If it's a rate limit error, make sure we set the cooldown timer
        if (error.message.includes('rate limit')) {
          this.lastRateLimitHit = Date.now();
        }
      } else {
        console.error(`[EconomicDataService] Unknown error fetching Alpha Vantage data for ${symbol}`);
      }
      
      // For network errors, check if we have partial cache data we can use
      if (axios.isAxiosError(error) && !error.response) {
        const emergencyCache = this.cache[cacheKey];
        if (emergencyCache?.data) {
          console.log(`[EconomicDataService] Network error, using emergency cached data for ${symbol}`);
          return emergencyCache.data;
        }
      }
      
      throw error;
    }
  }
  
  // Helper method to convert country codes to full names for Alpha Vantage
  private getCountryNameFromCode(countryCode: string): string {
    const countryMap: Record<string, string> = {
      'USA': 'United States',
      'GBR': 'United Kingdom',
      'DEU': 'Germany',
      'FRA': 'France',
      'ITA': 'Italy',
      'JPN': 'Japan',
      'CAN': 'Canada',
      'AUS': 'Australia',
      'CHN': 'China',
      'IND': 'India',
      'BRA': 'Brazil',
      'RUS': 'Russia',
      'ZAF': 'South Africa',
      'MEX': 'Mexico',
      'KOR': 'South Korea',
      'SGP': 'Singapore',
      'SAU': 'Saudi Arabia',
      'ARE': 'United Arab Emirates',
      'EGY': 'Egypt',
      'OMN': 'Oman',
      'QAT': 'Qatar',
      'KWT': 'Kuwait',
      'BHR': 'Bahrain',
      'TUR': 'Turkey',
      'NGA': 'Nigeria',
      'NLD': 'Netherlands'
    };
    
    return countryMap[countryCode] || countryCode;
  }

  /**
   * Initialize API connections and check required parameters
   */
  private async initializeAPIs(): Promise<void> {
    // Check for any missing required API keys
    const missingKeys = [];
    if (!this.apiKeys.imf) missingKeys.push('IMF');
    if (!this.apiKeys.worldBank) missingKeys.push('World Bank');
    if (!this.apiKeys.oecd) missingKeys.push('OECD');
    if (!this.apiKeys.unComtrade) missingKeys.push('UN Comtrade');
    
    // Log Alpha Vantage API status for premium features
    if (!this.apiKeys.alphaVantage) {
      console.warn('Alpha Vantage API key not available - premium real-time data features will be limited');
      missingKeys.push('Alpha Vantage');
    } else {
      console.log('Alpha Vantage API key available - premium real-time data features enabled');
    }
    
    if (missingKeys.length > 0) {
      console.warn(`Missing API keys for: ${missingKeys.join(', ')}`);
    }
  }

  async getCountryData(countryCode: string, countryName: string): Promise<Partial<CountryData>> {
    try {
      // Validate inputs and normalize country name
      if (!countryCode || !countryName) {
        throw new Error('Invalid country code or name');
      }

      // Normalize country name to match our reference data
      const normalizedName = countryName.replace(/-fixed|-Updated/g, '');
      
      // Check cache first for this country
      const cacheKey = `countryData_${countryCode}`;
      const cachedData = this.getCachedValue(cacheKey);
      if (cachedData) {
        console.log(`[EconomicDataService] Using cached data for ${normalizedName} (${countryCode})`);
        return cachedData;
      }
      
      console.log(`[EconomicDataService] Fetching real-time data for ${normalizedName} (${countryCode})`);
      
      // First try to get data from our server's direct integration with World Bank and IMF
      try {
        const response = await axios.get(`/api/business-map/economic-data/${countryCode}`);
        
        if (response.data && response.data.indicators) {
          // The server endpoint already combines data from World Bank and IMF APIs
          const serverData = response.data;
          
          // Calculate risk level based on real economic data
          let riskLevel: 'low' | 'medium' | 'high' = 'medium';
          
          // Extract economic indicators from server response
          const gdpGrowthNum = serverData.indicators.gdpGrowth || 0;
          const unemploymentNum = serverData.indicators.unemployment || 0;
          const inflationNum = serverData.indicators.inflation || 0;
          
          // Simple risk calculation algorithm based on actual data
          if (
            gdpGrowthNum > 3 && 
            unemploymentNum < 5 && 
            inflationNum < 3
          ) {
            riskLevel = 'low';
          } else if (
            gdpGrowthNum < 0 || 
            unemploymentNum > 8 || 
            inflationNum > 8
          ) {
            riskLevel = 'high';
          }
          
          // Format data for display
          const gdp = serverData.indicators.gdp ? 
            this.formatCurrency(serverData.indicators.gdp) : 
            'Data not available';
            
          const gdpGrowth = serverData.indicators.gdpGrowth ? 
            `${serverData.indicators.gdpGrowth}%` : 
            'Data not available';
            
          const inflation = serverData.indicators.inflation ? 
            `${serverData.indicators.inflation}%` : 
            'Data not available';
            
          const unemployment = serverData.indicators.unemployment ? 
            `${serverData.indicators.unemployment}%` : 
            'Data not available';
            
          const population = serverData.indicators.population ? 
            this.formatPopulation(serverData.indicators.population) : 
            'Data not available';
            
          // Calculate market size in USD
          let marketSizeNumber = 0;
          
          if (serverData.indicators.gdp) {
            // Calculate market size as a percentage of GDP based on industries
            // Technology: 15-25% of GDP, Manufacturing: 10-20%, Services: 50-70%
            marketSizeNumber = Math.round(serverData.indicators.gdp * 0.15); // Conservative estimate
          }
          
          // Use market research to identify opportunities
          const opportunities = await this.getOpportunities(countryCode, normalizedName);
          
          // Construct country data with server values
          const countryData: Partial<CountryData> = {
            name: normalizedName,
            gdp,
            population,
            gdpGrowth,
            unemployment,
            inflation,
            businessConfidence: 'Data not available', // Not in most public APIs
            totalBusinesses: 'Data not available',
            newStartups: 'Data not available',
            riskLevel,
            growthRate: gdpGrowth,
            marketSize: marketSizeNumber,
            industries: [],
            riskFactors: [
              "Economic volatility",
              "Regulatory changes",
              "Market competition",
              "Supply chain disruptions"
            ],
            opportunities,
            dataProviders: ['World Bank', 'IMF', 'OECD', 'UN Comtrade'],
            lastUpdated: new Date().toISOString(),
            forecast: {
              gdp: serverData.forecasts?.gdpGrowth || 'Forecast unavailable',
              inflation: serverData.forecasts?.inflation || 'Forecast unavailable',
              employment: serverData.forecasts?.unemployment || 'Forecast unavailable',
              period: '2024-2025',
              source: 'IMF World Economic Outlook'
            }
          };
          
          // Cache the result
          this.setCachedValue(cacheKey, countryData);
          console.log(`[DEBUG] Economic data from server endpoint for ${normalizedName}:`, countryData);
          
          return countryData;
        }
      } catch (serverError) {
        console.error('Error fetching from server endpoint:', serverError);
        // Continue to fallback methods if server endpoint fails
      }
      
      // Initialize API connections as fallback
      await this.initializeAPIs();

      // Fallback: Get data from multiple sources in parallel
      const [
        gdp, 
        population, 
        gdpGrowth, 
        unemployment, 
        businessData, 
        inflation, 
        businessConfidence, 
        marketSize, 
        industries,
        imfSDMXData  // New IMF SDMX data
      ] = await Promise.all([
        this.getGDP(countryCode, normalizedName).catch(() => 'Data not available'),
        this.getPopulation(countryCode).catch(() => 'Data not available'),
        this.getGDPGrowth(countryCode).catch(() => 'Data not available'),
        this.getUnemployment(countryCode).catch(() => 'Data not available'),
        this.getBusinessData(countryCode).catch(() => ({ 
          totalBusinesses: 'Data not available', 
          newStartups: 'Data not available' 
        })),
        this.getInflation(countryCode).catch(() => 'Data not available'),
        this.getBusinessConfidence(countryCode).catch(() => 'Data not available'),
        this.getMarketSize(countryCode).catch(() => 'Data not available'),
        this.getIndustryData(countryCode).catch(() => []),
        this.getGlobalEconomicIndicators(countryCode).catch(() => ({}))  // Get IMF SDMX data
      ]);

      // Get forecast data
      const forecastData = await Promise.all([
        this.getGDPForecast(countryCode),
        this.getInflationForecast(countryCode),
        this.getEmploymentForecast(countryCode)
      ]).catch(() => [null, null, null]);

      // Calculate risk level based on real economic data
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';

      // Prefer IMF SDMX data if available for risk calculations
      const gdpGrowthValue = typeof gdpGrowth === 'string' ? 
        gdpGrowth.replace('%', '').replace('+', '') : 
        '0';
      const unemploymentValue = typeof unemployment === 'string' ? 
        unemployment.replace('%', '') : 
        String(imfSDMXData?.unemployment || '0');
      const inflationValue = typeof inflation === 'string' ? 
        inflation.replace('%', '') : 
        String(imfSDMXData?.inflation || '0');

      // Simple risk calculation algorithm - convert data to numbers and check thresholds
      const gdpGrowthNum = parseFloat(gdpGrowthValue);
      const unemploymentNum = parseFloat(unemploymentValue);
      const inflationNum = parseFloat(inflationValue);

      if (
        gdpGrowthNum > 3 && 
        unemploymentNum < 5 && 
        inflationNum < 3
      ) {
        riskLevel = 'low';
      } else if (
        gdpGrowthNum < 0 || 
        unemploymentNum > 8 || 
        inflationNum > 8
      ) {
        riskLevel = 'high';
      }

      // Calculate trade balance using IMF data if available
      let tradeBalance = 'Data not available';
      if (imfSDMXData?.exports && imfSDMXData?.imports) {
        const balance = imfSDMXData.exports - imfSDMXData.imports;
        tradeBalance = balance >= 0 ? 
          `+$${Math.abs(balance / 1e9).toFixed(2)} billion` : 
          `-$${Math.abs(balance / 1e9).toFixed(2)} billion`;
      }
      
      // Use standard opportunities instead of making an API request
      const opportunities = [
        { name: 'Digital Transformation', sector: 'Technology', riskScore: 28 },
        { name: 'Green Energy', sector: 'Energy', riskScore: 35 },
        { name: 'E-Commerce', sector: 'Retail', riskScore: 30 }
      ];

      // Return real-time data enriched with calculations
      // Use the actual numeric value for market size if it's a number
      const knowledgeGraphMarketSize = await this.fetchKnowledgeGraphMarketSize(countryName, countryCode);
      
      // Log the market size from knowledge graph
      console.log(`[EconomicDataService] Country: ${countryName}, Knowledge Graph Market Size: ${knowledgeGraphMarketSize}`);
      
      return {
        name: countryName,
        gdp,
        population,
        gdpGrowth: imfSDMXData && 'gdp' in imfSDMXData && imfSDMXData.gdp ? 
          `${(imfSDMXData.gdp * 100).toFixed(1)}%` : gdpGrowth,
        unemployment: imfSDMXData && 'unemployment' in imfSDMXData && imfSDMXData.unemployment ? 
          `${imfSDMXData.unemployment.toFixed(1)}%` : unemployment,
        inflation: imfSDMXData && 'inflation' in imfSDMXData && imfSDMXData.inflation ? 
          `${imfSDMXData.inflation.toFixed(1)}%` : inflation,
        businessConfidence,
        totalBusinesses: businessData.totalBusinesses,
        newStartups: businessData.newStartups,
        riskLevel,
        growthRate: imfSDMXData && 'gdp' in imfSDMXData && imfSDMXData.gdp ? 
          `${(imfSDMXData.gdp * 100).toFixed(1)}%` : gdpGrowth, 
        // Prefer the numeric market size from knowledge graph service if available
        marketSize: knowledgeGraphMarketSize !== null ? knowledgeGraphMarketSize : marketSize,
        industries: industries.length > 0 ? industries : [],
        riskFactors: ['Economic volatility', 'Regulatory changes', 'Market competition', 'Supply chain disruptions'],
        opportunities: [
          { name: 'Digital Transformation', sector: 'Technology', riskScore: 28 },
          { name: 'Green Energy', sector: 'Energy', riskScore: 35 },
          { name: 'E-Commerce', sector: 'Retail', riskScore: 30 }
        ],
        exchangeRate: imfSDMXData?.exchange_rate ? 
          imfSDMXData.exchange_rate.toFixed(2) : undefined,
        interestRate: imfSDMXData?.interest_rate ? 
          `${imfSDMXData.interest_rate.toFixed(1)}%` : undefined,
        dataProviders: ['World Bank', 'IMF', 'OECD', 'UN Comtrade'].filter(provider => 
          provider === 'IMF' ? !!imfSDMXData : true
        ),
        lastUpdated: new Date().toISOString(),
        forecast: {
          gdp: forecastData[0] || 'Forecast unavailable',
          inflation: forecastData[1] || 'Forecast unavailable',
          employment: forecastData[2] || 'Forecast unavailable',
          period: '2024-2025',
          source: 'IMF World Economic Outlook'
        }
      };
    } catch (error) {
      console.error('Error fetching country data:', error);
      throw error;
    }
  }

  // Helper method to get the right authorization headers for each API
  private getAuthHeaders(api: string): Record<string, string> {
    switch (api) {
      case 'worldBank':
        return this.apiKeys.worldBank ? { 'Authorization': `Bearer ${this.apiKeys.worldBank}` } : {};
      case 'imf':
        return this.apiKeys.imf ? { 'Authorization': `Bearer ${this.apiKeys.imf}` } : {};
      case 'oecd':
        return this.apiKeys.oecd ? { 'Authorization': `Bearer ${this.apiKeys.oecd}` } : {};
      case 'unComtrade':
        return this.apiKeys.unComtrade ? { 'Authorization': `Bearer ${this.apiKeys.unComtrade}` } : {};
      default:
        return {};
    }
  }

  // Helper method to format currency values
  private formatCurrency(value: number): string {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)} trillion`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)} billion`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)} million`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  }

  // Helper method to format population values
  private formatPopulation(value: number): string {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)} billion`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)} million`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)} thousand`;
    } else {
      return value.toLocaleString();
    }
  }

  // Helper method to format number values with commas
  private formatNumber(value: number): string {
    return value.toLocaleString();
  }
  
  /**
   * Fetch market size data directly from the knowledge graph service
   * This ensures we get the real-time calculated market size based on GDP data
   */
  private async fetchKnowledgeGraphMarketSize(countryName: string, countryCode: string): Promise<number | null> {
    try {
      console.log(`[EconomicDataService] Fetching market size for ${countryName} (${countryCode})`);
      
      // First try Alpha Vantage for GDP data
      if (this.apiKeys.alphaVantage) {
        try {
          console.log(`[EconomicDataService] Trying Alpha Vantage API for ${countryName}`);
          const alphaVantageData = await this.getAlphaVantageData('GDP', countryCode);
          
          if (alphaVantageData && alphaVantageData.data && alphaVantageData.data.length > 0) {
            // Get the most recent data
            const latestData = alphaVantageData.data.sort((a: any, b: any) => {
              // Sort by date in descending order
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })[0];
            
            if (latestData && latestData.value) {
              // Alpha Vantage returns GDP in millions, convert to full value
              const gdpValue = parseFloat(latestData.value) * 1000000;
              console.log(`[EconomicDataService] Alpha Vantage GDP for ${countryName}: ${gdpValue}`);
              
              // Calculate market size based on GDP (use technology industry as default)
              // Technology industry typically represents around 15-25% of GDP in developed countries
              const marketSizeMultiplier = 0.20; // 20% of GDP
              const marketSize = gdpValue * marketSizeMultiplier;
              console.log(`[EconomicDataService] Calculated market size from Alpha Vantage GDP: ${marketSize}`);
              return marketSize;
            }
          }
        } catch (alphaVantageError) {
          console.warn(`Alpha Vantage error for ${countryName}:`, alphaVantageError);
        }
      }
      
      // Then try World Bank API as backup
      try {
        console.log(`[EconomicDataService] Trying World Bank API for ${countryName}`);
        const worldBankGDPresponse = await axios.get(
          `${WORLD_BANK_API}/country/${countryCode}/indicator/NY.GDP.MKTP.CD?format=json&per_page=1`,
          { 
            params: {
              date: new Date().getFullYear() - 1,
              source: 'wb'
            }
          }
        );
        
        if (worldBankGDPresponse.data && 
            worldBankGDPresponse.data[1] && 
            worldBankGDPresponse.data[1][0] && 
            worldBankGDPresponse.data[1][0].value) {
          
          const gdpValue = worldBankGDPresponse.data[1][0].value;
          console.log(`[EconomicDataService] World Bank GDP for ${countryName}: ${gdpValue}`);
          
          // Calculate market size
          const marketSizeMultiplier = 0.20; // 20% of GDP
          const marketSize = gdpValue * marketSizeMultiplier;
          console.log(`[EconomicDataService] Calculated market size from World Bank GDP: ${marketSize}`);
          return marketSize;
        }
      } catch (worldBankError) {
        console.warn(`World Bank error for ${countryName}:`, worldBankError);
      }
      
      // Finally, try our API endpoint (which might use cached data)
      try {
        console.log(`[EconomicDataService] Trying knowledge graph API for ${countryName}`);
        const response = await axios.get('/api/knowledge-graph', {
          params: {
            country: countryName,
            industry: 'Technology',
            region: this.getRegionForCountry(countryCode),
            isPremium: true
          }
        });
        
        if (response.data && typeof response.data.marketSize === 'number') {
          console.log(`[EconomicDataService] Got market size from knowledge graph: ${response.data.marketSize} for ${countryName}`);
          return response.data.marketSize;
        }
      } catch (apiError) {
        console.warn(`Knowledge graph API error for ${countryName}:`, apiError);
      }
      
      console.warn(`[EconomicDataService] No market size data found for ${countryName}`);
      return null;
    } catch (error) {
      console.error('Error fetching knowledge graph market size:', error);
      return null;
    }
  }
  
  /**
   * Helper to determine region from country code
   */
  private getRegionForCountry(countryCode: string): string {
    // Comprehensive mapping of country codes to regions
    const middleEastCodes = ['BHR', 'KWT', 'OMN', 'QAT', 'SAU', 'ARE', 'YEM', 'IRQ', 'IRN', 'JOR', 'LBN', 'SYR', 'EGY'];
    const europeCodes = ['DEU', 'FRA', 'GBR', 'ITA', 'ESP', 'NLD', 'BEL', 'CHE', 'AUT', 'SWE', 'NOR', 'DNK', 'FIN', 'IRL', 'PRT', 'GRC', 'POL', 'UKR'];
    const asiaCodes = ['CHN', 'JPN', 'KOR', 'IND', 'SGP', 'MYS', 'THA', 'IDN', 'PHL', 'VNM', 'TWN', 'PRK', 'PAK', 'BGD'];
    const northAmericaCodes = ['USA', 'CAN', 'MEX'];
    const southAmericaCodes = ['BRA', 'ARG', 'COL', 'CHL', 'PER', 'VEN'];
    const africaCodes = ['ZAF', 'NGA', 'EGY', 'MAR', 'KEN', 'ETH', 'GHA', 'TZA', 'SDN', 'TUN', 'DZA'];
    const oceaniaCodes = ['AUS', 'NZL', 'PNG', 'FJI'];
    
    if (middleEastCodes.includes(countryCode)) return 'Middle East';
    if (europeCodes.includes(countryCode)) return 'Europe';
    if (asiaCodes.includes(countryCode)) return 'Asia';
    if (northAmericaCodes.includes(countryCode)) return 'North America';
    if (southAmericaCodes.includes(countryCode)) return 'South America';
    if (africaCodes.includes(countryCode)) return 'Africa';
    if (oceaniaCodes.includes(countryCode)) return 'Oceania';
    
    return 'Global'; // Default region
  }
}

// Export singleton instance
export const economicDataService = EconomicDataService.getInstance();