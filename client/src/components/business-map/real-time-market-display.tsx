import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactInsightsPanel } from '@/components/business-intelligence/compact-insights-panel';

interface MarketData {
  marketSize: number;
  growthRate: number;
  marketShare: number;
  countryName: string;
  gdp?: number; // Add GDP field
  competitors?: string[];
  industryTrends?: string[];
  detailedAnalytics?: {
    quarterlyGrowth?: number[];
    marketPenetration?: number;
    competitorMarketShare?: Record<string, number>;
    riskAssessment?: string;
    economicIndicators?: {
      inflation?: number;
      unemployment?: number;
      gdp?: number; // Add GDP field here too for consistency
    };
  };
  realTimeMetrics?: {
    lastUpdate?: string;
    volatility?: number;
    sentiment?: string;
  };
}

export interface RealTimeMarketDisplayProps {
  selectedCountry: string | null;
  onRefresh?: () => void;
}

export function RealTimeMarketDisplay({ selectedCountry, onRefresh }: RealTimeMarketDisplayProps) {
  const [data, setData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Function to fetch data directly from the API
  const fetchCountryData = async (country: string) => {
    if (!country) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`[RealTimeMarketDisplay] Fetching data for ${country}`);
      
      // Log to ensure we track the API call
      console.log(`[RealTimeMarketDisplay] Making API request to /api/knowledge-graph with params:`, {
        country,
        industry: 'Technology',
        region: determineRegion(country),
        isPremium: true
      });
      
      // Make a direct API call to get the market data
      const response = await axios.get('/api/knowledge-graph', {
        params: {
          country,
          industry: 'Technology',
          region: determineRegion(country),
          isPremium: true
        }
      });
      
      // Verify we got valid data back
      if (response.data && typeof response.data.marketSize === 'number') {
        // Make the market size value very visible in logs
        console.log(`[RealTimeMarketDisplay] **** ${country} MARKET SIZE: ${response.data.marketSize} ****`);
        console.log(`[RealTimeMarketDisplay] GROWTH RATE: ${response.data.growthRate}`);
        console.log(`[RealTimeMarketDisplay] MARKET SHARE: ${response.data.marketShare}%`);
        
        // Store the data for this country
        setData(prev => {
          const newData = {
            ...prev,
            [country]: response.data
          };
          
          // Log all stored market sizes
          Object.entries(newData).forEach(([c, d]) => {
            console.log(`[RealTimeMarketDisplay] Stored data for ${c}: Market size = ${(d as any).marketSize}`);
          });
          
          return newData;
        });
        
        setLastUpdated(new Date());
      } else {
        // Handle missing or invalid data
        console.error(`[RealTimeMarketDisplay] Invalid data for ${country}:`, response.data);
        console.error(`[RealTimeMarketDisplay] Market size missing or invalid: ${response.data?.marketSize}`);
        setError(`Failed to fetch valid market data for ${country}`);
      }
    } catch (err: any) {
      console.error(`[RealTimeMarketDisplay] Error fetching ${country}:`, err);
      setError(`Failed to fetch data for ${country}: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Determine the region for a country
  const determineRegion = (country: string): string => {
    const middleEastCountries = [
      'Saudi Arabia', 'UAE', 'United Arab Emirates', 'Qatar', 'Bahrain', 
      'Kuwait', 'Oman', 'Yemen', 'Iraq', 'Iran', 'Jordan', 'Lebanon', 
      'Syria', 'Palestine', 'Israel'
    ];
    
    const africanCountries = [
      'Egypt', 'Algeria', 'Morocco', 'Tunisia', 'Libya', 'Sudan', 'South Sudan',
      'Ethiopia', 'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Burundi', 'Somalia',
      'Djibouti', 'Eritrea', 'South Africa', 'Nigeria', 'Ghana', 'Cameroon'
    ];
    
    const asianCountries = [
      'China', 'Japan', 'South Korea', 'North Korea', 'Taiwan', 'Hong Kong',
      'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan',
      'Myanmar', 'Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Malaysia',
      'Singapore', 'Indonesia', 'Philippines', 'Brunei'
    ];
    
    const europeanCountries = [
      'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal',
      'Netherlands', 'Belgium', 'Luxembourg', 'Switzerland', 'Austria',
      'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Ireland',
      'Greece', 'Turkey', 'Cyprus', 'Malta', 'Poland', 'Czech Republic',
      'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia',
      'Serbia', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia',
      'Albania', 'Kosovo', 'Estonia', 'Latvia', 'Lithuania', 'Ukraine',
      'Belarus', 'Moldova', 'Russia'
    ];
    
    if (middleEastCountries.includes(country)) return 'Middle East';
    if (africanCountries.includes(country)) return 'Africa';
    if (asianCountries.includes(country)) return 'Asia';
    if (europeanCountries.includes(country)) return 'Europe';
    
    return 'Global'; // Default region
  };

  // Fetch data when selected country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchCountryData(selectedCountry);
    }
  }, [selectedCountry]);

  // Format currency values without using browser's built-in formatter to ensure consistent display
  const formatCurrency = (value: number) => {
    // Log the raw value for debugging
    console.log(`[RealTimeMarketDisplay] Formatting currency value: ${value}, type: ${typeof value}`);
    
    if (isNaN(value) || value === null || value === undefined) {
      console.error(`[RealTimeMarketDisplay] Invalid market size value: ${value}`);
      return 'Unknown';
    }
    
    try {
      // Make sure we're working with a number
      const numValue = Number(value);
      
      // Trillion range
      if (numValue >= 1e12) {
        const trillions = numValue / 1e12;
        console.log(`[RealTimeMarketDisplay] Converting to trillions: ${trillions.toFixed(2)} Trillion`);
        return `$${trillions.toFixed(2)} Trillion`;
      } 
      // Billion range
      else if (numValue >= 1e9) {
        const billions = numValue / 1e9;
        console.log(`[RealTimeMarketDisplay] Converting to billions: ${billions.toFixed(2)} Billion`);
        return `$${billions.toFixed(2)} Billion`;
      } 
      // Million range
      else if (numValue >= 1e6) {
        const millions = numValue / 1e6;
        console.log(`[RealTimeMarketDisplay] Converting to millions: ${millions.toFixed(1)} Million`);
        return `$${millions.toFixed(1)} Million`;
      } 
      // Thousand range and below
      else {
        const formatted = numValue.toLocaleString('en-US', {maximumFractionDigits: 0});
        console.log(`[RealTimeMarketDisplay] Formatting as regular number: ${formatted}`);
        return `$${formatted}`;
      }
    } catch (err) {
      console.error(`[RealTimeMarketDisplay] Error formatting currency:`, err, value);
      // Fallback to basic formatting
      return `$${Number(value).toLocaleString('en-US')}`;
    }
  };

  const handleRefresh = () => {
    if (selectedCountry) {
      fetchCountryData(selectedCountry);
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  // If no country is selected or data not yet loaded
  if (!selectedCountry || Object.keys(data).length === 0) {
    return (
      <Card className="mb-4 border border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Market Insights</CardTitle>
            <Badge variant="outline">World Bank Data</Badge>
          </div>
          <CardDescription>
            Select a country on the map to view market data
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading market data...</span>
            </div>
          ) : (
            <span>No country selected</span>
          )}
        </CardContent>
      </Card>
    );
  }

  // Get the data for the selected country
  const countryData = data[selectedCountry];

  return (
    <Card className="mb-4 border border-primary/20">
      <CardContent className="p-0">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Refreshing data...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 p-4 rounded-md flex items-start gap-2 m-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Error loading data</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {!loading && countryData && (
          <>
            {/* Use the new CompactInsightsPanel component for better formatting */}
            <CompactInsightsPanel data={{
              countryName: countryData.countryName,
              gdp: countryData.gdp,
              marketSize: countryData.marketSize,
              growthRate: countryData.growthRate,
              marketShare: countryData.marketShare,
              revenue: countryData.revenue || countryData.marketSize * 0.15,
              detailedAnalytics: countryData.detailedAnalytics
            }} />
            
            <div className="px-4 py-2 border-t text-xs flex justify-between items-center">
              <span className="text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </>
        )}


      </CardContent>
    </Card>
  );
}