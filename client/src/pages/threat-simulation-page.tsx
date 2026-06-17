import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Plus, Loader2, Activity, Zap, TrendingDown } from "lucide-react";
import { FinancialDisclaimer, AIEstimateBadge } from "@/components/integrity/disclaimers";
import { PageNavHeader } from "@/components/page-nav-header";

export default function ThreatSimulationPage() {
  const { toast } = useToast();
  const [simOpen, setSimOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioType, setScenarioType] = useState("market_crash");

  const { data: fraudAlerts = [], isLoading: alertsLoading } = useQuery({ queryKey: ["/api/fraud-alerts"] });
  const { data: simulations = [], isLoading: simsLoading } = useQuery({ queryKey: ["/api/threat-simulations"] });

  const scanMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/fraud-alerts/scan"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fraud-alerts"] });
      toast({ title: "Fraud scan completed" });
    },
    onError: () => { toast({ title: "Scan failed", variant: "destructive" }); }
  });

  const simMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/threat-simulations", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threat-simulations"] });
      setSimOpen(false); setScenarioName(""); setScenarioType("market_crash");
      toast({ title: "Simulation completed" });
    },
    onError: () => { toast({ title: "Simulation failed", variant: "destructive" }); }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("PATCH", `/api/fraud-alerts/${id}`, { status: "resolved", resolvedAt: new Date() }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fraud-alerts"] });
      toast({ title: "Alert resolved" });
    }
  });

  const severityColors: Record<string, string> = { low: "bg-blue-100 text-blue-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };
  const riskColor = (score: number) => score >= 75 ? "text-red-500" : score >= 50 ? "text-orange-500" : score >= 25 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8 text-primary" /> Threat Simulation & Fraud Detection <Badge variant="secondary" className="text-xs align-middle" data-testid="badge-beta">Beta</Badge></h1>
          <p className="text-muted-foreground mt-1">AI-powered threat analysis, fraud detection, and risk simulation</p>
        </div>
        <FinancialDisclaimer className="mb-6" />

        <Tabs defaultValue="alerts">
          <TabsList className="mb-6">
            <TabsTrigger value="alerts" className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Fraud Alerts</TabsTrigger>
            <TabsTrigger value="simulations" className="flex items-center gap-2"><Activity className="h-4 w-4" /> Threat Simulations</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <div className="flex justify-end mb-4">
              <Button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
                {scanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />} Run Fraud Scan
              </Button>
            </div>
            {alertsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (fraudAlerts as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No fraud alerts. Run a scan to check for potential threats.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {(fraudAlerts as any[]).map((alert: any) => (
                  <Card key={alert.id} className={alert.status === "resolved" ? "opacity-60" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={severityColors[alert.severity] || ""}>{alert.severity}</Badge>
                            <Badge variant="outline">{alert.alertType}</Badge>
                            <Badge variant={alert.status === "active" ? "destructive" : "secondary"}>{alert.status}</Badge>
                          </div>
                          <h3 className="font-semibold">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          {alert.indicators?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">{alert.indicators.map((ind: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>)}</div>
                          )}
                        </div>
                        {alert.status === "active" && (
                          <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate(alert.id)}>Resolve</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="simulations">
            <div className="flex justify-end mb-4">
              <Dialog open={simOpen} onOpenChange={setSimOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Simulation</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Run Threat Simulation</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div><Label>Scenario Name</Label><Input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="e.g., Q3 Market Downturn" /></div>
                    <div><Label>Scenario Type</Label>
                      <Select value={scenarioType} onValueChange={setScenarioType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market_crash">Market Crash</SelectItem>
                          <SelectItem value="supply_chain">Supply Chain Disruption</SelectItem>
                          <SelectItem value="cyber_attack">Cyber Attack</SelectItem>
                          <SelectItem value="regulatory_change">Regulatory Change</SelectItem>
                          <SelectItem value="economic_recession">Economic Recession</SelectItem>
                          <SelectItem value="competitor_disruption">Competitor Disruption</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" disabled={!scenarioName.trim() || simMutation.isPending} onClick={() => simMutation.mutate({ scenarioName, scenarioType, parameters: { severity: "moderate" } })}>
                      {simMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running Simulation...</> : "Run Simulation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {simsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (simulations as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No simulations yet. Run your first threat simulation to assess risks.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {(simulations as any[]).map((sim: any) => (
                  <Card key={sim.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{sim.scenarioType.replace(/_/g, " ")}</Badge>
                            <Badge variant={sim.status === "completed" ? "default" : "secondary"}>{sim.status}</Badge>
                          </div>
                          <CardTitle className="text-lg">{sim.scenarioName}</CardTitle>
                        </div>
                        {sim.riskScore !== null && (
                          <div className="text-center">
                            <p className={`text-3xl font-bold tabular-nums ${riskColor(sim.riskScore)}`}>{sim.riskScore}</p>
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                            <AIEstimateBadge className="mt-1" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {sim.results && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Impact</p>
                            <p className="text-sm text-muted-foreground">{sim.results.impact}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Likelihood</p>
                            <p className="text-sm text-muted-foreground">{sim.results.likelihood}</p>
                          </div>
                        </div>
                        {sim.recommendations?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Recommendations</p>
                            <div className="space-y-2">
                              {sim.recommendations.map((rec: any, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs shrink-0">{rec.priority}</Badge>
                                  <span>{rec.action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
