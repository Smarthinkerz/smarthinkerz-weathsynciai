import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SERVICE_UNAVAILABLE_MSG = "The AI service is temporarily unavailable. Please try again in a few moments.";

// Rate limiting setup
const rateLimiter = {
  tokens: 50,
  lastRefill: Date.now(),
  maxTokens: 50,
  refillRate: 10, // tokens per second
  refillInterval: 1000, // 1 second
};

async function checkRateLimit() {
  const now = Date.now();
  const timePassed = now - rateLimiter.lastRefill;
  
  if (timePassed >= rateLimiter.refillInterval) {
    const periods = Math.floor(timePassed / rateLimiter.refillInterval);
    const tokensToAdd = periods * rateLimiter.refillRate;
    rateLimiter.tokens = Math.min(rateLimiter.maxTokens, rateLimiter.tokens + tokensToAdd);
    rateLimiter.lastRefill = now - (timePassed % rateLimiter.refillInterval);
  }

  if (rateLimiter.tokens < 1) {
    const waitTime = Math.ceil((rateLimiter.refillInterval - (now - rateLimiter.lastRefill)) / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
  }

  rateLimiter.tokens -= 1;
}

function handleOpenAIError(error: any, fallbackGenerator?: () => string): string {
  console.error("OpenAI API Error:", error);

  if (fallbackGenerator) {
    console.log("Using fallback response generator");
    return fallbackGenerator();
  }

  if (error?.status === 429) {
    throw new Error("API quota exceeded. Using simplified assistant mode.");
  } else if (error?.status === 500) {
    throw new Error("Service is currently experiencing issues. Using simplified assistant mode.");
  } else {
    throw new Error(error?.message || "Failed to process your request. Using simplified assistant mode.");
  }
}

export async function generateEmailDraft(data: {
  purpose: string;
  recipient?: string;
  context?: string;
}): Promise<string> {
  try {
    await checkRateLimit();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional email writer. Write clear, concise, and professional emails based on the given purpose and context.",
        },
        {
          role: "user",
          content: `Please draft an email with the following details:
            Purpose: ${data.purpose}
            ${data.recipient ? `Recipient: ${data.recipient}` : ''}
            ${data.context ? `Additional Context: ${data.context}` : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Failed to generate email draft";
  } catch (error) {
    return handleOpenAIError(error, () => SERVICE_UNAVAILABLE_MSG);
  }
}

export async function generateMeetingSchedule(data: {
  purpose: string;
  participants?: string;
  duration?: string;
  preferences?: string;
}): Promise<string> {
  try {
    await checkRateLimit();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional meeting coordinator. Help schedule meetings efficiently based on the given information.",
        },
        {
          role: "user",
          content: `Please suggest a meeting schedule for:
            Purpose: ${data.purpose}
            ${data.participants ? `Participants: ${data.participants}` : ''}
            ${data.duration ? `Duration: ${data.duration}` : ''}
            ${data.preferences ? `Preferences: ${data.preferences}` : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Failed to generate meeting schedule";
  } catch (error) {
    return handleOpenAIError(error, () => SERVICE_UNAVAILABLE_MSG);
  }
}

export async function generateBusinessPlan(data: {
  businessName: string;
  industry: string;
  targetMarket?: string;
  businessModel?: string;
  uniqueSellingProposition?: string;
  competitorAnalysis?: string;
  financialProjections?: string;
  marketingStrategy?: string;
}): Promise<string> {
  try {
    if (!data.businessName || !data.industry) {
      throw new Error("Missing required fields: business name and industry");
    }

    await checkRateLimit();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional business consultant specializing in creating detailed business plans. Create a comprehensive business plan based on the provided information.",
        },
        {
          role: "user",
          content: `Please create a detailed business plan for the following business:
            Business Name: ${data.businessName}
            Industry: ${data.industry}
            Target Market: ${data.targetMarket || 'Global'}
            Business Model: ${data.businessModel || 'Standard'}
            Unique Selling Proposition: ${data.uniqueSellingProposition || 'To be determined'}
            Competitor Analysis: ${data.competitorAnalysis || 'In progress'}
            Financial Projections: ${data.financialProjections || 'To be developed'}
            Marketing Strategy: ${data.marketingStrategy || 'To be planned'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "Failed to generate business plan";
  } catch (error) {
    return handleOpenAIError(error, () => SERVICE_UNAVAILABLE_MSG);
  }
}

export async function getAssistantResponse(task: string, input: string): Promise<string> {
  try {
    await checkRateLimit();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant specializing in ${task}. Provide detailed and professional responses.`,
        },
        {
          role: "user",
          content: input,
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Failed to generate response";
  } catch (error) {
    // For general assistant responses, we'll use a simple fallback
    return handleOpenAIError(error, () =>
      "I'm currently operating in simplified mode due to high demand. I can still help with basic tasks like email drafting, meeting scheduling, and business planning. Please try again or choose a specific task from the menu."
    );
  }
}

export async function generateGrowthRoadmap(data: {
  companyName: string;
  goals: string;
  location: string;
  resources: string[];
  currentMarket?: string;
  industryFocus?: string;
  timeframe?: string;
}): Promise<string> {
  try {
    await checkRateLimit();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a business growth strategist specializing in creating detailed, actionable growth roadmaps. Focus on practical steps and realistic timelines based on the company's current position and available resources.",
        },
        {
          role: "user",
          content: `Please create a detailed growth roadmap for:
            Company: ${data.companyName}
            Current Location: ${data.location}
            Business Goals: ${data.goals}
            Available Resources: ${data.resources.join(', ')}
            ${data.currentMarket ? `Current Market: ${data.currentMarket}` : ''}
            ${data.industryFocus ? `Industry Focus: ${data.industryFocus}` : ''}
            ${data.timeframe ? `Desired Timeframe: ${data.timeframe}` : ''}

            Include:
            1. Strategic Expansion Plan
            2. Market Analysis & Opportunities
            3. Resource Allocation Strategy
            4. Risk Assessment
            5. Implementation Timeline
            6. Key Performance Indicators
            7. Financial Projections
            8. Recommended Partnerships`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "Failed to generate growth roadmap";
  } catch (error) {
    return handleOpenAIError(error, () => SERVICE_UNAVAILABLE_MSG);
  }
}