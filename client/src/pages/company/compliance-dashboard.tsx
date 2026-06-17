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
import { FileText, Plus, Loader2, Shield, Lightbulb, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function ComplianceDashboard() {
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("regulatory");
  const [briefTitle, setBriefTitle] = useState("");
  const [briefFocus, setBriefFocus] = useState("");

  const { data: reports = [], isLoading: reportsLoading } = useQuery({ queryKey: ["/api/compliance-reports"] });
  const { data: briefs = [], isLoading: briefsLoading } = useQuery({ queryKey: ["/api/strategy-briefs"] });

  const generateReportMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/compliance-reports/generate", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-reports"] });
      setReportOpen(false); setReportTitle(""); setReportType("regulatory");
      toast({ title: "Compliance report generated" });
    },
    onError: () => { toast({ title: "Generation failed", variant: "destructive" }); }
  });

  const generateBriefMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/strategy-briefs/generate", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy-briefs"] });
      setBriefOpen(false); setBriefTitle(""); setBriefFocus("");
      toast({ title: "Strategy brief generated" });
    },
    onError: () => { toast({ title: "Generation failed", variant: "destructive" }); }
  });

  const riskColors: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8 text-primary" /> Enterprise Intelligence</h1>
          <p className="text-muted-foreground mt-1">AI-powered compliance monitoring and strategic planning</p>
        </div>

        <Tabs defaultValue="compliance">
          <TabsList className="mb-6">
            <TabsTrigger value="compliance" className="flex items-center gap-2"><FileText className="h-4 w-4" /> Compliance Reports</TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Strategy Briefs</TabsTrigger>
          </TabsList>

          <TabsContent value="compliance">
            <div className="flex items-center justify-between mb-4">
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{(reports as any[]).length}</p><p className="text-xs text-muted-foreground">Total Reports</p></CardContent></Card>
                <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-green-600">{(reports as any[]).filter((r: any) => r.riskLevel === "low").length}</p><p className="text-xs text-muted-foreground">Low Risk</p></CardContent></Card>
                <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-red-600">{(reports as any[]).filter((r: any) => r.riskLevel === "high" || r.riskLevel === "critical").length}</p><p className="text-xs text-muted-foreground">High Risk</p></CardContent></Card>
              </div>
              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Generate Report</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Generate Compliance Report</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div><Label>Report Title</Label><Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="e.g., Q4 Regulatory Review" /></div>
                    <div><Label>Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regulatory">Regulatory Compliance</SelectItem>
                          <SelectItem value="financial">Financial Compliance</SelectItem>
                          <SelectItem value="data_privacy">Data Privacy</SelectItem>
                          <SelectItem value="operational">Operational Risk</SelectItem>
                          <SelectItem value="environmental">Environmental (ESG)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" disabled={!reportTitle.trim() || generateReportMutation.isPending} onClick={() => generateReportMutation.mutate({ title: reportTitle, reportType })}>
                      {generateReportMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : "Generate Report"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {reportsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (reports as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No compliance reports yet. Generate your first AI-powered report.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {(reports as any[]).map((report: any) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{report.reportType}</Badge>
                            <Badge className={riskColors[report.riskLevel] || ""}>{report.riskLevel} risk</Badge>
                          </div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription>{new Date(report.createdAt).toLocaleDateString()}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{report.summary}</p>
                      {report.findings?.length > 0 && (
                        <div className="space-y-2">
                          {report.findings.slice(0, 3).map((finding: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                              {finding.severity === "high" || finding.severity === "critical" ? <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                              <div>
                                <p className="font-medium">{finding.title}</p>
                                <p className="text-muted-foreground">{finding.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="strategy">
            <div className="flex justify-end mb-4">
              <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Generate Brief</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Generate Strategy Brief</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div><Label>Brief Title</Label><Input value={briefTitle} onChange={e => setBriefTitle(e.target.value)} placeholder="e.g., Market Expansion Strategy" /></div>
                    <div><Label>Focus Area</Label><Input value={briefFocus} onChange={e => setBriefFocus(e.target.value)} placeholder="e.g., APAC market entry" /></div>
                    <Button className="w-full" disabled={!briefTitle.trim() || generateBriefMutation.isPending} onClick={() => generateBriefMutation.mutate({ title: briefTitle, focus: briefFocus })}>
                      {generateBriefMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : "Generate Brief"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {briefsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (briefs as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No strategy briefs yet. Generate your first AI-powered brief.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {(briefs as any[]).map((brief: any) => (
                  <Card key={brief.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{brief.title}</CardTitle>
                      <CardDescription>{new Date(brief.createdAt).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{brief.executiveSummary}</p>
                      {brief.recommendations?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Key Recommendations</p>
                          <div className="space-y-2">
                            {brief.recommendations.slice(0, 3).map((rec: any, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <Badge variant="outline" className="text-xs shrink-0">{rec.priority}</Badge>
                                <div>
                                  <p className="font-medium">{rec.title}</p>
                                  <p className="text-muted-foreground">{rec.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
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
