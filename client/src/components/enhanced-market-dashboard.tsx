import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, PieChart, BarChart3, Globe, AlertTriangle } from "lucide-react";
import { MarketGrowthChart } from "./charts/market-growth-chart";
import { PortfolioAllocationChart } from "./charts/portfolio-allocation-chart";
import { RiskAssessmentChart } from "./charts/risk-assessment-chart";
import { useToast } from "@/hooks/use-toast";

interface MarketReport {
  id: number;
  country: string;
  industry: string;
  marketSize: string;
  growthRate: string;
  riskLevel: string;
  investmentActivity: string;
  competitorDensity: string;
  createdAt: string;
}

export function EnhancedMarketDashboard() {
  const [selectedReport, setSelectedReport] = useState<MarketReport | null>(null);
  const { toast } = useToast();

  const { data: reports, isLoading } = useQuery<MarketReport[]>({
    queryKey: ['/api/company/market-reports'],
  });

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/company/market-reports/export', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'market-reports.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: "Market reports exported successfully",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export market data",
        variant: "destructive",
      });
    }
  };

  const getMarketSizeValue = (marketSize: string): number => {
    const value = parseFloat(marketSize.replace(/[^0-9.]/g, ''));
    if (marketSize.includes('T')) return value * 1000;
    if (marketSize.includes('M')) return value / 1000;
    return value;
  };

  const getPortfolioData = () => {
    if (!reports || reports.length === 0) return null;

    const sectorData = reports.reduce((acc, report) => {
      const existing = acc.find(item => item.name === report.industry);
      const value = getMarketSizeValue(report.marketSize);
      
      if (existing) {
        existing.value += value;
      } else {
        acc.push({
          name: report.industry,
          value: value,
          color: getIndustryColor(report.industry)
        });
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[]);

    return { sectors: sectorData };
  };

  const getRiskData = () => {
    if (!reports || reports.length === 0) return null;

    const riskCategories = [
      { name: 'Market Risk', riskScore: 0, maxScore: 10 },
      { name: 'Political Risk', riskScore: 0, maxScore: 10 },
      { name: 'Economic Risk', riskScore: 0, maxScore: 10 },
      { name: 'Operational Risk', riskScore: 0, maxScore: 10 }
    ];

    // Calculate average risk scores based on reports
    reports.forEach(report => {
      const riskMultiplier = report.riskLevel === 'high' ? 8 : 
                           report.riskLevel === 'medium' ? 5 : 2;
      
      riskCategories[0].riskScore += riskMultiplier * 0.3; // Market Risk
      riskCategories[1].riskScore += riskMultiplier * 0.2; // Political Risk
      riskCategories[2].riskScore += riskMultiplier * 0.3; // Economic Risk
      riskCategories[3].riskScore += riskMultiplier * 0.2; // Operational Risk
    });

    // Average the scores
    riskCategories.forEach(category => {
      category.riskScore = Math.round(category.riskScore / reports.length);
    });

    return { categories: riskCategories };
  };

  const getIndustryColor = (industry: string): string => {
    const colors = {
      'Technology': '#3b82f6',
      'Healthcare': '#10b981',
      'Finance': '#f59e0b',
      'Energy': '#ef4444',
      'Manufacturing': '#8b5cf6',
      'Retail': '#06b6d4',
      'Agriculture': '#84cc16',
      'Tourism': '#f97316'
    };
    return colors[industry as keyof typeof colors] || '#6b7280';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Enhanced Market Dashboard</CardTitle>
            <CardDescription>No market reports available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const portfolioData = getPortfolioData();
  const riskData = getRiskData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Market Analysis</h1>
          <p className="text-muted-foreground">Comprehensive business intelligence dashboard</p>
        </div>
        <Button onClick={handleExportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Analyzed markets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reports.reduce((sum, report) => sum + getMarketSizeValue(report.marketSize), 0).toFixed(1)}B
            </div>
            <p className="text-xs text-muted-foreground">Combined market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Growth Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reports.reduce((sum, report) => sum + parseFloat(report.growthRate.replace('%', '')), 0) / reports.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Average growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Markets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.riskLevel === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Distribution</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedReport(report)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {report.country} - {report.industry}
                    <Badge variant={report.riskLevel === 'high' ? 'destructive' : 
                                  report.riskLevel === 'medium' ? 'default' : 'secondary'}>
                      {report.riskLevel}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Market Size: {report.marketSize}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Growth Rate:</span>
                      <div className="text-green-600">{report.growthRate}</div>
                    </div>
                    <div>
                      <span className="font-medium">Investment Activity:</span>
                      <div>{report.investmentActivity}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          {selectedReport ? (
            <Card>
              <CardHeader>
                <CardTitle>Market Growth Projection</CardTitle>
                <CardDescription>
                  5-year projection for {selectedReport.country} {selectedReport.industry} market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketGrowthChart data={selectedReport} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Select a market from the overview to view growth projections</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          {portfolioData && (
            <Card>
              <CardHeader>
                <CardTitle>Market Portfolio Distribution</CardTitle>
                <CardDescription>Distribution of market investments by industry sector</CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioAllocationChart data={portfolioData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {riskData && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Overview</CardTitle>
                <CardDescription>Comprehensive risk analysis across all market segments</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskAssessmentChart data={riskData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}