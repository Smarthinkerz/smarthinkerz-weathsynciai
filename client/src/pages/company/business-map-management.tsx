import { isHighTier } from '@shared/schema';
import React, { useState } from 'react';
import { BusinessLocationManagement } from '@/components/business-map/location-management';
import { InteractiveBusinessMap } from '@/components/business-map/interactive-business-map';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, PlusCircle, Settings, Globe, Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface Company {
  id: number;
  name: string;
  subscriptionTier: string;
  [key: string]: any;
}

export default function BusinessMapManagementPage() {
  const [activeTab, setActiveTab] = useState('manage');
  
  // Use session data from company auth
  const sessionCompany = typeof window !== 'undefined' ? 
    JSON.parse(sessionStorage.getItem('company') || 'null') : null;
  
  // Fetch company details
  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['/api/company'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    initialData: sessionCompany,
  });

  // Check if company has premium subscription
  const isPremiumCompany = isHighTier(company?.subscriptionTier);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-6 w-96 bg-muted rounded animate-pulse" />
        <div className="h-[600px] w-full bg-muted rounded animate-pulse mt-8" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in as a company to access this page.
            <div className="mt-4">
              <Button asChild>
                <Link href="/company-auth">Log In</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isPremiumCompany) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Business Map Management</h1>
          <p className="text-muted-foreground">
            Manage your company's presence on the global business map.
          </p>
        </div>
        
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertTitle>Premium Feature</AlertTitle>
          <AlertDescription>
            The Interactive Global Business Map is a premium feature. Upgrade your subscription to add your locations to the map and increase your global visibility.
            <div className="mt-4">
              <Button asChild>
                <Link href="/company-subscription">Upgrade to Premium</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Business Map Preview</CardTitle>
            <CardDescription>
              See how the interactive map works before upgrading your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InteractiveBusinessMap />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Business Map Management</h1>
          <p className="text-muted-foreground">
            Manage your company's locations on the global business map and increase your visibility.
          </p>
        </div>

        <Tabs defaultValue="manage" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="manage" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Manage Locations</span>
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center">
              <Map className="mr-2 h-4 w-4" />
              <span>View Global Map</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Your Business Locations
                </CardTitle>
                <CardDescription>
                  Add and manage your business locations on the global interactive map.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company && <BusinessLocationManagement companyId={company.id} />}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="view" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <InteractiveBusinessMap />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}