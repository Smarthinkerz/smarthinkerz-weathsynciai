import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface InvestmentProfile {
  userId: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: number; // years
  monthlyInvestmentCapacity: number;
  currentAge: number;
  retirementAge: number;
  totalAssets: number;
  monthlyIncome: number;
  hasEmergencyFund: boolean;
  investmentExperience: 'beginner' | 'intermediate' | 'advanced';
  investmentGoals: string[];
}

export interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  realEstate: number;
  commodities: number;
  cash: number;
  international: number;
  emergingMarkets: number;
  alternatives: number;
}

export interface InvestmentRecommendation {
  symbol: string;
  name: string;
  type: 'ETF' | 'Stock' | 'Bond' | 'REIT' | 'Index Fund';
  allocation: number; // percentage
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number; // annual percentage
  expenseRatio?: number;
}

export interface MarketOpportunity {
  sector: string;
  opportunity: string;
  timeframe: 'short-term' | 'medium-term' | 'long-term';
  riskLevel: 'low' | 'medium' | 'high';
  potentialReturn: string;
  investmentVehicles: string[];
  analysis: string;
  confidence: number; // 0-100
}

export interface PortfolioOptimization {
  currentAllocation: PortfolioAllocation;
  recommendedAllocation: PortfolioAllocation;
  rebalancingActions: string[];
  expectedImprovement: {
    riskReduction: number;
    returnIncrease: number;
    diversificationScore: number;
  };
  timeline: string;
}

export interface InvestmentAnalysis {
  riskProfile: string;
  recommendedPortfolio: PortfolioAllocation;
  specificInvestments: InvestmentRecommendation[];
  marketOpportunities: MarketOpportunity[];
  portfolioOptimization: PortfolioOptimization;
  monthlyInvestmentPlan: {
    emergencyFund: number;
    retirement: number;
    taxable: number;
    education?: number;
  };
  aiInsights: string[];
  nextSteps: string[];
}

export class InvestmentStrategistService {
  /**
   * Generate comprehensive investment analysis for premium users
   */
  async generateInvestmentAnalysis(profile: InvestmentProfile): Promise<InvestmentAnalysis> {
    // Calculate optimal portfolio allocation
    const recommendedPortfolio = this.calculateOptimalAllocation(profile);
    
    // Generate specific investment recommendations
    const specificInvestments = await this.generateInvestmentRecommendations(profile, recommendedPortfolio);
    
    // Identify market opportunities
    const marketOpportunities = await this.identifyMarketOpportunities(profile);
    
    // Create portfolio optimization plan
    const portfolioOptimization = this.generatePortfolioOptimization(profile, recommendedPortfolio);
    
    // Calculate monthly investment plan
    const monthlyInvestmentPlan = this.calculateMonthlyInvestmentPlan(profile);
    
    // Generate AI-powered insights
    const aiInsights = await this.generateAIInsights(profile, recommendedPortfolio);
    
    // Create actionable next steps
    const nextSteps = this.generateNextSteps(profile, specificInvestments);

    return {
      riskProfile: this.determineRiskProfile(profile),
      recommendedPortfolio,
      specificInvestments,
      marketOpportunities,
      portfolioOptimization,
      monthlyInvestmentPlan,
      aiInsights,
      nextSteps
    };
  }

