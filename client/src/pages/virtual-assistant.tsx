import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Calendar, Mail, FileText, MessageSquare, Sparkles, ArrowLeft } from "lucide-react";
import { BusinessPlanGenerator } from "@/components/virtual-assistant/business-plan-generator";
import { MeetingScheduler } from "@/components/virtual-assistant/meeting-scheduler";
import { EmailDrafter } from "@/components/virtual-assistant/email-drafter";
import AdvancedAIChatbot from "@/components/virtual-assistant/advanced-ai-chatbot";
import { useAuth } from "@/hooks/use-auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLocation } from "wouter";

export default function VirtualAssistantPage() {
  const { company, user } = useAuth();
  const isPremium = isHighTier(company?.subscriptionTier) || isHighTier(user?.subscriptionTier);
  const [, setLocation] = useLocation();
  
  // Determine where to go back to
  const handleBackClick = () => {
    if (company) {
      setLocation('/company/dashboard');
    } else {
      setLocation('/dashboard');
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-0 hover:bg-transparent" 
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <h1 className="text-3xl font-bold">AI Virtual Assistant</h1>
        </div>
        
        {isPremium && (
          <div className="flex items-center">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center">
              <Sparkles className="h-4 w-4 mr-1" />
              Premium Features Enabled
            </span>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="advanced-chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="advanced-chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Chat
            {isPremium && <span className="ml-1 text-xs text-primary">✦</span>}
          </TabsTrigger>
          <TabsTrigger value="business-plan">
            <FileText className="h-4 w-4 mr-2" />
            Business Plan
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-2" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advanced-chat" className="h-[calc(100vh-15rem)]">
          <AdvancedAIChatbot />
          {!isPremium && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div className="text-sm text-amber-800">
                <strong>Premium Feature:</strong> Upgrade to unlock unlimited AI interactions, image analysis, multilingual support, and personalized responses.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="business-plan">
          <Card>
            <CardHeader>
              <CardTitle>Business Plan Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessPlanGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Scheduler</CardTitle>
            </CardHeader>
            <CardContent>
              <MeetingScheduler />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Email Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailDrafter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
