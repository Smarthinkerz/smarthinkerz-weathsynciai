import { isPaidTier } from '@shared/schema';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FinancialDisclaimer, AIEstimateBadge } from "@/components/integrity/disclaimers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  TrendingUp,
  Target,
  AlertTriangle,
  PiggyBank,
  DollarSign,
  Calculator,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Clock,
  Users,
  X
} from "lucide-react";

interface FinancialProfile {
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  currentSavings: number;
  debts: number;
  age: number;
  dependents: number;
  financialGoals: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

interface BudgetRecommendation {
  totalBudget: number;
  categories: {
    name: string;
    amount: number;
    percentage: number;
    priority: 'essential' | 'important' | 'optional';
    tips: string[];
  }[];
  emergencyFund: {
    targetAmount: number;
    monthlyContribution: number;
    timeToGoal: number;
  };
  savingsStrategy: {
    totalSavingsRate: number;
    allocations: {
      category: string;
      amount: number;
      reasoning: string;
    }[];
  };
  insights: string[];
  nextActions: string[];
}

export default function PersonalFinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<FinancialProfile>({
    monthlyIncome: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    currentSavings: 0,
    debts: 0,
    age: 25,
    dependents: 0,
    financialGoals: [],
    riskTolerance: 'medium'
  });

  // Get financial insights
  const { data: insights } = useQuery({
    queryKey: ["/api/personal-finance/insights"],
    enabled: !!user
  });

