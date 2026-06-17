import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Globe, Shield, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AIEstimateBadge } from "@/components/integrity/disclaimers";
import { useToast } from "@/hooks/use-toast";

interface GeopoliticalAnalysis {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    riskFactors: string[];
    opportunities: string[];
    stabilityScore: number;
    tradingPartners: string[];
    economicSanctions: string;
    futureOutlook: string;
  };
  timestamp: Date;
}

export function GeopoliticalAnalyst() {
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [timeframe, setTimeframe] = useState("12 months");
  const [analysisResult, setAnalysisResult] = useState<GeopoliticalAnalysis | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/agents/geopolitical-analyst", {
        country,
        region,
        timeframe
      });
      return await response.json();
    },
    onSuccess: (data: GeopoliticalAnalysis) => {
      setAnalysisResult(data);
      toast({
        title: "Geopolitical Analysis Complete",
        description: `Analysis for ${country} has been generated successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate geopolitical analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    if (!country || !region) {
      toast({
        title: "Missing Information",
        description: "Please select both country and region.",
        variant: "destructive"
      });
      return;
    }
    analysisMutation.mutate();
  };

  const getStabilityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStabilityIcon = (score: number) => {
    if (score >= 80) return <Shield className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Geopolitical Analyst AI
            <Badge variant="outline" className="ml-auto">Premium</Badge>
          </CardTitle>
          <CardDescription>
            Analyze political stability, trade relationships, and geopolitical risks for strategic business decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country/Territory</Label>
              <Input
                id="country"
                placeholder="e.g., United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                  <SelectItem value="Middle East">Middle East</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Latin America">Latin America</SelectItem>
                  <SelectItem value="Global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="timeframe">Analysis Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6 months">6 months</SelectItem>
                <SelectItem value="12 months">12 months</SelectItem>
                <SelectItem value="2 years">2 years</SelectItem>
                <SelectItem value="5 years">5 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending || !country || !region}
            className="w-full"
          >
            {analysisMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Geopolitical Landscape...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Generate Geopolitical Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Analysis Results: {country}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <Progress value={analysisResult.confidence} className="w-20" />
                  <span className="text-sm font-medium tabular-nums">{analysisResult.confidence}%</span>
                  <AIEstimateBadge />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Geopolitical Overview</h4>
                <p className="text-sm text-muted-foreground">{analysisResult.analysis}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStabilityIcon(analysisResult.data.stabilityScore)}
                      Political Stability Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Progress value={analysisResult.data.stabilityScore} className="flex-1" />
                      <span className={`text-lg font-bold ${getStabilityColor(analysisResult.data.stabilityScore)}`}>
                        {analysisResult.data.stabilityScore}/100
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Trading Partners</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.data.tradingPartners.map((partner, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {partner}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Key Risk Factors
                </h4>
                <ul className="space-y-2">
                  {analysisResult.data.riskFactors.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Strategic Opportunities
                </h4>
                <ul className="space-y-2">
                  {analysisResult.data.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysisResult.data.economicSanctions && (
                <div>
                  <h4 className="font-medium mb-2">Economic Sanctions & Trade Restrictions</h4>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {analysisResult.data.economicSanctions}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Future Outlook ({timeframe})</h4>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm">{analysisResult.data.futureOutlook}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Strategic Recommendations</h4>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-muted-foreground">
                Analysis generated on {new Date(analysisResult.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}