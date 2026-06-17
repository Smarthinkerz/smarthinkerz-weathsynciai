import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, XAxis, YAxis, Bar, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  Users, BarChart2, PieChart, Percent 
} from 'lucide-react';
import { FormattedEconomicData } from './economics-data-adapter';

interface EconomicIndicator {
  name: string;
  value: string | number;
  change: number;
  status: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

interface BasicEconomicDashboardProps {
  data: FormattedEconomicData;
  isPremium?: boolean;
}

export default function BasicEconomicDashboard({ data, isPremium = false }: BasicEconomicDashboardProps) {
  // Prepare economic indicators
  const indicators: EconomicIndicator[] = [
    {
      name: 'GDP',
      value: data.gdpFormatted,
      change: data.gdpGrowth,
      status: data.gdpGrowth >= 0 ? 'positive' : 'negative',
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      name: 'GDP Growth',
      value: data.gdpGrowthFormatted,
      change: data.gdpGrowth,
      status: data.gdpGrowth >= 0 ? 'positive' : 'negative',
      icon: data.gdpGrowth >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />
    },
    {
      name: 'Inflation',
      value: data.inflationFormatted,
      change: 0, // Not showing change for inflation
      status: data.inflation <= 3 ? 'positive' : data.inflation <= 5 ? 'neutral' : 'negative',
      icon: <Percent className="h-5 w-5" />
    },
    {
      name: 'Unemployment',
      value: data.unemploymentFormatted,
      change: 0, // Not showing change for unemployment
      status: data.unemployment <= 5 ? 'positive' : data.unemployment <= 8 ? 'neutral' : 'negative',
      icon: <Users className="h-5 w-5" />
    }
  ];

  // Prepare market size data for charts
  const marketSizeData = data.marketSizes.map((item) => ({
    name: item.industry,
    value: item.value / 1e9, // Convert to billions for better display
  }));

  // Sort market size data from largest to smallest
  marketSizeData.sort((a, b) => b.value - a.value);

  // Generate colors for different industries
  const getBarColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F',
      '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ];
    return colors[index % colors.length];
  };

  // Prepare historical GDP data if available
  const historicalGDPData = data.historicalGDP || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
          {data.countryName} Economic Dashboard
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Key economic indicators and market size analysis
        </p>
      </div>

      {/* Mobile-Optimized Economic Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {indicators.map((indicator, index) => (
          <Card key={index} className={indicator.status === 'positive' ? 'border-l-4 border-l-green-500' : 
                                      indicator.status === 'negative' ? 'border-l-4 border-l-red-500' : 
                                      'border-l-4 border-l-yellow-500'}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{indicator.name}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{indicator.value}</p>
                </div>
                <div className={`rounded-full p-1.5 sm:p-2 ${
                  indicator.status === 'positive' ? 'bg-green-100 text-green-600' : 
                  indicator.status === 'negative' ? 'bg-red-100 text-red-600' : 
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <div className="h-4 w-4 sm:h-5 sm:w-5">
                    {indicator.icon}
                  </div>
                </div>
              </div>
              
              {indicator.change !== 0 && (
                <div className={`text-sm mt-2 ${
                  indicator.status === 'positive' ? 'text-green-600' : 
                  indicator.status === 'negative' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {indicator.status === 'positive' ? '+' : ''}{indicator.change.toFixed(1)}% from previous year
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Size Analysis */}
      <Tabs defaultValue="market-size">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="market-size" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Market Size</span>
          </TabsTrigger>
          <TabsTrigger value="growth-trends" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Growth Trends</span>
          </TabsTrigger>
          <TabsTrigger value="industry-comparison" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Industry</span>
          </TabsTrigger>
          <TabsTrigger value="economic-indicators" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Economics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="market-size" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Market Size (in Billions USD)</CardTitle>
              <CardDescription>
                Estimated market sizes for key industries in {data.countryName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={marketSizeData.slice(0, 6)} 
                    layout="vertical" 
                    margin={{ top: 5, right: 15, left: 60, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(1)}B`, 'Market Size']} />
                    <Bar dataKey="value" fill="#8884d8" name="Market Size (Billions USD)">
                      {marketSizeData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth-trends" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>GDP Growth Trends</CardTitle>
              <CardDescription>
                {data.countryName} economic growth trajectory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {historicalGDPData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historicalGDPData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`$${(Number(value)/1e9).toFixed(1)}B`, 'GDP']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="GDP (Billions USD)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      Historical GDP data not available for {data.countryName}
                      <br />
                      {isPremium ? 
                        "We're working on adding this data." : 
                        "Upgrade to premium for access to historical trend data."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industry-comparison" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Comparison</CardTitle>
              <CardDescription>
                Top industries by market size in {data.countryName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={marketSizeData.slice(0, 8)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(1)}B`, 'Market Size']} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Market Size (Billions USD)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="economic-indicators" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Economic Indicators</CardTitle>
              <CardDescription>
                Economic health metrics for {data.countryName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'GDP Growth', value: data.gdpGrowth },
                      { name: 'Inflation', value: data.inflation },
                      { name: 'Unemployment', value: data.unemployment }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Rate']} />
                    <Legend />
                    <Bar dataKey="value" name="Percentage (%)">
                      {[
                        { name: 'GDP Growth', value: data.gdpGrowth },
                        { name: 'Inflation', value: data.inflation },
                        { name: 'Unemployment', value: data.unemployment }
                      ].map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'GDP Growth' 
                              ? (entry.value >= 0 ? '#4caf50' : '#f44336') 
                              : entry.name === 'Inflation' 
                                ? (entry.value <= 3 ? '#4caf50' : entry.value <= 5 ? '#ff9800' : '#f44336') 
                                : entry.value <= 5 ? '#4caf50' : entry.value <= 8 ? '#ff9800' : '#f44336'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm font-medium">GDP Growth</h3>
                  <p className={`text-xl font-bold ${data.gdpGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.gdpGrowthFormatted}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.gdpGrowth >= 3 ? 'Strong growth' : 
                     data.gdpGrowth >= 0 ? 'Moderate growth' : 
                     data.gdpGrowth >= -2 ? 'Slow growth/recession' : 'Severe recession'}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm font-medium">Inflation</h3>
                  <p className={`text-xl font-bold ${
                    data.inflation <= 3 ? 'text-green-600' : 
                    data.inflation <= 5 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {data.inflationFormatted}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.inflation <= 2 ? 'Low inflation' : 
                     data.inflation <= 5 ? 'Moderate inflation' : 
                     'High inflation'}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm font-medium">Unemployment</h3>
                  <p className={`text-xl font-bold ${
                    data.unemployment <= 5 ? 'text-green-600' : 
                    data.unemployment <= 8 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {data.unemploymentFormatted}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.unemployment <= 4 ? 'Low unemployment' : 
                     data.unemployment <= 7 ? 'Moderate unemployment' : 
                     'High unemployment'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Attribution */}
      <div className="text-xs text-muted-foreground text-center mt-6">
        Data sources: World Bank, IMF, OECD, and National Statistical Offices (2023-2025)
      </div>
    </div>
  );
}