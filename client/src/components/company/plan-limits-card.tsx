import { isHighTier } from '@shared/schema';
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, BarChart3, Inbox, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

type CompanyLimits = {
  services: {
    limit: number | null;
    current: number;
    remaining: number | null;
  };
  opportunities: {
    limit: number | null;
    current: number;
    resetDate: string | null;
    remaining: number | null;
  };
  reports: {
    limit: number | null;
    current: number;
    resetDate: string | null;
    remaining: number | null;
  };
  aiEmail: {
    limit: number | null;
    current: number;
    resetDate: string | null;
    remaining: number | null;
  };
  tier: string;
  isPremium: boolean;
};

export const PlanLimitsCard = () => {
  const { company } = useAuth();
  const isPremium = isHighTier(company?.subscriptionTier);
  
  // Fetch plan limits from API
  const { data: limits, isLoading, error } = useQuery<CompanyLimits, Error>({
    queryKey: ['/api/company/limits'],
    retry: 1,
  });

  const getResetDateText = (resetDate: string | null) => {
    if (!resetDate) return 'Never';
    const date = new Date(resetDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Skeleton className="h-5 w-5 mr-2" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription className="flex">
            <div className="w-full"><Skeleton className="h-4 w-64" /></div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !limits) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>Error loading plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We couldn't load your current plan usage information. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              {isPremium ? 'Premium Plan Usage' : 'Basic Plan Usage'}
            </CardTitle>
            <CardDescription>
              Track your plan limits and monthly usage
            </CardDescription>
          </div>
          {!isPremium && (
            <Link href="/company/subscription">
              <Button variant="outline" size="sm" className="flex items-center">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Listings */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Inbox className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">Service Listings</span>
            </div>
            <span className="text-sm">
              {isPremium 
                ? 'Unlimited' 
                : `${limits.services.current} / ${limits.services.limit || 3}`}
            </span>
          </div>
          <Progress 
            value={isPremium ? 20 : ((limits.services.current / (limits.services.limit || 3)) * 100)} 
            className={isPremium ? "bg-amber-100" : ""} 
          />
          <p className="text-xs text-muted-foreground italic">
            {isPremium 
              ? 'Premium plan includes unlimited service listings' 
              : `You can add ${limits.services.remaining || 0} more service${limits.services.remaining !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Business Opportunities */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">Business Opportunities</span>
            </div>
            <span className="text-sm">
              {isPremium 
                ? 'Unlimited' 
                : `${limits.opportunities.current} / ${limits.opportunities.limit || 5}`}
            </span>
          </div>
          <Progress 
            value={isPremium ? 20 : ((limits.opportunities.current / (limits.opportunities.limit || 5)) * 100)} 
            className={isPremium ? "bg-amber-100" : ""} 
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="italic">
              {isPremium 
                ? 'No limits on business opportunity requests' 
                : `${limits.opportunities.remaining || 0} requests remaining this month`}
            </span>
            {!isPremium && (
              <span>Resets: {getResetDateText(limits.opportunities.resetDate)}</span>
            )}
          </div>
        </div>

        {/* Market Reports */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">Market Reports</span>
            </div>
            <span className="text-sm">
              {isPremium 
                ? 'Unlimited' 
                : `${limits.reports.current} / ${limits.reports.limit || 1}`}
            </span>
          </div>
          <Progress 
            value={isPremium ? 20 : ((limits.reports.current / (limits.reports.limit || 1)) * 100)} 
            className={isPremium ? "bg-amber-100" : ""} 
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="italic">
              {isPremium 
                ? 'Generate unlimited market intelligence reports' 
                : `${limits.reports.remaining || 0} report${limits.reports.remaining !== 1 ? 's' : ''} remaining this month`}
            </span>
            {!isPremium && (
              <span>Resets: {getResetDateText(limits.reports.resetDate)}</span>
            )}
          </div>
        </div>

        {/* AI Email Assistant */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Send className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">AI Email Assistant</span>
            </div>
            <span className="text-sm">
              {isPremium 
                ? 'Unlimited' 
                : `${limits.aiEmail.current} / ${limits.aiEmail.limit || 2}`}
            </span>
          </div>
          <Progress 
            value={isPremium ? 20 : ((limits.aiEmail.current / (limits.aiEmail.limit || 2)) * 100)} 
            className={isPremium ? "bg-amber-100" : ""} 
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="italic">
              {isPremium 
                ? 'Generate unlimited AI-powered emails' 
                : `${limits.aiEmail.remaining || 0} email${limits.aiEmail.remaining !== 1 ? 's' : ''} remaining today`}
            </span>
            {!isPremium && (
              <span>Resets: {getResetDateText(limits.aiEmail.resetDate)}</span>
            )}
          </div>
        </div>
      </CardContent>
      {!isPremium && (
        <CardFooter className="bg-muted/50 border-t">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <p className="text-sm">Need more capabilities for your business?</p>
              <Link href="/company/subscription">
                <Button size="sm">Upgrade to Premium</Button>
              </Link>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};