import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Key, Plus, Trash2, Copy, Loader2, Link2, TrendingUp, DollarSign } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [keyOpen, setKeyOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [newKey, setNewKey] = useState("");

  const { data: apiKeysData = [], isLoading: keysLoading } = useQuery({ queryKey: ["/api/api-keys"] });
  const { data: affiliateData = [], isLoading: linksLoading } = useQuery({ queryKey: ["/api/affiliate-links"] });
  const { data: usage } = useQuery<any>({ queryKey: ["/api/api-keys/usage/summary"] });

  const createKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/api-keys", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setNewKey(data.rawKey);
      setKeyName("");
      toast({ title: "API key created" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/api-keys/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "API key deleted" });
    }
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/affiliate-links", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate-links"] });
      setLinkOpen(false); setCampaignName("");
      toast({ title: "Affiliate link created" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/affiliate-links/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate-links"] });
      toast({ title: "Link deleted" });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Key className="h-8 w-8 text-primary" /> Developer & Partner Hub</h1>
          <p className="text-muted-foreground mt-1">Manage API keys and affiliate partnerships</p>
        </div>

        <Tabs defaultValue="api-keys">
          <TabsList className="mb-6">
            <TabsTrigger value="api-keys" className="flex items-center gap-2"><Key className="h-4 w-4" /> API Keys</TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Usage Analytics</TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Affiliate Program</TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            {!usage ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Usage analytics requires an Elite or Enterprise plan with at least one API key.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Requests</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{usage.totalRequests.toLocaleString()}</p></CardContent></Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Keys</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{usage.activeKeys}</p></CardContent></Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Monthly Allowance</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{usage.monthlyAllowance.toLocaleString()}</p></CardContent></Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Overage Cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${usage.overageCost.toFixed(2)}</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Monthly Usage</CardTitle><CardDescription>{usage.usagePercent}% of your {usage.tier} plan allowance</CardDescription></CardHeader>
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div className={`h-3 transition-all ${usage.usagePercent > 90 ? 'bg-red-500' : usage.usagePercent > 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${usage.usagePercent}%` }} />
                    </div>
                    {usage.overageRequests > 0 && (
                      <p className="mt-3 text-sm text-amber-700">⚠️ {usage.overageRequests.toLocaleString()} requests over your allowance — billed at $0.001/request</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Per-Key Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {usage.perKey.length === 0 ? <p className="text-sm text-muted-foreground">No API keys yet</p> : (
                      <div className="space-y-2">
                        {usage.perKey.map((k: any) => (
                          <div key={k.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                            <div>
                              <p className="font-medium text-sm">{k.name}</p>
                              <p className="text-xs text-muted-foreground">Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{k.usageCount.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">/ {k.rateLimit}/hr</span></p>
                              <Badge variant={k.isActive ? "secondary" : "outline"} className="text-xs">{k.isActive ? "Active" : "Inactive"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="api-keys">
            <div className="flex justify-end mb-4">
              <Dialog open={keyOpen} onOpenChange={(o) => { setKeyOpen(o); if (!o) setNewKey(""); }}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Create API Key</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{newKey ? "API Key Created" : "Create API Key"}</DialogTitle></DialogHeader>
                  {newKey ? (
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">Copy this key now. You won't be able to see it again.</p>
                      <div className="flex gap-2">
                        <Input value={newKey} readOnly className="font-mono text-xs" />
                        <Button variant="outline" onClick={() => copyToClipboard(newKey)}><Copy className="h-4 w-4" /></Button>
                      </div>
                      <Button className="w-full" onClick={() => { setKeyOpen(false); setNewKey(""); }}>Done</Button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div><Label>Key Name</Label><Input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="e.g., Production API" /></div>
                      <Button className="w-full" disabled={!keyName.trim() || createKeyMutation.isPending} onClick={() => createKeyMutation.mutate({ name: keyName, permissions: ["read", "write"] })}>
                        {createKeyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Generate Key
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            {keysLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (apiKeysData as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No API keys yet. Create one to start integrating with the WealthSync API.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {(apiKeysData as any[]).map((key: any) => (
                  <Card key={key.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">{key.keyPrefix}...</code>
                          <span>{key.usageCount} requests</span>
                          <span>Rate limit: {key.rateLimit}/hr</span>
                          {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                        </div>
                        <div className="flex gap-1 mt-2">{key.permissions?.map((p: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{p}</Badge>)}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteKeyMutation.mutate(key.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="affiliates">
            <div className="flex justify-end mb-4">
              <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Create Affiliate Link</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Affiliate Link</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div><Label>Campaign Name</Label><Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g., Blog Promotion" /></div>
                    <Button className="w-full" disabled={!campaignName.trim() || createLinkMutation.isPending} onClick={() => createLinkMutation.mutate({ campaignName })}>
                      {createLinkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {linksLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (affiliateData as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No affiliate links yet. Create one to start earning commissions.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {(affiliateData as any[]).map((link: any) => (
                  <Card key={link.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{link.campaignName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">{link.code}</code>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/api/affiliate/track/${link.code}`)}><Copy className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-center">
                          <div><p className="text-lg font-bold">{link.clicks}</p><p className="text-xs text-muted-foreground">Clicks</p></div>
                          <div><p className="text-lg font-bold">{link.conversions}</p><p className="text-xs text-muted-foreground">Conversions</p></div>
                          <div><p className="text-lg font-bold">{link.commissionRate}%</p><p className="text-xs text-muted-foreground">Commission</p></div>
                          <Button variant="ghost" size="icon" onClick={() => deleteLinkMutation.mutate(link.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
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
