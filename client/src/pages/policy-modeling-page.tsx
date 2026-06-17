import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Scale, Plus, Trash2, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";
import { FinancialDisclaimer } from "@/components/integrity/disclaimers";

export default function PolicyModelingPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [policyType, setPolicyType] = useState("tax");
  const [scenarios, setScenarios] = useState([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);

  const { data: models = [], isLoading } = useQuery({ queryKey: ["/api/policy-models"] });

  const simulateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/policy-models/simulate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policy-models"] });
      toast({ title: "Simulation complete" });
      setOpen(false); setName(""); setDescription("");
      setScenarios([{ name: "", description: "" }, { name: "", description: "" }]);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/policy-models/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policy-models"] });
      toast({ title: "Model deleted" });
    },
  });

  const riskColor: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <FinancialDisclaimer className="mb-6" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Scale className="h-8 w-8 text-primary" /> Co-Policy Modeling <Badge variant="secondary" className="text-xs align-middle" data-testid="badge-beta">Beta</Badge></h1>
            <p className="text-muted-foreground mt-1">Compare policy scenarios with AI-driven impact analysis</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Simulation</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Run Policy Simulation</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
                <div><Label>Model Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., 2026 Corporate Tax Reform" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
                <div><Label>Policy Type</Label>
                  <Select value={policyType} onValueChange={setPolicyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax">Tax Policy</SelectItem>
                      <SelectItem value="regulatory">Regulatory</SelectItem>
                      <SelectItem value="trade">Trade & Tariffs</SelectItem>
                      <SelectItem value="monetary">Monetary</SelectItem>
                      <SelectItem value="environmental">Environmental / ESG</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Scenarios to Compare ({scenarios.length})</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScenarios([...scenarios, { name: "", description: "" }])}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                  </div>
                  {scenarios.map((s, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Scenario {idx + 1}</span>
                          {scenarios.length > 2 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => setScenarios(scenarios.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                          )}
                        </div>
                        <Input placeholder="Scenario name (e.g., Increase rate to 25%)" value={s.name} onChange={e => { const ns = [...scenarios]; ns[idx].name = e.target.value; setScenarios(ns); }} />
                        <Textarea placeholder="Parameters & assumptions" rows={2} value={s.description} onChange={e => { const ns = [...scenarios]; ns[idx].description = e.target.value; setScenarios(ns); }} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button className="w-full" disabled={!name.trim() || scenarios.some(s => !s.name.trim()) || simulateMutation.isPending} onClick={() => simulateMutation.mutate({ name, description, policyType, scenarios })}>
                  {simulateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Simulating with AI…</> : "Run Simulation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          : (models as any[]).length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No policy models yet. Run your first simulation to compare scenarios.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {(models as any[]).map((m: any) => (
                <Card key={m.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{m.name}</CardTitle>
                        <CardDescription className="mt-1">{m.description}</CardDescription>
                        <div className="flex gap-2 mt-2"><Badge variant="outline">{m.policyType}</Badge><Badge variant="secondary">{m.confidenceScore}% confidence</Badge></div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Comparative Results</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {(m.comparativeResults || []).map((r: any, i: number) => (
                        <Card key={i} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">{r.scenarioName}</p>
                              <Badge className={riskColor[r.riskLevel] || ""}>{r.riskLevel} risk</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{r.economicImpact}</p>
                            <p className="text-sm">{r.expectedOutcome}</p>
                            {r.score && <div className="mt-2 text-xs text-muted-foreground">Score: <strong>{r.score}/100</strong></div>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {m.recommendations?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Recommendations</h4>
                        <ul className="space-y-1 text-sm">
                          {m.recommendations.map((r: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary">→</span><span>{r}</span></li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
