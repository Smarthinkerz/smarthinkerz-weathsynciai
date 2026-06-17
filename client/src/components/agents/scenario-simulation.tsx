import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { AIEstimateBadge } from "@/components/integrity/disclaimers";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  DollarSign, 
  Loader2, 
  AlertTriangle,
  Target,
  Clock,
  Zap,
  LineChart
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ScenarioSimulation {
  agentType: string;
  analysis: string;
  confidence: number;
  scenarios: {
    optimistic: {
      probability: number;
      gdpImpact: number;
      inflationImpact: number;
      marketImpact: number;
      timeframe: string;
      keyDrivers: string[];
      implications: string[];
    };
    baseline: {
      probability: number;
      gdpImpact: number;
      inflationImpact: number;
      marketImpact: number;
      timeframe: string;
      keyDrivers: string[];
      implications: string[];
    };
    pessimistic: {
      probability: number;
      gdpImpact: number;
      inflationImpact: number;
      marketImpact: number;
      timeframe: string;
      keyDrivers: string[];
      implications: string[];
    };
  };
  forecastData: {
    month: string;
    gdp: number;
    inflation: number;
    unemployment: number;
    marketIndex: number;
  }[];
  riskFactors: {
    factor: string;
    probability: number;
    severity: number;
    impact: string;
  }[];
  recommendations: string[];
  timestamp: Date;
}

