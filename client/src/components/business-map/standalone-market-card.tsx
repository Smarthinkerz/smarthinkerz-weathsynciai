import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

export function StandaloneMarketCard() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true); // Start as loading
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("Saudi Arabia");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Function to fetch data directly from the API
  const fetchCountryData = async (country: string) => {
    try {
      setLoading(true);
      const logMsg = `[StandaloneMarketCard] Fetching data for ${country}`;
      console.log(logMsg);
      setDebugLog(prev => [...prev, logMsg]);
      
      // Use the direct knowledge-graph API endpoint, not the combined endpoint
      const response = await axios.get('/api/knowledge-graph', {
        params: {
          country,
          industry: 'Technology',
          region: country.includes("Saudi") || country.includes("Oman") ? "Middle East" : "Global",
          isPremium: true
        }
      });
      
      if (response.data && response.data.marketSize) {
        // Log the exact market size from API for debugging
        const marketSizeLog = `[StandaloneMarketCard] ${country} market size: ${response.data.marketSize}`;
        console.log(marketSizeLog);
        setDebugLog(prev => [...prev, marketSizeLog]);
        
        // Store the data for this country
        setData(prev => {
          const newData = {
            ...prev,
            [country]: response.data
          };
          
          // Log all market sizes in state for comparison
          const markets = Object.entries(newData)
            .map(([c, d]) => `${c}: ${(d as any).marketSize}`)
            .join(', ');
          
          console.log(`[StandaloneMarketCard] All market sizes: ${markets}`);
          setDebugLog(prev => [...prev, `All markets: ${markets}`]);
          
          return newData;
        });
      } else {
        const errorMsg = `[StandaloneMarketCard] Invalid data for ${country}: ${JSON.stringify(response.data)}`;
        console.error(errorMsg);
        setDebugLog(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg = `[StandaloneMarketCard] Error fetching ${country}: ${err}`;
      console.error(errorMsg);
      setDebugLog(prev => [...prev, errorMsg]);
      setError(`Failed to fetch data for ${country}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for initial countries one at a time to avoid race conditions
  useEffect(() => {
    const countries = ["Saudi Arabia", "Oman", "Egypt"];
    
    // Fetch data sequentially to avoid race conditions
    const fetchSequentially = async () => {
      for (const country of countries) {
        await fetchCountryData(country);
      }
    };
    
    fetchSequentially();
  }, []);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <Card className="mb-4 border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Real Market Size Comparison</CardTitle>
          <Badge variant="secondary">Direct API</Badge>
        </div>
        <CardDescription>
          Real-time market data from World Bank API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex space-x-2">
            {["Saudi Arabia", "Oman", "Egypt"].map(country => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedCountry === country 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Error loading data</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && data[selectedCountry] && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">{selectedCountry} Technology Market</div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(data[selectedCountry].marketSize)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Annual market size based on World Bank GDP data
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-xs text-muted-foreground mb-1">Growth Rate</div>
                <div className={`text-lg font-semibold ${
                  data[selectedCountry].growthRate > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(data[selectedCountry].growthRate * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-xs text-muted-foreground mb-1">Market Share</div>
                <div className="text-lg font-semibold text-primary">
                  {data[selectedCountry].marketShare}%
                </div>
              </div>
            </div>

            {data[selectedCountry].competitors && (
              <div>
                <div className="text-xs font-medium mb-2">Top Competitors</div>
                <ul className="space-y-1">
                  {data[selectedCountry].competitors.slice(0, 3).map((competitor: string, index: number) => (
                    <li key={index} className="text-sm flex items-center">
                      <span className="w-2 h-2 rounded-full bg-primary/70 mr-2"></span>
                      {competitor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Data source: World Bank API</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          
          {/* Debug log display */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="font-mono text-[10px] text-gray-500 max-h-32 overflow-y-auto">
              {debugLog.map((log, i) => (
                <div key={i} className="whitespace-nowrap overflow-x-hidden text-ellipsis">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}