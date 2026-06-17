import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, Globe, Target, BarChart3, Sparkles, MapPin, LineChart, Brain, Search } from "lucide-react";
import { FinancialDisclaimer } from "@/components/integrity/disclaimers";
import { Link } from "wouter";
import { InvestmentStrategist } from "@/components/agents/investment-strategist";
import { GeopoliticalAnalyst } from "@/components/agents/geopolitical-analyst";
import { OpportunityMapper } from "@/components/agents/opportunity-mapper";
import { ScenarioSimulation } from "@/components/agents/scenario-simulation";

export default function PremiumDashboard() {
  const { user } = useAuth();
  const [activeAgent, setActiveAgent] = useState("investment");

  // Check if user has premium subscription
  const isPremium = isHighTier(user?.subscriptionTier) && 
                   user?.subscriptionStartDate && 
                   user?.subscriptionEndDate && 
                   new Date(user.subscriptionEndDate) > new Date();

  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Crown className="h-6 w-6 text-yellow-500" />
                Premium Multi-Agent System
              </CardTitle>
              <CardDescription>
                Access advanced AI agents for investment strategy, geopolitical analysis, and scenario simulation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  Premium subscription required to access the Multi-Agent System. 
                  Upgrade your subscription to unlock advanced AI capabilities.
                </AlertDescription>
              </Alert>
              <Button className="mt-4">
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Premium Multi-Agent System
            <Badge variant="outline" className="ml-auto">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced AI agents for strategic business intelligence and economic forecasting
          </p>
        </div>

        <FinancialDisclaimer className="mb-6" />

        <Tabs value={activeAgent} onValueChange={setActiveAgent} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Investment Strategist
            </TabsTrigger>
            <TabsTrigger value="geopolitical" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Geopolitical Analyst
            </TabsTrigger>
            <TabsTrigger value="opportunity" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Opportunity Mapper
            </TabsTrigger>
            <TabsTrigger value="simulation" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Scenario Simulation
              <Badge variant="secondary" className="text-xs" data-testid="badge-beta">Beta</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Deep Research Feature Card */}
            <div className="mb-6">
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Search className="h-6 w-6 text-blue-600" />
                    Deep Research
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">New Feature</Badge>
                  </CardTitle>
                  <CardDescription>
                    Advanced AI-powered research using hundreds of sources for market analysis, funding opportunities, and competitive intelligence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">• Market Analysis • Funding Research</p>
                      <p className="text-sm text-gray-600">• Competitor Intelligence • Economic Impact</p>
                    </div>
                    <Link href="/deep-research">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Start Research
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => setActiveAgent("investment")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Investment Strategist
                  </CardTitle>
                  <CardDescription>
                    Get personalized investment recommendations based on your profile and market conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Portfolio Analysis</span>
                      <Badge variant="secondary">AI-Powered</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Risk Assessment</span>
                      <Badge variant="secondary">Real-time</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Market Insights</span>
                      <Badge variant="secondary">Live Data</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setActiveAgent("geopolitical")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-green-600" />
                    Geopolitical Analyst
                  </CardTitle>
                  <CardDescription>
                    Analyze political stability, trade relationships, and geopolitical risks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Stability Scoring</span>
                      <Badge variant="secondary">1-100 Scale</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Trade Analysis</span>
                      <Badge variant="secondary">Global Data</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Risk Mapping</span>
                      <Badge variant="secondary">Predictive</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setActiveAgent("opportunity")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Opportunity Mapper
                  </CardTitle>
                  <CardDescription>
                    Discover market opportunities, investment prospects, and emerging trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Market Analysis</span>
                      <Badge variant="secondary">Comprehensive</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Investment Mapping</span>
                      <Badge variant="secondary">Multi-Sector</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Trend Detection</span>
                      <Badge variant="secondary">AI-Driven</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setActiveAgent("simulation")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LineChart className="h-5 w-5 text-orange-600" />
                    Scenario Simulation
                    <Badge variant="secondary" className="text-xs" data-testid="badge-beta">Beta</Badge>
                  </CardTitle>
                  <CardDescription>
                    Run macroeconomic forecasting simulations for strategic planning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Economic Modeling</span>
                      <Badge variant="secondary">Advanced</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Impact Analysis</span>
                      <Badge variant="secondary">Multi-factor</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Risk Scenarios</span>
                      <Badge variant="secondary">Custom & Preset</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Getting Started with Multi-Agent System</CardTitle>
                <CardDescription>
                  Your premium subscription includes access to three specialized AI agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">1. Investment Strategist</h4>
                    <p className="text-muted-foreground">
                      Analyze your investment profile and receive personalized portfolio recommendations
                      based on current market conditions and your risk tolerance.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">2. Geopolitical Analyst</h4>
                    <p className="text-muted-foreground">
                      Assess political stability, trade relationships, and geopolitical risks 
                      for any country or region to inform your business decisions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">3. Scenario Simulation</h4>
                    <p className="text-muted-foreground">
                      Model economic scenarios to understand potential impacts on GDP, inflation,
                      and market volatility for strategic planning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investment">
            <InvestmentStrategist />
          </TabsContent>

          <TabsContent value="geopolitical">
            <GeopoliticalAnalyst />
          </TabsContent>

          <TabsContent value="opportunity">
            <OpportunityMapper />
          </TabsContent>

          <TabsContent value="simulation">
            <ScenarioSimulation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}