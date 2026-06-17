import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Globe, AlertTriangle, BarChart3, Target, Network, Users } from "lucide-react";
import { StartupHealthAnalyzer } from "@/components/company-agents/startup-health-analyzer";
import { TradeFlowAnalyzer } from "@/components/company-agents/trade-flow-analyzer";
import { MarketRiskAnalyzer } from "@/components/company-agents/market-risk-analyzer";
import { CompanyPerformanceMetrics } from "@/components/company-agents/company-performance-metrics";

interface CompanyDashboardProps {
  company?: {
    id: number;
    name: string;
    subscriptionTier: string;
    industry?: string;
    country?: string;
    employeeCount?: number;
    revenue?: number;
  };
}

export default function CompanyPremiumDashboard({ company }: CompanyDashboardProps) {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const isPremium = isHighTier(company?.subscriptionTier);

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">Premium Company Features</CardTitle>
              <CardDescription className="text-lg">
                Upgrade to Premium to access advanced economic analysis and multi-agent capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 border rounded-lg bg-white/60">
                  <Activity className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold">Startup Health Analysis</h3>
                  <p className="text-sm text-gray-600">Real-time company health monitoring and performance metrics</p>
                </div>
                <div className="p-4 border rounded-lg bg-white/60">
                  <Network className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold">Trade Flow Analysis</h3>
                  <p className="text-sm text-gray-600">International trade patterns and supply chain optimization</p>
                </div>
                <div className="p-4 border rounded-lg bg-white/60">
                  <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                  <h3 className="font-semibold">Market Risk Assessment</h3>
                  <p className="text-sm text-gray-600">Advanced risk modeling and mitigation strategies</p>
                </div>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setActiveAgent(null)}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
          </div>
          
          {activeAgent === "startup-health" && <StartupHealthAnalyzer company={company} />}
          {activeAgent === "trade-flow" && <TradeFlowAnalyzer company={company} />}
          {activeAgent === "market-risk" && <MarketRiskAnalyzer company={company} />}
          {activeAgent === "performance" && <CompanyPerformanceMetrics company={company} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Premium Company Analytics</h1>
              <p className="text-gray-600 mt-2">
                Advanced economic analysis and AI-powered business intelligence for {company?.name}
              </p>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
              Premium Company
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Employees</p>
                  <p className="text-2xl font-bold">{company?.employeeCount || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold">
                    {company?.revenue ? `$${(company.revenue / 1000000).toFixed(1)}M` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Market</p>
                  <p className="text-2xl font-bold">{company?.country || 'Global'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Industry</p>
                  <p className="text-lg font-bold">{company?.industry || 'Technology'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Startup Health Analyzer */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setActiveAgent("startup-health")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-blue-600 transition-colors">
                <Activity className="h-5 w-5 text-blue-600" />
                Startup Health Analyzer
              </CardTitle>
              <CardDescription>
                Comprehensive health assessment of your company's operational and financial metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Financial Health</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Operational Efficiency</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Good</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Growth Trajectory</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">Strong</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Market Position</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Competitive</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Flow Analyzer */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setActiveAgent("trade-flow")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-green-600 transition-colors">
                <Network className="h-5 w-5 text-green-600" />
                Trade Flow Analyzer
              </CardTitle>
              <CardDescription>
                International trade pattern analysis and supply chain optimization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Supply Chain Efficiency</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">92%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Trade Partners</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">15 Countries</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Import/Export Balance</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">Balanced</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Logistics Optimization</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">High Potential</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Risk Analyzer */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setActiveAgent("market-risk")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-orange-600 transition-colors">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Market Risk Analyzer
              </CardTitle>
              <CardDescription>
                Advanced risk assessment and mitigation strategy recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Risk Level</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Market Volatility</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Low</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Currency Risk</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Medium</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Regulatory Risk</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Performance Metrics */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setActiveAgent("performance")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-purple-600 transition-colors">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Real-time business performance monitoring and predictive analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Revenue Growth</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">+23.5%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Customer Retention</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">94.2%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Market Share</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">12.8%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Efficiency Score</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">8.7/10</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Premium Features Overview</CardTitle>
              <CardDescription>
                Advanced capabilities exclusive to premium company subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-2">AI-Powered Analysis</h4>
                  <p className="text-sm text-blue-700">
                    Multi-agent AI system providing deep insights across all business dimensions
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                  <h4 className="font-semibold text-green-800 mb-2">Real-Time Monitoring</h4>
                  <p className="text-sm text-green-700">
                    Continuous tracking of market conditions and business performance metrics
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                  <h4 className="font-semibold text-purple-800 mb-2">Strategic Recommendations</h4>
                  <p className="text-sm text-purple-700">
                    Actionable insights and strategic guidance based on comprehensive data analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}