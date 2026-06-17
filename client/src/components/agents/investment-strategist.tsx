import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, PieChart, Target, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AIEstimateBadge } from "@/components/integrity/disclaimers";

interface InvestmentAnalysis {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: {
    riskAssessment: string;
    timeframeStrategy: string;
    portfolioAllocation: string;
  };
  timestamp: Date;
}

export function InvestmentStrategist() {
  const [analysisResult, setAnalysisResult] = useState<InvestmentAnalysis | null>(null);
  const { toast } = useToast();

  // Get user's market data for context
  const { data: marketData } = useQuery({
    queryKey: ['/api/business-metrics'],
    enabled: false // We'll trigger this manually when needed
  });

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/agents/investment-strategist", {
        marketData: marketData || {
          gdp: 21000000000000,
          inflation: 3.2,
          gdpGrowth: 2.1,
          industry: 'Technology'
        }
      });
      return await response.json();
    },
    onSuccess: (data: InvestmentAnalysis) => {
      setAnalysisResult(data);
      toast({
        title: "Investment Analysis Complete",
        description: "Your personalized investment strategy has been generated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate investment analysis",
        variant: "destructive"
      });
    }
  });

  const runAnalysis = () => {
    analysisMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Investment Strategist AI
            <Badge variant="outline" className="ml-auto">Premium</Badge>
          </CardTitle>
          <CardDescription>
            Get personalized investment recommendations based on your profile and current market conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAnalysis}
            disabled={analysisMutation.isPending}
            className="w-full"
          >
            {analysisMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Investment Opportunities...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Generate Investment Strategy
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
                Analysis Results
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <Progress value={analysisResult.confidence} className="w-20" />
                  <span className="text-sm font-medium tabular-nums">{analysisResult.confidence}%</span>
                  <AIEstimateBadge />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Market Analysis</h4>
                <p className="text-sm text-muted-foreground">{analysisResult.analysis}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Portfolio Allocation Strategy
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    {typeof analysisResult.data.portfolioAllocation === 'object' 
                      ? JSON.stringify(analysisResult.data.portfolioAllocation, null, 2) 
                      : analysisResult.data.portfolioAllocation}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Risk Assessment</h4>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {typeof analysisResult.data.riskAssessment === 'object' 
                      ? JSON.stringify(analysisResult.data.riskAssessment, null, 2) 
                      : analysisResult.data.riskAssessment}
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h4 className="font-medium mb-2">Timeframe Strategy</h4>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm">
                    {typeof analysisResult.data.timeframeStrategy === 'object' 
                      ? JSON.stringify(analysisResult.data.timeframeStrategy, null, 2) 
                      : analysisResult.data.timeframeStrategy}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Recommendations</h4>
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