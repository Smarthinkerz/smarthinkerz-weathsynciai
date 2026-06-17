import { isHighTier } from '@shared/schema';
import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Users, BarChart, Globe, AlertTriangle, LineChart, Percent, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/use-auth";

interface BusinessMetrics {
  revenue: number;
  marketShare: number;
  growthRate: number;
  competitors: string[];
  marketSize: number | null;
  industryTrends: string[];
  countryName: string;
  gdp?: number; // Total GDP value from authoritative sources
  detailedAnalytics?: {
    quarterlyGrowth: number[];
    marketPenetration: number;
    competitorMarketShare: Record<string, number>;
    riskAssessment: string;
    economicIndicators?: {
      inflation?: number;
      unemployment?: number;
    };
  };
  realTimeMetrics?: {
    lastUpdate: string;
    volatility: number;
    sentiment: string;
  };
}

interface KnowledgeGraphProps {
  industry: string;
  region: string;
  selectedCountry: string | null;
}

export function KnowledgeGraph({ industry, region, selectedCountry }: KnowledgeGraphProps) {
  const { user } = useAuth();
  const isPremium = isHighTier(user?.subscriptionTier);

  const { data: metrics, isLoading, error, isError } = useQuery<BusinessMetrics>({
    queryKey: ['/api/knowledge-graph', industry, region, selectedCountry],
    queryFn: async () => {
      console.log(`[KnowledgeGraph] Fetching data:`, {
        industry,
        region,
        selectedCountry,
        isPremium
      });

      if (!industry || !region) {
        throw new Error("Industry and region are required");
      }

      const params = new URLSearchParams();
      if (selectedCountry) {
        params.append('country', selectedCountry);
      }
      params.append('isPremium', isPremium ? 'true' : 'false');

      const response = await fetch(
        `/api/knowledge-graph/${encodeURIComponent(industry)}/${encodeURIComponent(region)}?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[KnowledgeGraph] Received data:`, data);

      if (!data || !data.countryName) {
        throw new Error('Invalid data received from server');
      }

      return data;
    },
    enabled: Boolean(industry) && Boolean(region) && Boolean(selectedCountry),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Loading Business Intelligence Insights...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load business intelligence data'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertDescription>
          No data available. Please click a country on the map to view its data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <span>Business Intelligence Insights for {metrics.countryName}</span>
          {isPremium && (
            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              Real-time market intelligence (30s updates)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '8px' }}>
        {/* Use Custom Spacing Layout for Better Readability */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '24px' }}>
          {/* GDP - Only show for premium users if available */}
          {isPremium && metrics.gdp !== undefined && (
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Globe className="mr-3 h-5 w-5 text-primary" />
                <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Total GDP</h3>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(metrics.gdp as number)}
              </p>
            </div>
          )}
          
          {/* Market Size */}
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <BarChart className="mr-3 h-5 w-5 text-primary" />
              <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Market Size</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>
              {metrics.marketSize ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(metrics.marketSize) : "No verified data available"}
            </p>
          </div>

          {/* Growth Rate */}
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <TrendingUp className={`mr-3 h-5 w-5 ${
                metrics.growthRate >= 1 ? "text-green-500" : 
                metrics.growthRate > -1 ? "text-amber-500" :
                "text-red-500"
              }`} />
              <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Growth Rate</h3>
            </div>
            <p style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              margin: 0, 
              letterSpacing: '0.5px',
              color: metrics.growthRate >= 1 ? '#047857' : metrics.growthRate > -1 ? '#d97706' : '#dc2626'
            }}>
              {new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 1
              }).format(metrics.growthRate)}%
            </p>
          </div>

          {/* Market Share */}
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center mb-2">
              <Users className="mr-2 h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">Market Share</h3>
            </div>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 1
              }).format(metrics.marketShare)}%
            </p>
          </div>

          {/* Average Revenue - Only shown if there's room */}
          {isPremium && (
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-2">
                <BarChart className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-sm font-medium">Avg. Revenue</h3>
              </div>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(metrics.revenue)}
              </p>
            </div>
          )}
        </div>

        {/* Premium-only detailed analytics */}
        {isPremium && metrics.detailedAnalytics && (
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <LineChart className="h-5 w-5" />
                Quarterly Growth Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {metrics.detailedAnalytics.quarterlyGrowth.map((growth, index) => (
                  <div key={index} style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    backgroundColor: growth >= 1 ? '#f0fdf4' : growth > -1 ? '#fffbeb' : '#fef2f2',
                    borderColor: growth >= 1 ? '#bbf7d0' : growth > -1 ? '#fed7aa' : '#fecaca'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', margin: 0 }}>Q{index + 1}</p>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: growth >= 1 ? '#047857' : growth > -1 ? '#d97706' : '#dc2626',
                        margin: 0,
                        letterSpacing: '0.5px'
                      }}>
                        {growth.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Percent className="h-5 w-5" />
                Market Penetration
              </h3>
              <div style={{ padding: '24px', backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '48px', fontWeight: '700', margin: 0, marginBottom: '16px', color: '#111827' }}>
                  {metrics.detailedAnalytics.marketPenetration.toFixed(1)}%
                </p>
                <p style={{ fontSize: '16px', color: '#6b7280', margin: 0, paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  Risk Level: {metrics.detailedAnalytics.riskAssessment}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Competitors and Trends */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Key Competitors</h3>
            <ul className="list-disc pl-4 space-y-1">
              {metrics.competitors.map((competitor, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {competitor}
                  {isPremium && metrics.detailedAnalytics?.competitorMarketShare[competitor] && (
                    <span className="ml-2 text-xs bg-secondary/20 px-2 py-1 rounded">
                      {metrics.detailedAnalytics.competitorMarketShare[competitor].toFixed(1)}% market share
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Industry Trends</h3>
            <ul className="list-disc pl-4 space-y-1">
              {metrics.industryTrends.map((trend, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {trend}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Economic Indicators and Real-time metrics */}
        {isPremium && (
          <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle className="h-4 w-4 text-primary" />
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Economic Health Indicators</span>
              </div>
              {metrics.realTimeMetrics && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Last updated: {new Date(metrics.realTimeMetrics.lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {/* Economic Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* GDP Growth */}
              <div className={`p-3 rounded-lg ${
                metrics.growthRate >= 1 ? "bg-green-100" :
                metrics.growthRate > -1 ? "bg-amber-100" :
                "bg-red-100"
              }`}>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> GDP Growth
                </p>
                <p className={`text-lg font-semibold ${
                  metrics.growthRate >= 1 ? "text-green-700" :
                  metrics.growthRate > -1 ? "text-amber-700" :
                  "text-red-700"
                }`}>{metrics.growthRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.growthRate >= 2 ? "Strong growth" :
                   metrics.growthRate >= 0 ? "Moderate growth" :
                   metrics.growthRate > -2 ? "Mild contraction" :
                   "Severe contraction"}
                </p>
              </div>
              
              {/* Inflation */}
              {metrics.detailedAnalytics?.economicIndicators?.inflation !== undefined && (
                <div className={`p-3 rounded-lg ${
                  metrics.detailedAnalytics.economicIndicators.inflation <= 2 ? "bg-green-100" :
                  metrics.detailedAnalytics.economicIndicators.inflation <= 4 ? "bg-amber-100" :
                  "bg-red-100"
                }`}>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Percent className="h-4 w-4" /> Inflation Rate
                  </p>
                  <p className={`text-lg font-semibold ${
                    metrics.detailedAnalytics.economicIndicators.inflation <= 2 ? "text-green-700" :
                    metrics.detailedAnalytics.economicIndicators.inflation <= 4 ? "text-amber-700" :
                    "text-red-700"
                  }`}>{metrics.detailedAnalytics.economicIndicators.inflation.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.detailedAnalytics.economicIndicators.inflation <= 2 ? "Healthy" :
                     metrics.detailedAnalytics.economicIndicators.inflation <= 4 ? "Moderate" :
                     "High inflation"}
                  </p>
                </div>
              )}
              
              {/* Unemployment */}
              {metrics.detailedAnalytics?.economicIndicators?.unemployment !== undefined && (
                <div className={`p-3 rounded-lg ${
                  metrics.detailedAnalytics.economicIndicators.unemployment <= 4 ? "bg-green-100" :
                  metrics.detailedAnalytics.economicIndicators.unemployment <= 7 ? "bg-amber-100" :
                  "bg-red-100"
                }`}>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" /> Unemployment
                  </p>
                  <p className={`text-lg font-semibold ${
                    metrics.detailedAnalytics.economicIndicators.unemployment <= 4 ? "text-green-700" :
                    metrics.detailedAnalytics.economicIndicators.unemployment <= 7 ? "text-amber-700" :
                    "text-red-700"
                  }`}>{metrics.detailedAnalytics.economicIndicators.unemployment.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.detailedAnalytics.economicIndicators.unemployment <= 4 ? "Low" :
                     metrics.detailedAnalytics.economicIndicators.unemployment <= 7 ? "Moderate" :
                     "High unemployment"}
                  </p>
                </div>
              )}
            </div>
            
            {/* Market Sentiment */}
            {metrics.realTimeMetrics && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm">
                  Market Sentiment: <span className={`font-medium ${
                    metrics.realTimeMetrics.sentiment === 'Positive' ? 'text-green-600' :
                    metrics.realTimeMetrics.sentiment === 'Neutral' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{metrics.realTimeMetrics.sentiment}</span>
                </p>
                <p className="text-sm">
                  Volatility Index: <span className={`font-medium ${
                    metrics.realTimeMetrics.volatility < 0.5 ? 'text-green-600' :
                    metrics.realTimeMetrics.volatility < 1.5 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{metrics.realTimeMetrics.volatility.toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}