import {
  generateBusinessPlan as openaiBusinessPlan,
  generateGrowthRoadmap as openaiGrowthRoadmap,
  generateEmailDraft as openaiEmailDraft,
  generateMeetingSchedule as openaiMeetingSchedule,
  getAssistantResponse as openaiAssistantResponse
} from "./openai-service";

export async function generateBusinessPlan(data: any): Promise<string> {
  return openaiBusinessPlan({
    businessName: data.businessName || data.name || "Unnamed Business",
    industry: data.industry || "General",
    targetMarket: data.targetMarket,
    businessModel: data.businessModel,
    uniqueSellingProposition: data.uniqueSellingProposition,
    competitorAnalysis: data.competitorAnalysis,
    financialProjections: data.financialProjections,
    marketingStrategy: data.marketingStrategy,
  });
}

export async function generateGrowthRoadmap(data: any): Promise<string> {
  return openaiGrowthRoadmap({
    companyName: data.companyName || data.name || "Company",
    goals: data.goals || "Growth",
    location: data.location || "Global",
    resources: data.resources || [],
    currentMarket: data.currentMarket,
    industryFocus: data.industryFocus,
    timeframe: data.timeframe,
  });
}

export async function generateEmailDraft(data: any): Promise<string> {
  return openaiEmailDraft({
    purpose: data.purpose || data.message || "General inquiry",
    recipient: data.recipient,
    context: data.context,
  });
}

export async function generateMeetingSchedule(data: any): Promise<string> {
  return openaiMeetingSchedule({
    purpose: data.purpose || data.topic || "Meeting",
    participants: data.participants,
    duration: data.duration,
    preferences: data.preferences,
  });
}

export async function getAssistantResponse(data: any): Promise<string> {
  const task = data.task || data.type || "general assistance";
  const input = data.input || data.message || data.query || "";
  return openaiAssistantResponse(task, input);
}
