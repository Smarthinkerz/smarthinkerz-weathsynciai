import OpenAI from "openai";
import { Request, Response } from "express";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getCustomRecommendations(req: Request, res: Response) {
  try {
    if (!req.user || (req.user.subscriptionTier !== 'premium' && req.user.subscriptionTier !== 'elite' && req.user.subscriptionTier !== 'enterprise')) {
      return res.status(403).json({ error: 'Elite subscription required' });
    }

    const { industry, region, marketMetrics } = req.body;

    const prompt = `As an AI business intelligence expert, analyze the following market data and provide strategic recommendations:

Industry: ${industry}
Region: ${region}
Market Metrics:
- Market Size: ${marketMetrics.marketSize}
- Growth Rate: ${marketMetrics.growthRate}%
- Market Share: ${marketMetrics.marketShare}%

Provide recommendations in JSON format with the following structure:
{
  "strategicRecommendations": [
    { "title": "string", "description": "string", "priority": "high|medium|low" }
  ],
  "riskMitigations": [
    { "risk": "string", "mitigation": "string", "impact": "high|medium|low" }
  ],
  "nextSteps": [
    { "action": "string", "timeline": "string" }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const recommendations = JSON.parse(response.choices[0].message.content);
    
    return res.json(recommendations);
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
