import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Globe, TrendingUp, Building2, Loader2, FileText, ExternalLink, ArrowLeft, Download } from "lucide-react";
import { FinancialDisclaimer } from "@/components/integrity/disclaimers";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface DeepResearchResult {
  output: string;
  sources: Array<{
    url: string;
    title: string;
    relevance: string;
  }>;
  citations: Array<{
    text: string;
    source: string;
    startIndex: number;
    endIndex: number;
  }>;
  researchPath: Array<{
    type: 'web_search' | 'code_analysis' | 'data_synthesis';
    action: string;
    result: string;
  }>;
}

const COUNTRIES = [
  'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France', 'India', 'Italy', 'Brazil', 'Canada',
  'Russia', 'South Korea', 'Australia', 'Spain', 'Mexico', 'Indonesia', 'Netherlands', 'Turkey', 'Taiwan', 'Belgium',
  'Saudi Arabia', 'UAE', 'Oman', 'Qatar', 'Kuwait', 'Bahrain', 'Egypt', 'Nigeria', 'South Africa', 'Kenya',
  'Morocco', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Senegal', 'Botswana', 'Rwanda', 'Zambia', 'Zimbabwe',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Bolivia', 'Paraguay', 'Guyana',
  'Thailand', 'Singapore', 'Malaysia', 'Philippines', 'Vietnam', 'Bangladesh', 'Pakistan', 'Sri Lanka', 'Myanmar',
  'Cambodia', 'Nepal', 'Afghanistan', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Lebanon', 'Syria', 'Yemen',
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland', 'Poland', 'Czech Republic', 'Hungary', 'Slovakia', 'Slovenia',
  'Croatia', 'Serbia', 'Bulgaria', 'Romania', 'Greece', 'Portugal', 'Austria', 'Switzerland', 'Ireland', 'Luxembourg'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Real Estate', 'Transportation',
  'Education', 'Agriculture', 'Construction', 'Telecommunications', 'Media', 'Tourism', 'Automotive',
  'Aerospace', 'Biotechnology', 'Pharmaceuticals', 'Food & Beverage', 'Textiles', 'Mining', 'Logistics',
  'E-commerce', 'Gaming', 'Entertainment', 'Fashion', 'Insurance', 'Banking', 'Investment', 'Consulting'
];

