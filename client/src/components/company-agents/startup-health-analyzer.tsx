import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Users, BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StartupHealthData {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    overallHealthScore: number;
    financialHealth: {
      score: number;
      cashFlow: number;
      burnRate: number;
      runway: number;
      revenue: number;
      revenueGrowth: number;
      status: 'excellent' | 'good' | 'moderate' | 'poor';
    };
    operationalHealth: {
      score: number;
      efficiency: number;
      customerAcquisition: number;
      retention: number;
      satisfaction: number;
      status: 'excellent' | 'good' | 'moderate' | 'poor';
    };
    marketHealth: {
      score: number;
      marketShare: number;
      competitivePosition: number;
      growthPotential: number;
      marketSentiment: number;
      status: 'excellent' | 'good' | 'moderate' | 'poor';
    };
    teamHealth: {
      score: number;
      productivity: number;
      satisfaction: number;
      retention: number;
      skillGaps: string[];
      status: 'excellent' | 'good' | 'moderate' | 'poor';
    };
    riskFactors: {
      name: string;
      severity: 'low' | 'medium' | 'high';
      impact: string;
      mitigation: string;
    }[];
    actionItems: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      action: string;
      timeline: string;
      impact: string;
    }[];
  };
  timestamp: Date;
}

interface StartupHealthAnalyzerProps {
  company?: {
    id: number;
    name: string;
    industry?: string;
    country?: string;
    employeeCount?: number;
    revenue?: number;
  };
}

