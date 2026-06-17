import { useState } from 'react';
import { Bot, X, Mail, Calendar, FileText, Send, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Message = {
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTaskSelect = (task: string) => {
    setSelectedTask(task);
    setIsOpen(true);
    // Add initial message based on selected task
    const initialMessage = {
      text: getInitialMessage(task),
      sender: 'assistant' as const,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  };

  const getInitialMessage = (task: string) => {
    switch (task) {
      case 'email':
        return "I'll help you draft an email. What's the purpose of the email?";
      case 'meeting':
        return "Let's schedule a meeting. What's the meeting about?";
      case 'business':
        return "I'll help you create a business plan. Please provide the business name and industry separated by a comma (e.g., 'Tech Solutions, Software Development')";
      case 'roadmap':
        return "I'll help you create a growth roadmap. Please provide your company name, main business goals, and current location separated by commas (e.g., 'Tech Solutions, expand to new markets and double revenue, New York')";
      default:
        return "How can I help you today?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let endpoint = '/api/virtual-assistant/chat';
      let requestData: any = {
        task: selectedTask,
        input: inputMessage,
      };

      // Use specific endpoints for different tasks
      if (selectedTask === 'email') {
        endpoint = '/api/virtual-assistant/generate-email';
        requestData = {
          purpose: inputMessage,
        };
      } else if (selectedTask === 'meeting') {
        endpoint = '/api/virtual-assistant/generate-meeting';
        requestData = {
          purpose: inputMessage,
        };
      } else if (selectedTask === 'business') {
        const [businessName, industry] = inputMessage.split(',').map(str => str.trim());
        if (!businessName || !industry) {
          throw new Error("Please provide both business name and industry separated by a comma");
        }

        endpoint = '/api/virtual-assistant/generate-business-plan';
        requestData = {
          businessName,
          industry,
          targetMarket: 'Global',
          businessModel: 'Standard',
          uniqueSellingProposition: 'TBD',
          competitorAnalysis: 'Pending',
          financialProjections: 'In Progress',
          marketingStrategy: 'To be developed'
        };
      } else if (selectedTask === 'roadmap') {
        const [companyName, goals, location] = inputMessage.split(',').map(str => str.trim());
        if (!companyName || !goals || !location) {
          throw new Error("Please provide company name, goals, and location separated by commas");
        }

        endpoint = '/api/virtual-assistant/generate-roadmap';
        requestData = {
          companyName,
          goals,
          location,
          resources: ['existing team', 'current technology', 'market presence'],
          timeframe: '12 months'
        };
      }

      console.log('Sending request to:', endpoint, requestData);
      const response = await apiRequest('POST', endpoint, requestData);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      const assistantMessage: Message = {
        text: data.response || data.plan || "I couldn't process that request.",
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If the response indicates simplified mode, show a toast
      if (assistantMessage.text.includes("simplified mode") || assistantMessage.text.includes("simplified assistant mode")) {
        toast({
          title: "Operating in Simplified Mode",
          description: "I'm currently using pre-defined responses due to high demand. I'll still try my best to help you!",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get response from the assistant";

      toast({
        title: "AI Assistant Error",
        description: errorMessage,
        variant: "destructive",
      });

      const assistantMessage: Message = {
        text: errorMessage.includes("quota exceeded") || errorMessage.includes("simplified mode")
          ? "I'm currently operating in simplified mode, but I can still help you with basic tasks. What would you like to do?"
          : errorMessage,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-[400px] h-[500px] p-4 shadow-lg relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Virtual Assistant</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 h-[380px] mb-4 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Bot className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleTaskSelect('email')}>
              <Mail className="mr-2 h-4 w-4" />
              Draft Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTaskSelect('meeting')}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTaskSelect('business')}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Business Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTaskSelect('roadmap')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Growth Roadmap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}