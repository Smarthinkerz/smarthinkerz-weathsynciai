import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  TrendingUp,
  Building2,
  GraduationCap,
  DollarSign,
  Globe,
  ExternalLink,
  Calendar,
  Star
} from "lucide-react";

interface ResearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  source: string;
  relevanceScore?: number;
}

interface ResearchResponse {
  query: string;
  results: ResearchResult[];
  totalResults: number;
  searchTime: number;
}

export default function ResearchDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("market-news");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [investmentType, setInvestmentType] = useState("stocks");
  const [riskLevel, setRiskLevel] = useState("moderate");
  const [companyName, setCompanyName] = useState("");
  const [educationTopic, setEducationTopic] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Market News Research
  const { data: marketNews, isLoading: loadingMarketNews, refetch: refetchMarketNews } = useQuery({
    queryKey: ["/api/research/market-news", searchQuery, selectedTimeframe],
    enabled: false
  });

  // Investment Research
  const { data: investmentResearch, isLoading: loadingInvestmentResearch, refetch: refetchInvestmentResearch } = useQuery({
    queryKey: ["/api/research/investment", investmentType, riskLevel],
    enabled: false
  });

  // Economic Insights
  const { data: economicInsights, isLoading: loadingEconomicInsights, refetch: refetchEconomicInsights } = useQuery({
    queryKey: ["/api/research/economic-insights", selectedCountry],
    enabled: false
  });

  // Company Research
  const { data: companyResearch, isLoading: loadingCompanyResearch, refetch: refetchCompanyResearch } = useQuery({
    queryKey: ["/api/research/company", companyName],
    enabled: false
  });

  // Education Research
  const { data: educationResearch, isLoading: loadingEducationResearch, refetch: refetchEducationResearch } = useQuery({
    queryKey: ["/api/research/education", educationTopic],
    enabled: false
  });

  // Funding Research
  const { data: fundingResearch, isLoading: loadingFundingResearch, refetch: refetchFundingResearch } = useQuery({
    queryKey: ["/api/research/funding", businessType, selectedCountry],
    enabled: false
  });

  const handleMarketNewsSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a stock symbol or search term.",
        variant: "destructive",
      });
      return;
    }
    refetchMarketNews();
  };

  const handleInvestmentSearch = () => {
    refetchInvestmentResearch();
  };

  const handleEconomicInsightsSearch = () => {
    refetchEconomicInsights();
  };

  const handleCompanySearch = () => {
    if (!companyName.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a company name.",
        variant: "destructive",
      });
      return;
    }
    refetchCompanyResearch();
  };

  const handleEducationSearch = () => {
    if (!educationTopic.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a financial topic.",
        variant: "destructive",
      });
      return;
    }
    refetchEducationResearch();
  };

  const handleFundingSearch = () => {
    if (!businessType.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a business type.",
        variant: "destructive",
      });
      return;
    }
    refetchFundingResearch();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recent";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Recent";
    }
  };

  const ResultCard = ({ result }: { result: ResearchResult }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{result.title}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {result.source}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(result.publishedDate)}</span>
          {result.relevanceScore && (
            <>
              <Star className="w-4 h-4 ml-2" />
              <span>{Math.round(result.relevanceScore * 100)}% relevant</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3 line-clamp-3">{result.content}</p>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Read more <ExternalLink className="w-3 h-3" />
        </a>
      </CardContent>
    </Card>
  );

  const ResultsList = ({ data, isLoading }: { data?: ResearchResponse; isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!data || data.results.length === 0) {
      return (
        <Alert>
          <AlertDescription>
            No results found. Try adjusting your search parameters.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div>
        <div className="mb-4 text-sm text-gray-600">
          Found {data.totalResults} results for "{data.query}"
        </div>
        <div className="space-y-4">
          {data.results.map((result, index) => (
            <ResultCard key={index} result={result} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Dashboard</h1>
        <p className="text-gray-600">AI-powered financial research and market intelligence</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="market-news" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Market News
          </TabsTrigger>
          <TabsTrigger value="investment" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Investments
          </TabsTrigger>
          <TabsTrigger value="economic" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Economic
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="funding" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Funding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market-news" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market News & Analysis</CardTitle>
              <CardDescription>
                Get the latest market news and financial analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="market-symbol">Stock Symbol (Optional)</Label>
                  <Input
                    id="market-symbol"
                    placeholder="e.g., AAPL, TSLA"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Last Day</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleMarketNewsSearch} className="w-full">
                    Search Market News
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <ResultsList data={marketNews} isLoading={loadingMarketNews} />
        </TabsContent>

        <TabsContent value="investment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment Research</CardTitle>
              <CardDescription>
                Research investment opportunities based on your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="investment-type">Investment Type</Label>
                  <Select value={investmentType} onValueChange={setInvestmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="etf">ETFs</SelectItem>
                      <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="risk-level">Risk Level</Label>
                  <Select value={riskLevel} onValueChange={setRiskLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleInvestmentSearch} className="w-full">
                    Research Investments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <ResultsList data={investmentResearch} isLoading={loadingInvestmentResearch} />
        </TabsContent>

        <TabsContent value="economic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Economic Insights</CardTitle>
              <CardDescription>
                Get economic indicators and market trends by country
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="EU">European Union</SelectItem>
                      <SelectItem value="CN">China</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleEconomicInsightsSearch} className="w-full">
                    Get Economic Insights
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <ResultsList data={economicInsights} isLoading={loadingEconomicInsights} />
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Research</CardTitle>
              <CardDescription>
                Research company fundamentals and financial health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="e.g., Apple, Microsoft, Tesla"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCompanySearch} className="w-full">
                    Research Company
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <ResultsList data={companyResearch} isLoading={loadingCompanyResearch} />
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Education</CardTitle>
              <CardDescription>
                Learn about financial topics and investment strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="education-topic">Financial Topic</Label>
                  <Input
                    id="education-topic"
                    placeholder="e.g., retirement planning, budgeting, investing"
                    value={educationTopic}
                    onChange={(e) => setEducationTopic(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleEducationSearch} className="w-full">
                    Find Educational Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <ResultsList data={educationResearch} isLoading={loadingEducationResearch} />
        </TabsContent>

        <TabsContent value="funding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funding Opportunities</CardTitle>
              <CardDescription>
                Search for business funding, grants, and investment opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="business-type">Business Type</Label>
                  <Input
                    id="business-type"
                    placeholder="e.g., startup, small business, nonprofit"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="funding-country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFundingSearch} className="w-full">
                    Search Funding
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <ResultsList data={fundingResearch} isLoading={loadingFundingResearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}