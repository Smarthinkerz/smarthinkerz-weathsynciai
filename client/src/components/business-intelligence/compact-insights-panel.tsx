import React from 'react';

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

interface CompactInsightsPanelProps {
  data: BusinessMetrics;
}

export function CompactInsightsPanel({ data }: CompactInsightsPanelProps) {
  // Format currency values with proper spacing
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "N/A";
    
    // Determine which scale to use based on the value
    if (value >= 1_000_000_000_000) {
      // Trillions
      return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
    } else if (value >= 1_000_000_000) {
      // Billions
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      // Millions
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      // Thousands
      return `$${(value / 1_000).toFixed(1)}K`;
    } else {
      // Regular numbers
      return `$${value.toFixed(1)}`;
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px', margin: '8px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
          Business Intelligence - {data.countryName}
        </h2>
        <span style={{ fontSize: '12px', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px' }}>
          Live Data
        </span>
      </div>
      
      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Total GDP */}
        {data.gdp !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Total GDP</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              {formatCurrency(data.gdp)}
            </span>
          </div>
        )}
        
        {/* Market Size */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Market Size</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {formatCurrency(data.marketSize)}
          </span>
        </div>
        
        {/* Growth Rate */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Growth Rate</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: data.growthRate >= 0 ? '#059669' : '#dc2626' }}>
            {data.growthRate.toFixed(1)}%
          </span>
        </div>
        
        {/* Market Share */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Market Share</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {data.marketShare}%
          </span>
        </div>
        
        {/* Average Revenue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Avg. Revenue</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {formatCurrency(data.revenue)}
          </span>
        </div>
      </div>
      
      {/* Quarterly Growth Analysis */}
      {data.detailedAnalytics?.quarterlyGrowth && (
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Quarterly Growth Analysis</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.detailedAnalytics.quarterlyGrowth.map((growth, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Q{index + 1}</span>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: growth >= 1 ? '#059669' : growth > -1 ? '#d97706' : '#dc2626' 
                }}>
                  {growth.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Market Penetration */}
      {data.detailedAnalytics?.marketPenetration && (
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Market Penetration</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              {data.detailedAnalytics.marketPenetration.toFixed(1)}%
            </span>
          </div>
          {data.detailedAnalytics.riskAssessment && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Risk Level</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {data.detailedAnalytics.riskAssessment}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}