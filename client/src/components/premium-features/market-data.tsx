import { isHighTier } from '@shared/schema';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Clock, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from "@/hooks/use-toast";
import { AIRecommendations } from './ai-recommendations';

// Helper function for consistent number formatting
const formatCurrency = (num: number) => {
  if (!num && num !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  }).format(num);
};

const formatPercent = (num: number) => {
  if (!num && num !== 0) return '0%';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  }).format(num) + '%';
};

export function MarketData({ country, industry }: { country: string; industry: string }) {
  const { user } = useAuth();
  const isPremium = isHighTier(user?.subscriptionTier);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState(30);
  const previousDataRef = useRef<any>(null);

  const { data: marketData, isLoading, refetch } = useQuery({
    queryKey: ['/api/market-data', country, industry],
    enabled: isPremium && Boolean(country) && Boolean(industry),
    refetchInterval: isPremium ? 30000 : false,
    refetchIntervalInBackground: true,
    onSuccess: () => {
      setLastUpdateTime(new Date());
      setSecondsUntilUpdate(30);
    }
  });

  useEffect(() => {
    if (isPremium) {
      const timer = setInterval(() => {
        const now = new Date();
        const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();
        const timeUntilNextUpdate = Math.ceil((30000 - (timeSinceLastUpdate % 30000)) / 1000);
        setSecondsUntilUpdate(timeUntilNextUpdate);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPremium, lastUpdateTime]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdateTime(new Date());
      setSecondsUntilUpdate(30);
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to manually refresh market data",
        variant: "destructive",
      });
    }
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Market Analysis Header - Always visible at the top */}
      <div className="bg-card p-6 rounded-lg border-2 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Premium Market Analysis
            </h2>
            <p className="text-lg text-muted-foreground mt-2">
              {industry} in {country}
              <span className="ml-3 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium inline-block">
                Real-time market intelligence (30s updates)
              </span>
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* Live Updates Indicator with Flashing Dot */}
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-medium">Live Updates ({secondsUntilUpdate}s)</span>
            </div>
            {/* Last Update Time */}
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last update: {lastUpdateTime.toLocaleTimeString()}
            </div>
            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[800px]">
        <div className="space-y-6">
          {/* Market Metrics Cards */}
          {isPremium && marketData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center h-[240px] p-8">
                  <div className="text-center">
                    <h4 className="text-base font-medium text-muted-foreground mb-8">Market Size</h4>
                    <p className="text-4xl font-bold mb-4">
                      {formatCurrency(marketData.marketSize)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercent(marketData.growthRate)} YoY Growth
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center h-[240px] p-8">
                  <div className="text-center">
                    <h4 className="text-base font-medium text-muted-foreground mb-8">Market Share</h4>
                    <p className="text-4xl font-bold mb-4">
                      {formatPercent(marketData.marketShare)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Industry Position
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center h-[240px] p-8">
                  <div className="text-center">
                    <h4 className="text-base font-medium text-muted-foreground mb-8">AI Confidence</h4>
                    <p className="text-4xl font-bold mb-4">
                      {formatPercent(marketData.aiConfidence * 100)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Prediction Accuracy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Market Trends Chart */}
          {isPremium && marketData && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marketData?.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="period" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                      <YAxis
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.8)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '12px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        name="Market Value"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        name="Growth Rate"
                        dataKey="growth"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {isPremium && marketData && (
            <AIRecommendations
              industry={industry}
              region={country}
              marketMetrics={{
                marketSize: marketData.marketSize,
                growthRate: marketData.growthRate,
                marketShare: marketData.marketShare,
              }}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}