export function StartupHealthAnalyzer({ company }: StartupHealthAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<StartupHealthData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/company/agents/startup-health", {
        marketData: {
          industry: company?.industry || 'Technology',
          region: company?.country || 'Global',
          employeeCount: company?.employeeCount || 50,
          revenue: company?.revenue || 1000000
        }
      });
      return await response.json();
    },
    onSuccess: (data: StartupHealthData) => {
      setAnalysisResult(data);
      toast({
        title: "Startup Health Analysis Complete",
        description: "Comprehensive health assessment has been generated for your company."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate startup health analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    analysisMutation.mutate();
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-5 w-5 text-blue-600" />;
    if (score >= 40) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Startup Health Analyzer
            <Badge variant="outline" className="ml-auto">Premium Company</Badge>
          </CardTitle>
          <CardDescription>
            Comprehensive health assessment and performance analysis for {company?.name || 'your company'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {analysisMutation.isPending ? "Analyzing Company Health..." : "Run Health Analysis"}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Health Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Health Score</CardTitle>
              <CardDescription>
                Comprehensive assessment based on financial, operational, market, and team metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Health Score</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded-full ${getHealthColor(analysisResult.data.overallHealthScore)}`}>
                      {analysisResult.data.overallHealthScore}/100
                    </span>
                  </div>
                  <Progress value={analysisResult.data.overallHealthScore} className="h-3" />
                </div>
                {getHealthIcon(analysisResult.data.overallHealthScore)}
              </div>
            </CardContent>
          </Card>

          {/* Health Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Financial Health</p>
                    <p className="text-2xl font-bold">{analysisResult.data.financialHealth.score}/100</p>
                    <Badge variant="outline" className={getHealthColor(analysisResult.data.financialHealth.score)}>
                      {analysisResult.data.financialHealth.status}
                    </Badge>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Operational Health</p>
                    <p className="text-2xl font-bold">{analysisResult.data.operationalHealth.score}/100</p>
                    <Badge variant="outline" className={getHealthColor(analysisResult.data.operationalHealth.score)}>
                      {analysisResult.data.operationalHealth.status}
                    </Badge>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Health</p>
                    <p className="text-2xl font-bold">{analysisResult.data.marketHealth.score}/100</p>
                    <Badge variant="outline" className={getHealthColor(analysisResult.data.marketHealth.score)}>
                      {analysisResult.data.marketHealth.status}
                    </Badge>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Health</p>
                    <p className="text-2xl font-bold">{analysisResult.data.teamHealth.score}/100</p>
                    <Badge variant="outline" className={getHealthColor(analysisResult.data.teamHealth.score)}>
                      {analysisResult.data.teamHealth.status}
                    </Badge>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Health Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="operational">Operational</TabsTrigger>
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                      <p className="text-gray-700 leading-relaxed">{analysisResult.analysis}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key Recommendations</h3>
                      <div className="space-y-2">
                        {analysisResult.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Financial Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Cash Flow</span>
                          <span className="font-medium">${analysisResult.data.financialHealth.cashFlow?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Burn Rate</span>
                          <span className="font-medium">${analysisResult.data.financialHealth.burnRate?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Runway</span>
                          <span className="font-medium">{analysisResult.data.financialHealth.runway} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenue Growth</span>
                          <span className="font-medium text-green-600">+{analysisResult.data.financialHealth.revenueGrowth}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Financial Health Score</h4>
                      <Progress value={analysisResult.data.financialHealth.score} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Financial health is assessed based on cash flow, burn rate, revenue growth, and overall financial stability.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="operational" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Operational Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Efficiency Score</span>
                          <span className="font-medium">{analysisResult.data.operationalHealth.efficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Acquisition</span>
                          <span className="font-medium">{analysisResult.data.operationalHealth.customerAcquisition}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Retention</span>
                          <span className="font-medium">{analysisResult.data.operationalHealth.retention}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Satisfaction</span>
                          <span className="font-medium">{analysisResult.data.operationalHealth.satisfaction}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Operational Health Score</h4>
                      <Progress value={analysisResult.data.operationalHealth.score} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Operational health reflects efficiency, customer metrics, and process optimization.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="market" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Market Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Market Share</span>
                          <span className="font-medium">{analysisResult.data.marketHealth.marketShare}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Competitive Position</span>
                          <span className="font-medium">{analysisResult.data.marketHealth.competitivePosition}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Growth Potential</span>
                          <span className="font-medium">{analysisResult.data.marketHealth.growthPotential}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Sentiment</span>
                          <span className="font-medium">{analysisResult.data.marketHealth.marketSentiment}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Market Health Score</h4>
                      <Progress value={analysisResult.data.marketHealth.score} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Market health evaluates competitive position, growth potential, and market dynamics.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="team" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Team Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Productivity</span>
                          <span className="font-medium">{analysisResult.data.teamHealth.productivity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Team Satisfaction</span>
                          <span className="font-medium">{analysisResult.data.teamHealth.satisfaction}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Employee Retention</span>
                          <span className="font-medium">{analysisResult.data.teamHealth.retention}%</span>
                        </div>
                      </div>
                      {analysisResult.data.teamHealth.skillGaps && analysisResult.data.teamHealth.skillGaps.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Skill Gaps Identified</h5>
                          <div className="space-y-1">
                            {analysisResult.data.teamHealth.skillGaps.map((gap, index) => (
                              <Badge key={index} variant="outline" className="mr-2 mb-1">
                                {gap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Team Health Score</h4>
                      <Progress value={analysisResult.data.teamHealth.score} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Team health assesses productivity, satisfaction, retention, and skill alignment.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {analysisResult.data.riskFactors && analysisResult.data.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Risk Factors
                </CardTitle>
                <CardDescription>
                  Identified risks and recommended mitigation strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.data.riskFactors.map((risk, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{risk.name}</h4>
                        <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                          {risk.severity} risk
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{risk.impact}</p>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {analysisResult.data.actionItems && analysisResult.data.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>
                  Prioritized action items to improve company health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.data.actionItems.map((action, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getPriorityColor(action.priority)}>
                            {action.priority} priority
                          </Badge>
                          <span className="text-sm text-gray-600">{action.category}</span>
                        </div>
                        <span className="text-sm text-gray-600">{action.timeline}</span>
                      </div>
                      <h4 className="font-semibold mb-2">{action.action}</h4>
                      <p className="text-sm text-gray-700">{action.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}