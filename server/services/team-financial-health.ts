import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TeamMember {
  id: number;
  userId: number;
  role: string;
  permissions: string[];
}

interface TeamFinancialMetric {
  id: number;
  teamId: number;
  userId?: number;
  metricType: string;
  amount: number;
  currency: string;
  category?: string;
  description?: string;
  isRecurring: boolean;
  frequency?: string;
  periodStart: Date;
  periodEnd: Date;
}

interface TeamFinancialProfile {
  teamId: number;
  teamName: string;
  teamType: string;
  monthlyBudget?: number;
  members: TeamMember[];
  metrics: TeamFinancialMetric[];
  goals: string[];
}

interface TeamInsight {
  insightType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  metrics?: {
    current: number;
    target?: number;
    trend: 'up' | 'down' | 'stable';
    changePercent?: number;
  };
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
    cashRunway: number; // in months
  };
  insights: TeamInsight[];
  recommendations: string[];
  trends: {
    income: 'up' | 'down' | 'stable';
    expenses: 'up' | 'down' | 'stable';
    savings: 'up' | 'down' | 'stable';
  };
}

export class TeamFinancialHealthService {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  private model = "gpt-4o";

  async generateTeamHealthReport(profile: TeamFinancialProfile): Promise<TeamHealthReport> {
    try {
      const prompt = this.buildTeamAnalysisPrompt(profile);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are an expert financial analyst specializing in small team and business financial health monitoring. 
            Analyze the team's financial data and provide comprehensive insights, recommendations, and health scoring.
            Focus on team-specific metrics like burn rate, cash runway, expense allocation efficiency, and collaborative financial planning.
            Provide actionable insights that help teams improve their financial coordination and decision-making.
            Always respond in valid JSON format.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.formatTeamHealthReport(result, profile);
    } catch (error) {
      console.error('Error generating team health report:', error);
      throw new Error('Failed to generate team financial health report');
    }
  }

  async generateTeamInsights(profile: TeamFinancialProfile): Promise<TeamInsight[]> {
    try {
      const prompt = this.buildInsightsPrompt(profile);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a financial insights expert for small teams and businesses. 
            Generate specific, actionable insights based on team financial patterns.
            Focus on team collaboration opportunities, budget optimization, and financial goal achievement.
            Identify spending patterns, savings opportunities, and potential risks.
            Always respond in valid JSON format.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.insights || [];
    } catch (error) {
      console.error('Error generating team insights:', error);
      throw new Error('Failed to generate team financial insights');
    }
  }

