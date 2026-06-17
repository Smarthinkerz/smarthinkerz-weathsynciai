import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AIEstimateBadge } from "@/components/integrity/disclaimers";
import { 
  MapPin, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Loader2, 
  Star, 
  AlertTriangle,
  Globe,
  Briefcase,
  BarChart3,
  Clock
} from "lucide-react";

interface OpportunityAnalysis {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    marketOpportunities: {
      sector: string;
      potentialValue: number;
      riskLevel: 'low' | 'medium' | 'high';
      timeToMarket: string;
      requiredCapital: number;
      competitionLevel: string;
      description: string;
    }[];
    investmentOpportunities: {
      type: string;
      expectedReturn: number;
      riskScore: number;
      minimumInvestment: number;
      timeHorizon: string;
      description: string;
    }[];
    geographicOpportunities: {
      region: string;
      growthPotential: number;
      marketSize: number;
      entryBarriers: string[];
      advantages: string[];
    }[];
    trendingOpportunities: {
      trend: string;
      momentum: number;
      applicationAreas: string[];
      timeframe: string;
    }[];
  };
  timestamp: Date;
}

export function OpportunityMapper() {
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [investmentRange, setInvestmentRange] = useState("");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [riskTolerance, setRiskTolerance] = useState("");
  const [interests, setInterests] = useState("");
  const [analysisResult, setAnalysisResult] = useState<OpportunityAnalysis | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/agents/opportunity-mapper", {
        sector,
        region,
        investmentRange,
        timeHorizon,
        riskTolerance,
        interests
      });
      return await response.json();
    },
    onSuccess: (data: OpportunityAnalysis) => {
      setAnalysisResult(data);
      toast({
        title: "Opportunity Analysis Complete",
        description: "Your personalized opportunity map has been generated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate opportunity analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    if (!sector || !region || !investmentRange) {
      toast({
        title: "Missing Information",
        description: "Please fill in sector, region, and investment range.",
        variant: "destructive"
      });
      return;
    }
    analysisMutation.mutate();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getReturnColor = (returnRate: number) => {
    if (returnRate >= 15) return 'text-green-600';
    if (returnRate >= 8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Opportunity Mapper AI
            <Badge variant="outline" className="ml-auto">Premium</Badge>
          </CardTitle>
          <CardDescription>
            Discover market opportunities, investment prospects, and emerging trends tailored to your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sector">Primary Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance & FinTech</SelectItem>
                  <SelectItem value="Energy">Energy & Renewables</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Consumer Goods">Consumer Goods</SelectItem>
                  <SelectItem value="Education">Education & EdTech</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Agriculture">Agriculture & FoodTech</SelectItem>
                  <SelectItem value="Transportation">Transportation & Logistics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="region">Target Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                  <SelectItem value="Middle East">Middle East</SelectItem>
                  <SelectItem value="Latin America">Latin America</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Global">Global Markets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="investmentRange">Investment Range</Label>
              <Select value={investmentRange} onValueChange={setInvestmentRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under $10K">Under $10,000</SelectItem>
                  <SelectItem value="$10K-$50K">$10,000 - $50,000</SelectItem>
                  <SelectItem value="$50K-$100K">$50,000 - $100,000</SelectItem>
                  <SelectItem value="$100K-$500K">$100,000 - $500,000</SelectItem>
                  <SelectItem value="$500K-$1M">$500,000 - $1,000,000</SelectItem>
                  <SelectItem value="Over $1M">Over $1,000,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeHorizon">Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short-term (6-12 months)">Short-term (6-12 months)</SelectItem>
                  <SelectItem value="Medium-term (1-3 years)">Medium-term (1-3 years)</SelectItem>
                  <SelectItem value="Long-term (3-5 years)">Long-term (3-5 years)</SelectItem>
                  <SelectItem value="Extended (5+ years)">Extended (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="riskTolerance">Risk Tolerance</Label>
              <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conservative">Conservative (Low Risk)</SelectItem>
                  <SelectItem value="Moderate">Moderate (Medium Risk)</SelectItem>
                  <SelectItem value="Aggressive">Aggressive (High Risk)</SelectItem>
                  <SelectItem value="Speculative">Speculative (Very High Risk)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="interests">Specific Interests or Expertise (Optional)</Label>
            <Textarea
              id="interests"
              placeholder="e.g., AI/ML, sustainable energy, emerging markets, cryptocurrency, etc."
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending || !sector || !region || !investmentRange}
            className="w-full"
          >
            {analysisMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mapping Opportunities...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Generate Opportunity Map
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Opportunity Analysis Results
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <Progress value={analysisResult.confidence} className="w-20" />
                  <span className="text-sm font-medium tabular-nums">{analysisResult.confidence}%</span>
                  <AIEstimateBadge />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{analysisResult.analysis}</p>
            </CardContent>
          </Card>

          {/* Market Opportunities */}
          {analysisResult.data.marketOpportunities && analysisResult.data.marketOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Market Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.data.marketOpportunities.map((opportunity, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          {opportunity.sector}
                          <Badge className={getRiskColor(opportunity.riskLevel)}>
                            {opportunity.riskLevel} risk
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Potential Value:</span>
                            <div className="text-green-600">${opportunity.potentialValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Time to Market:</span>
                            <div>{opportunity.timeToMarket}</div>
                          </div>
                          <div>
                            <span className="font-medium">Required Capital:</span>
                            <div>${opportunity.requiredCapital.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Competition:</span>
                            <div>{opportunity.competitionLevel}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment Opportunities */}
          {analysisResult.data.investmentOpportunities && analysisResult.data.investmentOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Investment Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.data.investmentOpportunities.map((investment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{investment.type}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getReturnColor(investment.expectedReturn)}`}>
                            {investment.expectedReturn}% Expected Return
                          </span>
                          <Badge variant="outline">Risk Score: {investment.riskScore}/10</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{investment.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Minimum Investment:</span>
                          <div>${investment.minimumInvestment.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium">Time Horizon:</span>
                          <div>{investment.timeHorizon}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Geographic Opportunities */}
          {analysisResult.data.geographicOpportunities && analysisResult.data.geographicOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Geographic Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.data.geographicOpportunities.map((geo, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{geo.region}</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={geo.growthPotential} className="w-16" />
                          <span className="text-sm">{geo.growthPotential}% Growth</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-600">Market Size:</span>
                          <div>${(geo.marketSize / 1e9).toFixed(1)}B</div>
                        </div>
                        <div>
                          <span className="font-medium text-blue-600">Advantages:</span>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {geo.advantages.map((advantage, idx) => (
                              <li key={idx}>{advantage}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {geo.entryBarriers.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium text-orange-600">Entry Barriers:</span>
                          <ul className="list-disc list-inside text-muted-foreground text-sm">
                            {geo.entryBarriers.map((barrier, idx) => (
                              <li key={idx}>{barrier}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Opportunities */}
          {analysisResult.data.trendingOpportunities && analysisResult.data.trendingOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Trending Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.data.trendingOpportunities.map((trend, index) => (
                    <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          {trend.trend}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{trend.momentum}% Momentum</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <span className="font-medium text-sm">Applications:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {trend.applicationAreas.map((area, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Timeframe:</span> {trend.timeframe}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">
                      {typeof rec === 'string' ? rec : 
                       typeof rec === 'object' && rec !== null && 'opportunity' in rec ? 
                       `${(rec as any).opportunity} - ${(rec as any).potential}` : 
                       JSON.stringify(rec)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center">
            Analysis generated on {new Date(analysisResult.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}