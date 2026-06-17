import { Request, Response } from "express";
import OpenAI from "openai";
import { storage } from "../storage";
import { SubscriptionTier } from "@shared/schema";
import { getWebsiteContent } from "../services/web-scraper";
import { sendEmail, scheduleAppointment } from "../services/email-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// URL pattern to detect when users are asking about websites
const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/[^\s]*)?/i;
const websiteQueryPattern = /(?:tell me about|analyze|info on|information about|what is|who is|website|check out|look at|details on)\s+(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/[^\s]*)?/i;

/**
 * Advanced AI Chatbot endpoint that provides different capabilities based on subscription tier
 * Premium users get unlimited interactions, multi-language support, sentiment analysis, knowledge base integration, 
 * and personalized experiences with extended context retention
 */
export async function handleAdvancedChatbot(req: Request, res: Response) {
  // Check for company or user authentication
  const isCompanyAuth = req.session && req.session.company;
  const isUserAuth = req.isAuthenticated();
  
  if (!isCompanyAuth && !isUserAuth) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    // Determine if the user is premium
    let isPremium = false;
    let userOrCompanyContext: Record<string, any> = {};
    
    if (isCompanyAuth) {
      // Check company subscription tier
      const companyId = req.session.company.id;
      const company = await storage.getCompany(companyId);
      isPremium = company && (company.subscriptionTier === SubscriptionTier.PREMIUM || company.subscriptionTier === SubscriptionTier.ELITE || company.subscriptionTier === SubscriptionTier.ENTERPRISE);
      
      // Add company context for more relevant responses
      if (company) {
        userOrCompanyContext = {
          companyName: company.name,
          industry: company.industry || "",
          size: company.size || "",
          location: company.country || company.city || "unspecified"
        };
      }
    } else if (isUserAuth && req.user) {
      // Check user subscription tier
      isPremium = req.user.subscriptionTier === 'premium' || req.user.subscriptionTier === 'elite' || req.user.subscriptionTier === 'enterprise';
      
      // Add user context
      userOrCompanyContext = {
        userId: req.user.id,
        skills: req.user.skills || []
      };
    }
    
    const { 
      message, 
      sessionId, 
      requestContext, 
      chatHistory, 
      languagePreference, 
      knowledgeSource,
      imageUrl,
      websiteUrl: directWebsiteUrl // Get the website URL directly from the request if provided
    } = req.body;
    
    if (!message && !imageUrl) {
      return res.status(400).json({ error: "Message or image input is required" });
    }
    
    console.log(`Processing advanced chat request (Premium: ${isPremium ? 'Yes' : 'No'}, Language: ${languagePreference || 'default'})`, 
      message ? (message.substring(0, 100) + (message.length > 100 ? '...' : '')) : 'Image input');
    
    // Create system message based on premium status, context, and language preference
    const language = languagePreference || 'English';
    let systemMessage = isPremium
      ? `You are an advanced AI business assistant with expertise in market analysis, business strategy, competitive intelligence, and financial planning. Provide detailed, data-driven responses with actionable insights. Respond in ${language}.`
      : `You are a helpful AI business assistant. Provide concise and useful information. Respond in ${language}.`;
    
    // Add context to system message
    if (Object.keys(userOrCompanyContext).length > 0) {
      systemMessage += " Context: " + JSON.stringify(userOrCompanyContext);
    }
    
    if (requestContext) {
      systemMessage += " Additional context: " + requestContext;
    }
    
    // Add knowledge source if provided (premium feature)
    if (isPremium && knowledgeSource) {
      systemMessage += " Reference the following knowledge source for your response: " + knowledgeSource;
    }
    
    // For non-premium users, enforce message limit check
    if (!isPremium) {
      // In a real implementation, you would check the database for message count
      console.log("Non-premium user - basic chatbot experience");
    }
    
    // Check if the message is asking about a website (premium feature)
    let websiteData = null;
    const isWebsiteQuery = isPremium && websiteQueryPattern.test(message);
    const directUrlMatch = message.match(urlPattern);
    const websiteMatch = message.match(websiteQueryPattern);
    
    // Check for appointment/email patterns (premium features)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const timePattern = /\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight|(\d{1,2})\s*o'?clock)\b/i;
    const appointmentPattern = /\b(?:schedule|set up|arrange|book|create|make|organize|plan|send)\s+(?:an?\s+)?(?:appointment|meeting|call|session|interview|consultation|event|reminder|email|message|notification)\b/i;
    
    // Extract email addresses from the message
    const emailMatches = message.match(new RegExp(emailPattern, 'g')) || [];
    const emailAddresses = emailMatches.map(email => email.toLowerCase());
    
    // Check if this is an appointment/email request
    const isAppointmentRequest = isPremium && appointmentPattern.test(message);
    const hasEmailAddress = emailAddresses.length > 0;
    const hasTimeReference = timePattern.test(message);
    
    // Extract URL if the message contains a website reference or if directly provided
    const hasWebsiteUrl = isWebsiteQuery || (isPremium && directUrlMatch) || (isPremium && directWebsiteUrl);
    const websiteUrl = directWebsiteUrl || (hasWebsiteUrl ? (websiteMatch?.[1] || directUrlMatch?.[1] || "") : "");
    
    // If premium user is asking about a website or provided a direct URL, fetch its content
    if (isPremium && websiteUrl) {
      console.log(`Detected website query: ${websiteUrl}`);
      
      try {
        // Use the web scraper to get website content
        websiteData = await getWebsiteContent(websiteUrl);
        
        if (websiteData.status === 'success') {
          // Add website data to the context for the AI
          systemMessage += `\n\nHere is information about the website ${websiteUrl} that ${directWebsiteUrl ? "was provided for analysis" : "the user is asking about"}:
          
Title: ${websiteData.title}
Description: ${websiteData.description}
Key technologies detected: ${websiteData.metadata?.technologies?.join(', ') || 'Not detected'}
${websiteData.metadata?.contactInfo?.emails?.length ? 'Contact emails: ' + websiteData.metadata.contactInfo.emails.join(', ') : ''}
${websiteData.metadata?.contactInfo?.phones?.length ? 'Contact phones: ' + websiteData.metadata.contactInfo.phones.join(', ') : ''}

Website Content Summary:
${websiteData.content.substring(0, 1500)}${websiteData.content.length > 1500 ? '...' : ''}

When responding, incorporate insights from this website data to provide a comprehensive analysis. Address the specific aspects the user is asking about based on this real data.`;
        } else {
          systemMessage += `\n${directWebsiteUrl ? `You were asked to analyze the website ${websiteUrl}` : `The user asked about the website ${websiteUrl}`}, but we couldn't retrieve its content due to an error: ${websiteData.error}. Please inform them about this issue.`;
        }
      } catch (error) {
        console.error(`Error fetching website data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        systemMessage += `\n${directWebsiteUrl ? `You were asked to analyze the website ${websiteUrl}` : `The user asked about the website ${websiteUrl}`}, but we encountered an error retrieving its content. Please inform them about this issue.`;
      }
    }
    
    // Prepare the messages for OpenAI
    const messages: Array<{role: string, content: any}> = [
      { role: "system", content: systemMessage }
    ];
    
    // Add chat history if available (limited for non-premium users)
    if (chatHistory && Array.isArray(chatHistory)) {
      const limitedHistory = isPremium ? chatHistory : chatHistory.slice(-3);
      messages.push(...limitedHistory);
    }
    
    // Add current message based on input type
    if (imageUrl && isPremium) {
      // For premium users, support image input
      messages.push({
        role: "user",
        content: [
          { type: "text", text: message || "What can you tell me about this image?" },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      });
    } else {
      // Text-only message
      messages.push({ role: "user", content: message });
    }
    
    // Generate response with OpenAI
    let assistantResponse;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: messages as any,
        temperature: isPremium ? 0.7 : 0.9,
        max_tokens: isPremium ? 2500 : 1000,
      });
      
      assistantResponse = response.choices[0].message.content;
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      
      // Check if it's a rate limit or quota error
      if (openaiError instanceof Error && 
          (openaiError.message.includes("rate limit") || 
           openaiError.message.includes("quota") || 
           (openaiError as any).status === 429)) {
        
        // Create a friendly error message for the user
        if (websiteData && websiteData.status === 'success') {
          // At least provide analysis of the website based on scraped data
          assistantResponse = `I'm currently experiencing high demand and couldn't process your full request due to rate limits. However, I've analyzed the website ${websiteUrl} for you.
          
Website: ${websiteData.title}
Description: ${websiteData.description}
${websiteData.metadata?.technologies?.length > 0 ? 'Technologies used: ' + websiteData.metadata.technologies.join(', ') : ''}
${websiteData.metadata?.contactInfo?.emails?.length > 0 ? 'Contact email(s): ' + websiteData.metadata.contactInfo.emails.join(', ') : ''}

Please try again later when our systems are less busy.`;
        } else {
          // Generic error with a helpful message
          assistantResponse = "I'm currently experiencing high demand and couldn't process your request due to API rate limits. Please try again in a few moments when our systems are less busy.";
        }
      } else {
        // For other errors, provide a generic message
        assistantResponse = "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.";
        throw openaiError; // Re-throw to log the full error stack
      }
    }
    
    // Handle appointment setting and email sending for premium users
    let appointmentResult = null;
    let emailResult = null;
    
    if (isPremium && isAppointmentRequest && hasEmailAddress && hasTimeReference) {
      // Try to extract time from the message
      const timeMatch = message.match(timePattern);
      const timeStr = timeMatch ? timeMatch[0] : null;
      
      // Determine if this is an appointment or email request
      const isAppointmentWithTime = timeStr && appointmentPattern.test(message);
      
      if (isAppointmentWithTime) {
        // Extract a simple subject from the message
        let subject = "Meeting from WealthSync AI";
        const subjectMatch = message.match(/(?:about|regarding|concerning|for|on)\s+(.{5,40}?)(?:\s+with|\s+at|\s+on|\.|$)/i);
        if (subjectMatch) {
          subject = subjectMatch[1];
        }
        
        // Create appointment time (default to 1 hour duration)
        const now = new Date();
        let appointmentTime = new Date();
        
        // Simple time parsing for demo purposes
        // In production, use a proper date-time parsing library
        if (timeStr) {
          try {
            // Very basic time parsing
            const hour = parseInt(timeStr.match(/\d{1,2}/)[0]);
            const isPM = /pm/i.test(timeStr);
            
            appointmentTime.setHours(isPM && hour < 12 ? hour + 12 : hour);
            appointmentTime.setMinutes(0);
            appointmentTime.setSeconds(0);
            
            // If the time has already passed today, set it for tomorrow
            if (appointmentTime <= now) {
              appointmentTime.setDate(appointmentTime.getDate() + 1);
            }
          } catch (e) {
            console.error("Error parsing appointment time:", e);
          }
        }
        
        // Calculate end time (1 hour after start)
        const endTime = new Date(appointmentTime);
        endTime.setHours(endTime.getHours() + 1);
        
        // Get organizer email - use the first email in the message or a default
        const organizerEmail = "noreply@wealthsync.ai";
        
        try {
          // Try to schedule the appointment
          appointmentResult = await scheduleAppointment(
            organizerEmail,
            emailAddresses,
            subject,
            `This meeting was scheduled via WealthSync AI Assistant.\n\nOriginal request: "${message}"`,
            appointmentTime.toISOString(),
            endTime.toISOString(),
            "Virtual Meeting"
          );
          
          // Append to the AI response that appointment was processed
          if (appointmentResult.success) {
            assistantResponse += `\n\n✅ I've scheduled an appointment for ${appointmentTime.toLocaleString()} with ${emailAddresses.join(', ')}. Calendar invitations have been sent.`;
          } else {
            assistantResponse += `\n\n❗ I tried to schedule the appointment but encountered an issue: ${appointmentResult.message}. You may need to set up email configuration in the app settings.`;
          }
        } catch (error) {
          console.error("Error scheduling appointment:", error);
          assistantResponse += "\n\n❗ I tried to schedule the appointment but encountered a technical error. Please try again later or contact support.";
        }
      } else if (hasEmailAddress && message.toLowerCase().includes("email")) {
        // This appears to be an email request, not a calendar invite
        const emailSubject = "Message from WealthSync AI";
        const emailBody = `This email was sent via WealthSync AI Assistant based on your request.\n\nOriginal request: "${message}"`;
        
        try {
          // Try to send the email
          emailResult = await sendEmail(
            emailAddresses[0],
            emailSubject,
            emailBody
          );
          
          // Append to the AI response that email was processed
          if (emailResult.success) {
            assistantResponse += `\n\n✅ I've sent an email to ${emailAddresses[0]} as requested.`;
          } else {
            assistantResponse += `\n\n❗ I tried to send the email but encountered an issue: ${emailResult.message}. You may need to set up email configuration in the app settings.`;
          }
        } catch (error) {
          console.error("Error sending email:", error);
          assistantResponse += "\n\n❗ I tried to send the email but encountered a technical error. Please try again later or contact support.";
        }
      }
    }
    
    // Perform sentiment analysis on user input for premium users
    let sentimentData = null;
    if (isPremium && message) {
      // In a production app, this would be a call to a sentiment analysis service
      // For demo purposes, we're using a simple positive/negative word check
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'happy', 'satisfied'];
      const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'angry'];
      
      const messageLower = message.toLowerCase();
      const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length;
      
      sentimentData = {
        positive: positiveCount > 0,
        negative: negativeCount > 0,
        neutral: positiveCount === 0 && negativeCount === 0,
        score: positiveCount - negativeCount
      };
    }
    
    // Record interaction for analytics (in a real app, this would be stored in a database)
    console.log("Advanced chat response generated successfully");
    
    // Add website scanning to available features if used
    const premiumFeatures = [
      "unlimited_interactions",
      "multi_language",
      "sentiment_analysis",
      "knowledge_base",
      "image_recognition",
      "extended_context",
      "email_integration",
      "calendar_scheduling"
    ];
    
    if (websiteData && websiteData.status === 'success') {
      premiumFeatures.push("website_analysis");
    }
    
    // Add email and appointment specific features
    if (appointmentResult) {
      premiumFeatures.push("appointment_scheduling");
    }
    
    if (emailResult) {
      premiumFeatures.push("email_sending");
    }
    
    res.json({ 
      response: assistantResponse,
      context: isPremium ? "Business intelligence and market analytics" : undefined,
      premium: isPremium,
      sentiment: sentimentData,
      sessionId: sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      availableFeatures: isPremium ? premiumFeatures : [
        "basic_assistance",
        "limited_interactions"
      ],
      websiteAnalyzed: websiteData ? websiteData.url : null
    });
  } catch (error) {
    console.error("Failed to generate advanced chat response:", error);
    res.status(500).json({
      error: "Failed to generate chat response",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}