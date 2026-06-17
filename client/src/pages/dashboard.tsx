import {  useState, useMemo } from "react";
import {  useQuery, useMutation } from "@tanstack/react-query";
import { Opportunity, InsertOpportunity, isHighTier } from '@shared/schema';
import {  Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {  useAuth } from "@/hooks/use-auth";
import {  Button } from "@/components/ui/button";
import {  LogOut, Plus, TrendingUp, Target, Clock, RefreshCw, Edit2, Loader2, Users, Shield, CreditCard, Menu } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import {  Link } from "wouter";
import {  Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {  apiRequest, queryClient } from "@/lib/queryClient";
import {  useToast } from "@/hooks/use-toast";
import OpportunityCard from "@/components/opportunity-card";
import TrialBanner from "@/components/trial-banner";
import {  OpportunityFormDialog } from "@/components/opportunity-form";
import {  Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {  Badge } from "@/components/ui/badge";
import {  SearchBar } from "@/components/search-bar";
import {  ProfileEditor } from "@/components/profile-editor";
import {  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import MapView from "@/components/map-view";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {  useTranslation } from 'react-i18next';
import {  formatCurrency } from '@/lib/currency';
import {  useEffect } from "react";
import {  FundingOpportunities } from "@/components/funding-opportunities";
import {  KnowledgeGraph } from "@/components/business-intelligence/knowledge-graph";
import {  PursueOpportunityDialog } from "@/components/pursue-opportunity-dialog";
import {  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import SubscriptionPlans from "@/components/subscription-plans";
import LegalGuidance from "@/components/legal-guidance";
// Direct import with full path to avoid path resolution issues
import {  PremiumFeaturesCard } from "../components/premium-features-card";
import {  AppNavigation } from "@/components/app-navigation";
import { MobileNavSheet } from "@/components/mobile-nav";
import {  FinnhubTicker, FinnhubNewsWidget } from "@/components/finnhub-ticker";
import {  NotificationBell } from "@/components/notifications/notification-bell";
import {  GlobalSearch } from "@/components/search/global-search";

// Update the utility functions at the top of the file

function getRelatedTerms(skill: string): string[] {
  const relatedTermsMap: { [key: string]: string[] } = {
    'web': ['javascript', 'html', 'css', 'react', 'frontend', 'backend', 'fullstack', 'web development', 'web app', 'website', 'web developer'],
    'javascript': ['react', 'node', 'typescript', 'frontend', 'web', 'js', 'development', 'programming', 'coding'],
    'developer': ['programming', 'coding', 'software', 'development', 'engineering', 'tech', 'web developer', 'application developer'],
    'frontend': ['react', 'vue', 'angular', 'ui', 'ux', 'web', 'design', 'html', 'css', 'javascript'],
    'backend': ['api', 'server', 'database', 'node', 'web', 'cloud', 'python', 'java', 'php'],
    'fullstack': ['frontend', 'backend', 'web', 'full-stack', 'development', 'javascript', 'database'],
    'design': ['ui', 'ux', 'web design', 'graphic', 'creative', 'interface', 'user experience'],
    'software': ['development', 'engineering', 'programming', 'tech', 'coding', 'applications'],
    'marketing': ['digital marketing', 'social media', 'content', 'seo', 'analytics', 'growth'],
    'business': ['development', 'sales', 'strategy', 'growth', 'management', 'operations'],
    'content': ['writing', 'marketing', 'social media', 'creation', 'digital', 'media'],
    'vr': ['virtual reality', 'ar', 'unity', 'unreal', '3d', 'modeling', 'animation'],
    'ar': ['augmented reality', 'vr', 'unity', 'unreal', '3d', 'modeling', 'animation']
  };

  const skillLower = skill.toLowerCase();
  let allRelatedTerms: string[] = [];

  // Direct matches
  for (const [key, terms] of Object.entries(relatedTermsMap)) {
    if (skillLower.includes(key) || terms.some(term => skillLower.includes(term))) {
      allRelatedTerms.push(...terms);
    }
  }

  // Check for composite skills (e.g., "web developer" -> check both "web" and "developer")
  const skillParts = skillLower.split(/\s+/);
  for (const part of skillParts) {
    for (const [key, terms] of Object.entries(relatedTermsMap)) {
      if (part === key || terms.includes(part)) {
        allRelatedTerms.push(...terms);
      }
    }
  }

  return Array.from(new Set(allRelatedTerms));
}

function calculateRelevanceScore(opportunity: Opportunity, userSkills: string[], userAssets: string[]): number {
  const descriptionLower = opportunity.description.toLowerCase();
  const nameLower = opportunity.name.toLowerCase();
  const titleWords = nameLower.split(/\s+/);

  let skillScore = 0;
  let assetScore = 0;

  // Process user skills
  userSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    const skillParts = skillLower.split(/\s+/);

    // Title matches
    if (nameLower.includes(skillLower)) skillScore += 3;
    skillParts.forEach(part => {
      if (titleWords.includes(part)) skillScore += 1.5;
    });

    // Description matches
    if (descriptionLower.includes(skillLower)) skillScore += 2;

    // Related terms matching
    const relatedTerms = getRelatedTerms(skillLower);
    relatedTerms.forEach(term => {
      if (nameLower.includes(term)) skillScore += 1;
      if (descriptionLower.includes(term)) skillScore += 0.5;
    });
  });

  // Process user assets
  userAssets.forEach(asset => {
    const assetLower = asset.toLowerCase();
    if (nameLower.includes(assetLower)) assetScore += 2;
    if (descriptionLower.includes(assetLower)) assetScore += 1;
  });

  // Earnings factor (logarithmic scale to prevent high salaries from dominating)
  const earningsScore = Math.log10(opportunity.earnings) / 3;

  // Normalize scores
  const maxSkillScore = userSkills.length * (3 + 1.5 + 2 + 1.5);
  const maxAssetScore = userAssets.length * (2 + 1);
  const normalizedSkillScore = maxSkillScore > 0 ? skillScore / maxSkillScore : 0;
  const normalizedAssetScore = maxAssetScore > 0 ? assetScore / maxAssetScore : 0;

  // Final weighted score
  return (normalizedSkillScore * 0.6) + (normalizedAssetScore * 0.2) + (earningsScore * 0.2);
}

// Rest of the dashboard.tsx file
const MATCH_THRESHOLD = 0.4; // Lowered threshold to show more matches

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isAdmin = user?.username === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  const [matchAlertMessage, setMatchAlertMessage] = useState("");
  // Add state for selected region
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  // Add state for selected country
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  // Add state for pursue opportunity dialog
  const [pursueDialogData, setPursueDialogData] = useState<any>(null);
  const [pursueDialogOpen, setPursueDialogOpen] = useState(false);

  const { data: opportunities = [], isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  // AUTHENTIC DATA: Enhanced recommendations query with dynamic country support
  const {
    data: recommendedOpportunities = [],
    isLoading: isLoadingRecommendations,
    error: recommendationsError
  } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities/recommended", user?.skills?.join(",") || "", selectedCountry || "Romania"],
    enabled: !isAdmin && !!user && !!user.skills && user.skills.length > 0,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (updated from deprecated cacheTime)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3
  });

  // Add logging for query enablement with proper typing
  useEffect(() => {
    console.log("📊 Recommendations Query Status:", {
      isAdmin,
      hasUser: !!user,
      userSkillsLength: user?.skills?.length || 0,
      userSkills: user?.skills,
      selectedCountry: selectedCountry || "Romania",
      queryEnabled: !isAdmin && !!user && !!user.skills && user.skills.length > 0,
      isLoadingRecommendations,
      recommendationsLength: recommendedOpportunities.length,
      hasError: !!recommendationsError
    });
    
    if (recommendationsError) {
      console.error("❌ Failed to fetch authentic recommendations:", recommendationsError);
    }
    
    if (recommendedOpportunities.length > 0) {
      console.log("✅ AUTHENTIC RECOMMENDATIONS received:", recommendedOpportunities.length, "opportunities");
      console.log("🏛️ Top authentic opportunities:", recommendedOpportunities.slice(0, 3).map((o: Opportunity) => ({ 
        name: o.name, 
        matchScore: o.matchScore,
        location: o.location || 'Global',
        company: o.company || 'Various'
      })));
    }
  }, [isAdmin, user, selectedCountry, isLoadingRecommendations, recommendedOpportunities, recommendationsError]);

  // Change this effect to add more detailed logging with proper null checks
  useEffect(() => {
    if (recommendedOpportunities.length === 0 && user?.skills && user.skills.length > 0) {
      console.log("No recommendations found despite user having skills");
      console.log("User skills:", user.skills);
      console.log("User assets:", user.assets);
      console.log("Available opportunities:", opportunities);
      console.log("Recommendations Error:", recommendationsError);
    }
  }, [recommendedOpportunities, user?.skills, user?.assets, opportunities, recommendationsError]);

  const filterOpportunities = (opportunities: Opportunity[]) => {
    if (!user || isAdmin) return opportunities;

    let filtered = opportunities;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((opp) =>
        opp.name.toLowerCase().includes(searchLower) ||
        opp.description.toLowerCase().includes(searchLower) ||
        opp.status.toLowerCase().includes(searchLower)
      );
    }

    return filtered.map(opp => ({
      ...opp,
      relevanceScore: calculateRelevanceScore(opp, user.skills || [], user.assets || [])
    }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const totalPotentialEarnings = opportunities
    .filter((opp) => opp.status === "available")
    .reduce((sum, opp) => sum + opp.earnings, 0);

  const pursuedEarnings = opportunities
    .filter((opp) => opp.status === "pursued" && opp.userId === user?.id)
    .reduce((sum, opp) => sum + opp.earnings, 0);

  const filteredOpportunities = useMemo(() => filterOpportunities(opportunities),
    [opportunities, user?.skills, user?.assets, searchTerm]
  );

  const availableOpportunities = filteredOpportunities.filter(opp => opp.status === "available");
  const pursuedOpportunities = filteredOpportunities.filter(opp => opp.status === "pursued");

  const pursueMutation = useMutation({
    mutationFn: async ({ oppId, country }: { oppId: number; country?: string }) => {
      const res = await apiRequest("POST", `/api/opportunities/${oppId}/pursue`, { 
        country: country || selectedCountry || 'not specified' 
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to pursue opportunity");
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Show the enhanced pursue dialog with next steps
      setPursueDialogData(data);
      setPursueDialogOpen(true);
      
      // Refresh opportunities list
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      
      // Show success toast
      toast({
        title: "Opportunity Pursued!",
        description: data.type === "funding_opportunity" 
          ? "Ready to apply for this funding program" 
          : "Opportunity marked as pursued - check your next steps",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to pursue opportunity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unpursueMutation = useMutation({
    mutationFn: async (oppId: number) => {
      const res = await apiRequest("POST", `/api/opportunities/${oppId}/unpursue`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success!",
        description: "Opportunity removed from your pursued list.",
      });
    },
  });


  const createOpportunityMutation = useMutation({
    mutationFn: async (data: InsertOpportunity) => {
      if (!data.name || !data.description || !data.earnings) {
        throw new Error("Please fill in all required fields");
      }

      const requestData = {
        ...data,
        status: "available",
        source: "platform",
        clientSubmitted: false,
      };

      const res = await apiRequest("POST", "/api/opportunities", requestData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create opportunity");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setIsCreating(false);
      toast({
        title: "Success",
        description: "Opportunity created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create opportunity",
        variant: "destructive",
      });
    },
  });

  const handleCreateOpportunity = async (data: InsertOpportunity) => {
    try {
      await createOpportunityMutation.mutateAsync(data);
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  // Add handler for map selection
  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
  };

  return (
    <div className="min-h-screen bg-background">
      {!isAdmin && <TrialBanner />}
      
      {/* Navigation Menu */}
      <div className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-2 flex items-center gap-3">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover-elevate active-elevate-2 px-2 py-1 rounded-md" data-testid="link-brand-home">
              <img src={wealthSyncLogo} alt="WealthSync AI" className="h-8 w-8 object-contain" />
              <span className="font-bold text-sm hidden sm:inline">WealthSync AI</span>
            </div>
          </Link>
          {/* Desktop nav */}
          <div className="flex-1 hidden md:block overflow-x-auto">
            <AppNavigation />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile hamburger */}
            <MobileNavSheet />
            <GlobalSearch />
            <div className="hidden md:block">
              <LanguageSwitcher compact />
            </div>
            {(user as any)?.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="h-9" data-testid="link-admin">
                  <Shield className="h-4 w-4 mr-1" /> Admin
                </Button>
              </Link>
            )}
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="h-9 hidden sm:inline-flex" data-testid="link-billing">
                <CreditCard className="h-4 w-4 mr-1" /> Billing
              </Button>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <span><NotificationBell /></span>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full" data-testid="button-profile-avatar">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any)?.avatarUrl} alt={user?.name} />
                      <AvatarFallback className="text-xs">{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Profile & settings</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">{t('welcome', { name: user?.name })}</h1>
            <p className="text-muted-foreground">
              {isAdmin ? t('adminDashboardDescription') : t('userDashboardDescription')}
            </p>
            {!isAdmin && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">{t('skills')}:</span>
                  <div className="flex flex-wrap gap-2">
                    {user?.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    )) || (
                      <span className="text-sm text-muted-foreground">No skills added yet</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <span className="text-sm text-muted-foreground">{t('assets')}:</span>
                  <div className="flex flex-wrap gap-2">
                    {user?.assets?.map((asset, index) => (
                      <Badge key={index} variant="outline">
                        {asset}
                      </Badge>
                    )) || (
                      <span className="text-sm text-muted-foreground">No assets added yet</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileEditorOpen(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('editProfile')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/smart-contracts'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Contracts
                  </Button>
                  {isHighTier(user?.subscriptionTier) && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.location.href = '/lead-generation'}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Lead Generation
                    </Button>
                  )}
                </div>
                <ProfileEditor
                  open={profileEditorOpen}
                  onOpenChange={setProfileEditorOpen}
                />
              </div>
            )}
          </div>
          <div className="w-full sm:w-auto flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </Button>

            {!isAdmin && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant={user?.subscriptionTier === 'free' ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[640px]">
                  <SheetHeader>
                    <SheetTitle>Subscription Plans</SheetTitle>
                    <SheetDescription>
                      Choose the plan that best fits your needs
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6">
                    <SubscriptionPlans />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {isAdmin ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('platformOverview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <h3 className="text-lg font-medium">{t('totalOpportunities')}</h3>
                    <p className="text-3xl font-bold">{opportunities.length}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{t('availableOpportunities')}</h3>
                    <p className="text-3xl font-bold">
                      {availableOpportunities.length}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{t('totalPotentialValue')}</h3>
                    <p className="text-3xl font-bold">{formatCurrency(totalPotentialEarnings)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/sync-jobs");
                      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
                      toast({
                        title: "Success",
                        description: "Job sync completed successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to sync jobs",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('syncExternalJobs')}
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-semibold">{t('allOpportunities')}</h2>
                <Button
                  onClick={() => setIsCreating(true)}
                  disabled={createOpportunityMutation.isPending}
                >
                  {createOpportunityMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {t('createOpportunity')}
                </Button>
              </div>
              <OpportunityFormDialog
                open={isCreating}
                onOpenChange={setIsCreating}
                onSubmit={handleCreateOpportunity}
              />
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('searchOpportunitiesPlaceholder')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onPursue={() => pursueMutation.mutate({ oppId: opportunity.id, country: selectedCountry || undefined })}
                  isPursuing={pursueMutation.isPending}
                  isAdmin={true}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {t('availableEarnings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalPotentialEarnings)}</span>
                  <span className="text-muted-foreground ml-2">{t('potential')}</span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    {t('pursuedEarnings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl sm:text-4xl font-bold">{formatCurrency(pursuedEarnings)}</span>
                  <span className="text-muted-foreground ml-2">{t('inProgress')}</span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    {t('activePursuits')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl sm:text-4xl font-bold">{pursuedOpportunities.length}</span>
                  <span className="text-muted-foreground ml-2">{t('opportunities')}</span>
                </CardContent>
              </Card>
            </div>

            {/* Live Market Data - Finnhub */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <FinnhubTicker symbols={['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']} />
              <FinnhubNewsWidget />
            </div>

            {/* Map View - Country-Specific Funding Only */}
            <div className="mb-8">
              <MapView
                opportunities={[]} // No fake opportunities - only country-specific funding
                onPursue={(id) => pursueMutation.mutate({ oppId: id, country: selectedCountry || undefined })}
                isPursuing={pursueMutation.isPending}
                onRegionSelect={handleRegionSelect}
                onCountrySelect={setSelectedCountry}
              />
            </div>

            {!isAdmin && (
              <div className="mb-8">
                <FundingOpportunities
                  onOpenProfileEditor={() => setProfileEditorOpen(true)}
                  selectedCountry={selectedCountry}
                  onCountrySelect={setSelectedCountry}
                />
              </div>
            )}

            {/* Premium features card is now placed after the stats cards */}

            {!isAdmin && (
              <div className="mb-8">
                {isLoadingRecommendations ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : recommendedOpportunities && recommendedOpportunities.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="mr-2 h-5 w-5" />
                        {t('aiRecommendedOpportunities')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {recommendedOpportunities.map((opportunity) => (
                          <OpportunityCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            onPursue={() => pursueMutation.mutate({ oppId: opportunity.id, country: selectedCountry || undefined })}
                            isPursuing={pursueMutation.isPending}
                            isAdmin={false}
                            isRecommended
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-muted">
                    <CardHeader>
                      <CardTitle className="flex items-center text-muted-foreground">
                        <Target className="mr-2 h-5 w-5" />
                        {t('noAiRecommendationsYet')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {t('updateSkillsMessage')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Tabs defaultValue="available" className="mb-8">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="available">{t('available', { count: availableOpportunities.length })}</TabsTrigger>
                <TabsTrigger value="pursued">{t('pursued', { count: pursuedOpportunities.length })}</TabsTrigger>
              </TabsList>
              <TabsContent value="available" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onPursue={() => pursueMutation.mutate({ oppId: opportunity.id, country: selectedCountry || undefined })}
                      isPursuing={pursueMutation.isPending}
                      isAdmin={false}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="pursued" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pursuedOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onPursue={() => unpursueMutation.mutate(opportunity.id)}
                      isPursuing={unpursueMutation.isPending}
                      isAdmin={false}
                      showUnpursueButton={true}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

          </>
        )}
      </div>
      {!isAdmin && (
        <AlertDialog open={showMatchAlert} onOpenChange={setShowMatchAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('aiAgentFeedback')}</AlertDialogTitle>
              <AlertDialogDescription>{matchAlertMessage}</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Enhanced Pursue Opportunity Dialog */}
      <PursueOpportunityDialog
        isOpen={pursueDialogOpen}
        onClose={() => {
          setPursueDialogOpen(false);
          setPursueDialogData(null);
        }}
        opportunityData={pursueDialogData}
      />
    </div>
  );
}