import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Receipt, CreditCard, Crown, Download, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { TIER_DISPLAY_NAMES, SubscriptionTier } from "@shared/schema";
import { Link } from "wouter";
import { EmptyState } from "@/components/empty-state";

interface InvoiceRow {
  id: number;
  externalId: string | null;
  tier: string;
  cycle: string;
  amountCents: number;
  currency: string;
  status: string;
  invoiceUrl: string | null;
  paidAt: string | null;
  failedReason: string | null;
  createdAt: string;
}
interface SubscriptionSummary {
  tier: string;
  tierLabel: string;
  isPremium: boolean;
  pendingTier: string | null;
  renewalDate: string | null;
}

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
  if (status === "failed") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function BillingPage() {
  const { toast } = useToast();

  const { data: sub, isLoading: subLoading } = useQuery<SubscriptionSummary>({
    queryKey: ["/api/billing/subscription"],
  });
  const { data: invData, isLoading: invLoading } = useQuery<{ invoices: InvoiceRow[] }>({
    queryKey: ["/api/billing/invoices"],
  });

  const cancelMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/billing/cancel", {})).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Subscription cancelled", description: "You've been moved to the Free plan." });
    },
    onError: (e: any) => toast({ title: "Cancel failed", description: e.message, variant: "destructive" }),
  });

  const isFree = sub?.tier === SubscriptionTier.FREE;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription and view past invoices.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" /> Current Plan
          </CardTitle>
          <CardDescription>Your active subscription details.</CardDescription>
        </CardHeader>
        <CardContent>
          {subLoading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold" data-testid="text-current-tier">{sub?.tierLabel || "Free"}</div>
                {sub?.pendingTier && (
                  <Badge variant="outline" className="mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Upgrade pending: {TIER_DISPLAY_NAMES[sub.pendingTier]}
                  </Badge>
                )}
                {sub?.renewalDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews {new Date(sub.renewalDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/#pricing">
                  <Button data-testid="button-change-plan">{isFree ? "Upgrade" : "Change Plan"}</Button>
                </Link>
                {!isFree && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Cancel your subscription? You'll lose premium features at the end of your billing period.")) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Invoice History</CardTitle>
          <CardDescription>Past payment activity for your account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {invLoading ? (
            <div className="p-6 text-muted-foreground text-sm">Loading invoices...</div>
          ) : !invData?.invoices.length ? (
            <div className="p-6">
              <EmptyState icon={Receipt} title="No invoices yet" description="Once you make a payment, your invoice history will appear here." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invData.invoices.map((inv) => (
                  <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{TIER_DISPLAY_NAMES[inv.tier] || inv.tier}</TableCell>
                    <TableCell className="capitalize text-xs">{inv.cycle}</TableCell>
                    <TableCell className="font-mono">{formatMoney(inv.amountCents, inv.currency)}</TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                      {inv.failedReason && <div className="text-xs text-red-600 mt-1">{inv.failedReason}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.invoiceUrl ? (
                        <a href={inv.invoiceUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
