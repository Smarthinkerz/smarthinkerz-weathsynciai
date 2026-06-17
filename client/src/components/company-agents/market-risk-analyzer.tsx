import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, TrendingDown, TrendingUp, BarChart3, Globe, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MarketRiskData {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    overallRiskScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    marketVolatility: {
      score: number;
      trend: 'increasing' | 'stable' | 'decreasing';
      factors: string[];
    };
    currencyRisk: {
      score: number;
      exposures: {
        currency: string;
        exposure: number;
        volatility: number;
        hedging: 'full' | 'partial' | 'none';
      }[];
    };
    regulatoryRisk: {
      score: number;
      changes: {
        regulation: string;
        impact: 'high' | 'medium' | 'low';
        timeline: string;
        compliance: string;
      }[];
    };
    competitiveRisk: {
      score: number;
      threats: {
        competitor: string;
        threat: string;
        probability: number;
        impact: 'high' | 'medium' | 'low';
      }[];
    };
    economicRisk: {
      score: number;
      indicators: {
        indicator: string;
        current: number;
        forecast: number;
        impact: string;
      }[];
    };
    mitigationStrategies: {
      risk: string;
      strategy: string;
      cost: number;
      effectiveness: number;
      timeline: string;
    }[];
    stressScenarios: {
      scenario: string;
      probability: number;
      impact: number;
      description: string;
      preparation: string[];
    }[];
  };
  timestamp: Date;
}

interface MarketRiskAnalyzerProps {
  company?: {
    id: number;
    name: string;
    industry?: string;
    country?: string;
  };
}