export default function DeepResearchPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("market-analysis");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DeepResearchResult | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  // Check for company authentication
  const { data: companyUser } = useQuery({
    queryKey: ["/api/company"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Form states for different research types
  const [marketForm, setMarketForm] = useState({
    country: "",
    industry: "",
    focusAreas: [""]
  });
  
  const [fundingForm, setFundingForm] = useState({
    industry: "",
    country: "",
    companySize: "small",
    focusAreas: [""]
  });
  
  const [competitorForm, setCompetitorForm] = useState({
    industry: "",
    country: "",
    marketSegment: ""
  });
  
  const [economicForm, setEconomicForm] = useState({
    topic: "",
    region: "",
    timeframe: "5 years"
  });

  // Check if user has premium access (either individual premium or company user)
  const hasAccess = isHighTier(user?.subscriptionTier) || 
    user?.isPremium || 
    isHighTier(companyUser?.subscriptionTier) ||
    !!companyUser;

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" />
              Deep Research - Premium Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Deep Research uses advanced AI models to conduct comprehensive analysis by searching hundreds of sources.
              Available for Premium users and Company accounts.
            </p>
            <Badge variant="outline" className="bg-blue-50">Premium Access Required</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMarketResearch = async () => {
    if (!marketForm.country || !marketForm.industry) {
      toast({
        title: "Required Fields",
        description: "Please enter both country and industry",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/deep-research/market-analysis", {
        country: marketForm.country,
        industry: marketForm.industry,
        focusAreas: marketForm.focusAreas.filter(area => area.trim())
      });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Research Complete",
        description: "Deep market analysis has been generated"
      });
    } catch (error) {
      toast({
        title: "Research Failed",
        description: "Failed to conduct deep research analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundingResearch = async () => {
    if (!fundingForm.industry || !fundingForm.country) {
      toast({
        title: "Required Fields", 
        description: "Please enter both industry and country",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/deep-research/funding-opportunities", fundingForm);
      const data = await response.json();
      setResult(data);
      toast({
        title: "Funding Research Complete",
        description: "Comprehensive funding analysis has been generated"
      });
    } catch (error) {
      toast({
        title: "Research Failed",
        description: "Failed to research funding opportunities",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompetitorResearch = async () => {
    if (!competitorForm.industry || !competitorForm.country) {
      toast({
        title: "Required Fields",
        description: "Please enter both industry and country", 
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/deep-research/competitor-analysis", competitorForm);
      const data = await response.json();
      setResult(data);
      toast({
        title: "Competitor Analysis Complete",
        description: "Deep competitor research has been generated"
      });
    } catch (error) {
      toast({
        title: "Research Failed",
        description: "Failed to analyze competitor landscape",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEconomicResearch = async () => {
    if (!economicForm.topic || !economicForm.region) {
      toast({
        title: "Required Fields",
        description: "Please enter both topic and region",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/deep-research/economic-impact", economicForm);
      const data = await response.json();
      setResult(data);
      toast({
        title: "Economic Analysis Complete",
        description: "Deep economic impact research has been generated"
      });
    } catch (error) {
      toast({
        title: "Research Failed",
        description: "Failed to analyze economic impact",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFocusArea = (form: any, setForm: any) => {
    setForm({ ...form, focusAreas: [...form.focusAreas, ""] });
  };

  const updateFocusArea = (index: number, value: string, form: any, setForm: any) => {
    const updated = [...form.focusAreas];
    updated[index] = value;
    setForm({ ...form, focusAreas: updated });
  };

  const removeFocusArea = (index: number, form: any, setForm: any) => {
    const updated = form.focusAreas.filter((_: any, i: number) => i !== index);
    setForm({ ...form, focusAreas: updated });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-600" />
            Deep Research
          </h1>
          {(user || companyUser) && (
            <Button variant="outline" size="sm" asChild>
              <Link href={companyUser ? "/company-dashboard" : "/"}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          )}
        </div>
        <p className="text-gray-600">
          Comprehensive AI-powered research using hundreds of sources for market analysis, funding opportunities, and competitive intelligence.
        </p>
        <Badge className="mt-2 bg-blue-100 text-blue-800">Premium Feature</Badge>
      </div>

      <FinancialDisclaimer className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto mb-6">
              <TabsTrigger value="market-analysis" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Market
              </TabsTrigger>
              <TabsTrigger value="funding" className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Funding
              </TabsTrigger>
              <TabsTrigger value="competitor" className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Competitors
              </TabsTrigger>
              <TabsTrigger value="economic" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Economic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="market-analysis">
              <Card>
                <CardHeader>
                  <CardTitle>Market Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={marketForm.country} onValueChange={(value) => setMarketForm({ ...marketForm, country: value })}>
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={marketForm.industry} onValueChange={(value) => setMarketForm({ ...marketForm, industry: value })}>
                        <SelectTrigger id="industry">
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Focus Areas (Optional)</Label>
                    {marketForm.focusAreas.map((area, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <Input
                          value={area}
                          onChange={(e) => updateFocusArea(index, e.target.value, marketForm, setMarketForm)}
                          placeholder="e.g. AI adoption, startup ecosystem"
                        />
                        {marketForm.focusAreas.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFocusArea(index, marketForm, setMarketForm)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFocusArea(marketForm, setMarketForm)}
                      className="mt-2"
                    >
                      Add Focus Area
                    </Button>
                  </div>

                  <Button 
                    onClick={handleMarketResearch} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Conducting Deep Research...
                      </>
                    ) : (
                      "Start Market Analysis"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funding">
              <Card>
                <CardHeader>
                  <CardTitle>Funding Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="funding-industry">Industry</Label>
                      <Input
                        id="funding-industry"
                        value={fundingForm.industry}
                        onChange={(e) => setFundingForm({ ...fundingForm, industry: e.target.value })}
                        placeholder="e.g. technology"
                      />
                    </div>
                    <div>
                      <Label htmlFor="funding-country">Country</Label>
                      <Input
                        id="funding-country"
                        value={fundingForm.country}
                        onChange={(e) => setFundingForm({ ...fundingForm, country: e.target.value })}
                        placeholder="e.g. United Arab Emirates"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company-size">Company Size</Label>
                    <Select value={fundingForm.companySize} onValueChange={(value) => setFundingForm({ ...fundingForm, companySize: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="small">Small Business</SelectItem>
                        <SelectItem value="medium">Medium Enterprise</SelectItem>
                        <SelectItem value="large">Large Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleFundingResearch} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Researching Funding...
                      </>
                    ) : (
                      "Research Funding Opportunities"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitor">
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="comp-industry">Industry</Label>
                      <Input
                        id="comp-industry"
                        value={competitorForm.industry}
                        onChange={(e) => setCompetitorForm({ ...competitorForm, industry: e.target.value })}
                        placeholder="e.g. fintech"
                      />
                    </div>
                    <div>
                      <Label htmlFor="comp-country">Country</Label>
                      <Input
                        id="comp-country"
                        value={competitorForm.country}
                        onChange={(e) => setCompetitorForm({ ...competitorForm, country: e.target.value })}
                        placeholder="e.g. Singapore"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="market-segment">Market Segment (Optional)</Label>
                    <Input
                      id="market-segment"
                      value={competitorForm.marketSegment}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, marketSegment: e.target.value })}
                      placeholder="e.g. digital banking, payments"
                    />
                  </div>

                  <Button 
                    onClick={handleCompetitorResearch} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Competitors...
                      </>
                    ) : (
                      "Analyze Competitor Landscape"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="economic">
              <Card>
                <CardHeader>
                  <CardTitle>Economic Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="topic">Research Topic</Label>
                    <Input
                      id="topic"
                      value={economicForm.topic}
                      onChange={(e) => setEconomicForm({ ...economicForm, topic: e.target.value })}
                      placeholder="e.g. AI adoption in manufacturing"
                    />
                  </div>

                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={economicForm.region}
                      onChange={(e) => setEconomicForm({ ...economicForm, region: e.target.value })}
                      placeholder="e.g. Middle East, Europe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeframe">Analysis Timeframe</Label>
                    <Select value={economicForm.timeframe} onValueChange={(value) => setEconomicForm({ ...economicForm, timeframe: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 year">1 Year</SelectItem>
                        <SelectItem value="3 years">3 Years</SelectItem>
                        <SelectItem value="5 years">5 Years</SelectItem>
                        <SelectItem value="10 years">10 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleEconomicResearch} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Economic Impact...
                      </>
                    ) : (
                      "Analyze Economic Impact"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle>Research Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">
                        {showFullReport ? "Complete Research Report" : "Executive Summary"}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullReport(!showFullReport)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {showFullReport ? "Show Summary" : "View Full Report"}
                      </Button>
                    </div>
                    <div className={`text-sm text-gray-600 ${showFullReport ? 'max-h-96' : 'max-h-60'} overflow-y-auto border rounded p-4 bg-gray-50`}>
                      {showFullReport ? (
                        // Show complete report
                        result.output.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 leading-relaxed">{line}</p>
                        ))
                      ) : (
                        // Show only first 10 lines as summary
                        result.output.split('\n').slice(0, 10).map((line, i) => (
                          <p key={i} className="mb-1">{line}</p>
                        ))
                      )}
                    </div>
                    {!showFullReport && (
                      <p className="text-xs text-gray-500 mt-2">
                        Click "View Full Report" to see the complete detailed analysis
                      </p>
                    )}
                  </div>

                  {result.sources && result.sources.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Sources ({result.sources.length})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {result.sources.slice(0, 5).map((source, i) => (
                          <div key={i} className="text-xs border rounded p-2">
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {source.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Report length: {result.output.split(' ').length} words
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const blob = new Blob([result.output], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `deep-research-report-${Date.now()}.txt`;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Select a research type and fill in the required information to start your deep research analysis.
                  The AI will search hundreds of sources to provide comprehensive insights.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}