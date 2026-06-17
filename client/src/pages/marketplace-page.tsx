import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Download, Trash2, Loader2, Star, Plug, Settings } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [configFor, setConfigFor] = useState<any>(null);
  const [configValues, setConfigValues] = useState<any>({});
  const [configActive, setConfigActive] = useState(true);

  const { data: plugins = [], isLoading } = useQuery({ queryKey: ["/api/plugins"] });
  const { data: installed = [] } = useQuery({ queryKey: ["/api/plugins/installed"] });

  const installMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/plugins/${id}/install`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plugins/installed"] });
      toast({ title: "Plugin installed" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  });

  const uninstallMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/plugins/installed/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plugins/installed"] });
      toast({ title: "Plugin uninstalled" });
    }
  });

  const installedPluginIds = new Set((installed as any[]).map((i: any) => i.pluginId));
  const getInstalledId = (pluginId: number) => (installed as any[]).find((i: any) => i.pluginId === pluginId)?.id;
  const getInstalledRecord = (pluginId: number) => (installed as any[]).find((i: any) => i.pluginId === pluginId);

  const saveConfigMutation = useMutation({
    mutationFn: async ({ id, config, isActive }: any) => {
      await apiRequest("PUT", `/api/plugins/installed/${id}/config`, { config, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins/installed"] });
      toast({ title: "Configuration saved" });
      setConfigFor(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openConfig = (plugin: any) => {
    const inst = getInstalledRecord(plugin.id);
    setConfigFor({ plugin, installed: inst });
    setConfigValues(inst?.config || {});
    setConfigActive(inst?.isActive ?? true);
  };

  const tierColors: Record<string, string> = { free: "bg-green-100 text-green-800", professional: "bg-blue-100 text-blue-800", elite: "bg-purple-100 text-purple-800", enterprise: "bg-amber-100 text-amber-800" };

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Plug className="h-8 w-8 text-primary" /> Plugin Marketplace</h1>
          <p className="text-muted-foreground mt-1">Extend WealthSync with powerful plugins and integrations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Available</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{(plugins as any[]).length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Installed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{(installed as any[]).length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Your Tier</CardTitle></CardHeader><CardContent><p className="text-xl font-bold capitalize">{user?.subscriptionTier || "free"}</p></CardContent></Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (plugins as any[]).length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No plugins available yet. Check back soon for new integrations!</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(plugins as any[]).map((plugin: any) => (
              <Card key={plugin.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <CardDescription className="text-xs">by {plugin.author} · v{plugin.version}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{plugin.category}</Badge>
                      <Badge className={tierColors[plugin.requiredTier] || ""}>{plugin.requiredTier}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {plugin.installCount}</span>
                      {plugin.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {plugin.rating}/5</span>}
                    </div>
                  </div>
                  <div className="mt-4">
                    {installedPluginIds.has(plugin.id) ? (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => openConfig(plugin)}>
                          <Settings className="h-4 w-4 mr-2" /> Configure
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => uninstallMutation.mutate(getInstalledId(plugin.id))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full" disabled={installMutation.isPending} onClick={() => installMutation.mutate(plugin.id)}>
                        {installMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />} Install
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!configFor} onOpenChange={(o) => !o && setConfigFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Configure {configFor?.plugin?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <Label htmlFor="active">Plugin Active</Label>
                <Switch id="active" checked={configActive} onCheckedChange={setConfigActive} />
              </div>
              {(configFor?.plugin?.configSchema?.fields || []).map((field: any) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                  {field.type === 'select' ? (
                    <Select value={configValues[field.key] || field.default || ''} onValueChange={(v) => setConfigValues({ ...configValues, [field.key]: v })}>
                      <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                      <SelectContent>{(field.options || []).map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : field.type === 'boolean' ? (
                    <Switch checked={configValues[field.key] ?? field.default ?? false} onCheckedChange={(v) => setConfigValues({ ...configValues, [field.key]: v })} />
                  ) : (
                    <Input
                      type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                      value={configValues[field.key] ?? field.default ?? ''}
                      onChange={(e) => setConfigValues({ ...configValues, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                      placeholder={field.label}
                    />
                  )}
                </div>
              ))}
              {(!configFor?.plugin?.configSchema?.fields?.length) && (
                <p className="text-sm text-muted-foreground text-center py-4">This plugin has no configuration options.</p>
              )}
              <Button className="w-full" disabled={saveConfigMutation.isPending} onClick={() => saveConfigMutation.mutate({ id: configFor?.installed?.id, config: configValues, isActive: configActive })}>
                {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