export function ScenarioSimulation() {
  const [region, setRegion] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [gdpAssumption, setGdpAssumption] = useState([2.5]);
  const [inflationAssumption, setInflationAssumption] = useState([3.0]);
  const [interestRateAssumption, setInterestRateAssumption] = useState([4.5]);
  const [geopoliticalTension, setGeopoliticalTension] = useState([3]);
  const [tradePolicy, setTradePolicy] = useState("");
  const [energyPrice, setEnergyPrice] = useState([75]);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulation | null>(null);
  const { toast } = useToast();

  const simulationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/agents/scenario-simulation", {
        region,
        timeframe,
        assumptions: {
          gdpGrowth: gdpAssumption[0],
          inflation: inflationAssumption[0],
          interestRate: interestRateAssumption[0],
          geopoliticalTension: geopoliticalTension[0],
          tradePolicy,
          energyPrice: energyPrice[0]
        }
      });
      return await response.json();
    },
    onSuccess: (data: ScenarioSimulation) => {
      setSimulationResult(data);
      toast({
        title: "Scenario Simulation Complete",
        description: "Macroeconomic forecasts and scenarios have been generated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Simulation Failed",
        description: error.message || "Failed to generate scenario simulation",
        variant: "destructive"
      });
    }
  });

  const runSimulation = () => {
    if (!region || !timeframe) {
      toast({
        title: "Missing Information",
        description: "Please select region and timeframe.",
        variant: "destructive"
      });
      return;
    }
    simulationMutation.mutate();
  };

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'optimistic': return 'border-l-green-500 bg-green-50';
      case 'baseline': return 'border-l-blue-500 bg-blue-50';
      case 'pessimistic': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'optimistic': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'baseline': return <Target className="h-4 w-4 text-blue-600" />;
      case 'pessimistic': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatImpact = (impact: number | string) => {
    const numImpact = typeof impact === 'string' ? parseFloat(impact) : impact;
    if (isNaN(numImpact)) return '0.0%';
    const sign = numImpact >= 0 ? '+' : '';
    return `${sign}${numImpact.toFixed(1)}%`;
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'text-red-600 bg-red-100';
    if (severity >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Scenario Simulation Dashboard
            <Badge variant="secondary" className="text-xs align-middle" data-testid="badge-beta">Beta</Badge>
            <Badge variant="outline" className="ml-auto">Premium</Badge>
          </CardTitle>
          <CardDescription>
            Generate macroeconomic forecasts and analyze multiple scenarios for strategic planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="region">Economic Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="European Union">European Union</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="Japan">Japan</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Global">Global Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timeframe">Forecast Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6 months">6 months</SelectItem>
                  <SelectItem value="12 months">12 months</SelectItem>
                  <SelectItem value="18 months">18 months</SelectItem>
                  <SelectItem value="24 months">24 months</SelectItem>
                  <SelectItem value="36 months">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Economic Assumptions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>GDP Growth Rate (%)</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={gdpAssumption}
                    onValueChange={setGdpAssumption}
                    max={8}
                    min={-3}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>-3%</span>
                    <span className="font-medium">{gdpAssumption[0]}%</span>
                    <span>8%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Inflation Rate (%)</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={inflationAssumption}
                    onValueChange={setInflationAssumption}
                    max={10}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>0%</span>
                    <span className="font-medium">{inflationAssumption[0]}%</span>
                    <span>10%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Interest Rate (%)</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={interestRateAssumption}
                    onValueChange={setInterestRateAssumption}
                    max={10}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>0%</span>
                    <span className="font-medium">{interestRateAssumption[0]}%</span>
                    <span>10%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Geopolitical Tension (1-10)</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={geopoliticalTension}
                    onValueChange={setGeopoliticalTension}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Low</span>
                    <span className="font-medium">{geopoliticalTension[0]}/10</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tradePolicy">Trade Policy Stance</Label>
                <Select value={tradePolicy} onValueChange={setTradePolicy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy stance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Protectionist">Protectionist</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Free Trade">Free Trade</SelectItem>
                    <SelectItem value="Regional Focus">Regional Focus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Energy Price ($/barrel)</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={energyPrice}
                    onValueChange={setEnergyPrice}
                    max={150}
                    min={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>$30</span>
                    <span className="font-medium">${energyPrice[0]}</span>
                    <span>$150</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={runSimulation}
            disabled={simulationMutation.isPending || !region || !timeframe}
            className="w-full"
            size="lg"
          >
            {simulationMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Scenarios
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {simulationResult && (
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Simulation Results: {region}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{timeframe} forecast</span>
                  <Badge variant="outline">
                    <span className="tabular-nums">{simulationResult.confidence}%</span> Confidence
                    <AIEstimateBadge className="ml-2" />
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{simulationResult.analysis}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="scenarios" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
              <TabsTrigger value="risks">Risk Factors</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {simulationResult.scenarios && Object.entries(simulationResult.scenarios).map(([scenarioType, scenario]) => (
                  <Card key={scenarioType} className={`border-l-4 ${getScenarioColor(scenarioType)}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 capitalize">
                        {getScenarioIcon(scenarioType)}
                        {scenarioType} Scenario
                        <Badge variant="outline" className="ml-auto tabular-nums">
                          {scenario.probability}%
                        </Badge>
                        <AIEstimateBadge />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">GDP</div>
                          <div className={scenario.gdpImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatImpact(scenario.gdpImpact)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Inflation</div>
                          <div className={scenario.inflationImpact <= 3 ? 'text-green-600' : 'text-red-600'}>
                            {formatImpact(scenario.inflationImpact)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Markets</div>
                          <div className={scenario.marketImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatImpact(scenario.marketImpact)}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-sm">Key Drivers:</div>
                        <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                          {scenario.keyDrivers.map((driver, idx) => (
                            <li key={idx}>• {driver}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="font-medium text-sm">Implications:</div>
                        <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                          {scenario.implications.map((implication, idx) => (
                            <li key={idx}>• {implication}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="forecasts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Economic Forecast Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={simulationResult.forecastData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="gdp" stroke="#3b82f6" name="GDP Growth %" />
                        <Line type="monotone" dataKey="inflation" stroke="#ef4444" name="Inflation %" />
                        <Line type="monotone" dataKey="unemployment" stroke="#f59e0b" name="Unemployment %" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Index Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simulationResult.forecastData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="marketIndex" fill="#10b981" name="Market Index" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulationResult.riskFactors && simulationResult.riskFactors.map((risk, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {risk.factor}
                        <span className="flex items-center gap-1">
                          <Badge className={`${getSeverityColor(risk.severity)} tabular-nums`}>
                            {risk.severity}/10
                          </Badge>
                          <AIEstimateBadge />
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Probability</span>
                          <span>{risk.probability}%</span>
                        </div>
                        <Progress value={risk.probability} className="h-2" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Impact:</div>
                        <p className="text-sm text-muted-foreground">{risk.impact}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Strategic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {simulationResult.recommendations && simulationResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These scenarios are based on current data and assumptions. Economic conditions can change rapidly due to unforeseen events.
                  Use this analysis as part of a broader strategic planning process.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground text-center">
            Simulation generated on {new Date(simulationResult.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}