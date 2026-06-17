import { isHighTier } from '@shared/schema';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, TrendingUp, Building, DollarSign, Globe, Loader2, ChevronDown, ChevronUp, ArrowLeft, Download, Save } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

interface DeepResearchPanelProps {
  selectedCountry: string;
  industry: string;
  isPremium: boolean;
  onCountryChange?: (country: string) => void;
  onIndustryChange?: (industry: string) => void;
}

interface ResearchResult {
  type: 'market-analysis' | 'funding-opportunities' | 'competitor-analysis' | 'economic-impact';
  title: string;
  summary: string;
  keyInsights: string[];
  confidence: number;
  methodology: string[];
  sources: string[];
  data?: any;
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

export function DeepResearchPanel({ selectedCountry: initialCountry, industry: initialIndustry, isPremium, onCountryChange, onIndustryChange }: DeepResearchPanelProps) {
  const [activeTab, setActiveTab] = useState('market-analysis');
  const [researchResults, setResearchResults] = useState<Record<string, ResearchResult>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [industry, setIndustry] = useState(initialIndustry);
  const [customCountry, setCustomCountry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomCountry, setShowCustomCountry] = useState(false);
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [showFullReport, setShowFullReport] = useState<Record<string, boolean>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [saveDialogData, setSaveDialogData] = useState<ResearchResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check for company authentication
  const { data: companyUser, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["/api/company"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Debug logging
  console.log('Deep Research Access Check:', {
    isPremium,
    userPremium: user?.isPremium,
    userTier: user?.subscriptionTier,
    companyUser: companyUser,
    companyPremium: companyUser?.isPremium,
    isLoadingCompany
  });

  // Enhanced premium access check: individual users OR companies
  const hasDeepResearchAccess = isPremium || 
    user?.isPremium || 
    isHighTier(user?.subscriptionTier) || 
    companyUser?.isPremium ||
    isHighTier(companyUser?.subscriptionTier) ||
    !!companyUser; // Companies get automatic access

  const handleCountryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCountry(true);
    } else {
      setSelectedCountry(value);
      setShowCustomCountry(false);
      onCountryChange?.(value);
    }
  };

  const handleIndustryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomIndustry(true);
    } else {
      setIndustry(value);
      setShowCustomIndustry(false);
      onIndustryChange?.(value);
    }
  };

  const handleCustomCountrySubmit = () => {
    if (customCountry.trim()) {
      setSelectedCountry(customCountry.trim());
      setShowCustomCountry(false);
      onCountryChange?.(customCountry.trim());
    }
  };

  const handleCustomIndustrySubmit = () => {
    if (customIndustry.trim()) {
      setIndustry(customIndustry.trim());
      setShowCustomIndustry(false);
      onIndustryChange?.(customIndustry.trim());
    }
  };

  // Market Analysis Deep Research
  const marketAnalysisMutation = useMutation({
    mutationFn: async () => {
      console.log('=== MARKET ANALYSIS MUTATION ===');
      console.log('Industry prop:', industry);
      console.log('Selected Country:', selectedCountry);
      console.log('Initial industry prop:', initialIndustry);
      
      const effectiveIndustry = industry || initialIndustry || 'Technology';
      console.log('Effective industry to use:', effectiveIndustry);
      
      const response = await apiRequest('POST', '/api/deep-research/market-analysis', {
        country: selectedCountry,
        industry: effectiveIndustry,
        focusAreas: ['market_size', 'growth_trends', 'competitive_landscape']
      });
      return response.json();
    },
    onSuccess: (data) => {
      const marketResult = {
        type: 'market-analysis' as const,
        title: `${industry} Market Analysis - ${selectedCountry}`,
        summary: data.summary || data.output?.substring(0, 200) + '...' || 'Comprehensive market analysis completed',
        keyInsights: data.keyInsights || (data.output ? ['Market analysis completed with comprehensive insights'] : []),
        confidence: data.confidence || 85,
        methodology: data.methodology || ['Deep research analysis', 'Market data synthesis'],
        sources: data.sources || ['Research databases', 'Market reports'],
        data: data
      };
      
      console.log('Storing market analysis result:', marketResult);
      console.log('Full data received:', data);
      
      setResearchResults(prev => {
        const newResults = {
          ...prev,
          'market-analysis': marketResult
        };
        console.log('=== RESEARCH RESULTS UPDATED ===');
        console.log('Previous results:', prev);
        console.log('New results:', newResults);
        console.log('Market analysis stored:', !!newResults['market-analysis']);
        
        // Force a re-render check
        setTimeout(() => {
          console.log('=== POST-UPDATE STATE CHECK ===');
          console.log('Research results keys:', Object.keys(newResults));
        }, 100);
        
        return newResults;
      });
      toast({
        title: "Market Analysis Complete",
        description: "Deep research analysis generated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research Failed", 
        description: error.message || "Failed to generate market analysis",
        variant: "destructive"
      });
    }
  });

  // Funding Opportunities Deep Research
  const fundingOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/deep-research/funding-opportunities', {
        industry: industry,
        country: selectedCountry,
        companySize: 'medium',
        focusAreas: ['grants', 'venture_capital', 'government_funding']
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResearchResults(prev => ({
        ...prev,
        'funding-opportunities': {
          type: 'funding-opportunities',
          title: `Funding Opportunities - ${selectedCountry}`,
          summary: data.summary || 'Funding opportunities research completed',
          keyInsights: data.keyInsights || [],
          confidence: data.confidence || 80,
          methodology: data.methodology || [],
          sources: data.sources || [],
          data: data
        }
      }));
      toast({
        title: "Funding Research Complete",
        description: "Found relevant funding opportunities"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research Failed", 
        description: error.message || "Failed to research funding opportunities",
        variant: "destructive"
      });
    }
  });

  // Competitor Analysis Deep Research  
  const competitorAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/deep-research/competitor-analysis', {
        industry: industry,
        country: selectedCountry,
        marketSegment: 'enterprise'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResearchResults(prev => ({
        ...prev,
        'competitor-analysis': {
          type: 'competitor-analysis',
          title: `Competitor Intelligence - ${selectedCountry}`,
          summary: data.summary || 'Competitor landscape analysis completed',
          keyInsights: data.keyInsights || [],
          confidence: data.confidence || 82,
          methodology: data.methodology || [],
          sources: data.sources || [],
          data: data
        }
      }));
      toast({
        title: "Competitor Analysis Complete",
        description: "Market intelligence research generated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research Failed", 
        description: error.message || "Failed to analyze competitor landscape",
        variant: "destructive"
      });
    }
  });

  // Economic Impact Analysis Deep Research
  const economicImpactMutation = useMutation({
    mutationFn: async () => {
      console.log('=== ECONOMIC IMPACT MUTATION ===');
      console.log('Industry:', industry);
      console.log('Selected Country:', selectedCountry);
      
      const effectiveIndustry = industry || initialIndustry || 'Technology';
      const topic = effectiveIndustry ? `${effectiveIndustry} sector development` : 'Economic development';
      console.log('Effective industry for economic impact:', effectiveIndustry);
      console.log('Topic to send:', topic);
      
      const response = await apiRequest('POST', '/api/deep-research/economic-impact', {
        topic: topic,
        region: selectedCountry,
        timeframe: '5 years'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResearchResults(prev => ({
        ...prev,
        'economic-impact': {
          type: 'economic-impact',
          title: `Economic Impact Analysis - ${selectedCountry}`,
          summary: data.summary || 'Economic impact analysis completed',
          keyInsights: data.keyInsights || [],
          confidence: data.confidence || 78,
          methodology: data.methodology || [],
          sources: data.sources || [],
          data: data
        }
      }));
      toast({
        title: "Economic Analysis Complete",
        description: "Impact assessment research generated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research Failed", 
        description: error.message || "Failed to analyze economic impact",
        variant: "destructive"
      });
    }
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle tab switching with save dialog
  const handleTabChange = (newTab: string) => {
    console.log('=== TAB CHANGE TRIGGERED ===');
    console.log('Current tab:', activeTab);
    console.log('New tab:', newTab);
    console.log('Research results:', researchResults);
    console.log('Current result exists:', !!researchResults[activeTab]);
    
    const currentResult = researchResults[activeTab];
    
    // Force show save dialog if there's ANY research data and we're switching tabs
    if (currentResult && newTab !== activeTab) {
      console.log('=== SHOWING SAVE DIALOG ===');
      console.log('Save dialog data:', currentResult);
      setSaveDialogData(currentResult);
      setPendingTab(newTab);
      setShowSaveDialog(true);
      return; // Don't change tab yet
    }
    
    console.log('=== SWITCHING TAB DIRECTLY ===');
    setActiveTab(newTab);
  };

  // Download functionality
  const downloadReport = (result: ResearchResult) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
    const filename = `${result.type}_${selectedCountry}_${industry}_${timestamp}.txt`;
    
    const content = `
${result.title}
Generated: ${new Date().toLocaleString()}
Country: ${selectedCountry}
Industry: ${industry}
Confidence: ${result.confidence}%

EXECUTIVE SUMMARY
${result.summary}

KEY INSIGHTS
${result.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

METHODOLOGY
${result.methodology.map((method, i) => `${i + 1}. ${method}`).join('\n')}

SOURCES
${result.sources.map((source, i) => `${i + 1}. ${typeof source === 'string' ? source : source.title || 'Research Source'}`).join('\n')}

${result.data?.output || 'Full analysis data available in the application.'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: `${filename} saved successfully`
    });
  };

  // Handle save dialog actions
  const handleSaveAndContinue = () => {
    if (saveDialogData) {
      downloadReport(saveDialogData);
    }
    setShowSaveDialog(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setSaveDialogData(null);
  };

  const handleContinueWithoutSaving = () => {
    setShowSaveDialog(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setSaveDialogData(null);
  };

  const renderResearchResult = (result: ResearchResult) => {
    const isExpanded = expandedSections[result.type];
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{result.title}</CardTitle>
              <CardDescription className="mt-1">{result.summary}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={result.confidence > 80 ? "default" : "secondary"}>
                {result.confidence}% confidence
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport(result)}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(result.type)}
            className="w-full justify-between mt-2"
          >
            <span>View Detailed Analysis</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        
        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              {/* Key Insights */}
              {result.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Key Insights</h4>
                  <ul className="space-y-1">
                    {result.keyInsights.map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Methodology */}
              {result.methodology.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Research Methodology</h4>
                  <ul className="space-y-1">
                    {result.methodology.map((method, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{method}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Sources */}
              {result.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Data Sources</h4>
                  <ul className="space-y-1">
                    {result.sources.slice(0, 5).map((source, index) => (
                      <li key={index} className="text-xs text-gray-500 flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          {typeof source === 'string' 
                            ? source 
                            : source.title || source.url || 'Data Source'
                          }
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Download Button */}
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Create comprehensive report
                    const fullReport = `${result.title}
========================

EXECUTIVE SUMMARY
${result.summary}

KEY INSIGHTS
${result.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

RESEARCH METHODOLOGY
${result.methodology.map((method, i) => `${i + 1}. ${method}`).join('\n')}

DATA SOURCES
${result.sources.map((source, i) => `${i + 1}. ${typeof source === 'string' ? source : source.title || source.url || 'Data Source'}`).join('\n')}

CONFIDENCE LEVEL: ${result.confidence}%

Generated on: ${new Date().toLocaleDateString()}
Research Type: ${result.type}
`;

                    const blob = new Blob([fullReport], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${result.type}-report-${selectedCountry}-${industry}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Full Report
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (!hasDeepResearchAccess) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Deep Research Analysis
          </CardTitle>
          <CardDescription>
            AI-powered deep research capabilities for comprehensive market intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <Search className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-blue-900 mb-2">Deep Research Premium Feature</h3>
              <p className="text-blue-700 text-sm mb-4">
                Access AI-powered deep research for market analysis, funding opportunities, competitor intelligence, and economic impact assessments.
              </p>
              <Button variant="default" size="sm">
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Deep Research Analysis - {selectedCountry}
            </CardTitle>
            {(user || companyUser) && (
              <Button variant="outline" size="sm" asChild>
                <Link href={companyUser ? "/company-dashboard" : "/"}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            )}
          </div>
          <CardDescription>
            AI-powered comprehensive market intelligence for {industry} sector
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Country and Industry Selection */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country-select">Country</Label>
              {showCustomCountry ? (
                <div className="flex gap-2">
                  <Input
                    id="custom-country"
                    placeholder="Enter country name"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomCountrySubmit()}
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomCountrySubmit}
                    disabled={!customCountry.trim()}
                  >
                    Set
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCustomCountry(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country-select">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                    <Separator />
                    <SelectItem value="custom">Enter custom country...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry-select">Industry</Label>
              {showCustomIndustry ? (
                <div className="flex gap-2">
                  <Input
                    id="custom-industry"
                    placeholder="Enter industry name"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomIndustrySubmit()}
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomIndustrySubmit}
                    disabled={!customIndustry.trim()}
                  >
                    Set
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCustomIndustry(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={industry} onValueChange={handleIndustryChange}>
                  <SelectTrigger id="industry-select">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                    <Separator />
                    <SelectItem value="custom">Enter custom industry...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Debug State Display */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-2 rounded text-xs mb-4">
              <strong>Debug State:</strong><br/>
              Active Tab: {activeTab}<br/>
              Research Results: {Object.keys(researchResults).join(', ') || 'None'}<br/>
              Show Save Dialog: {showSaveDialog.toString()}<br/>
              Pending Tab: {pendingTab || 'None'}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="market-analysis" className="flex items-center relative">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Market</span>
                {researchResults['market-analysis'] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </TabsTrigger>
              <TabsTrigger value="funding-opportunities" className="flex items-center relative">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Funding</span>
                {researchResults['funding-opportunities'] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </TabsTrigger>
              <TabsTrigger value="competitor-analysis" className="flex items-center relative">
                <Building className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Competitors</span>
                {researchResults['competitor-analysis'] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </TabsTrigger>
              <TabsTrigger value="economic-impact" className="flex items-center relative">
                <Globe className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Economic</span>
                {researchResults['economic-impact'] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="market-analysis" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Market Analysis Research</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => marketAnalysisMutation.mutate()}
                    disabled={marketAnalysisMutation.isPending}
                    size="sm"
                  >
                    {marketAnalysisMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Researching...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" /> Start Research</>
                    )}
                  </Button>
                  {/* Test button for save dialog */}
                  {researchResults['market-analysis'] && (
                    <Button 
                      onClick={() => {
                        setSaveDialogData(researchResults['market-analysis']);
                        setPendingTab('funding-opportunities');
                        setShowSaveDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Test Save Dialog
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Comprehensive analysis of market size, growth trends, and competitive landscape for {industry} in {selectedCountry}.
              </p>
              {researchResults['market-analysis'] && renderResearchResult(researchResults['market-analysis'])}
            </TabsContent>

            <TabsContent value="funding-opportunities" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Funding Opportunities</h3>
                <Button 
                  onClick={() => fundingOpportunitiesMutation.mutate()}
                  disabled={fundingOpportunitiesMutation.isPending}
                  size="sm"
                >
                  {fundingOpportunitiesMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Researching...</>
                  ) : (
                    <><DollarSign className="h-4 w-4 mr-2" /> Find Funding</>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Research grants, venture capital, and government funding opportunities for {industry} companies in {selectedCountry}.
              </p>
              {researchResults['funding-opportunities'] && renderResearchResult(researchResults['funding-opportunities'])}
            </TabsContent>

            <TabsContent value="competitor-analysis" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Competitor Intelligence</h3>
                <Button 
                  onClick={() => competitorAnalysisMutation.mutate()}
                  disabled={competitorAnalysisMutation.isPending}
                  size="sm"
                >
                  {competitorAnalysisMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Building className="h-4 w-4 mr-2" /> Analyze Market</>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Deep analysis of key players, market positioning, and competitive dynamics in the {industry} sector.
              </p>
              {researchResults['competitor-analysis'] && renderResearchResult(researchResults['competitor-analysis'])}
            </TabsContent>

            <TabsContent value="economic-impact" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Economic Impact Analysis</h3>
                <Button 
                  onClick={() => economicImpactMutation.mutate()}
                  disabled={economicImpactMutation.isPending}
                  size="sm"
                >
                  {economicImpactMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Globe className="h-4 w-4 mr-2" /> Assess Impact</>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Analysis of {industry} sector's economic impact and future projections for {selectedCountry} over the next 5 years.
              </p>
              {researchResults['economic-impact'] && renderResearchResult(researchResults['economic-impact'])}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Current Research?
            </DialogTitle>
            <DialogDescription>
              You have research results for "{saveDialogData?.title}". Would you like to save this report before switching to a different analysis?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleSaveAndContinue}
              className="flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save & Continue
            </Button>
            <Button 
              variant="outline"
              onClick={handleContinueWithoutSaving}
            >
              Continue Without Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}