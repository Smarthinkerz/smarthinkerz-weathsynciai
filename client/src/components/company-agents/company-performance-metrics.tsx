import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Target, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PerformanceData {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    overallPerformance: number;
    financialMetrics: {
      revenue: number;
      revenueGrowth: number;
      profitMargin: number;
      burnRate: number;
      cashFlow: number;
      ebitda: number;
      revenuePerEmployee: number;
    };
    operationalMetrics: {
      efficiency: number;
      productivity: number;
      customerAcquisitionCost: number;
      customerLifetimeValue: number;
      retentionRate: number;
      satisfactionScore: number;
      timeToMarket: number;
    };
    marketMetrics: {
      marketShare: number;
      competitivePosition: number;
      brandValue: number;
      customerGrowth: number;
      marketPenetration: number;
    };
    teamMetrics: {
      employeeCount: number;
      productivityIndex: number;
      employeeSatisfaction: number;
      turnoverRate: number;
      skillDevelopment: number;
      diversity: number;
    };
    trendAnalysis: {
      metric: string;
      trend: 'upward' | 'downward' | 'stable';
      changePercent: number;
      forecast: number;
      confidence: number;
    }[];
    benchmarking: {
      category: string;
      ourValue: number;
      industryAverage: number;
      topPerformer: number;
      percentile: number;
    }[];
    kpis: {
      name: string;
      current: number;
      target: number;
      unit: string;
      status: 'ahead' | 'on-track' | 'behind' | 'critical';
      trend: 'improving' | 'stable' | 'declining';
    }[];
    alerts: {
      type: 'warning' | 'critical' | 'opportunity';
      metric: string;
      message: string;
      action: string;
    }[];
  };
  timestamp: Date;
}

interface CompanyPerformanceMetricsProps {
  company?: {
    id: number;
    name: string;
    industry?: string;
    country?: string;
  };
}

