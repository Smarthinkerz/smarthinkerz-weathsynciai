import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface BusinessMetrics {
  gdp?: number;
  marketSize: number;
  growthRate: number;
  marketShare: number;
  revenue: number;
  countryName: string;
  detailedAnalytics?: {
    quarterlyGrowth: number[];
    marketPenetration: number;
    riskAssessment?: string;
  };
}

interface BusinessInsightsPanelProps {
  data: BusinessMetrics;
}

export function BusinessInsightsPanel({ data }: BusinessInsightsPanelProps) {
  // Format currency values with proper spacing and notation
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "N/A";
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
      }).format(value);
    } catch (err) {
      console.error('Error formatting currency:', err);
      return `$${value.toLocaleString()}`;
    }
  };

  // Format percentage with proper spacing
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="shadow-md border rounded-lg overflow-hidden">
      <div className="bg-primary/5 p-4 flex justify-between items-start">
        <h2 className="text-xl font-bold">
          Business Intelligence<br />
          Insights for {data.countryName}
        </h2>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          Real-time market<br />intelligence (30s updates)
        </div>
      </div>
      
      <CardContent className="p-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {data.gdp !== undefined && (
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-sm font-semibold mb-1">Total GDP</div>
              <div className="text-2xl font-bold">{formatCurrency(data.gdp)}</div>
            </div>
          )}
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm font-semibold mb-1">Market Size</div>
            <div className="text-2xl font-bold">{formatCurrency(data.marketSize)}</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm font-semibold mb-1">Growth Rate</div>
            <div className={`text-2xl font-bold ${data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(data.growthRate)}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm font-semibold mb-1">Market Share</div>
            <div className="text-2xl font-bold">{formatPercentage(data.marketShare)}</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm font-semibold mb-1">Avg. Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue)}</div>
          </div>
        </div>
        
        {/* Quarterly Growth Analysis */}
        {data.detailedAnalytics?.quarterlyGrowth && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Quarterly Growth Analysis</h3>
              <div className="text-sm font-medium text-gray-500">%</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {data.detailedAnalytics.quarterlyGrowth.map((growth, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded border ${
                    growth >= 1 ? 'bg-green-50 border-green-200' : 
                    growth > -1 ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-1">Q{index + 1}</div>
                    <div className={`text-xl font-bold ${
                      growth >= 1 ? 'text-green-700' : 
                      growth > -1 ? 'text-amber-700' :
                      'text-red-700'
                    }`}>
                      {growth.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Market Penetration */}
        {data.detailedAnalytics?.marketPenetration && (
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Market Penetration</h3>
              <div className="text-2xl font-bold">
                {data.detailedAnalytics.marketPenetration.toFixed(1)}%
              </div>
            </div>
            {data.detailedAnalytics.riskAssessment && (
              <div className="text-sm text-gray-500 mt-1">
                Risk Level: {data.detailedAnalytics.riskAssessment}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}