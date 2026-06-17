import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, TrendingUp, Target, DollarSign } from "lucide-react";
import { FinancialDisclaimer, AIEstimateBadge } from "@/components/integrity/disclaimers";
import { ComputedPortfolio } from "@/components/portfolio/computed-portfolio";
import { useLocation } from "wouter";

interface InvestmentProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: number;
  monthlyInvestmentCapacity: number;
  currentAge: number;
  retirementAge: number;
  totalAssets: number;
  monthlyIncome: number;
  hasEmergencyFund: boolean;
  investmentExperience: 'beginner' | 'intermediate' | 'advanced';
  investmentGoals: string[];
}

export default function InvestmentStrategistPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState<Partial<InvestmentProfile>>({
    riskTolerance: 'moderate',
    investmentHorizon: 10,
    monthlyInvestmentCapacity: 1000,
    currentAge: 35,
    retirementAge: 65,
    totalAssets: 50000,
    monthlyIncome: 5000,
    hasEmergencyFund: false,
    investmentExperience: 'intermediate',
    investmentGoals: []
  });

  // Fetch investment profile
  const { data: investmentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/investment/profile'],
    enabled: !!user
  });

  // Fetch investment analyses
  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['/api/investment/analyses'],
    enabled: !!user
  });

  // Create analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (profile: InvestmentProfile) => {
      const response = await apiRequest('POST', '/api/investment/analyze', profile);
      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Your investment strategy has been updated!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/investment/analyses'] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateAnalysis = async () => {
    // Use the current profile data from the form if available, otherwise use saved profile
    const currentProfile = {
      riskTolerance: profileData.riskTolerance || 'moderate',
      investmentHorizon: profileData.investmentHorizon || 10,
      monthlyInvestmentCapacity: profileData.monthlyInvestmentCapacity || 1000,
      currentAge: profileData.currentAge || 35,
      retirementAge: profileData.retirementAge || 65,
      totalAssets: profileData.totalAssets || 50000,
      monthlyIncome: profileData.monthlyIncome || 5000,
      hasEmergencyFund: profileData.hasEmergencyFund || false,
      investmentExperience: profileData.investmentExperience || 'intermediate',
      investmentGoals: profileData.investmentGoals || []
    } as InvestmentProfile;
    
    console.log('Generating analysis with profile:', currentProfile);
    await analysisMutation.mutateAsync(currentProfile);
  };

  const latestAnalysis = Array.isArray(analyses) && analyses.length > 0 ? analyses[0] : null;
  
  // Debug logging
  console.log('Latest analysis data:', latestAnalysis);
  console.log('Recommended portfolio:', latestAnalysis?.recommendedPortfolio);
  console.log('Specific investments:', latestAnalysis?.specificInvestments);

  if (profileLoading || analysesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your investment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <FinancialDisclaimer />

      <ComputedPortfolio />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Investment Strategist AI
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered investment analysis and portfolio optimization
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Premium Feature
        </Badge>
      </div>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Profile</CardTitle>
          <CardDescription>
            {!investmentProfile 
              ? "Create your investment profile to get personalized AI recommendations"
              : "Your investment profile is ready for analysis"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowProfileForm(true)}>
            {!investmentProfile ? "Create Investment Profile" : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      {investmentProfile && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Risk Tolerance:</span>
                <Badge variant="outline">{investmentProfile?.riskTolerance || 'Not set'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Investment Horizon:</span>
                <span className="text-sm">{investmentProfile?.investmentHorizon || 0} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Capacity:</span>
                <span className="text-sm">${investmentProfile?.monthlyInvestmentCapacity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Age:</span>
                <span className="text-sm">{investmentProfile?.currentAge || 0} years old</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Experience:</span>
                <span className="text-sm capitalize">{investmentProfile?.investmentExperience || 'Not set'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analysis Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestAnalysis ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600">✓ Analysis Complete</p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {latestAnalysis.createdAt ? new Date(latestAnalysis.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleGenerateAnalysis}
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? "Updating..." : "Update Analysis"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-orange-600">⚠ No analysis available</p>
                  <Button 
                    size="sm"
                    onClick={handleGenerateAnalysis}
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? "Generating..." : "Generate Analysis"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                Update Profile
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                View Portfolio
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Export Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Results */}
      {latestAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Investment Analysis Results</CardTitle>
            <CardDescription>
              AI-generated insights based on your profile and market conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Risk Profile Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  {profileData ? (
                    `Based on your ${profileData.riskTolerance} risk tolerance and ${profileData.investmentHorizon}-year investment horizon, you're positioned for ${
                      profileData.riskTolerance === 'aggressive' ? 'high-growth potential with higher volatility' :
                      profileData.riskTolerance === 'conservative' ? 'stable, lower-risk investments with modest growth' :
                      'balanced growth strategy with moderate risk'
                    }.`
                  ) : (
                    "Complete your profile to see personalized risk assessment."
                  )}
                </p>
              </div>

              {latestAnalysis?.recommendedPortfolio && Object.keys(latestAnalysis.recommendedPortfolio).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">Recommended Portfolio Allocation <AIEstimateBadge /></h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(latestAnalysis.recommendedPortfolio).map(([asset, percentage]) => 
                      percentage && percentage > 0 && (
                        <div key={asset} className="flex justify-between">
                          <span className="capitalize">{asset.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span>{percentage}%</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {latestAnalysis.monthlyInvestmentPlan && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">Monthly Investment Plan <AIEstimateBadge /></h4>
                  <div className="space-y-1 text-sm">
                    {latestAnalysis.monthlyInvestmentPlan.emergencyFund && (
                      <div className="flex justify-between">
                        <span>Emergency Fund:</span>
                        <span>${latestAnalysis.monthlyInvestmentPlan.emergencyFund}</span>
                      </div>
                    )}
                    {latestAnalysis.monthlyInvestmentPlan.retirement && (
                      <div className="flex justify-between">
                        <span>Retirement (401k/IRA):</span>
                        <span>${latestAnalysis.monthlyInvestmentPlan.retirement}</span>
                      </div>
                    )}
                    {latestAnalysis.monthlyInvestmentPlan.taxable && (
                      <div className="flex justify-between">
                        <span>Taxable Investments:</span>
                        <span>${latestAnalysis.monthlyInvestmentPlan.taxable}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total Monthly:</span>
                      <span>${(latestAnalysis.monthlyInvestmentPlan.emergencyFund || 0) + (latestAnalysis.monthlyInvestmentPlan.retirement || 0) + (latestAnalysis.monthlyInvestmentPlan.taxable || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {latestAnalysis.aiInsights && latestAnalysis.aiInsights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">AI Investment Insights</h4>
                  <ul className="space-y-1">
                    {latestAnalysis.aiInsights.map((insight: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestAnalysis.specificInvestments && latestAnalysis.specificInvestments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">Specific Investment Recommendations <AIEstimateBadge /></h4>
                  <div className="space-y-2 text-sm">
                    {latestAnalysis.specificInvestments.map((investment: any, index: number) => (
                      <div key={index} className="border rounded p-2">
                        <div className="font-medium">{investment.name} ({investment.symbol})</div>
                        <div className="text-xs text-muted-foreground">
                          {investment.allocation}% allocation • {investment.rationale} • {investment.expenseRatio}% expense ratio
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Recommended Next Steps</h4>
                <ul className="space-y-1">
                  <li className="text-sm text-muted-foreground">• Open a low-cost brokerage account if you don't have one</li>
                  <li className="text-sm text-muted-foreground">• Set up automatic monthly investments to maintain discipline</li>
                  <li className="text-sm text-muted-foreground">• Rebalance your portfolio quarterly to maintain target allocations</li>
                  <li className="text-sm text-muted-foreground">• Review and adjust strategy annually based on life changes</li>
                </ul>
              </div>

              {latestAnalysis.specificInvestments && latestAnalysis.specificInvestments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">Specific Investment Recommendations <AIEstimateBadge /></h4>
                  <div className="space-y-2">
                    {latestAnalysis.specificInvestments.slice(0, 3).map((investment: any, index: number) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="font-medium">{investment.symbol} - {investment.allocation}%</div>
                        <div className="text-muted-foreground">{investment.reasoning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Form Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Investment Profile</CardTitle>
              <CardDescription>
                Help us understand your investment goals and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentAge">Current Age</Label>
                  <Input
                    id="currentAge"
                    type="number"
                    value={profileData.currentAge || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currentAge: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="retirementAge">Retirement Age</Label>
                  <Input
                    id="retirementAge"
                    type="number"
                    value={profileData.retirementAge || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, retirementAge: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                <Select
                  value={profileData.riskTolerance}
                  onValueChange={(value: 'conservative' | 'moderate' | 'aggressive') => 
                    setProfileData(prev => ({ ...prev, riskTolerance: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyCapacity">Monthly Investment Capacity ($)</Label>
                  <Input
                    id="monthlyCapacity"
                    type="number"
                    placeholder="e.g. 1000"
                    value={profileData.monthlyInvestmentCapacity || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, monthlyInvestmentCapacity: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="totalAssets">Total Assets ($)</Label>
                  <Input
                    id="totalAssets"
                    type="number"
                    placeholder="e.g. 50000"
                    value={profileData.totalAssets || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, totalAssets: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder="e.g. 5000"
                    value={profileData.monthlyIncome || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, monthlyIncome: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="investmentHorizon">Investment Timeline (years)</Label>
                  <Input
                    id="investmentHorizon"
                    type="number"
                    placeholder="e.g. 10"
                    value={profileData.investmentHorizon || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, investmentHorizon: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="investmentExperience">Investment Experience</Label>
                <Select
                  value={profileData.investmentExperience}
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                    setProfileData(prev => ({ ...prev, investmentExperience: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - New to investing</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">Advanced - Experienced investor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasEmergencyFund"
                  checked={profileData.hasEmergencyFund || false}
                  onChange={(e) => setProfileData(prev => ({ ...prev, hasEmergencyFund: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="hasEmergencyFund">I have an emergency fund (3-6 months expenses)</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowProfileForm(false)}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  try {
                    const response = await apiRequest('POST', '/api/investment/profile', profileData);
                    if (response.ok) {
                      setShowProfileForm(false);
                      queryClient.invalidateQueries({ queryKey: ['/api/investment/profile'] });
                      toast({
                        title: "Profile Saved",
                        description: "Your investment profile has been updated"
                      });
                    } else {
                      throw new Error('Failed to save profile');
                    }
                  } catch (error) {
                    toast({
                      title: "Save Failed",
                      description: "Unable to save your investment profile",
                      variant: "destructive"
                    });
                  }
                }}>
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}