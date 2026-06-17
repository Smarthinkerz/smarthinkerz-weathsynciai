import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PredictiveInsights {
  predictedGrowth: string;
  growthSectors: string[];
  investmentOpportunities: string[];
  riskFactors: string[];
  timeframe: string;
  confidenceScore: number;
}

export async function generateRegionalInsights(
  country: string,
  economicData: {
    economicGrowth: string;
    marketSize: string;
    regulatoryScore: string;
    dataSource: 'WorldBank' | 'IMF' | 'OECD' | 'UN' | 'National';
    lastUpdated: string;
  }
): Promise<PredictiveInsights & { dataValidation: { source: string; timestamp: string; verified: boolean } }> {
  try {
    const prompt = `Analyze the following economic data for ${country}:
      - Economic Growth: ${economicData.economicGrowth}
      - Market Size: ${economicData.marketSize}
      - Regulatory Environment: ${economicData.regulatoryScore}
      
      Provide a detailed predictive analysis in JSON format with the following information:
      - Predicted growth rate for the next 2 years
      - Key growth sectors
      - Specific investment opportunities
      - Potential risk factors
      - Analysis timeframe
      - Confidence score (0-1)
      
      Focus on practical, data-driven insights for business decision-making.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    return {
      predictedGrowth: analysis.predictedGrowth,
      growthSectors: analysis.growthSectors,
      investmentOpportunities: analysis.investmentOpportunities,
      riskFactors: analysis.riskFactors,
      timeframe: analysis.timeframe,
      confidenceScore: analysis.confidenceScore
    };
  } catch (error) {
    console.error('Error generating AI insights:', error);
    throw error;
  }
}
