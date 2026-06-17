import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Calculator, DollarSign, TrendingUp } from "lucide-react";

interface DirectMarketOverviewProps {
  country: string;
  industry?: string;
}

/**
 * This is a more comprehensive market overview component
 * that directly fetches data from the knowledge graph API
 */
export function DirectMarketOverview({
  country,
  industry = 'Technology'
}: DirectMarketOverviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country) return;

    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[DirectMarketOverview] Fetching data for ${country}, ${industry}`);
        
        const response = await axios.get('/api/knowledge-graph', {
          params: {
            country,
            industry,
            isPremium: true
          }
        });

        console.log(`[DirectMarketOverview] Received data:`, response.data);
        
        if (response.data) {
          setData(response.data);
        } else {
          setError('Invalid data response');
        }
      } catch (err) {
        console.error('[DirectMarketOverview] Error fetching data:', err);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [country, industry]);

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="mb-4 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Market Data</CardTitle>
          <CardDescription className="text-red-500">
            {error || 'Unable to load market data'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <Card className="mb-4 border-2 border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {country} {industry} Market
        </CardTitle>
        <CardDescription>
          Real-time market data from World Bank and IMF APIs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center py-2 bg-primary/5 rounded-md border">
            <div className="text-xs text-muted-foreground mb-1">Total Addressable Market</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(data.marketSize)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-md border border-green-100">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Growth Rate</div>
                <TrendingUp className="h-3 w-3 text-green-600" />
              </div>
              <div className="text-lg font-semibold text-green-600">
                {(data.growthRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Market Share</div>
                <Calculator className="h-3 w-3 text-blue-600" />
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {data.marketShare}%
              </div>
            </div>
          </div>

          {data.competitors && data.competitors.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Top Competitors</div>
              <div className="space-y-1">
                {data.competitors.slice(0, 3).map((competitor: string, index: number) => (
                  <div key={index} className="text-sm flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1 text-primary" />
                    {competitor}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}