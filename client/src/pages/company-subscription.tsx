import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Gem, Building2, CheckCircle, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

type CompanyTier = 'professional' | 'elite' | 'enterprise';

const COMPANY_PLANS: Array<{
  id: CompanyTier;
  name: string;
  icon: typeof Briefcase;
  price: number | null;
  description: string;
  features: string[];
  highlight: boolean;
}> = [
  {
    id: 'professional',
    name: 'Business Professional',
    icon: Briefcase,
    price: 79,
    description: 'For growing businesses',
    features: [
      'Full AI agent access for teams',
      'Advanced market analysis',
      'Company verification badge',
      'Priority support',
      'Team collaboration tools',
    ],
    highlight: false,
  },
  {
    id: 'elite',
    name: 'Business Elite',
    icon: Gem,
    price: 199,
    description: 'For established enterprises',
    features: [
      'Everything in Professional',
      'Predictive modeling',
      'Lead generation tools',
      'Smart contracts',
      'Custom dashboards',
      'API access',
    ],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: null,
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Elite',
      'Dedicated AI models',
      'Private data integration',
      'Custom SLA',
      'Dedicated account manager',
      'On-premise options',
    ],
    highlight: false,
  },
];

export default function CompanySubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<CompanyTier>('professional');
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

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

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/confirm-company-payment', {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to confirm payment');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setAwaitingPayment(false);
      queryClient.invalidateQueries({ queryKey: ['/api/company/profile'] });
      toast({
        title: 'Subscription Activated!',
        description: `Your business plan is now active.`,
      });
      setLocation('/company/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Activation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubscribe = async () => {
    if (selectedTier === 'enterprise') {
      window.open('https://smarthinkerz.com/#contact', '_blank');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/company-checkout-session', { tier: selectedTier });
      const data = await response.json();

      if (data.checkoutUrl && data.formData) {
        submitCheckoutForm(data.checkoutUrl, data.formData);
        setIsProcessing(false);
        setAwaitingPayment(true);
        toast({
          title: 'Payment Page Opened',
          description: 'Complete your payment in the new tab, then come back here to activate.',
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Error',
        description: error instanceof Error ? error.message : 'Failed to process subscription',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setLocation('/company/dashboard');
  };

  return (
    <div className="container py-10 max-w-6xl">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-3xl font-bold">Choose Your Business Plan</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Select the plan that best fits your business needs. Upgrade or downgrade anytime as your business grows.
          </p>
        </div>

        {awaitingPayment && (
          <div className="max-w-xl mx-auto mb-8 p-5 border-2 border-primary/50 rounded-lg bg-primary/5">
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
                    onClick={() => setAwaitingPayment(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {COMPANY_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedTier === plan.id;
            const isEnterprise = plan.id === 'enterprise';

            return (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all cursor-pointer ${isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-primary/30'}`}
                onClick={() => setSelectedTier(plan.id)}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="text-xs">{plan.description}</CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="bg-primary/10 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground ml-1">/month</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">Custom</span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {isEnterprise ? 'Contact us for pricing' : 'Billed monthly, cancel anytime'}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center mt-12">
          <Button
            size="lg"
            onClick={handleSubscribe}
            disabled={isProcessing || awaitingPayment}
            className="px-10"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : selectedTier === 'enterprise' ? (
              <><Mail className="h-4 w-4 mr-2" /> Contact Sales</>
            ) : (
              `Subscribe to ${COMPANY_PLANS.find(p => p.id === selectedTier)?.name} — $${COMPANY_PLANS.find(p => p.id === selectedTier)?.price}/mo`
            )}
          </Button>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground max-w-md mx-auto">
          By subscribing, you agree to our Terms of Service and Privacy Policy. Your subscription will begin immediately after successful payment.
        </div>
      </div>
    </div>
  );
}
