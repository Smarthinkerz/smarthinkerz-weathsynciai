import OpenAI from 'openai';

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

interface SpendingAnalysis {
  patterns: {
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    variance: number;
    insights: string[];
  }[];
  alerts: {
    type: 'overspending' | 'opportunity' | 'goal_progress';
    message: string;
    severity: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  }[];
  recommendations: string[];
  score: number; // 0-100 financial health score
}

export class PersonalFinanceAI {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateBudgetRecommendations(profile: FinancialProfile): Promise<BudgetRecommendation> {
    const prompt = `
As a certified financial advisor AI, create a comprehensive budget recommendation for this profile:

Monthly Income: $${profile.monthlyIncome}
Fixed Expenses: $${profile.fixedExpenses}
Variable Expenses: $${profile.variableExpenses}
Current Savings: $${profile.currentSavings}
Debts: $${profile.debts}
Age: ${profile.age}
Dependents: ${profile.dependents}
Financial Goals: ${profile.financialGoals.join(', ')}
Risk Tolerance: ${profile.riskTolerance}

Provide detailed budget categories with specific amounts, emergency fund strategy, savings allocations, and actionable insights. Focus on realistic, achievable recommendations based on the 50/30/20 rule adjusted for their specific situation.

Return your response in this exact JSON format:
{
  "totalBudget": number,
  "categories": [
    {
      "name": "string",
      "amount": number,
      "percentage": number,
      "priority": "essential|important|optional",
      "tips": ["string"]
    }
  ],
  "emergencyFund": {
    "targetAmount": number,
    "monthlyContribution": number,
    "timeToGoal": number
  },
  "savingsStrategy": {
    "totalSavingsRate": number,
    "allocations": [
      {
        "category": "string",
        "amount": number,
        "reasoning": "string"
      }
    ]
  },
  "insights": ["string"],
  "nextActions": ["string"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as BudgetRecommendation;
    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      throw new Error('Failed to generate budget recommendations');
    }
  }

  async analyzeSpendingPatterns(transactions: any[], currentBudget: any): Promise<SpendingAnalysis> {
    const transactionSummary = transactions.map(t => ({
      amount: t.amount,
      category: t.category,
      date: t.date,
      description: t.description
    }));

    const prompt = `
As a financial analyst AI, analyze these spending patterns and provide insights:

Recent Transactions: ${JSON.stringify(transactionSummary.slice(-50))}
Current Budget: ${JSON.stringify(currentBudget)}

Analyze spending trends, identify patterns, detect potential issues, and provide actionable recommendations. Calculate a financial health score based on budget adherence, spending patterns, and savings rate.

Return your response in this exact JSON format:
{
  "patterns": [
    {
      "category": "string",
      "trend": "increasing|decreasing|stable",
      "variance": number,
      "insights": ["string"]
    }
  ],
  "alerts": [
    {
      "type": "overspending|opportunity|goal_progress",
      "message": "string",
      "severity": "low|medium|high",
      "actionRequired": boolean
    }
  ],
  "recommendations": ["string"],
  "score": number
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as SpendingAnalysis;
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      throw new Error('Failed to analyze spending patterns');
    }
  }

  async generateSavingsStrategy(profile: FinancialProfile, goals: any[]): Promise<any> {
    const prompt = `
As a savings strategist AI, create a comprehensive savings plan for this profile:

Financial Profile: ${JSON.stringify(profile)}
Savings Goals: ${JSON.stringify(goals)}

Create a detailed savings strategy with timeline, milestone tracking, and optimization suggestions. Consider goal priority, time horizons, and risk tolerance.

Return your response in this exact JSON format:
{
  "totalMonthlySavings": number,
  "goalAllocations": [
    {
      "goalId": number,
      "goalName": "string",
      "monthlyAmount": number,
      "timeToGoal": number,
      "strategy": "string",
      "milestones": [
        {
          "amount": number,
          "date": "string",
          "description": "string"
        }
      ]
    }
  ],
  "optimizations": ["string"],
  "riskAssessment": "string"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating savings strategy:', error);
      throw new Error('Failed to generate savings strategy');
    }
  }

  async generateFinancialInsights(userId: number, recentActivity: any): Promise<any[]> {
    const prompt = `
Based on this user's financial activity, generate 3-5 personalized insights:

Recent Activity: ${JSON.stringify(recentActivity)}

Focus on actionable insights about spending optimization, saving opportunities, bill reminders, and financial goal progress. Each insight should be specific and helpful.

Return your response in this exact JSON format:
{
  "insights": [
    {
      "type": "spending_pattern|budget_alert|savings_opportunity|bill_reminder",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "actionable": boolean,
      "amount": number,
      "category": "string"
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.insights || [];
    } catch (error) {
      console.error('Error generating financial insights:', error);
      return [];
    }
  }
}

export const personalFinanceAI = new PersonalFinanceAI();