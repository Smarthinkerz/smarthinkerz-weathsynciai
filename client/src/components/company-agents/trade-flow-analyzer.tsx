import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Globe, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, Truck, Ship } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TradeFlowData {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    tradeVolume: {
      totalImports: number;
      totalExports: number;
      tradeBalance: number;
      yearOverYearGrowth: number;
    };
    tradingPartners: {
      country: string;
      tradeValue: number;
      percentage: number;
      relationship: 'major' | 'moderate' | 'minor';
      trends: 'growing' | 'stable' | 'declining';
    }[];
    sectorAnalysis: {
      sector: string;
      importValue: number;
      exportValue: number;
      competitiveness: number;
      opportunities: string[];
    }[];
    supplyChainHealth: {
      efficiency: number;
      resilience: number;
      diversification: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    logisticsOptimization: {
      currentCosts: number;
      optimizedCosts: number;
      savings: number;
      recommendations: string[];
    };
    marketOpportunities: {
      market: string;
      potential: number;
      barriers: string[];
      timeline: string;
      requirements: string[];
    }[];
  };
  timestamp: Date;
}

interface TradeFlowAnalyzerProps {
  company?: {
    id: number;
    name: string;
    industry?: string;
    country?: string;
  };
}

export function TradeFlowAnalyzer({ company }: TradeFlowAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<TradeFlowData | null>(null);
  const [tradingPartners, setTradingPartners] = useState("");
  const [sectors, setSectors] = useState("");
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/company/agents/trade-flow", {
        tradingPartners: tradingPartners.split(',').map(p => p.trim()).filter(p => p),
        sectors: sectors.split(',').map(s => s.trim()).filter(s => s)
      });
      return await response.json();
    },
    onSuccess: (data: TradeFlowData) => {
      setAnalysisResult(data);
      toast({
        title: "Trade Flow Analysis Complete",
        description: "Comprehensive trade analysis has been generated for your company."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate trade flow analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    analysisMutation.mutate();
  };

  const getHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-50';
    if (value >= 60) return 'text-blue-600 bg-blue-50';
    if (value >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'declining': return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-green-600" />
            Trade Flow Analyzer
            <Badge variant="outline" className="ml-auto">Premium Company</Badge>
          </CardTitle>
          <CardDescription>
            International trade pattern analysis and supply chain optimization for {company?.name || 'your company'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tradingPartners">Trading Partners (comma-separated)</Label>
              <Input
                id="tradingPartners"
                placeholder="USA, China, Germany, Japan"
                value={tradingPartners}
                onChange={(e) => setTradingPartners(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sectors">Key Sectors (comma-separated)</Label>
              <Input
                id="sectors"
                placeholder="Technology, Manufacturing, Energy"
                value={sectors}
                onChange={(e) => setSectors(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
          >
            {analysisMutation.isPending ? "Analyzing Trade Flows..." : "Analyze Trade Patterns"}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {/* Trade Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Imports</p>
                    <p className="text-2xl font-bold">${(analysisResult.data.tradeVolume.totalImports / 1000000).toFixed(1)}M</p>
                  </div>
                  <ArrowDownRight className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Exports</p>
                    <p className="text-2xl font-bold">${(analysisResult.data.tradeVolume.totalExports / 1000000).toFixed(1)}M</p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trade Balance</p>
                    <p className={`text-2xl font-bold ${analysisResult.data.tradeVolume.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(analysisResult.data.tradeVolume.tradeBalance / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">YoY Growth</p>
                    <p className={`text-2xl font-bold ${analysisResult.data.tradeVolume.yearOverYearGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysisResult.data.tradeVolume.yearOverYearGrowth >= 0 ? '+' : ''}{analysisResult.data.tradeVolume.yearOverYearGrowth}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="partners">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
                  <TabsTrigger value="partners">Trading Partners</TabsTrigger>
                  <TabsTrigger value="sectors">Sector Analysis</TabsTrigger>
                  <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
                  <TabsTrigger value="logistics">Logistics</TabsTrigger>
                  <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                </TabsList>

                <TabsContent value="partners" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Major Trading Partners</h3>
                    <div className="space-y-3">
                      {analysisResult.data.tradingPartners.map((partner, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">{partner.country}</h4>
                              <p className="text-sm text-gray-600">${(partner.tradeValue / 1000000).toFixed(1)}M trade value</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={
                              partner.relationship === 'major' ? 'text-green-600 bg-green-50' :
                              partner.relationship === 'moderate' ? 'text-blue-600 bg-blue-50' :
                              'text-gray-600 bg-gray-50'
                            }>
                              {partner.relationship}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(partner.trends)}
                              <span className="text-sm">{partner.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sectors" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sector Performance</h3>
                    <div className="space-y-3">
                      {analysisResult.data.sectorAnalysis.map((sector, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{sector.sector}</h4>
                            <Badge variant="outline" className={getHealthColor(sector.competitiveness)}>
                              {sector.competitiveness}% competitive
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-600">Imports</p>
                              <p className="font-medium">${(sector.importValue / 1000000).toFixed(1)}M</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Exports</p>
                              <p className="font-medium">${(sector.exportValue / 1000000).toFixed(1)}M</p>
                            </div>
                          </div>
                          {sector.opportunities.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Opportunities:</p>
                              <div className="flex flex-wrap gap-1">
                                {sector.opportunities.map((opp, oppIndex) => (
                                  <Badge key={oppIndex} variant="secondary" className="text-xs">
                                    {opp}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="supply-chain" className="mt-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Supply Chain Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Truck className="h-8 w-8 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-600">Efficiency</p>
                          <p className="text-2xl font-bold">{analysisResult.data.supplyChainHealth.efficiency}%</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Ship className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-600">Resilience</p>
                          <p className="text-2xl font-bold">{analysisResult.data.supplyChainHealth.resilience}%</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Network className="h-8 w-8 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-600">Diversification</p>
                          <p className="text-2xl font-bold">{analysisResult.data.supplyChainHealth.diversification}%</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Overall Risk Level</h4>
                        <Badge variant="outline" className={
                          analysisResult.data.supplyChainHealth.riskLevel === 'low' ? 'text-green-600 bg-green-50' :
                          analysisResult.data.supplyChainHealth.riskLevel === 'medium' ? 'text-yellow-600 bg-yellow-50' :
                          'text-red-600 bg-red-50'
                        }>
                          {analysisResult.data.supplyChainHealth.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logistics" className="mt-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Logistics Optimization</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm font-medium text-gray-600">Current Costs</p>
                          <p className="text-2xl font-bold">${(analysisResult.data.logisticsOptimization.currentCosts / 1000000).toFixed(1)}M</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm font-medium text-gray-600">Optimized Costs</p>
                          <p className="text-2xl font-bold text-green-600">${(analysisResult.data.logisticsOptimization.optimizedCosts / 1000000).toFixed(1)}M</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                          <p className="text-2xl font-bold text-blue-600">${(analysisResult.data.logisticsOptimization.savings / 1000000).toFixed(1)}M</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Optimization Recommendations</h4>
                      {analysisResult.data.logisticsOptimization.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="opportunities" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Market Opportunities</h3>
                    <div className="space-y-4">
                      {analysisResult.data.marketOpportunities.map((opportunity, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{opportunity.market}</h4>
                            <Badge variant="outline" className={getHealthColor(opportunity.potential)}>
                              {opportunity.potential}% potential
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Entry Barriers:</p>
                              <div className="space-y-1">
                                {opportunity.barriers.map((barrier, barrierIndex) => (
                                  <div key={barrierIndex} className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">{barrier}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Requirements:</p>
                              <div className="space-y-1">
                                {opportunity.requirements.map((req, reqIndex) => (
                                  <div key={reqIndex} className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">{req}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">
                              <strong>Timeline:</strong> {opportunity.timeline}
                            </p>
                          </div>
                        </div>
                      ))}
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