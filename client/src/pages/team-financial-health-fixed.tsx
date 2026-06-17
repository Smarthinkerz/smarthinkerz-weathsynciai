import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Plus,
  Settings,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  UserPlus,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar
} from "lucide-react";

interface FinancialTeam {
  id: number;
  name: string;
  description?: string;
  teamType: string;
  industry?: string;
  monthlyBudget?: number;
  goals: string[];
  memberCount: number;
  role: string;
  createdAt: string;
}

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  permissions: string[];
  joinedAt: string;
  isActive: boolean;
  username: string;
}

interface TeamHealthReport {
  overallScore: number;
  financialHealth: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  keyMetrics: {
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
    burnRate: number;
    cashRunway: number;
  };
  insights: any[];
  recommendations: string[];
  trends: {
    income: 'up' | 'down' | 'stable';
    expenses: 'up' | 'down' | 'stable';
    savings: 'up' | 'down' | 'stable';
  };
}

export default function TeamFinancialHealthPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<FinancialTeam | null>(null);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    teamType: 'small_business',
    industry: '',
    monthlyBudget: '',
    goals: [] as string[]
  });

  // Get user's financial teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams/financial"],
    enabled: !!user
  });

  // Set default selected team
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
    }
  }, [teams, selectedTeam]);

  // Get team health report
  const { data: healthReport, error: healthReportError, isLoading: healthReportLoading } = useQuery({
    queryKey: ["/api/teams", selectedTeam, "health-report"],
    queryFn: async () => {
      console.log('Fetching health report for team:', selectedTeam);
      const response = await fetch(`/api/teams/${selectedTeam}/health-report`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Health report fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch health report');
      }
      const data = await response.json();
      console.log('Health report data received:', data);
      return data;
    },
    enabled: !!selectedTeam
  });

  // Get team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/teams", selectedTeam, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${selectedTeam}/members`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    },
    enabled: !!selectedTeam
  });

  // Get team insights
  const { data: insights } = useQuery({
    queryKey: ["/api/teams", selectedTeam, "insights"],
    enabled: !!selectedTeam
  });

  // Get team financial metrics
  const { data: teamMetrics = [] } = useQuery({
    queryKey: ["/api/teams", selectedTeam, "metrics"],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${selectedTeam}/metrics`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch team metrics');
      }
      return response.json();
    },
    enabled: !!selectedTeam
  });

  // Get all users for member management
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: showInviteMembers
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const response = await apiRequest("POST", "/api/teams/financial", teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/financial"] });
      setShowCreateTeam(false);
      setNewTeam({
        name: '',
        description: '',
        teamType: 'small_business',
        industry: '',
        monthlyBudget: '',
        goals: []
      });
      toast({
        title: "Team Created",
        description: "Financial team created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, teamData }: { teamId: number; teamData: any }) => {
      const response = await apiRequest("PUT", `/api/teams/financial/${teamId}`, teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/financial"] });
      setShowEditTeam(false);
      setEditingTeam(null);
      toast({
        title: "Team Updated",
        description: "Team settings updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await apiRequest("DELETE", `/api/teams/financial/${teamId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/financial"] });
      if (selectedTeam === deleteTeamMutation.variables) {
        setSelectedTeam(null);
      }
      toast({
        title: "Team Deleted",
        description: "Team deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Invite members mutation
  const inviteMembersMutation = useMutation({
    mutationFn: async ({ teamId, userIds }: { teamId: number; userIds: number[] }) => {
      const response = await apiRequest("POST", `/api/teams/${teamId}/invite`, { userIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "members"] });
      setShowInviteMembers(false);
      setSelectedUsers([]);
      toast({
        title: "Members Invited",
        description: "Team members invited successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get current user's member info for the selected team
  const currentUserMember = teamMembers.find((member: TeamMember) => member.userId === user?.id);
  const canManageMembers = currentUserMember?.role === 'owner' || currentUserMember?.permissions.includes('manage_members');

  // Helper functions
  const createTeam = () => {
    const budgetValue = newTeam.monthlyBudget ? parseFloat(newTeam.monthlyBudget.replace(/[^0-9.]/g, '')) : 0;
    createTeamMutation.mutate({
      ...newTeam,
      monthlyBudget: budgetValue
    });
  };

  const updateTeam = () => {
    if (!editingTeam) return;
    const budgetValue = editingTeam.monthlyBudget || 0;
    updateTeamMutation.mutate({
      teamId: editingTeam.id,
      teamData: {
        name: editingTeam.name,
        description: editingTeam.description,
        teamType: editingTeam.teamType,
        industry: editingTeam.industry,
        monthlyBudget: budgetValue,
        goals: editingTeam.goals
      }
    });
  };

  const handleEditTeam = (team: FinancialTeam) => {
    setEditingTeam(team);
    setShowEditTeam(true);
  };

  const handleDeleteTeam = (teamId: number) => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const inviteMembers = () => {
    if (selectedTeam && selectedUsers.length > 0) {
      inviteMembersMutation.mutate({
        teamId: selectedTeam,
        userIds: selectedUsers
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const defaultReport = {
    overallScore: 0,
    financialHealth: 'fair' as const,
    summary: 'Loading financial health data...',
    keyMetrics: {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      burnRate: 0,
      cashRunway: 0
    },
    insights: [],
    recommendations: [],
    trends: {
      income: 'stable' as const,
      expenses: 'stable' as const,
      savings: 'stable' as const
    }
  };

  const report: TeamHealthReport = (healthReport && 
    typeof healthReport === 'object' && 
    'keyMetrics' in healthReport && 
    healthReport.keyMetrics && 
    typeof healthReport.keyMetrics === 'object') ? 
    healthReport as TeamHealthReport : defaultReport;

  // Debug logging
  console.log('Selected team:', selectedTeam);
  console.log('Health report:', healthReport);
  console.log('Health report loading:', healthReportLoading);
  console.log('Health report error:', healthReportError);
  console.log('Team metrics:', teamMetrics);
  console.log('Team metrics length:', teamMetrics?.length);
  console.log('Calculated report:', report);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <Button onClick={() => setShowCreateTeam(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Team Financial Health</h1>
          <Badge variant="outline">
            <Shield className="w-4 h-4 mr-1" />
            Premium Feature
          </Badge>
        </div>

        {teams && teams.length > 0 && (
          <div className="flex gap-2 mb-6">
            {teams.map((team: FinancialTeam) => (
              <Button
                key={team.id}
                variant={selectedTeam === team.id ? "default" : "outline"}
                onClick={() => setSelectedTeam(team.id)}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {team.name}
                <Badge variant="secondary" className="ml-1">
                  {team.memberCount}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Overview Section */}
      {selectedTeam && report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.overallScore}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getHealthColor(report.financialHealth)}>
                  {report.financialHealth.charAt(0).toUpperCase() + report.financialHealth.slice(1)}
                </Badge>
              </div>
              <Progress value={report.overallScore} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {report.summary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(report.keyMetrics.totalIncome)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(report.trends.income)}
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(report.keyMetrics.totalIncome - report.keyMetrics.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(report.keyMetrics.totalIncome - report.keyMetrics.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Income - Expenses
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Breakdown */}
      {selectedTeam && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown</CardTitle>
              <CardDescription>Current financial position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Income</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(report.keyMetrics.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Expenses</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(report.keyMetrics.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Savings</span>
                <span className="text-sm font-bold text-blue-600">
                  {formatCurrency(report.keyMetrics.totalSavings)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Position</span>
                  <span className={`text-sm font-bold ${(report.keyMetrics.totalIncome - report.keyMetrics.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.keyMetrics.totalIncome - report.keyMetrics.totalExpenses)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              {report.recommendations && report.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recommendations available yet. Add more financial data to get personalized suggestions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Management Section */}
      {selectedTeam && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your financial team</CardDescription>
              </div>
              {canManageMembers && (
                <Button onClick={() => setShowInviteMembers(true)} size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-center py-4">Loading team members...</div>
            ) : teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member: TeamMember) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.role} • Joined {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No team members yet. Invite some colleagues to collaborate!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teams List with Management */}
      {teams && teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Financial Teams</CardTitle>
            <CardDescription>Manage and organize your collaborative finances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map((team: FinancialTeam) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {team.description || 'No description'} • {team.memberCount} members
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {team.teamType.replace('_', ' ')}
                        </Badge>
                        {team.monthlyBudget && (
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(team.monthlyBudget)}/month
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      View Health
                    </Button>
                    {team.role === 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Financial Team</DialogTitle>
            <DialogDescription>
              Set up a new team to track collaborative finances
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                placeholder="Enter team name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newTeam.description}
                onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                placeholder="Brief description"
              />
            </div>
            
            <div>
              <Label htmlFor="teamType">Team Type</Label>
              <Select value={newTeam.teamType} onValueChange={(value) => setNewTeam({...newTeam, teamType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="small_business">Small Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="non_profit">Non-Profit</SelectItem>
                  <SelectItem value="investment_group">Investment Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="monthlyBudget">Monthly Budget</Label>
              <Input
                id="monthlyBudget"
                value={newTeam.monthlyBudget}
                onChange={(e) => setNewTeam({...newTeam, monthlyBudget: e.target.value})}
                placeholder="$5,000"
              />
            </div>
            
            <div>
              <Label>Financial Goals</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Cash Flow', 'Growth', 'Profit', 'Savings', 'Investment'].map(goal => (
                  <Button
                    key={goal}
                    type="button"
                    variant={newTeam.goals.includes(goal) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const goals = newTeam.goals.includes(goal)
                        ? newTeam.goals.filter(g => g !== goal)
                        : [...newTeam.goals, goal];
                      setNewTeam({...newTeam, goals});
                    }}
                  >
                    {goal}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createTeam}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(!teams || teams.length === 0) ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
            <p className="text-gray-600 mb-6">Create your first financial team to start monitoring collaborative finances</p>
            
            <Button size="lg" onClick={() => setShowCreateTeam(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Financial Team
            </Button>
            
            <div className="mt-8 max-w-md mx-auto">
              <h4 className="font-semibold mb-3">Benefits of Team Financial Health:</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Track collaborative income and expenses</li>
                <li>• AI-powered financial health insights</li>
                <li>• Team member management and permissions</li>
                <li>• Real-time financial monitoring</li>
                <li>• Automated recommendations and alerts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Settings</DialogTitle>
            <DialogDescription>
              Update your team configuration
            </DialogDescription>
          </DialogHeader>
          
          {editingTeam && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Team Name</Label>
                <Input
                  id="edit-name"
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingTeam.description || ''}
                  onChange={(e) => setEditingTeam({...editingTeam, description: e.target.value})}
                  placeholder="Brief description"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-teamType">Team Type</Label>
                <Select value={editingTeam.teamType} onValueChange={(value) => setEditingTeam({...editingTeam, teamType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="small_business">Small Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="non_profit">Non-Profit</SelectItem>
                    <SelectItem value="investment_group">Investment Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-monthlyBudget">Monthly Budget</Label>
                <Input
                  id="edit-monthlyBudget"
                  value={editingTeam.monthlyBudget?.toString() || ''}
                  onChange={(e) => setEditingTeam({...editingTeam, monthlyBudget: parseFloat(e.target.value) || 0})}
                  placeholder="$5,000"
                />
              </div>
              
              <div>
                <Label>Financial Goals</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Cash Flow', 'Growth', 'Profit', 'Savings', 'Investment'].map(goal => (
                    <Button
                      key={goal}
                      type="button"
                      variant={editingTeam.goals.includes(goal) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const goals = editingTeam.goals.includes(goal)
                          ? editingTeam.goals.filter(g => g !== goal)
                          : [...editingTeam.goals, goal];
                        setEditingTeam({...editingTeam, goals});
                      }}
                    >
                      {goal}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTeam(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateTeam}
              disabled={updateTeamMutation.isPending}
            >
              {updateTeamMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Team'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Members Dialog */}
      <Dialog open={showInviteMembers} onOpenChange={setShowInviteMembers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Add members to your financial team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {allUsers.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {allUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No users available to invite
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteMembers(false)}>
              Cancel
            </Button>
            <Button 
              onClick={inviteMembers}
              disabled={inviteMembersMutation.isPending || selectedUsers.length === 0}
            >
              {inviteMembersMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                `Invite ${selectedUsers.length} Members`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}