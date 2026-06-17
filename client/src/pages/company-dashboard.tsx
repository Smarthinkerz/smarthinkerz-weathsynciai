import { isHighTier } from '@shared/schema';
import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  Map, 
  MessageSquareText, 
  TrendingUp, 
  BadgeCheck, 
  Crown, 
  Calendar, 
  FileText, 
  Video, 
  Globe2, 
  Lock, 
  ArrowUpRight, 
  Sparkles,
  Globe,
  BarChart,
  PieChart,
  UserCheck,
  LineChart,
  MessageSquare,
  ListChecks,
  Target,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  Bot,
  Inbox,
  ShieldCheck,
  Activity,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanLimitsCard } from '@/components/company/plan-limits-card';
import ServiceManagement from '@/components/company/fixed-service-management';
import { FinnhubTicker, FinnhubNewsWidget } from '@/components/finnhub-ticker';

export default function CompanyDashboard() {
  const { company, isLoading, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use useEffect to handle redirects after render instead of during render
  React.useEffect(() => {
    if (!company && !isLoading) {
      setLocation('/company/auth');
    }
  }, [company, isLoading, setLocation]);
  
  const handleFeatureClick = (featureName: string, isPremiumOnly: boolean = true) => {
    if (isPremiumOnly && !isHighTier(company?.subscriptionTier)) {
      toast({
        title: 'Premium Feature',
        description: `${featureName} is available only for Premium plan subscribers. Upgrade to access this feature.`,
        variant: 'default',
      });
      return;
    }
    
    // Navigate to the specific feature page if it exists
    if (featureName === 'Premium Directory Placement') {
      setLocation('/company/premium-directory');
      return;
    }
    
    if (featureName === 'Advanced AI Chatbot') {
      setLocation('/virtual-assistant');
      return;
    }
    
    if (featureName === 'AI-powered Lead Generation & Negotiation') {
      setLocation('/lead-generation');
      return;
    }
    
    // For other features still in development
    toast({
      title: featureName,
      description: 'This feature will be fully implemented in the next update.',
      variant: 'default',
    });
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!company) {
    return null;
  }
  
  const isPremium = isHighTier(company.subscriptionTier);

  // Fetch real global economic data from World Bank via our API (defaults to global/US)
  const { data: economicData, isLoading: economicLoading } = useQuery<any>({
    queryKey: ['/api/economic-data', 'US'],
    queryFn: () => fetch('/api/economic-data?country=US').then(r => r.ok ? r.json() : null),
    staleTime: 1000 * 60 * 30,
  });

  // Fetch real company analytics
  const { data: analytics } = useQuery<any>({
    queryKey: ['/api/company/analytics/summary'],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real client requests count
  const { data: clientRequests } = useQuery<any[]>({
    queryKey: ['/api/company/client-requests'],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real chatbot interactions count
  const { data: chatbotInteractions } = useQuery<any[]>({
    queryKey: ['/api/company/chatbot/interactions'],
    staleTime: 1000 * 60 * 5,
  });
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">Company Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {isPremium ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 py-1.5">
              <Crown className="h-3.5 w-3.5" />
              Premium Plan
            </Badge>
          ) : (
            <Link href="/company/subscription">
              <Button variant="outline" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={() => setLocation('/company/profile')}>
            Edit Profile
          </Button>
          <Button variant="outline" onClick={() => {
            logoutMutation.mutate();
            setLocation('/company/auth');
          }}>
            Logout
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Premium Features</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {/* Deep Research Feature Card - Available to all companies */}
          <div className="mb-6">
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-6 w-6 text-blue-600" />
                  Deep Research
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">AI-Powered</Badge>
                </CardTitle>
                <CardDescription>
                  Advanced research using hundreds of sources for market analysis, funding opportunities, and competitive intelligence.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">• Market Analysis • Funding Research</p>
                    <p className="text-sm text-gray-600">• Competitor Intelligence • Economic Impact</p>
                  </div>
                  <Link href="/company/deep-research">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Search className="h-4 w-4 mr-2" />
                      Start Research
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Basic Tier Features - Available to all companies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Economic Data Dashboard */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-transparent">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Economic Data Dashboard</CardTitle>
                </div>
                <CardDescription>Real-time economic indicators from World Bank</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {economicLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading live data...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">GDP Growth (US)</span>
                      <Badge variant="outline">
                        {economicData?.gdpGrowth != null
                          ? `${Number(economicData.gdpGrowth).toFixed(1)}%`
                          : '—'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inflation Rate (US)</span>
                      <Badge variant="outline">
                        {economicData?.inflation != null
                          ? `${Number(economicData.inflation).toFixed(1)}%`
                          : '—'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Unemployment (US)</span>
                      <Badge variant="outline">
                        {economicData?.unemployment != null
                          ? `${Number(economicData.unemployment).toFixed(1)}%`
                          : '—'}
                      </Badge>
                    </div>
                  </div>
                )}
                <Link href="/basic-tier">
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    View Full Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Financial Health Monitoring */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-transparent">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Team Financial Health</CardTitle>
                </div>
                <CardDescription>Monitor your team's financial wellness</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Company Size</span>
                    <Badge variant="outline">
                      {company.employeeCount ? `${company.employeeCount} employees` : 'Not set'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Client Requests</span>
                    <Badge variant="outline">
                      {clientRequests ? `${clientRequests.length} total` : '0 total'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Chatbot Interactions</span>
                    <Badge variant="outline">
                      {chatbotInteractions ? `${chatbotInteractions.length} total` : '0 total'}
                    </Badge>
                  </div>
                </div>
                <Link href="/team-financial-health">
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    View Team Health
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Basic Plan Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="overflow-hidden border-t-4 border-t-violet-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-br from-violet-50 to-transparent">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-violet-500" />
                  <CardTitle className="text-sm font-medium">AI Chatbot</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">Preset FAQ responses for customer inquiries</p>
                <Badge variant="outline" className="text-xs mb-3">{isPremium ? 'Unlimited' : '50/month'}</Badge>
                <Link href="/company/chatbot-settings">
                  <Button variant="outline" className="w-full" size="sm">
                    <Bot className="h-3.5 w-3.5 mr-1" />
                    Manage Chatbot
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-br from-orange-50 to-transparent">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-sm font-medium">Client Requests</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">Receive and respond to hiring requests</p>
                <Badge variant="outline" className="text-xs mb-3">Manual Response</Badge>
                <Link href="/company/client-requests">
                  <Button variant="outline" className="w-full" size="sm">
                    <Inbox className="h-3.5 w-3.5 mr-1" />
                    View Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-t-4 border-t-cyan-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-br from-cyan-50 to-transparent">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-500" />
                  <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">Profile views, inquiries & engagement</p>
                <Badge variant="outline" className="text-xs mb-3">Basic Insights</Badge>
                <Link href="/company/analytics">
                  <Button variant="outline" className="w-full" size="sm">
                    <Activity className="h-3.5 w-3.5 mr-1" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-t-4 border-t-teal-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-br from-teal-50 to-transparent">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-500" />
                  <CardTitle className="text-sm font-medium">Verification</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">Employee skills & license verification</p>
                <Badge variant="outline" className="text-xs mb-3">{isPremium ? 'Unlimited' : '2 verifications'}</Badge>
                <Link href="/company/employee-verifications">
                  <Button variant="outline" className="w-full" size="sm">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Manage Verifications
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {isPremium && (
              <Card className="overflow-hidden border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-gradient-to-br from-indigo-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    <CardTitle className="text-sm font-medium">Enterprise Intelligence</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-xs text-muted-foreground mb-3">AI compliance reports & strategy briefs</p>
                  <Badge variant="outline" className="text-xs mb-3">Elite+</Badge>
                  <Link href="/company/compliance">
                    <Button variant="outline" className="w-full" size="sm">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Open Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Plan Limits Card - Shows all usage limits with visual indicators */}
          <PlanLimitsCard />
          
          {/* Service Management Component - For Basic companies to manage their 3 services */}
          <ServiceManagement />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Company Info Card */}
            <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2 bg-gradient-to-br from-blue-50 to-transparent">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base font-medium">Company Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mt-2 p-4 rounded-lg bg-white border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Verification</span>
                    </div>
                    <Badge variant={company.verificationStatus === 'Verified' ? 'default' : 'outline'} 
                      className={company.verificationStatus === 'Verified' ? 
                        "bg-green-100 text-green-700 hover:bg-green-200" : 
                        "bg-amber-100 text-amber-700 hover:bg-amber-200"}>
                      {company.verificationStatus || 'Pending'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Subscription</span>
                    </div>
                    <Badge variant={isPremium ? 'default' : 'outline'} 
                      className={isPremium ? 
                        "bg-amber-100 text-amber-700 hover:bg-amber-200" : 
                        "bg-gray-100 text-gray-700 hover:bg-gray-200"}>
                      {isPremium ? 'Premium' : 'Basic'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setLocation('/company/profile')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  {!isPremium && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setLocation('/company/subscription')}
                    >
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Video Profile Card */}
            <Card className="overflow-hidden border-t-4 border-t-purple-500 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2 bg-gradient-to-br from-purple-50 to-transparent">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base font-medium">Company Media</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mt-2 relative overflow-hidden rounded-lg aspect-video bg-gradient-to-br from-purple-100 to-gray-100 border border-purple-100 flex items-center justify-center">
                  {company.profileVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/10 backdrop-blur-sm rounded-full p-2">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <Video className="h-10 w-10 text-purple-300" />
                      <p className="text-sm text-purple-600 font-medium">Add a company introduction video</p>
                      <p className="text-xs text-muted-foreground">Showcase your services in action</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    {company.profileVideo ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not uploaded
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-sm mt-auto pt-4"
                  onClick={() => setLocation('/company/profile')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  {company.profileVideo ? 'View Profile Video' : 'Add Profile Video'}
                </Button>
              </CardContent>
            </Card>
            
            {/* Market Reports Card */}
            <Card className="overflow-hidden border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2 bg-gradient-to-br from-emerald-50 to-transparent">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-base font-medium">Market Reports</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mt-2 p-4 rounded-lg bg-white border border-emerald-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Smart Analysis</h4>
                      <p className="text-xs text-muted-foreground">AI-powered market insights</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <Globe2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Global Coverage</h4>
                      <p className="text-xs text-muted-foreground">Data from trusted sources</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-md">
                  {isPremium ? 
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Generate unlimited market reports</span>
                    </div> : 
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span>1 report per month with Basic plan</span>
                    </div>
                  }
                </div>
                
                <div className="space-y-2 mt-auto pt-4">
                  <Button 
                    variant="default" 
                    className="w-full text-sm bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setLocation('/company/market-reports')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Market Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setLocation('/company/enhanced-analytics')}
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    Enhanced Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-8 w-1 rounded-md"></div>
              <h3 className="text-xl font-medium">Premium Features</h3>
              {!isPremium && (
                <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 py-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Upgrade to unlock
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Directory Card */}
              <Card className={`${!isPremium ? "opacity-75 border-dashed" : "border-t-2 border-t-indigo-500 shadow-sm hover:shadow-md transition-shadow"} flex flex-col h-[450px]`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-indigo-100">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <CardTitle className="text-base font-medium">Business Directory</CardTitle>
                    </div>
                    {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  {/* Feature image/visualization */}
                  <div className="h-24 mb-4 rounded-md overflow-hidden bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-center border-l-4 border-l-indigo-500">
                    <div className="flex items-center gap-3 px-4">
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-medium text-indigo-600">P1</div>
                        <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium text-blue-600">P2</div>
                        <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-medium text-purple-600">P3</div>
                      </div>
                      <div className="w-24 h-1 bg-gradient-to-r from-indigo-300 to-indigo-100 rounded-full"></div>
                      <div className="flex -space-x-2">
                        <div className="h-10 w-10 rounded-full bg-indigo-300 ring-2 ring-white flex items-center justify-center text-xs font-medium text-white">YOU</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Featured placement</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Enhanced visibility</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Direct business connections</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant={isPremium ? "default" : "outline"}
                    className={`w-full text-sm mt-auto pt-4 ${isPremium ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                    disabled={!isPremium}
                    onClick={() => handleFeatureClick('Premium Directory Placement')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Directory Listing
                  </Button>
                </CardContent>
              </Card>
              
              {/* Chatbot Card */}
              <Card className={`${!isPremium ? "opacity-75 border-dashed" : "border-t-2 border-t-violet-500 shadow-sm hover:shadow-md transition-shadow"} flex flex-col h-[450px]`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-violet-100">
                        <MessageSquare className="h-5 w-5 text-violet-600" />
                      </div>
                      <CardTitle className="text-base font-medium">AI Assistant</CardTitle>
                    </div>
                    {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  {/* Feature image/visualization */}
                  <div className="h-24 mb-4 rounded-md overflow-hidden bg-gradient-to-r from-violet-50 to-purple-50 flex items-center justify-center p-3 border-l-4 border-l-violet-500">
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-violet-200 flex items-center justify-center">
                          <MessageSquare className="h-3 w-3 text-violet-600" />
                        </div>
                        <div className="bg-violet-100 rounded-lg p-1 px-2 text-xs text-violet-700">How can I help your business today?</div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="bg-white rounded-lg p-1 px-2 text-xs">Generate market report</div>
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">24/7 AI assistance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Customer support automation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">{isPremium ? "Unlimited interactions" : "Basic interactions (2/day)"}</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant={isPremium ? "default" : "outline"}
                    className={`w-full text-sm mt-auto pt-4 ${isPremium ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                    onClick={() => handleFeatureClick('Advanced AI Chatbot', !isPremium)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Configure AI Assistant
                  </Button>
                </CardContent>
              </Card>
              
              {/* Business Map Card */}
              <Card className={`${!isPremium ? "opacity-75 border-dashed" : "border-t-2 border-t-cyan-500 shadow-sm hover:shadow-md transition-shadow"} flex flex-col h-[450px]`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-cyan-100">
                        <Globe className="h-5 w-5 text-cyan-600" />
                      </div>
                      <CardTitle className="text-base font-medium">Global Business Map</CardTitle>
                    </div>
                    {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  {/* Feature image/visualization */}
                  <div className="h-24 mb-4 rounded-md overflow-hidden bg-gradient-to-r from-cyan-50 to-blue-50 flex items-center justify-center border-l-4 border-l-cyan-500">
                    <div className="relative w-full h-full">
                      {/* World map simplified visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Globe className="h-16 w-16 text-cyan-200" />
                      </div>
                      {/* Map pins */}
                      <div className="absolute top-1/3 left-1/4 h-2 w-2 bg-cyan-500 rounded-full pulse-animation"></div>
                      <div className="absolute top-1/2 left-1/2 h-3 w-3 bg-cyan-600 rounded-full pulse-animation"></div>
                      <div className="absolute bottom-1/3 right-1/4 h-2 w-2 bg-cyan-500 rounded-full pulse-animation"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Interactive business mapping</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Real-time market data</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Global opportunity insights</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant={isPremium ? "default" : "outline"}
                    className={`w-full text-sm mt-auto pt-4 ${isPremium ? "bg-cyan-600 hover:bg-cyan-700" : ""}`}
                    disabled={!isPremium}
                    onClick={() => setLocation('/company/business-map')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Explore Global Opportunities
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Add a pulsing animation for the map indicators */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.7; }
              50% { transform: scale(1.2); opacity: 0.9; }
              100% { transform: scale(0.95); opacity: 0.7; }
            }
            .pulse-animation {
              animation: pulse 2s infinite;
              box-shadow: 0 0 0 rgba(0, 180, 216, 0.4);
            }
          `}} />
        </TabsContent>
        
        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Premium Features */}
            <PremiumFeatureCard 
              title="Premium Directory Placement" 
              description="Featured placement in our business directory for maximum visibility"
              icon={<Crown />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Premium Directory Placement')}
            />
            
            <PremiumFeatureCard 
              title="Advanced AI Chatbot" 
              description="Unlimited interactions with our AI assistant for customer engagement"
              icon={<MessageSquare />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Advanced AI Chatbot')}
            />
            
            <PremiumFeatureCard 
              title="Interactive Global Business Map" 
              description="Visual mapping of global business opportunities and connections"
              icon={<Globe />}
              isPremium={isPremium}
              onClick={() => setLocation('/company/business-map')}
            />
            
            <PremiumFeatureCard 
              title="AI Lead Generation & Negotiation" 
              description="AI-powered tools to identify and engage with high-quality leads"
              icon={<Target />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('AI-powered Lead Generation & Negotiation')}
            />
            
            <PremiumFeatureCard 
              title="Advanced Analytics" 
              description="Detailed analytics with AI-generated growth recommendations"
              icon={<BarChart />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Advanced Analytics with Growth Recommendations')}
            />
            
            <PremiumFeatureCard 
              title="Unlimited Employee Verifications" 
              description="Verify and showcase employee credentials and accomplishments"
              icon={<UserCheck />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Unlimited Employee Verifications')}
            />
            
            <PremiumFeatureCard 
              title="Exclusive AI Market Intelligence" 
              description="Access to AI-powered industry insights and competitive analysis"
              icon={<Sparkles />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Exclusive AI Market Intelligence')}
            />
            
            <PremiumFeatureCard 
              title="Automated Client Booking & Contracts" 
              description="Streamlined client acquisition with automated bookings and smart contracts"
              icon={<Calendar />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Automated Client Booking & Contracts')}
            />
            
            <PremiumFeatureCard 
              title="Unlimited Services Listing" 
              description="List and promote all your business services without restrictions"
              icon={<ListChecks />}
              isPremium={isPremium}
              onClick={() => handleFeatureClick('Unlimited Services Listing')}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Live Market Data - always visible for all companies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinnhubTicker symbols={['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']} title="Live Stock Market" />
              <FinnhubNewsWidget />
            </div>

            {/* Engagement Summary */}
            <EngagementSummaryCard companyId={company?.id} isPremium={isPremium} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EngagementSummaryCard({ companyId, isPremium }: { companyId?: number; isPremium: boolean }) {
  const { data: rawSummary, isLoading } = useQuery<any[]>({
    queryKey: ["/api/company/analytics/summary"],
    enabled: !!companyId,
  });

  const summary: Record<string, number> = {};
  if (Array.isArray(rawSummary)) {
    for (const row of rawSummary) summary[row.eventType] = Number(row.count);
  }

  const stats = [
    { key: "profile_view",         label: "Profile Views",    icon: "👁️",  color: "bg-purple-50 border-purple-200 text-purple-700" },
    { key: "chatbot_interaction",   label: "Chatbot Sessions", icon: "💬",  color: "bg-blue-50 border-blue-200 text-blue-700"   },
    { key: "client_request",        label: "Client Requests",  icon: "📋",  color: "bg-green-50 border-green-200 text-green-700" },
    { key: "directory_click",       label: "Directory Clicks", icon: "📌",  color: "bg-orange-50 border-orange-200 text-orange-700" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Engagement Overview
            </CardTitle>
            <CardDescription>Live summary of how users interact with your company profile</CardDescription>
          </div>
          <Link href="/company/analytics">
            <Button variant="outline" size="sm">View Full Analytics →</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.key} className={`rounded-lg border p-3 ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{summary[s.key] ?? 0}</p>
              )}
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isPremium: boolean;
  onClick: () => void;
}

const PremiumFeatureCard = ({ title, description, icon, isPremium, onClick }: PremiumFeatureCardProps) => {
  return (
    <Card className={!isPremium ? "opacity-80" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[200px]">
        <div className="flex flex-col items-center text-center flex-grow">
          <div className={`p-3 rounded-full ${isPremium ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'} mb-3`}>
            {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' })}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto pt-4">
          <Button 
            variant={isPremium ? "default" : "outline"} 
            className="w-full" 
            disabled={!isPremium}
            onClick={onClick}
          >
            {isPremium ? 'Access Feature' : 'Premium Only'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};