  /**
   * Calculate optimal portfolio allocation based on user profile
   */
  private calculateOptimalAllocation(profile: InvestmentProfile): PortfolioAllocation {
    const { riskTolerance, currentAge, investmentHorizon, hasEmergencyFund } = profile;
    
    // Base allocation using age-based rule of thumb (100 - age = stock percentage)
    let stockPercentage = Math.min(90, Math.max(20, 100 - currentAge));
    
    // Adjust based on risk tolerance
    switch (riskTolerance) {
      case 'conservative':
        stockPercentage = Math.max(20, stockPercentage - 20);
        break;
      case 'aggressive':
        stockPercentage = Math.min(90, stockPercentage + 15);
        break;
      case 'moderate':
        // Keep base allocation
        break;
    }

    // Adjust based on investment horizon
    if (investmentHorizon > 20) {
      stockPercentage = Math.min(90, stockPercentage + 10);
    } else if (investmentHorizon < 5) {
      stockPercentage = Math.max(30, stockPercentage - 15);
    }

    const realEstatePercentage = profile.totalAssets > 100000 ? 10 : 5;
    const internationalPercentage = Math.floor(stockPercentage * 0.3);
    const emergingMarketsPercentage = riskTolerance === 'aggressive' ? 5 : 3;
    const cashPercentage = hasEmergencyFund ? 5 : 10;
    const commoditiesPercentage = 3;
    const alternativesPercentage = 2;
    
    // Ensure minimum stock allocation
    const minDomesticStocks = Math.max(20, stockPercentage - internationalPercentage - emergingMarketsPercentage);
    
    // Calculate bonds as remainder to make portfolio add up to 100%
    const totalOtherAssets = minDomesticStocks + internationalPercentage + emergingMarketsPercentage + 
                            realEstatePercentage + commoditiesPercentage + alternativesPercentage + cashPercentage;
    const bondPercentage = Math.max(15, 100 - totalOtherAssets);
    
    console.log(`Age ${profile.currentAge}: Stock ${stockPercentage}%, Domestic ${minDomesticStocks}%, Bonds ${bondPercentage}%`);

    return {
      stocks: minDomesticStocks,
      bonds: bondPercentage,
      realEstate: realEstatePercentage,
      commodities: commoditiesPercentage,
      cash: cashPercentage,
      international: internationalPercentage,
      emergingMarkets: emergingMarketsPercentage,
      alternatives: alternativesPercentage
    };
  }

  /**
   * Generate specific investment recommendations
   */
  private async generateInvestmentRecommendations(
    profile: InvestmentProfile, 
    allocation: PortfolioAllocation
  ): Promise<InvestmentRecommendation[]> {
    const recommendations: InvestmentRecommendation[] = [];
    const { currentAge, riskTolerance } = profile;

    console.log(`Generating recommendations for age ${currentAge}, allocation:`, allocation);

    // Age-based stock recommendations
    if (allocation.stocks && allocation.stocks > 0) {
      if (currentAge < 40) {
        // Younger investors - more growth-focused
        recommendations.push({
          symbol: "VUG",
          name: "Vanguard Growth ETF",
          type: "ETF",
          allocation: allocation.stocks * 0.5,
          rationale: "Growth stocks for long-term wealth building",
          riskLevel: "medium",
          expectedReturn: 11.5,
          expenseRatio: 0.04
        });

        recommendations.push({
          symbol: "QQQ",
          name: "Invesco QQQ Trust ETF",
          type: "ETF",
          allocation: allocation.stocks * 0.3,
          rationale: "Technology sector exposure for growth",
          riskLevel: "medium",
          expectedReturn: 12,
          expenseRatio: 0.20
        });

        recommendations.push({
          symbol: "VTI",
          name: "Vanguard Total Stock Market ETF",
          type: "ETF",
          allocation: allocation.stocks * 0.2,
          rationale: "Broad market foundation",
          riskLevel: "medium",
          expectedReturn: 10,
          expenseRatio: 0.03
        });
      } else {
        // Older investors - more balanced approach
        recommendations.push({
          symbol: "VOO",
          name: "Vanguard S&P 500 ETF",
          type: "ETF",
          allocation: allocation.stocks * 0.6,
          rationale: "Large-cap stability and dividend growth",
          riskLevel: "medium",
          expectedReturn: 9.5,
          expenseRatio: 0.03
        });

        recommendations.push({
          symbol: "VYM",
          name: "Vanguard High Dividend Yield ETF",
          type: "ETF",
          allocation: allocation.stocks * 0.4,
          rationale: "Dividend income for approaching retirement",
          riskLevel: "low",
          expectedReturn: 8.5,
          expenseRatio: 0.06
        });
      }
    }

    // Bond holdings
    if (allocation.bonds > 0) {
      recommendations.push({
        symbol: "BND",
        name: "Vanguard Total Bond Market ETF",
        type: "ETF",
        allocation: allocation.bonds,
        rationale: "Diversified bond exposure for stability",
        riskLevel: "low",
        expectedReturn: 4.5,
        expenseRatio: 0.05
      });
    }

    // International exposure
    if (allocation.international > 0) {
      recommendations.push({
        symbol: "VTIAX",
        name: "Vanguard Total International Stock Index",
        type: "Index Fund",
        allocation: allocation.international,
        rationale: "Global diversification outside US markets",
        riskLevel: "medium",
        expectedReturn: 8.5,
        expenseRatio: 0.11
      });
    }

    // Real Estate
    if (allocation.realEstate > 0) {
      recommendations.push({
        symbol: "VNQ",
        name: "Vanguard Real Estate ETF",
        type: "REIT",
        allocation: allocation.realEstate,
        rationale: "Real estate exposure for diversification",
        riskLevel: "medium",
        expectedReturn: 7.5,
        expenseRatio: 0.12
      });
    }

    // Emerging Markets (if aggressive profile)
    if (allocation.emergingMarkets > 0) {
      recommendations.push({
        symbol: "VWO",
        name: "Vanguard Emerging Markets ETF",
        type: "ETF",
        allocation: allocation.emergingMarkets,
        rationale: "Higher growth potential in developing markets",
        riskLevel: "high",
        expectedReturn: 11,
        expenseRatio: 0.10
      });
    }

    return recommendations;
  }

