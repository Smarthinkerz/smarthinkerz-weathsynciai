import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Compass, Briefcase, Gem, Building2, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TIER_DISPLAY_NAMES } from "@shared/schema";
import { RISK_ANALYTICS_LIVE } from "@shared/feature-flags";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PaidTier = 'professional' | 'elite' | 'enterprise';

// Computed risk analytics is feature-flagged. Until RISK_ANALYTICS_LIVE is true
// it's listed as "Coming soon" (not a delivered paid benefit) so we don't charge
// for it as a live deliverable; flipping the flag presents it as a real benefit.
const RISK_ANALYTICS_FEATURE = RISK_ANALYTICS_LIVE
  ? 'Risk analytics: volatility, Sharpe, beta, max drawdown'
  : 'Risk analytics (volatility, Sharpe, beta, max drawdown) — Coming soon';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Explorer',
    icon: Compass,
    price: 'Free',
    period: '',
    description: 'Get started with essential tools',
    features: [
      'Limited AI agent access',
      'Basic summarized insights',
      '3D opportunity map (view-only, limited regions)',
      'Basic alerts',
      'Limited daily queries',
    ],
    highlight: false,
    gradient: '',
  },
  {
    id: 'professional' as const,
    name: 'Professional',
    icon: Briefcase,
    price: '$49',
    period: '/month',
    description: 'Full power for serious users',
    features: [
      'Full multi-agent system access (Beta)',
      'Advanced analysis & insights',
      'Interactive 3D opportunity map',
      'Scenario simulations (Beta)',
      'Personalized tracking',
      'Priority AI processing',
      RISK_ANALYTICS_FEATURE,
    ],
    highlight: true,
    gradient: '',
  },
  {
    id: 'elite' as const,
    name: 'Elite',
    icon: Gem,
    price: '$149',
    period: '/month',
    description: 'For power users and teams',
    features: [
      'Everything in Professional',
      'Predictive modeling',
      'Multi-agent collaboration (Beta)',
      'Strategic execution tools',
      'Real-time global signals',
      'Custom dashboards',
      'Lead generation & smart contracts',
    ],
    highlight: false,
    gradient: '',
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    icon: Building2,
    price: 'Custom',
    period: '',
    description: 'Tailored for organizations',
    features: [
      'Everything in Elite',
      'API integrations',
      'Dedicated AI models',
      'Team roles & permissions',
      'Private data integration',
      'Dedicated account manager + SLA',
    ],
    highlight: false,
    gradient: '',
  },
];

function getTierDisplayName(tier: string): string {
  return TIER_DISPLAY_NAMES[tier] || tier;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 text-center">
      <p className="text-red-500">Something went wrong loading subscription plans.</p>
      <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
    </div>
  );
}

function SubscriptionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PaidTier | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  const currentTier = user?.subscriptionTier || 'free';

  const checkoutMutation = useMutation({
    mutationFn: async (tier: PaidTier) => {
      const res = await apiRequest("POST", "/api/checkout-session", { tier });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Failed to create payment session');
      }

      const data = await res.json();

      if (!data.checkoutUrl || !data.formData) {
        throw new Error("No checkout data received from server");
      }

      return data as { checkoutUrl: string; formData: Record<string, string> };
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      setAwaitingPayment(false);
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/confirm-payment", {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to confirm payment');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setAwaitingPayment(false);
      setSelectedTier(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Subscription Activated!",
        description: `Your ${getTierDisplayName(data.tier)} plan is now active.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitCheckoutForm = (checkoutUrl: string, formData: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkoutUrl;
    form.target = '_blank';

    Object.entries(formData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleSubscribe = async () => {
    if (!selectedTier) return;

    setShowConfirmDialog(false);
    try {
      setIsProcessing(true);
      toast({
        title: "Processing",
        description: "Opening payment page in a new tab...",
      });

      const result = await checkoutMutation.mutateAsync(selectedTier);
      submitCheckoutForm(result.checkoutUrl, result.formData);
      setIsProcessing(false);
      setAwaitingPayment(true);
    } catch (error) {
      console.error('Subscription error:', error);
      setIsProcessing(false);
    }
  };

  const isSubscribing = checkoutMutation.isPending || isProcessing;

  const isCurrent = (planId: string) => {
    if (planId === 'free' && (currentTier === 'free' || !currentTier)) return true;
    if (planId === 'professional' && (currentTier === 'professional' || currentTier === 'basic')) return true;
    if (planId === 'elite' && (currentTier === 'elite' || currentTier === 'premium')) return true;
    if (planId === 'enterprise' && currentTier === 'enterprise') return true;
    return false;
  };

  return (
    <>
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-4 -mr-4">
        <div className="mb-6 p-4 border rounded-lg bg-secondary/10">
          <h3 className="text-lg font-semibold mb-1">Your Current Plan</h3>
          <p className="text-sm text-muted-foreground">
            You are on the <span className="font-medium">{getTierDisplayName(currentTier)}</span> plan.
          </p>
        </div>

        {awaitingPayment && (
          <div className="mb-6 p-5 border-2 border-primary/50 rounded-lg bg-primary/5">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-lg font-semibold">Complete Your Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    A payment page has been opened in a new tab. After completing your payment there,
                    click the button below to activate your subscription.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                  >
                    {confirmMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Activating...</>
                    ) : (
                      "I've Completed Payment — Activate My Plan"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAwaitingPayment(false);
                      setSelectedTier(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const current = isCurrent(plan.id);
            const isPaid = plan.id !== 'free';
            const isEnterprise = plan.id === 'enterprise';

            return (
              <Card 
                key={plan.id} 
                className={`relative border-2 transition-all ${plan.highlight ? 'ring-2 ring-primary shadow-lg' : ''} ${current ? 'border-green-500/50' : ''} ${plan.gradient}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3 left-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Current Plan</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-xs">{plan.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <ul className="grid gap-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isEnterprise ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open('https://smarthinkerz.com/#contact', '_blank')}
                      disabled={current}
                    >
                      {current ? 'Current Plan' : <><Mail className="h-4 w-4 mr-2" /> Contact Sales</>}
                    </Button>
                  ) : isPaid ? (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedTier(plan.id as PaidTier);
                        setShowConfirmDialog(true);
                      }}
                      disabled={isSubscribing || current || awaitingPayment}
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      {isSubscribing && selectedTier === plan.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                      ) : current ? (
                        'Current Plan'
                      ) : (
                        `Get ${plan.name} — ${plan.price}${plan.period}`
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      {current ? 'Current Plan' : 'Included Free'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTier && (
                <>
                  You're about to {currentTier !== 'free' ? 'switch' : 'subscribe'} to the{' '}
                  <strong>{PLANS.find(p => p.id === selectedTier)?.name}</strong> plan at{' '}
                  <strong>{PLANS.find(p => p.id === selectedTier)?.price}{PLANS.find(p => p.id === selectedTier)?.period}</strong>.
                  You'll be redirected to our secure payment page in a new tab.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubscribe}>Proceed to Checkout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function SubscriptionPlans() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SubscriptionForm />
    </ErrorBoundary>
  );
}
