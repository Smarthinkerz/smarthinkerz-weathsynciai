import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Lightbulb, TrendingUp, DollarSign, Users, Newspaper, Building2, Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PersonalizedOpportunity {
  title: string;
  description: string;
  category: 'startup' | 'freelance' | 'investment' | 'partnership' | 'grant';
  matchScore: number;
  reasoning: string;
  actionSteps: string[];
  estimatedRevenue: string;
  timeToMarket: string;
  requiredSkills: string[];
  riskLevel: 'low' | 'medium' | 'high';
  marketTrend: string;
}

interface CompetitiveAnalysis {
  marketLeaders: Array<{name: string; marketShare: string; strengths: string[]}>;
  emergingPlayers: Array<{name: string; growthRate: string; innovations: string[]}>;
  marketGaps: string[];
  opportunities: string[];
  threatLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface InvestmentOpportunity {
  investmentType: 'startup' | 'fund' | 'stock' | 'crypto' | 'real-estate';
  name: string;
  description: string;
  minimumInvestment: string;
  expectedReturns: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: string;
  marketTrends: string[];
  exitStrategy: string;
  confidenceScore: number;
}

interface TrendAnalysis {
  emergingTrends: Array<{trend: string; impact: 'high' | 'medium' | 'low'; timeline: string}>;
  decliningTrends: Array<{trend: string; reason: string}>;
  disruptiveTechnologies: string[];
  marketPredictions: string[];
  actionableInsights: string[];
  confidenceLevel: number;
}

interface SmartNewsItem {
  title: string;
  summary: string;
  relevanceScore: number;
  category: 'funding' | 'market' | 'competition' | 'trend';
  actionable: boolean;
  impact: 'high' | 'medium' | 'low';
  url?: string;
}

export default function AIOpportunityDashboard() {
  const { user } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState("Germany");
  const [selectedIndustry, setSelectedIndustry] = useState("Technology");
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');

  // Personalized Opportunities
  const { data: personalizedOpportunities, isLoading: opportunitiesLoading } = useQuery<PersonalizedOpportunity[]>({
    queryKey: ['/api/ai/opportunities/personalized', selectedRegion],
    queryFn: async () => {
      const res = await fetch(`/api/ai/opportunities/personalized?region=${selectedRegion}`);
      return await res.json();
    },
    enabled: !!user
  });

  // Competitive Intelligence
  const { data: competitiveAnalysis, isLoading: competitiveLoading } = useQuery<CompetitiveAnalysis>({
    queryKey: ['/api/ai/competitive-intelligence', selectedIndustry, selectedRegion],
    queryFn: async () => {
      const res = await fetch(`/api/ai/competitive-intelligence/${selectedIndustry}/${selectedRegion}`);
      return await res.json();
    },
    enabled: !!user
  });

  // Investment Opportunities
  const { data: investmentOpportunities, isLoading: investmentLoading } = useQuery<InvestmentOpportunity[]>({
    queryKey: ['/api/ai/investment-opportunities', selectedIndustry, riskTolerance],
    queryFn: async () => {
      const res = await fetch(`/api/ai/investment-opportunities/${selectedIndustry}?riskTolerance=${riskTolerance}`);
      return await res.json();
    },
    enabled: !!user
  });

  // Trend Analysis
  const { data: trendAnalysis, isLoading: trendLoading } = useQuery<TrendAnalysis>({
    queryKey: ['/api/ai/trend-analysis', selectedIndustry],
    queryFn: async () => {
      const res = await fetch(`/api/ai/trend-analysis/${selectedIndustry}`);
      return await res.json();
    },
    enabled: !!user
  });

  // Smart News Feed
  const { data: smartNewsFeed, isLoading: newsLoading } = useQuery<SmartNewsItem[]>({
    queryKey: ['/api/ai/smart-news-feed'],
    queryFn: async () => {
      const res = await fetch(`/api/ai/smart-news-feed?industries=${selectedIndustry},Business`);
      return await res.json();
    },
    enabled: !!user
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'startup': return <Lightbulb className="h-4 w-4" />;
      case 'investment': return <DollarSign className="h-4 w-4" />;
      case 'freelance': return <Users className="h-4 w-4" />;
      case 'partnership': return <Building2 className="h-4 w-4" />;
      case 'grant': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>AI Opportunities</CardTitle>
            <CardDescription>Please log in to access AI-powered business opportunities</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Opportunity Dashboard</h1>
          <p className="text-muted-foreground">Personalized business insights powered by live market data</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="USA">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="France">France</SelectItem>
              <SelectItem value="Global">Global</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="opportunities">Personalized Opportunities</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Intelligence</TabsTrigger>
          <TabsTrigger value="investments">Investment Scanner</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="news">Smart News</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Business Opportunities
              </CardTitle>
              <CardDescription>
                AI-generated opportunities based on your skills: {user.skills?.join(', ') || 'No skills listed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunitiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : personalizedOpportunities?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalizedOpportunities.map((opportunity, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(opportunity.category)}
                            <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                          </div>
                          <Badge variant="secondary">{opportunity.matchScore}% match</Badge>
                        </div>
                        <CardDescription>{opportunity.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{opportunity.category}</Badge>
                          <Badge className={getRiskColor(opportunity.riskLevel)}>{opportunity.riskLevel} risk</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Revenue:</strong> {opportunity.estimatedRevenue}</p>
                          <p><strong>Time to Market:</strong> {opportunity.timeToMarket}</p>
                          <p><strong>Market Trend:</strong> {opportunity.marketTrend}</p>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">Reasoning:</p>
                          <p className="text-muted-foreground">{opportunity.reasoning}</p>
                        </div>
                        {opportunity.actionSteps?.length > 0 && (
                          <div className="text-sm">
                            <p className="font-medium">Next Steps:</p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1">
                              {opportunity.actionSteps.slice(0, 3).map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Generating personalized opportunities based on your profile...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This feature uses live market data to find opportunities that match your skills.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Competitive Intelligence
              </CardTitle>
              <CardDescription>
                Live competitive analysis for {selectedIndustry} in {selectedRegion}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitiveLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : competitiveAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Market Leaders</h4>
                      {competitiveAnalysis.marketLeaders?.length ? (
                        competitiveAnalysis.marketLeaders.map((leader, index) => (
                          <div key={index} className="border rounded-lg p-3 mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <strong>{leader.name}</strong>
                              <Badge variant="secondary">{leader.marketShare}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Strengths: {leader.strengths?.join(', ')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No market leaders data available</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Market Gaps</h4>
                      {competitiveAnalysis.marketGaps?.length ? (
                        <ul className="list-disc list-inside space-y-1">
                          {competitiveAnalysis.marketGaps.map((gap, index) => (
                            <li key={index} className="text-sm">{gap}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">Analyzing market gaps...</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Emerging Players</h4>
                      {competitiveAnalysis.emergingPlayers?.length ? (
                        competitiveAnalysis.emergingPlayers.map((player, index) => (
                          <div key={index} className="border rounded-lg p-3 mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <strong>{player.name}</strong>
                              <Badge variant="outline">{player.growthRate} growth</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Innovations: {player.innovations?.join(', ')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No emerging players data available</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Strategic Recommendations</h4>
                      {competitiveAnalysis.recommendations?.length ? (
                        <ul className="list-disc list-inside space-y-1">
                          {competitiveAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">Generating strategic recommendations...</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Analyzing competitive landscape...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Investment Opportunity Scanner
              </CardTitle>
              <CardDescription>
                AI-curated investment opportunities with {riskTolerance} risk tolerance
              </CardDescription>
              <div className="flex gap-2">
                <Select value={riskTolerance} onValueChange={(value: 'low' | 'medium' | 'high') => setRiskTolerance(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {investmentLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-40 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : investmentOpportunities?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investmentOpportunities.map((investment, index) => (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{investment.name}</CardTitle>
                          <Badge variant="secondary">{investment.confidenceScore}% confidence</Badge>
                        </div>
                        <CardDescription>{investment.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{investment.investmentType}</Badge>
                          <Badge className={getRiskColor(investment.riskLevel)}>{investment.riskLevel} risk</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Minimum Investment:</strong> {investment.minimumInvestment}</p>
                          <p><strong>Expected Returns:</strong> {investment.expectedReturns}</p>
                          <p><strong>Time Horizon:</strong> {investment.timeHorizon}</p>
                          <p><strong>Exit Strategy:</strong> {investment.exitStrategy}</p>
                        </div>
                        {investment.marketTrends?.length > 0 && (
                          <div className="text-sm">
                            <p className="font-medium">Market Trends:</p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1">
                              {investment.marketTrends.map((trend, i) => (
                                <li key={i}>{trend}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Scanning for investment opportunities...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI is analyzing live market data for {riskTolerance}-risk investments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Trend Analysis
              </CardTitle>
              <CardDescription>
                AI-powered trend analysis for {selectedIndustry}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : trendAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600">Emerging Trends</h4>
                      {trendAnalysis.emergingTrends?.length ? (
                        trendAnalysis.emergingTrends.map((trend, index) => (
                          <div key={index} className="border border-green-200 rounded-lg p-3 mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <strong>{trend.trend}</strong>
                              <Badge variant={trend.impact === 'high' ? 'default' : 'secondary'}>
                                {trend.impact} impact
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Timeline: {trend.timeline}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Analyzing emerging trends...</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Disruptive Technologies</h4>
                      {trendAnalysis.disruptiveTechnologies?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {trendAnalysis.disruptiveTechnologies.map((tech, index) => (
                            <Badge key={index} variant="outline">{tech}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Identifying disruptive technologies...</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Declining Trends</h4>
                      {trendAnalysis.decliningTrends?.length ? (
                        trendAnalysis.decliningTrends.map((trend, index) => (
                          <div key={index} className="border border-red-200 rounded-lg p-3 mb-2">
                            <strong>{trend.trend}</strong>
                            <div className="text-sm text-muted-foreground mt-1">
                              Reason: {trend.reason}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No declining trends identified</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Actionable Insights</h4>
                      {trendAnalysis.actionableInsights?.length ? (
                        <ul className="list-disc list-inside space-y-1">
                          {trendAnalysis.actionableInsights.map((insight, index) => (
                            <li key={index} className="text-sm flex items-start gap-1">
                              <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">Generating actionable insights...</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Analyzing market trends...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Smart Business News Feed
              </CardTitle>
              <CardDescription>
                Personalized news relevant to your skills and interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : smartNewsFeed?.length ? (
                <div className="space-y-4">
                  {smartNewsFeed.map((news, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg leading-tight">{news.title}</h4>
                          <div className="flex gap-2 ml-4">
                            <Badge variant="secondary">{news.relevanceScore}% relevant</Badge>
                            <Badge variant={news.impact === 'high' ? 'default' : 'outline'}>
                              {news.impact} impact
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">{news.summary}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant="outline">{news.category}</Badge>
                            {news.actionable && (
                              <Badge className="bg-blue-100 text-blue-800">Actionable</Badge>
                            )}
                          </div>
                          {news.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={news.url} target="_blank" rel="noopener noreferrer">
                                Read More
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Curating personalized news feed...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI is analyzing news relevant to your skills and interests
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}