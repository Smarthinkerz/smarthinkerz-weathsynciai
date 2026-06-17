import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Plug, Activity, Database } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function IntegrationDashboardPage() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/integrations/status"] });

  const categoryIcon: Record<string, any> = {
    AI: Activity, Database: Database, "Market Data": Activity, Leads: Plug, Payments: Plug, Email: Plug, Maps: Plug,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Plug className="h-8 w-8 text-primary" /> Integration Dashboard</h1>
          <p className="text-muted-foreground mt-1">Connected APIs, status, and configuration overview</p>
        </div>

        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Total Integrations</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data.summary.total}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-lg text-green-600">Connected</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{data.summary.connected}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-lg text-red-600">Disconnected</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{data.summary.disconnected}</p></CardContent></Card>
            </div>

            <div className="grid gap-3">
              {data.integrations.map((i: any) => {
                const Icon = categoryIcon[i.category] || Plug;
                return (
                  <Card key={i.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${i.status === 'connected' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Icon className={`h-6 w-6 ${i.status === 'connected' ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{i.name}</p>
                            <Badge variant="outline">{i.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{i.usage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {i.status === 'connected' ? (
                          <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Not Configured</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