  /**
   * Identify current market opportunities using AI analysis
   */
  private async identifyMarketOpportunities(profile: InvestmentProfile): Promise<MarketOpportunity[]> {
    try {
      const prompt = `As an investment strategist, identify current market opportunities for a ${profile.riskTolerance} investor with ${profile.investmentHorizon} year horizon and $${profile.monthlyInvestmentCapacity} monthly investment capacity.

Consider current market conditions, economic trends, and emerging sectors. Provide 4-5 specific opportunities with sectors, timeframes, and investment vehicles.

Format as JSON: {
  "opportunities": [
    {
      "sector": "Technology",
      "opportunity": "AI and Machine Learning Growth",
      "timeframe": "long-term",
      "riskLevel": "medium",
      "potentialReturn": "12-15% annually",
      "investmentVehicles": ["ARKK ETF", "QQQ ETF", "Individual AI stocks"],
      "analysis": "Detailed analysis of why this is an opportunity",
      "confidence": 85
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional investment strategist with expertise in market analysis and opportunity identification. Provide data-driven investment opportunities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.opportunities || [];
    } catch (error) {
      console.error("Market opportunity analysis failed:", error);
      return this.getFallbackOpportunities(profile);
    }
  }

  /**
   * Generate portfolio optimization recommendations
   */
  private generatePortfolioOptimization(
    profile: InvestmentProfile, 
    recommendedAllocation: PortfolioAllocation
  ): PortfolioOptimization {
    // Assume current allocation (this would come from user's actual portfolio in a real app)
    const currentAllocation: PortfolioAllocation = {
      stocks: 50,
      bonds: 30,
      realEstate: 5,
      commodities: 2,
      cash: 10,
      international: 3,
      emergingMarkets: 0,
      alternatives: 0
    };

    const rebalancingActions: string[] = [];
    
    // Generate rebalancing actions
    if (currentAllocation.stocks < recommendedAllocation.stocks) {
      rebalancingActions.push(`Increase stock allocation by ${recommendedAllocation.stocks - currentAllocation.stocks}%`);
    }
    
    if (currentAllocation.international < recommendedAllocation.international) {
      rebalancingActions.push(`Add ${recommendedAllocation.international}% international exposure`);
    }
    
    if (currentAllocation.realEstate < recommendedAllocation.realEstate) {
      rebalancingActions.push(`Increase real estate allocation to ${recommendedAllocation.realEstate}%`);
    }

    return {
      currentAllocation,
      recommendedAllocation,
      rebalancingActions,
      expectedImprovement: {
        riskReduction: 15,
        returnIncrease: 1.2,
        diversificationScore: 85
      },
      timeline: "Implement over 3-6 months to minimize market timing risk"
    };
  }

  /**
   * Calculate monthly investment plan
   */
  private calculateMonthlyInvestmentPlan(profile: InvestmentProfile) {
    const { monthlyInvestmentCapacity, hasEmergencyFund, currentAge } = profile;
    
    let plan = {
      emergencyFund: 0,
      retirement: 0,
      taxable: 0,
      education: undefined as number | undefined
    };

    // Emergency fund allocation (even if they have one, may want to top it up)
    plan.emergencyFund = hasEmergencyFund ? 
      Math.min(monthlyInvestmentCapacity * 0.1, 200) : 
      Math.min(monthlyInvestmentCapacity * 0.3, 800);

    // Retirement savings (age-based allocation)
    const retirementPercentage = currentAge < 40 ? 0.5 : currentAge < 50 ? 0.45 : 0.4;
    plan.retirement = Math.floor(monthlyInvestmentCapacity * retirementPercentage);

    // Remaining goes to taxable accounts
    plan.taxable = monthlyInvestmentCapacity - plan.emergencyFund - plan.retirement;

    // Education savings if applicable (would be determined by user goals)
    if (profile.investmentGoals && profile.investmentGoals.includes('education')) {
      plan.education = Math.min(plan.taxable * 0.3, 500);
      plan.taxable -= plan.education;
    }

    return plan;
  }

  /**
   * Generate AI-powered investment insights
   */
  private async generateAIInsights(
    profile: InvestmentProfile, 
    allocation: PortfolioAllocation
  ): Promise<string[]> {
    try {
      const prompt = `Provide 5 strategic investment insights for a ${profile.currentAge}-year-old ${profile.riskTolerance} investor with $${profile.monthlyInvestmentCapacity} monthly capacity and ${profile.investmentHorizon} year horizon.

Focus on personalized strategies, tax optimization, and long-term wealth building.

Format as JSON: {"insights": ["🎯 Insight 1", "💡 Insight 2", "📈 Insight 3", ...]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a certified financial planner providing personalized investment insights. Focus on actionable, strategic advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 600
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.insights || [];
    } catch (error) {
      console.error("AI insights generation failed:", error);
      return this.getFallbackInsights(profile);
    }
  }

  /**
   * Generate actionable next steps
   */
  private generateNextSteps(
    profile: InvestmentProfile, 
    recommendations: InvestmentRecommendation[]
  ): string[] {
    const steps: string[] = [];

    if (!profile.hasEmergencyFund) {
      steps.push("1. Build emergency fund of 3-6 months expenses in high-yield savings");
    }

    steps.push("2. Open tax-advantaged accounts (401k, IRA) if not already available");
    
    if (recommendations.length > 0) {
      steps.push(`3. Start with core holdings: ${recommendations.slice(0, 2).map(r => r.symbol).join(', ')}`);
    }

    steps.push("4. Set up automatic monthly investments to maintain consistency");
    steps.push("5. Review and rebalance portfolio quarterly");

    if (profile.investmentExperience === 'beginner') {
      steps.push("6. Continue investment education through reputable financial resources");
    }

    return steps;
  }

  /**
   * Determine risk profile description
   */
  private determineRiskProfile(profile: InvestmentProfile): string {
    const { riskTolerance, investmentHorizon, currentAge } = profile;
    
    if (riskTolerance === 'conservative' || investmentHorizon < 5) {
      return "Conservative investor focused on capital preservation with steady, lower-risk returns";
    } else if (riskTolerance === 'aggressive' && investmentHorizon > 15) {
      return "Aggressive growth investor comfortable with volatility for higher long-term returns";
    } else {
      return "Moderate investor balancing growth potential with reasonable risk management";
    }
  }

  /**
   * Fallback market opportunities if AI fails
   */
  private getFallbackOpportunities(profile: InvestmentProfile): MarketOpportunity[] {
    return [];
  }

  /**
   * Fallback insights if AI fails
   */
  private getFallbackInsights(profile: InvestmentProfile): string[] {
    return [];
  }
}

export const investmentStrategistService = new InvestmentStrategistService();