export function CompanyPerformanceMetrics({ company }: CompanyPerformanceMetricsProps) {
  const [analysisResult, setAnalysisResult] = useState<PerformanceData | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/company/agents/performance-metrics", {
        industry: company?.industry || 'Technology',
        country: company?.country || 'Global'
      });
      return await response.json();
    },
    onSuccess: (data: PerformanceData) => {
      setAnalysisResult(data);
      toast({
        title: "Performance Analysis Complete",
        description: "Comprehensive performance metrics have been generated for your company."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate performance analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    analysisMutation.mutate();
  };

  const getPerformanceColor = (value: number, target?: number) => {
    const threshold = target || 80;
    if (value >= threshold) return 'text-green-600 bg-green-50';
    if (value >= threshold * 0.75) return 'text-blue-600 bg-blue-50';
    if (value >= threshold * 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'text-green-600 bg-green-50';
      case 'on-track': return 'text-blue-600 bg-blue-50';
      case 'behind': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'upward':
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'downward':
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'opportunity': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Company Performance Metrics
            <Badge variant="outline" className="ml-auto">Premium Company</Badge>
          </CardTitle>
          <CardDescription>
            Real-time business performance monitoring and predictive analytics for {company?.name || 'your company'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            {analysisMutation.isPending ? "Analyzing Performance..." : "Generate Performance Report"}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Performance Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance Score</CardTitle>
              <CardDescription>
                Comprehensive performance assessment across all business dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Performance Score</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded-full ${getPerformanceColor(analysisResult.data.overallPerformance)}`}>
                      {analysisResult.data.overallPerformance}/100
                    </span>
                  </div>
                  <Progress value={analysisResult.data.overallPerformance} className="h-3" />
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {analysisResult.data.alerts && analysisResult.data.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
                <CardDescription>
                  Critical insights and opportunities requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.data.alerts.map((alert, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{alert.metric}</h4>
                        <Badge variant="outline" className={getAlertColor(alert.type)}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <p className="text-sm font-medium">Recommended Action: {alert.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Performance Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>
                Critical metrics tracking against targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.data.kpis.map((kpi, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{kpi.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(kpi.status)}>
                          {kpi.status}
                        </Badge>
                        {getTrendIcon(kpi.trend)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current</p>
                        <p className="text-lg font-bold">{kpi.current}{kpi.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target</p>
                        <p className="text-lg font-bold">{kpi.target}{kpi.unit}</p>
                      </div>
                    </div>
                    <Progress 
                      value={(kpi.current / kpi.target) * 100} 
                      className="mt-3 h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="financial">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="operational">Operational</TabsTrigger>
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="financial" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Revenue</p>
                            <p className="text-2xl font-bold">${(analysisResult.data.financialMetrics.revenue / 1000000).toFixed(1)}M</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                            <p className={`text-2xl font-bold ${analysisResult.data.financialMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {analysisResult.data.financialMetrics.revenueGrowth >= 0 ? '+' : ''}{analysisResult.data.financialMetrics.revenueGrowth}%
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                            <p className="text-2xl font-bold">{analysisResult.data.financialMetrics.profitMargin}%</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Cash Flow</p>
                            <p className={`text-2xl font-bold ${analysisResult.data.financialMetrics.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${Math.abs(analysisResult.data.financialMetrics.cashFlow / 1000000).toFixed(1)}M
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">EBITDA</p>
                            <p className="text-2xl font-bold">${(analysisResult.data.financialMetrics.ebitda / 1000000).toFixed(1)}M</p>
                          </div>
                          <Target className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Revenue/Employee</p>
                            <p className="text-2xl font-bold">${(analysisResult.data.financialMetrics.revenuePerEmployee / 1000).toFixed(0)}K</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="operational" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Efficiency</p>
                            <p className="text-2xl font-bold">{analysisResult.data.operationalMetrics.efficiency}%</p>
                          </div>
                          <Zap className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                            <p className="text-2xl font-bold">{analysisResult.data.operationalMetrics.retentionRate}%</p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                            <p className="text-2xl font-bold">{analysisResult.data.operationalMetrics.satisfactionScore}/10</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">CAC</p>
                            <p className="text-2xl font-bold">${analysisResult.data.operationalMetrics.customerAcquisitionCost}</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">LTV</p>
                            <p className="text-2xl font-bold">${(analysisResult.data.operationalMetrics.customerLifetimeValue / 1000).toFixed(0)}K</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Time to Market</p>
                            <p className="text-2xl font-bold">{analysisResult.data.operationalMetrics.timeToMarket} days</p>
                          </div>
                          <Clock className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="market" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Market Share</p>
                            <p className="text-2xl font-bold">{analysisResult.data.marketMetrics.marketShare}%</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Competitive Position</p>
                            <p className="text-2xl font-bold">{analysisResult.data.marketMetrics.competitivePosition}%</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Brand Value</p>
                            <p className="text-2xl font-bold">${(analysisResult.data.marketMetrics.brandValue / 1000000).toFixed(1)}M</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Customer Growth</p>
                            <p className="text-2xl font-bold">+{analysisResult.data.marketMetrics.customerGrowth}%</p>
                          </div>
                          <Users className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Market Penetration</p>
                            <p className="text-2xl font-bold">{analysisResult.data.marketMetrics.marketPenetration}%</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="team" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Employee Count</p>
                            <p className="text-2xl font-bold">{analysisResult.data.teamMetrics.employeeCount}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Productivity Index</p>
                            <p className="text-2xl font-bold">{analysisResult.data.teamMetrics.productivityIndex}</p>
                          </div>
                          <Zap className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Employee Satisfaction</p>
                            <p className="text-2xl font-bold">{analysisResult.data.teamMetrics.employeeSatisfaction}%</p>
                          </div>
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
                            <p className="text-2xl font-bold">{analysisResult.data.teamMetrics.turnoverRate}%</p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Skill Development</p>
                            <p className="text-2xl font-bold">{analysisResult.data.teamMetrics.skillDevelopment}%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Diversity Index</p>
                            <p className="text-2xl font-bold">{analysisResult.data.teamMetrics.diversity}%</p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="trends" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Trend Analysis & Forecasting</h3>
                    <div className="space-y-3">
                      {analysisResult.data.trendAnalysis.map((trend, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{trend.metric}</h4>
                            <div className="flex items-center space-x-2">
                              {getTrendIcon(trend.trend)}
                              <Badge variant="outline" className={getPerformanceColor(trend.confidence)}>
                                {trend.confidence}% confidence
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Change</p>
                              <p className={`font-medium ${trend.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.changePercent >= 0 ? '+' : ''}{trend.changePercent}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Forecast</p>
                              <p className="font-medium">{trend.forecast}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Trend</p>
                              <p className="font-medium capitalize">{trend.trend}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Industry Benchmarking */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Industry Benchmarking</h3>
                      <div className="space-y-3">
                        {analysisResult.data.benchmarking.map((benchmark, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-3">{benchmark.category}</h4>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Our Value</p>
                                <p className="font-medium">{benchmark.ourValue}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Industry Avg</p>
                                <p className="font-medium">{benchmark.industryAverage}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Top Performer</p>
                                <p className="font-medium">{benchmark.topPerformer}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Percentile</p>
                                <Badge variant="outline" className={getPerformanceColor(benchmark.percentile)}>
                                  {benchmark.percentile}th
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}