  async analyzeTeamSpendingPatterns(metrics: TeamFinancialMetric[]): Promise<{
    patterns: any[];
    alerts: any[];
    opportunities: any[];
  }> {
    try {
      const expenseMetrics = metrics.filter(m => m.metricType === 'expenses');
      const prompt = this.buildSpendingAnalysisPrompt(expenseMetrics);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a spending pattern analyst for teams. 
            Analyze expense data to identify trends, inefficiencies, and optimization opportunities.
            Focus on team spending behavior, budget adherence, and cost-saving opportunities.
            Always respond in valid JSON format.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 1200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        patterns: result.patterns || [],
        alerts: result.alerts || [],
        opportunities: result.opportunities || []
      };
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      throw new Error('Failed to analyze team spending patterns');
    }
  }

  private buildTeamAnalysisPrompt(profile: TeamFinancialProfile): string {
    const totalIncome = this.calculateTotal(profile.metrics, 'income');
    const totalExpenses = this.calculateTotal(profile.metrics, 'expenses');
    const totalSavings = this.calculateTotal(profile.metrics, 'savings');
    const memberCount = profile.members.length;

    return `Analyze the financial health of this ${profile.teamType} team:

Team Profile:
- Name: ${profile.teamName}
- Type: ${profile.teamType}
- Members: ${memberCount}
- Monthly Budget: ${profile.monthlyBudget ? `$${(profile.monthlyBudget / 100).toLocaleString()}` : 'Not set'}
- Goals: ${profile.goals.join(', ') || 'None specified'}

Financial Metrics (Monthly):
- Total Income: $${(totalIncome / 100).toLocaleString()}
- Total Expenses: $${(totalExpenses / 100).toLocaleString()}
- Total Savings: $${(totalSavings / 100).toLocaleString()}
- Net Cash Flow: $${((totalIncome - totalExpenses) / 100).toLocaleString()}

Expense Breakdown:
${this.getExpenseBreakdown(profile.metrics)}

Please provide a comprehensive analysis in JSON format with:
{
  "overallScore": number (0-100),
  "financialHealth": "excellent|good|fair|poor",
  "summary": "brief overview",
  "keyMetrics": {
    "burnRate": number,
    "cashRunway": number
  },
  "insights": [array of insight objects],
  "recommendations": [array of strings],
  "trends": {
    "income": "up|down|stable",
    "expenses": "up|down|stable", 
    "savings": "up|down|stable"
  }
}`;
  }

  private buildInsightsPrompt(profile: TeamFinancialProfile): string {
    return `Generate specific financial insights for this team:

Team: ${profile.teamName} (${profile.teamType})
Members: ${profile.members.length}
Monthly Budget: ${profile.monthlyBudget ? `$${(profile.monthlyBudget / 100).toLocaleString()}` : 'Not set'}

Recent Financial Activity:
${this.getRecentActivity(profile.metrics)}

Focus on:
- Budget optimization opportunities
- Team spending coordination
- Goal achievement progress
- Financial risks and alerts
- Collaborative planning suggestions

Provide insights in JSON format:
{
  "insights": [
    {
      "insightType": "budget_alert|savings_opportunity|spending_pattern|goal_progress",
      "title": "string",
      "description": "string", 
      "priority": "low|medium|high|critical",
      "actionItems": ["string"],
      "metrics": {
        "current": number,
        "target": number,
        "trend": "up|down|stable",
        "changePercent": number
      }
    }
  ]
}`;
  }

  private buildSpendingAnalysisPrompt(expenseMetrics: TeamFinancialMetric[]): string {
    const categories = this.groupByCategory(expenseMetrics);
    
    return `Analyze team spending patterns:

Expense Categories:
${Object.entries(categories).map(([category, amount]) => 
  `- ${category}: $${(amount / 100).toLocaleString()}`
).join('\n')}

Recent Transactions: ${expenseMetrics.length}

Identify:
- Unusual spending patterns
- Budget overspend alerts  
- Cost optimization opportunities
- Recurring expense efficiency

Respond in JSON format:
{
  "patterns": [{"category": "string", "trend": "string", "analysis": "string"}],
  "alerts": [{"type": "string", "message": "string", "severity": "string"}],
  "opportunities": [{"area": "string", "potential_savings": number, "description": "string"}]
}`;
  }

  private calculateTotal(metrics: TeamFinancialMetric[], type: string): number {
    return metrics
      .filter(m => m.metricType === type)
      .reduce((sum, m) => sum + m.amount, 0);
  }

  private getExpenseBreakdown(metrics: TeamFinancialMetric[]): string {
    const expenses = metrics.filter(m => m.metricType === 'expenses');
    const categories = this.groupByCategory(expenses);
    
    return Object.entries(categories)
      .map(([category, amount]) => `- ${category}: $${(amount / 100).toLocaleString()}`)
      .join('\n') || '- No expense data available';
  }

  private getRecentActivity(metrics: TeamFinancialMetric[]): string {
    const recent = metrics
      .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())
      .slice(0, 10);
    
    return recent
      .map(m => `- ${m.metricType}: $${(m.amount / 100).toLocaleString()} (${m.category || 'uncategorized'})`)
      .join('\n') || '- No recent activity';
  }

  private groupByCategory(metrics: TeamFinancialMetric[]): Record<string, number> {
    return metrics.reduce((acc, metric) => {
      const category = metric.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + metric.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private formatTeamHealthReport(result: any, profile: TeamFinancialProfile): TeamHealthReport {
    const totalIncome = this.calculateTotal(profile.metrics, 'income');
    const totalExpenses = this.calculateTotal(profile.metrics, 'expenses');
    const totalSavings = this.calculateTotal(profile.metrics, 'savings');
    const burnRate = totalExpenses;
    const cashRunway = totalSavings > 0 && burnRate > 0 ? Math.floor(totalSavings / burnRate) : 0;

    return {
      overallScore: result.overallScore || 0,
      financialHealth: result.financialHealth || 'fair',
      summary: result.summary || 'Financial analysis completed',
      keyMetrics: {
        totalIncome,
        totalExpenses,
        totalSavings,
        burnRate,
        cashRunway
      },
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      trends: result.trends || {
        income: 'stable',
        expenses: 'stable',
        savings: 'stable'
      }
    };
  }
}