  // Budget recommendations mutation
  const budgetRecommendationsMutation = useMutation({
    mutationFn: async (profileData: FinancialProfile) => {
      const response = await apiRequest("POST", "/api/personal-finance/budget-recommendations", {
        profile: profileData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget Recommendations Generated",
        description: "Your personalized budget plan is ready!",
      });
      setActiveTab("budget");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Spending analysis mutation
  const spendingAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/personal-finance/spending-analysis", {
        transactions: [],
        currentBudget: budgetRecommendationsMutation.data
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Spending Analysis Complete",
        description: "Your spending patterns have been analyzed.",
      });
    },
  });

  const handleProfileUpdate = (field: keyof FinancialProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalToggle = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal]
    }));
  };

  const generateBudgetPlan = () => {
    if (profile.monthlyIncome <= 0) {
      toast({
        title: "Missing Information",
        description: "Please enter your monthly income to generate recommendations.",
        variant: "destructive",
      });
      return;
    }
    budgetRecommendationsMutation.mutate(profile);
  };

  const recommendations: BudgetRecommendation = budgetRecommendationsMutation.data;
  const spendingAnalysis = spendingAnalysisMutation.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Finance AI Agent</h1>
        <p className="text-gray-600">Smart budgeting, savings strategies, and spending analysis powered by AI</p>
        <FinancialDisclaimer className="mt-4" />
        
        {isPaidTier(user?.subscriptionTier) && (
          <Alert className="mt-4">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              You're using the Basic tier. Unlock advanced features with Premium subscription.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="profile">
            <Users className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="budget">
            <Calculator className="w-4 h-4 mr-2" />
            Budget Builder
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="w-4 h-4 mr-2" />
            Spending Analysis
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Financial Profile
              </CardTitle>
              <CardDescription>
                Tell us about your financial situation to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={profile.monthlyIncome || ''}
                    onChange={(e) => handleProfileUpdate('monthlyIncome', Number(e.target.value))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => handleProfileUpdate('age', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="fixedExpenses">Fixed Monthly Expenses ($)</Label>
                  <Input
                    id="fixedExpenses"
                    type="number"
                    value={profile.fixedExpenses || ''}
                    onChange={(e) => handleProfileUpdate('fixedExpenses', Number(e.target.value))}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="variableExpenses">Variable Monthly Expenses ($)</Label>
                  <Input
                    id="variableExpenses"
                    type="number"
                    value={profile.variableExpenses || ''}
                    onChange={(e) => handleProfileUpdate('variableExpenses', Number(e.target.value))}
                    placeholder="800"
                  />
                </div>
                <div>
                  <Label htmlFor="currentSavings">Current Savings ($)</Label>
                  <Input
                    id="currentSavings"
                    type="number"
                    value={profile.currentSavings || ''}
                    onChange={(e) => handleProfileUpdate('currentSavings', Number(e.target.value))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="debts">Total Debts ($)</Label>
                  <Input
                    id="debts"
                    type="number"
                    value={profile.debts || ''}
                    onChange={(e) => handleProfileUpdate('debts', Number(e.target.value))}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <Label htmlFor="dependents">Number of Dependents</Label>
                  <Input
                    id="dependents"
                    type="number"
                    value={profile.dependents}
                    onChange={(e) => handleProfileUpdate('dependents', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select value={profile.riskTolerance} onValueChange={(value) => handleProfileUpdate('riskTolerance', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Financial Goals</Label>
                <p className="text-sm text-gray-600 mb-3">Select all goals that apply to your financial situation</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Emergency Fund', 'House Down Payment', 'Retirement', 'Vacation', 'Car Purchase', 'Debt Payoff', 'Education', 'Investment Portfolio', 'Business Startup'].map((goal) => (
                    <Button
                      key={goal}
                      variant={profile.financialGoals.includes(goal) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGoalToggle(goal)}
                      className="justify-start h-auto py-2 px-3 text-left"
                    >
                      {profile.financialGoals.includes(goal) && <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
                      <span className="text-sm">{goal}</span>
                    </Button>
                  ))}
                </div>
                {profile.financialGoals.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Selected Goals ({profile.financialGoals.length})</p>
                        <p className="text-xs text-blue-700">{profile.financialGoals.join(', ')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProfile(prev => ({ ...prev, financialGoals: [] }))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={generateBudgetPlan}
                disabled={budgetRecommendationsMutation.isPending}
                className="w-full"
                size="lg"
              >
                {budgetRecommendationsMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating AI Recommendations...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Generate Smart Budget Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          {recommendations ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PiggyBank className="w-5 h-5 mr-2" />
                      Your Personalized Budget Plan
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab("profile")}
                      >
                        <Calculator className="w-4 h-4 mr-1" />
                        Update Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          budgetRecommendationsMutation.reset();
                          spendingAnalysisMutation.reset();
                          setActiveTab("profile");
                          toast({
                            title: "Budget Plan Cleared",
                            description: "You can now create a new budget plan.",
                          });
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear Plan
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    AI-generated budget recommendations based on your financial profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        ${recommendations.totalBudget.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        Total Monthly Budget <AIEstimateBadge />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {recommendations.savingsStrategy.totalSavingsRate}%
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        Savings Rate <AIEstimateBadge />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold text-orange-600">
                        ${recommendations.emergencyFund.targetAmount.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        Emergency Fund Goal <AIEstimateBadge />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Budget Categories</h3>
                    {recommendations.categories.map((category, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <h4 className="font-medium">{category.name}</h4>
                            <Badge 
                              className="ml-2"
                              variant={category.priority === 'essential' ? 'destructive' : 
                                      category.priority === 'important' ? 'default' : 'secondary'}
                            >
                              {category.priority}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${category.amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">{category.percentage}%</div>
                          </div>
                        </div>
                        <Progress value={category.percentage} className="mb-2" />
                        {category.tips.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">Tips:</div>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {category.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Fund Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Target Amount</Label>
                      <div className="text-2xl font-bold text-green-600">
                        ${recommendations.emergencyFund.targetAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label>Monthly Contribution</Label>
                      <div className="text-2xl font-bold text-blue-600">
                        ${recommendations.emergencyFund.monthlyContribution.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label>Time to Goal</Label>
                      <div className="text-2xl font-bold text-orange-600">
                        {recommendations.emergencyFund.timeToGoal} months
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {recommendations.insights.map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Next Actions</h4>
                      <ul className="space-y-1">
                        {recommendations.nextActions.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Budget Plan Yet</h3>
                <p className="text-gray-600 mb-4">
                  Complete your financial profile to generate a personalized budget plan.
                </p>
                <Button onClick={() => setActiveTab("profile")}>
                  Complete Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                AI-Powered Spending Analysis
              </CardTitle>
              <CardDescription>
                Advanced insights into your spending patterns and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => spendingAnalysisMutation.mutate()}
                disabled={spendingAnalysisMutation.isPending || !recommendations}
                className="mb-4"
              >
                {spendingAnalysisMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Spending...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze Spending Patterns
                  </>
                )}
              </Button>

              {spendingAnalysis ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{spendingAnalysis.score}/100</div>
                    <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                      Financial Health Score <AIEstimateBadge />
                    </div>
                  </div>
                  
                  {spendingAnalysis.alerts?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Alerts</h4>
                      {spendingAnalysis.alerts.map((alert: any, index: number) => (
                        <Alert key={index} className="mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              ) : !recommendations ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please generate a budget plan first to enable spending analysis.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Financial Insights
              </CardTitle>
              <CardDescription>
                Personalized recommendations and alerts from our AI agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights && insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant={insight.priority === 'high' ? 'destructive' : 'default'}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      {insight.amount && (
                        <div className="mt-2 text-sm font-medium">
                          Amount: ${insight.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Insights Yet</h3>
                  <p className="text-gray-600">
                    Complete your profile and generate a budget to receive personalized insights.
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