import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface DirectMarketWidgetProps {
  country: string;
  region?: string;
  industry?: string;
}

/**
 * This component bypasses the data flow issues by directly fetching
 * from the knowledge graph API and displaying the market size
 */
export function DirectMarketWidget({ 
  country, 
  region = 'Middle East', 
  industry = 'Technology' 
}: DirectMarketWidgetProps) {
  const [marketSize, setMarketSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country) return;

    const fetchMarketSize = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[DirectMarketWidget] Fetching market size for ${country}`);
        
        const response = await axios.get('/api/knowledge-graph', {
          params: {
            country,
            region,
            industry,
            isPremium: true
          }
        });

        console.log(`[DirectMarketWidget] API response:`, response.data);
        
        if (response.data && typeof response.data.marketSize === 'number') {
          setMarketSize(response.data.marketSize);
          console.log(`[DirectMarketWidget] Market size set to: ${response.data.marketSize}`);
        } else {
          setError('Invalid market size data in response');
        }
      } catch (err) {
        console.error('[DirectMarketWidget] Error fetching market size:', err);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketSize();
  }, [country, region, industry]);

  return (
    <Card className="mb-4 border-2 border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Real Market Size</CardTitle>
          <Badge variant="outline" className="ml-2">Direct API</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-2">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading data...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : marketSize !== null ? (
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(marketSize)}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No data available</div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {country} • {industry} Industry • {new Date().toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}