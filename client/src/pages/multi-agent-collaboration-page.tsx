import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2, Sparkles, Brain } from "lucide-react";
import { FinancialDisclaimer, AIEstimateBadge } from "@/components/integrity/disclaimers";
import { PageNavHeader } from "@/components/page-nav-header";

const ALL_AGENTS = [
  { id: "market", name: "Market Analyst", color: "bg-blue-100 text-blue-800" },
  { id: "risk", name: "Risk Assessor", color: "bg-red-100 text-red-800" },
  { id: "trade", name: "Trade Flow", color: "bg-green-100 text-green-800" },
  { id: "startup", name: "Startup Health", color: "bg-purple-100 text-purple-800" },
  { id: "investment", name: "Investment Strategist", color: "bg-amber-100 text-amber-800" },
];

export default function MultiAgentCollaborationPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(ALL_AGENTS.map(a => a.id));

  const { data: history = [] } = useQuery({ queryKey: ["/api/multi-agent/history"] });

  const collaborateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/multi-agent/collaborate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/multi-agent/history"] });
      setQuery("");
      toast({ title: "Collaboration complete" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAgent = (id: string) => setSelectedAgents(s => s.includes(id) ? s.filter(a => a !== id) : [...s, id]);

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8 text-primary" /> Multi-Agent Collaboration <Badge variant="secondary" className="text-xs align-middle" data-testid="badge-beta">Beta</Badge></h1>
          <p className="text-muted-foreground mt-1">Have multiple specialist AI agents work together on a single query</p>
        </div>
        <FinancialDisclaimer className="mb-6" />

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">New Collaborative Query</CardTitle><CardDescription>Pick which specialists should weigh in</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={3} placeholder="e.g., Should we expand our SaaS startup into the MENA region in 2026?" value={query} onChange={e => setQuery(e.target.value)} />
            <div>
              <p className="text-sm font-medium mb-2">Participating Agents ({selectedAgents.length})</p>
              <div className="flex flex-wrap gap-2">
                {ALL_AGENTS.map(a => (
                  <label key={a.id} className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 hover:bg-muted/50">
                    <Checkbox checked={selectedAgents.includes(a.id)} onCheckedChange={() => toggleAgent(a.id)} />
                    <Badge className={a.color}>{a.name}</Badge>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={!query.trim() || selectedAgents.length < 2 || collaborateMutation.isPending} onClick={() => collaborateMutation.mutate({ query, agents: selectedAgents })}>
              {collaborateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Agents collaborating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Run Multi-Agent Collaboration</>}
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-3">Recent Collaborations</h2>
        {(history as any[]).length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No collaborations yet. Run your first query above.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {(history as any[]).map((c: any) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.query}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(c.participatingAgents || []).map((a: string) => {
                      const meta = ALL_AGENTS.find(x => x.id === a);
                      return <Badge key={a} className={meta?.color || ""}>{meta?.name || a}</Badge>;
                    })}
                    <Badge variant="secondary" className="tabular-nums">{c.confidenceScore}% confidence</Badge>
                    <AIEstimateBadge />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-3">
                    <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Brain className="h-4 w-4" /> Synthesized Recommendation</p>
                    <p className="text-sm whitespace-pre-wrap">{c.aggregatedResult}</p>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-muted-foreground">View individual agent responses</summary>
                    <div className="mt-3 space-y-2">
                      {Object.entries(c.agentResponses || {}).map(([agent, resp]: any) => {
                        const meta = ALL_AGENTS.find(x => x.id === agent);
                        return (
                          <div key={agent} className="border rounded p-3">
                            <Badge className={meta?.color || ""}>{meta?.name || agent}</Badge>
                            <p className="mt-2 text-sm">{resp.analysis}</p>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
