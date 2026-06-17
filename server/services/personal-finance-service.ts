import OpenAI from "openai";

// Initialize OpenAI for AI-powered financial analysis
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FinancialGoal {
  id: string;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategory {
  name: string;
  amount: number;
  budget: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  categories: BudgetCategory[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  financialScore: number;
}

export interface SpendingPattern {
  month: string;
  category: string;
  amount: number;
  trend: number;
}

export class PersonalFinanceService {
  /**
   * Generate AI-powered budget analysis using real financial data
   */
  async generateBudgetAnalysis(
    income: number,
    expenses: Record<string, number>,
    userId: number
  ): Promise<FinancialAnalysis> {
    const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    const savings = income - totalExpenses;
    const savingsRate = (savings / income) * 100;

    // Calculate recommended budget percentages based on 50/30/20 rule
    const recommendedBudgets = {
      housing: income * 0.30,
      food: income * 0.12,
      transportation: income * 0.15,
      entertainment: income * 0.08,
      healthcare: income * 0.08,
      shopping: income * 0.07,
      savings: income * 0.20
    };

    const categories: BudgetCategory[] = Object.entries(expenses).map(([name, amount]) => {
      const recommended = recommendedBudgets[name.toLowerCase() as keyof typeof recommendedBudgets] || income * 0.05;
      return {
        name,
        amount,
        budget: recommended,
        percentage: (amount / income) * 100,
        trend: this.calculateTrend(amount, recommended)
      };
    });

    // Generate AI recommendations using OpenAI
    const recommendations = await this.generateAIRecommendations(income, expenses, savingsRate);
    
    const riskLevel = this.calculateRiskLevel(savingsRate, categories);
    const financialScore = this.calculateFinancialScore(savingsRate, categories);

    return {
      totalIncome: income,
      totalExpenses,
      savings,
      savingsRate,
      categories,
      recommendations,
      riskLevel,
      financialScore
    };
  }

  /**
   * Generate AI-powered financial recommendations using OpenAI
   */
  private async generateAIRecommendations(
    income: number,
    expenses: Record<string, number>,
    savingsRate: number
  ): Promise<string[]> {
    try {
      const prompt = `As a personal finance advisor, analyze this financial situation and provide 3-5 specific, actionable recommendations:

Income: $${income.toLocaleString()}/month
Expenses: ${Object.entries(expenses).map(([category, amount]) => `${category}: $${amount}`).join(', ')}
Savings Rate: ${savingsRate.toFixed(1)}%

Provide practical advice for improving financial health. Focus on specific actions they can take.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a certified financial advisor providing personalized recommendations. Keep advice practical and actionable. Format your response as a JSON array of recommendation strings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations || this.getFallbackRecommendations(savingsRate);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackRecommendations(savingsRate);
    }
  }

  /**
   * Fallback recommendations when AI is unavailable
   */
  private getFallbackRecommendations(savingsRate: number): string[] {
    const recommendations: string[] = [];
    
    if (savingsRate < 10) {
      recommendations.push("💡 Aim to save at least 10-20% of your income for financial security");
      recommendations.push("🎯 Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings");
    } else if (savingsRate < 20) {
      recommendations.push("📈 You're saving well! Try to reach the ideal 20% savings rate");
      recommendations.push("🔍 Look for opportunities to reduce discretionary spending");
    } else {
      recommendations.push("🎉 Excellent savings rate! Consider investing for long-term growth");
      recommendations.push("💼 Explore tax-advantaged retirement accounts like 401(k) or IRA");
    }

    recommendations.push("📊 Track your expenses monthly to identify spending patterns");
    recommendations.push("🎯 Set specific financial goals with target dates and amounts");

    return recommendations;
  }

  /**
   * Calculate spending trend compared to recommended budget
   */
  private calculateTrend(actual: number, recommended: number): 'up' | 'down' | 'stable' {
    const variance = (actual - recommended) / recommended;
    if (variance > 0.1) return 'up';
    if (variance < -0.1) return 'down';
    return 'stable';
  }

  /**
   * Calculate financial risk level based on spending patterns
   */
  private calculateRiskLevel(savingsRate: number, categories: BudgetCategory[]): 'low' | 'medium' | 'high' {
    if (savingsRate < 5) return 'high';
    if (savingsRate < 15) return 'medium';
    
    const overBudgetCategories = categories.filter(cat => cat.trend === 'up').length;
    if (overBudgetCategories > 2) return 'medium';
    
    return 'low';
  }

  /**
   * Calculate overall financial health score (0-100)
   */
  private calculateFinancialScore(savingsRate: number, categories: BudgetCategory[]): number {
    let score = 50; // Base score
    
    // Savings rate impact (40% of score)
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 15) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate >= 5) score += 10;
    
    // Budget adherence impact (30% of score)
    const budgetScore = categories.reduce((sum, cat) => {
      if (cat.trend === 'stable') return sum + 10;
      if (cat.trend === 'down') return sum + 5;
      return sum;
    }, 0);
    score += Math.min(budgetScore, 30);
    
    // Financial stability impact (30% of score)
    const hasEmergencyFund = savingsRate > 0;
    const diversifiedSpending = categories.length >= 4;
    if (hasEmergencyFund) score += 15;
    if (diversifiedSpending) score += 15;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Analyze spending patterns for insights
   */
  async analyzeSpendingPatterns(
    userId: number,
    monthlyData: Record<string, Record<string, number>>
  ): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];
    
    Object.entries(monthlyData).forEach(([month, categories]) => {
      Object.entries(categories).forEach(([category, amount]) => {
        // Calculate trend compared to previous month
        const trend = this.calculateMonthlyTrend(monthlyData, month, category);
        
        patterns.push({
          month,
          category,
          amount,
          trend
        });
      });
    });
    
    return patterns;
  }

  /**
   * Calculate month-over-month spending trend
   */
  private calculateMonthlyTrend(
    data: Record<string, Record<string, number>>,
    currentMonth: string,
    category: string
  ): number {
    const months = Object.keys(data).sort();
    const currentIndex = months.indexOf(currentMonth);
    
    if (currentIndex === 0) return 0; // No previous month to compare
    
    const previousMonth = months[currentIndex - 1];
    const currentAmount = data[currentMonth][category] || 0;
    const previousAmount = data[previousMonth][category] || 0;
    
    if (previousAmount === 0) return 0;
    
    return ((currentAmount - previousAmount) / previousAmount) * 100;
  }

  /**
   * Generate financial goal recommendations based on user profile
   */
  async generateGoalRecommendations(
    income: number,
    age: number,
    financialScore: number
  ): Promise<Partial<FinancialGoal>[]> {
    const recommendations: Partial<FinancialGoal>[] = [];
    
    // Emergency fund (always recommended)
    recommendations.push({
      title: "Emergency Fund",
      targetAmount: income * 6, // 6 months of income
      category: "Safety",
      priority: "high"
    });
    
    // Retirement savings based on age
    if (age < 30) {
      recommendations.push({
        title: "Retirement Savings",
        targetAmount: income * 1, // 1x annual income by 30
        category: "Retirement",
        priority: "high"
      });
    } else if (age < 40) {
      recommendations.push({
        title: "Retirement Savings",
        targetAmount: income * 3 * 12, // 3x annual income by 40
        category: "Retirement",
        priority: "high"
      });
    }
    
    // Additional goals based on financial health
    if (financialScore > 70) {
      recommendations.push({
        title: "Investment Portfolio",
        targetAmount: income * 2 * 12,
        category: "Investment",
        priority: "medium"
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate optimal savings rate based on user profile
   */
  calculateOptimalSavingsRate(
    age: number,
    income: number,
    hasDebt: boolean,
    hasEmergencyFund: boolean
  ): number {
    let baseRate = 20; // Standard 20% savings rate
    
    // Adjust based on age
    if (age < 25) baseRate = 15; // Young adults starting out
    if (age > 50) baseRate = 25; // Catch-up phase
    
    // Adjust based on income level
    if (income > 100000) baseRate += 5; // Higher earners should save more
    if (income < 40000) baseRate -= 5; // Lower earners need flexibility
    
    // Adjust based on financial situation
    if (hasDebt) baseRate -= 5; // Focus on debt repayment first
    if (!hasEmergencyFund) baseRate += 5; // Build emergency fund quickly
    
    return Math.max(Math.min(baseRate, 40), 10); // Cap between 10-40%
  }
}

export const personalFinanceService = new PersonalFinanceService();