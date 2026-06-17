import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Users, FileText, BarChart3, Search, AlertTriangle, Activity, Building2 } from "lucide-react";
import { SubscriptionTier, TIER_DISPLAY_NAMES } from "@shared/schema";
import { Redirect } from "wouter";
import { EmptyState } from "@/components/empty-state";

interface AdminUser {
  id: number; username: string; email: string; name: string;
  subscriptionTier: string; isPremium: boolean; isAdmin: boolean; isSuspended: boolean;
}
interface AuditLogEntry {
  id: number; userId: number | null; companyId: number | null; action: string;
  resourceType: string; resourceId: string | null; createdAt: string; ipAddress: string | null;
  metadata: Record<string, any> | null;
}
interface AdminStats {
  users: { total: number; suspended: number; byTier: Record<string, number> };
  companies: { total: number };
  activity24h: { auditEvents: number };
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <Redirect to="/auth" />;
  if (!(user as any).isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <EmptyState
          icon={AlertTriangle}
          title="Admin access required"
          description="You don't have permission to view this page. Contact your account administrator if you believe this is a mistake."
        />
      </div>
    );
  }

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ["/api/admin/users", search],
    queryFn: async () => {
      const r = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (!r.ok) throw new Error("Failed to load users");
      return r.json();
    },
  });

  const { data: logsData, isLoading: logsLoading } = useQuery<{ logs: AuditLogEntry[] }>({
    queryKey: ["/api/admin/audit-logs", actionFilter],
    queryFn: async () => {
      const url = actionFilter ? `/api/admin/audit-logs?action=${encodeURIComponent(actionFilter)}` : `/api/admin/audit-logs`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to load logs");
      return r.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const tierMutation = useMutation({
    mutationFn: async ({ id, tier, reason }: { id: number; tier: string; reason: string }) =>
      (await apiRequest("PATCH", `/api/admin/users/${id}/tier`, { tier, reason })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Tier updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, suspended, reason }: { id: number; suspended: boolean; reason: string }) =>
      (await apiRequest("PATCH", `/api/admin/users/${id}/suspend`, { suspended, reason })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const promptReason = (action: string): string | null => {
    const reason = window.prompt(`Enter a reason for this action (${action}). This is recorded in the audit log.`);
    if (reason === null) return null;
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "A reason is needed for this admin action.", variant: "destructive" });
      return null;
    }
    return reason.trim();
  };

  const tierOptions = Object.values(SubscriptionTier);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Internal controls for users, audit trail, and system health.</p>
        </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="stats" data-testid="tab-stats"><BarChart3 className="h-4 w-4 mr-2" />Stats</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit"><FileText className="h-4 w-4 mr-2" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 mt-6">
          {statsLoading ? (
            <div className="text-muted-foreground text-sm">Loading stats...</div>
          ) : !stats ? (
            <EmptyState icon={BarChart3} title="No stats available" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Total Users" value={stats.users.total} accent="text-blue-600" />
              <StatCard icon={AlertTriangle} label="Suspended" value={stats.users.suspended} accent="text-red-600" />
              <StatCard icon={Building2} label="Companies" value={stats.companies.total} accent="text-green-600" />
              <StatCard icon={Activity} label="24h Audit Events" value={stats.activity24h.auditEvents} accent="text-purple-600" />
            </div>
          )}
          {stats && (
            <Card>
              <CardHeader><CardTitle>Users by Tier</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(stats.users.byTier).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between p-3 rounded-md border">
                      <span className="text-sm">{TIER_DISPLAY_NAMES[tier] || tier}</span>
                      <Badge variant="secondary" data-testid={`stat-tier-${tier}`}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              data-testid="input-user-search"
            />
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {usersLoading ? (
                <div className="p-6 text-muted-foreground text-sm">Loading users...</div>
              ) : !usersData?.users.length ? (
                <EmptyState icon={Users} title="No users found" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="font-medium">{u.name || u.username}</div>
                          <div className="text-xs text-muted-foreground">@{u.username}</div>
                        </TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            value={u.subscriptionTier || SubscriptionTier.FREE}
                            onValueChange={(tier) => {
                              const reason = promptReason(`change tier to ${TIER_DISPLAY_NAMES[tier] || tier}`);
                              if (reason) tierMutation.mutate({ id: u.id, tier, reason });
                            }}
                          >
                            <SelectTrigger className="w-32 h-8" data-testid={`select-tier-${u.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tierOptions.map((t) => (
                                <SelectItem key={t} value={t}>{TIER_DISPLAY_NAMES[t] || t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {u.isSuspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                          {u.isAdmin && <Badge className="ml-1 bg-purple-600">Admin</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={u.isSuspended ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => {
                              const reason = promptReason(u.isSuspended ? "unsuspend user" : "suspend user");
                              if (reason) suspendMutation.mutate({ id: u.id, suspended: !u.isSuspended, reason });
                            }}
                            data-testid={`button-suspend-${u.id}`}
                          >
                            {u.isSuspended ? "Unsuspend" : "Suspend"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by action (e.g. admin.user.suspended)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="max-w-md"
              data-testid="input-audit-filter"
            />
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {logsLoading ? (
                <div className="p-6 text-muted-foreground text-sm">Loading logs...</div>
              ) : !logsData?.logs.length ? (
                <EmptyState icon={FileText} title="No audit logs" description="Actions taken across the platform will appear here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-[10px]">{l.action}</Badge></TableCell>
                        <TableCell className="text-xs">{l.resourceType}{l.resourceId ? `:${l.resourceId}` : ""}</TableCell>
                        <TableCell className="text-xs">{l.userId ? `user:${l.userId}` : l.companyId ? `company:${l.companyId}` : "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.ipAddress || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${accent}`} />
        </div>
      </CardContent>
    </Card>
  );
}
