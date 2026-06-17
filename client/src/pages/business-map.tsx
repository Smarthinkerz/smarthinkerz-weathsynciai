import { isHighTier } from '@shared/schema';
import { useState } from 'react';
import { InteractiveBusinessMap } from '@/components/business-map/interactive-business-map';
import { EconomicDashboardTab } from '@/components/business-map/economic-dashboard-tab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Globe, Info, PanelLeft, Search, BarChart2, Building2, CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

interface DirectoryCompany {
  id: number;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  headquarters?: string;
  industries?: string[];
  foundedYear?: number;
  employeeCount?: number;
  verificationStatus: string;
  subscriptionTier: string;
}

const INDUSTRIES = [
  "All Industries", "Technology", "Finance", "Healthcare", "Education",
  "Manufacturing", "Retail", "Consulting", "Real Estate", "Legal",
  "Marketing", "Logistics", "Energy", "Agriculture", "Media",
];

function CompanyCard({ company }: { company: DirectoryCompany }) {
  const isVerified = company.verificationStatus === 'verified';
  const isPremium = isHighTier(company.subscriptionTier);
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
            {company.logo
              ? <img src={company.logo} alt={company.name} className="h-12 w-12 object-cover rounded-lg" />
              : company.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{company.name}</h3>
              {isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
              {isPremium && <Badge className="text-xs py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-300">Premium</Badge>}
            </div>
            {company.headquarters && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{company.headquarters}
              </p>
            )}
            {company.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{company.description}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {(company.industries || []).slice(0, 2).map(ind => (
                <span key={ind} className="text-xs bg-muted px-1.5 py-0.5 rounded">{ind}</span>
              ))}
              {(company.industries || []).length > 2 && (
                <span className="text-xs text-muted-foreground">+{(company.industries || []).length - 2}</span>
              )}
            </div>
          </div>
          <Link href={`/companies/${company.id}`}>
            <Button size="sm" variant="ghost" className="flex-shrink-0">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessMapPage() {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("Technology");
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryIndustry, setDirectoryIndustry] = useState('All Industries');
  const [directoryCountry, setDirectoryCountry] = useState('');

  const isPremiumUser = user?.isPremium || isHighTier(user?.subscriptionTier);

  const handleCountrySelection = (country: string | null) => setSelectedCountry(country);

  // Build query params for directory
  const directoryParams = new URLSearchParams();
  if (directorySearch) directoryParams.set('search', directorySearch);
  if (directoryIndustry && directoryIndustry !== 'All Industries') directoryParams.set('industry', directoryIndustry);
  if (directoryCountry) directoryParams.set('country', directoryCountry);
  const directoryUrl = `/api/companies/directory${directoryParams.toString() ? '?' + directoryParams.toString() : ''}`;

  const { data: companies = [], isLoading: loadingCompanies } = useQuery<DirectoryCompany[]>({
    queryKey: [directoryUrl],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const verifiedCount = companies.filter(c => c.verificationStatus === 'verified').length;
  const premiumCount = companies.filter(c => isHighTier(c.subscriptionTier)).length;

  return (
    <div className="container px-2 sm:px-4 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Interactive Global Business Map</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore business opportunities, companies, and funding sources around the world.
          </p>

          {selectedCountry && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertTitle>Country Selected: {selectedCountry}</AlertTitle>
              <AlertDescription>
                View detailed economic data and business opportunities in the tabs below.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Tabs defaultValue="map">
          <TabsList className="mb-4 w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="map" className="flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3">
              <Globe className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-xs sm:text-sm">Global Map</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3">
              <Building2 className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-xs sm:text-sm">Companies</span>
            </TabsTrigger>
            <TabsTrigger value="economics" className="flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3">
              <BarChart2 className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-xs sm:text-sm">Economic Data</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3">
              <Info className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-xs sm:text-sm">About</span>
            </TabsTrigger>
          </TabsList>

          {/* Global Map Tab */}
          <TabsContent value="map" className="space-y-4">
            {/* Industry filter for the map */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" /> Industry focus:
              </div>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.filter(i => i !== 'All Industries').map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCountry && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{selectedCountry}
                  <button className="ml-1 hover:text-destructive" onClick={() => setSelectedCountry(null)}>✕</button>
                </Badge>
              )}
            </div>
            <div className="h-[60vh] sm:h-[70vh] lg:h-[80vh] w-full relative">
              <InteractiveBusinessMap
                isPremium={isPremiumUser}
                onCountrySelect={handleCountrySelection}
              />
            </div>
          </TabsContent>

          {/* Companies Directory Tab */}
          <TabsContent value="companies" className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{companies.length}</p>
                  <p className="text-xs text-muted-foreground">Total Listed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </CardContent>
              </Card>
              <Card className="hidden sm:block">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{premiumCount}</p>
                  <p className="text-xs text-muted-foreground">Premium</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={directoryIndustry} onValueChange={setDirectoryIndustry}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Filter by country..."
                value={directoryCountry}
                onChange={e => setDirectoryCountry(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>

            {/* Company grid */}
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Building2 className="h-10 w-10 animate-pulse text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Loading companies...</p>
                </div>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No companies found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map(company => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Economic Data Tab */}
          <TabsContent value="economics" className="space-y-4">
            <EconomicDashboardTab
              selectedCountry={selectedCountry}
              selectedIndustry={selectedIndustry || "Technology"}
              isPremium={isPremiumUser}
            />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About the Interactive Global Business Map</CardTitle>
                <CardDescription>Connect with opportunities, companies, and funding sources globally</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The interactive global business map provides a visual representation of companies, business opportunities,
                  and funding sources worldwide. This feature helps users discover potential business partners, investment
                  opportunities, and strategic locations relevant to their industry.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {[
                    { icon: MapPin, title: "Discover Opportunities", color: "text-primary", desc: "Find business opportunities, partnerships, and collaborations based on geographical locations that match your skills." },
                    { icon: Search, title: "Research Companies", color: "text-blue-600", desc: "Explore company profiles, their locations, and details to connect with potential clients or partners in your target regions." },
                    { icon: PanelLeft, title: "Access Funding", color: "text-green-600", desc: "Locate global funding sources, grants, venture capital firms, and investors actively funding projects in your industry." },
                    { icon: Building2, title: "Company Directory", color: "text-purple-600", desc: "Browse verified companies in the Companies tab, filter by industry or location, and view full public profiles." },
                  ].map(({ icon: Icon, title, color, desc }) => (
                    <Card key={title}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Icon className={`mr-2 h-5 w-5 ${color}`} />
                          {title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {!isPremiumUser && (
                  <Alert className="mt-6">
                    <AlertTitle>Upgrade to Premium</AlertTitle>
                    <AlertDescription>
                      As a premium user, you can add your own business locations to the global map, access advanced
                      filtering options, and get priority placement in search results.
                      <div className="mt-2">
                        <Button size="sm" asChild>
                          <Link href="/payment-verification">Upgrade Now</Link>
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
