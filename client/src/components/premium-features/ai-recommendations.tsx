import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Brain, Clock, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface RiskMitigation {
  risk: string;
  mitigation: string;
  impact: 'high' | 'medium' | 'low';
}

interface NextStep {
  action: string;
  timeline: string;
}

interface AIRecommendations {
  strategicRecommendations: Recommendation[];
  riskMitigations: RiskMitigation[];
  nextSteps: NextStep[];
}

interface AIRecommendationsProps {
  industry: string;
  region: string;
  marketMetrics: {
    marketSize: number;
    growthRate: number;
    marketShare: number;
  };
}

export function AIRecommendations({ industry, region, marketMetrics }: AIRecommendationsProps) {
  const { toast } = useToast();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: recommendations, isLoading, error } = useQuery<AIRecommendations>({
    queryKey: ['/api/ai-recommendations', industry, region, marketMetrics],
    queryFn: async () => {
      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          region,
          marketMetrics,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to fetch AI recommendations');
      }

      setLastRefresh(new Date());
      return response.json();
    },
    enabled: Boolean(industry) && Boolean(region) && Boolean(marketMetrics),
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    onError: (error: Error) => {
      toast({
        title: 'Error fetching AI recommendations',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Loading AI Recommendations...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load AI recommendations. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Custom AI Recommendations
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.strategicRecommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{rec.title}</h4>
                  <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Mitigations */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis & Mitigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.riskMitigations.map((risk, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{risk.risk}</h4>
                  <Badge variant={risk.impact === 'high' ? 'destructive' : risk.impact === 'medium' ? 'default' : 'secondary'}>
                    {risk.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <Flag className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">{step.action}</h4>
                  <p className="text-sm text-muted-foreground">{step.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