export function MarketRiskAnalyzer({ company }: MarketRiskAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<MarketRiskData | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/company/agents/market-risk", {
        industry: company?.industry || 'Technology',
        country: company?.country || 'Global'
      });
      return await response.json();
    },
    onSuccess: (data: MarketRiskData) => {
      setAnalysisResult(data);
      toast({
        title: "Market Risk Analysis Complete",
        description: "Comprehensive risk assessment has been generated for your company."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate market risk analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    analysisMutation.mutate();
  };

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'text-green-600 bg-green-50';
    if (score <= 50) return 'text-yellow-600 bg-yellow-50';
    if (score <= 75) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Market Risk Analyzer
            <Badge variant="outline" className="ml-auto">Premium Company</Badge>
          </CardTitle>
          <CardDescription>
            Advanced risk assessment and mitigation strategy recommendations for {company?.name || 'your company'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white"
          >
            {analysisMutation.isPending ? "Analyzing Market Risks..." : "Perform Risk Assessment"}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Risk Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Risk Assessment</CardTitle>
              <CardDescription>
                Comprehensive risk evaluation across all market dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded-full ${getRiskColor(analysisResult.data.overallRiskScore)}`}>
                      {analysisResult.data.overallRiskScore}/100
                    </span>
                  </div>
                  <Progress value={analysisResult.data.overallRiskScore} className="h-3" />
                  <div className="mt-2">
                    <Badge variant="outline" className={getRiskLevelColor(analysisResult.data.riskLevel)}>
                      {analysisResult.data.riskLevel} risk level
                    </Badge>
                  </div>
                </div>
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          {/* Risk Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Volatility</p>
                    <p className="text-2xl font-bold">{analysisResult.data.marketVolatility.score}/100</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {getTrendIcon(analysisResult.data.marketVolatility.trend)}
                      <span className="text-sm text-gray-600">{analysisResult.data.marketVolatility.trend}</span>
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Currency Risk</p>
                    <p className="text-2xl font-bold">{analysisResult.data.currencyRisk.score}/100</p>
                    <p className="text-sm text-gray-600">{analysisResult.data.currencyRisk.exposures.length} exposures</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Regulatory Risk</p>
                    <p className="text-2xl font-bold">{analysisResult.data.regulatoryRisk.score}/100</p>
                    <p className="text-sm text-gray-600">{analysisResult.data.regulatoryRisk.changes.length} pending changes</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Competitive Risk</p>
                    <p className="text-2xl font-bold">{analysisResult.data.competitiveRisk.score}/100</p>
                    <p className="text-sm text-gray-600">{analysisResult.data.competitiveRisk.threats.length} identified threats</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Economic Risk</p>
                    <p className="text-2xl font-bold">{analysisResult.data.economicRisk.score}/100</p>
                    <p className="text-sm text-gray-600">{analysisResult.data.economicRisk.indicators.length} indicators</p>
                  </div>
                  <Globe className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="volatility">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
                  <TabsTrigger value="volatility">Market</TabsTrigger>
                  <TabsTrigger value="currency">Currency</TabsTrigger>
                  <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
                  <TabsTrigger value="competitive">Competitive</TabsTrigger>
                  <TabsTrigger value="economic">Economic</TabsTrigger>
                  <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
                </TabsList>

                <TabsContent value="volatility" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Market Volatility Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-3">Volatility Score</h4>
                        <Progress value={analysisResult.data.marketVolatility.score} className="mb-2" />
                        <p className="text-sm text-gray-600">
                          Current volatility trend: {analysisResult.data.marketVolatility.trend}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Contributing Factors</h4>
                        <div className="space-y-2">
                          {analysisResult.data.marketVolatility.factors.map((factor, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              <span className="text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="currency" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Currency Risk Exposure</h3>
                    <div className="space-y-3">
                      {analysisResult.data.currencyRisk.exposures.map((exposure, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{exposure.currency}</h4>
                            <Badge variant="outline" className={
                              exposure.hedging === 'full' ? 'text-green-600 bg-green-50' :
                              exposure.hedging === 'partial' ? 'text-yellow-600 bg-yellow-50' :
                              'text-red-600 bg-red-50'
                            }>
                              {exposure.hedging} hedging
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Exposure</p>
                              <p className="font-medium">${exposure.exposure.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Volatility</p>
                              <p className="font-medium">{exposure.volatility}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="regulatory" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Regulatory Changes</h3>
                    <div className="space-y-3">
                      {analysisResult.data.regulatoryRisk.changes.map((change, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{change.regulation}</h4>
                            <Badge variant="outline" className={getImpactColor(change.impact)}>
                              {change.impact} impact
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Timeline</p>
                              <p className="font-medium">{change.timeline}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Compliance</p>
                              <p className="font-medium">{change.compliance}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="competitive" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Competitive Threats</h3>
                    <div className="space-y-3">
                      {analysisResult.data.competitiveRisk.threats.map((threat, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{threat.competitor}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getImpactColor(threat.impact)}>
                                {threat.impact} impact
                              </Badge>
                              <span className="text-sm text-gray-600">{threat.probability}% probability</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{threat.threat}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="economic" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Economic Indicators</h3>
                    <div className="space-y-3">
                      {analysisResult.data.economicRisk.indicators.map((indicator, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">{indicator.indicator}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Current</p>
                              <p className="font-medium">{indicator.current}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Forecast</p>
                              <p className={`font-medium ${indicator.forecast > indicator.current ? 'text-red-600' : 'text-green-600'}`}>
                                {indicator.forecast}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Impact</p>
                              <p className="font-medium text-sm">{indicator.impact}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mitigation" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Mitigation Strategies</h3>
                      <div className="space-y-4">
                        {analysisResult.data.mitigationStrategies.map((strategy, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{strategy.risk}</h4>
                              <Badge variant="outline" className={getRiskColor(100 - strategy.effectiveness)}>
                                {strategy.effectiveness}% effective
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-3">{strategy.strategy}</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Implementation Cost</p>
                                <p className="font-medium">${strategy.cost.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Timeline</p>
                                <p className="font-medium">{strategy.timeline}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stress Scenarios */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Stress Test Scenarios</h3>
                      <div className="space-y-4">
                        {analysisResult.data.stressScenarios.map((scenario, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{scenario.scenario}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{scenario.probability}% probability</span>
                                <Badge variant="outline" className={getRiskColor(scenario.impact)}>
                                  {scenario.impact}/100 impact
                                </Badge>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">{scenario.description}</p>
                            <div>
                              <p className="text-sm font-medium mb-2">Preparation Steps:</p>
                              <div className="space-y-1">
                                {scenario.preparation.map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">{step}</span>
                                  </div>
                                ))}
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

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{analysisResult.analysis}</p>
                
                <div>
                  <h4 className="font-semibold mb-3">Key Recommendations</h4>
                  <div className="space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}