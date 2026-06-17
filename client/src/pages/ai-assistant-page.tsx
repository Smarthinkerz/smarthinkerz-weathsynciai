import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Brain, Send, Loader2, Trash2, Bot, User, Sparkles } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function AiAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [agentType, setAgentType] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history = [] } = useQuery({
    queryKey: ["/api/conversation-history", agentType],
    queryFn: async () => {
      const res = await fetch(`/api/conversation-history/${agentType}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: profile } = useQuery({ queryKey: ["/api/ai-profile"] });

  useEffect(() => {
    if (history && (history as any[]).length > 0) {
      setMessages([...(history as any[])].reverse().map((h: any) => ({ role: h.role, content: h.content, timestamp: h.createdAt })));
    }
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest("POST", "/api/ai-chat-with-memory", { message: msg, agentType });
      return res.json();
    },
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      queryClient.invalidateQueries({ queryKey: ["/api/conversation-history", agentType] });
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again." }]);
    }
  });

  const clearMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/conversation-history/${agentType}`); },
    onSuccess: () => {
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/conversation-history", agentType] });
      toast({ title: "Conversation cleared" });
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: message }]);
    chatMutation.mutate(message);
    setMessage("");
  };

  const agents = [
    { value: "general", label: "General Assistant", desc: "Business intelligence & strategy" },
    { value: "market_analysis", label: "Market Analyst", desc: "Market trends & opportunities" },
    { value: "risk_assessment", label: "Risk Advisor", desc: "Risk evaluation & mitigation" },
    { value: "trade_flow", label: "Trade Analyst", desc: "Global trade patterns" },
    { value: "startup_health", label: "Startup Advisor", desc: "Startup metrics & health" },
    { value: "investment", label: "Investment Strategist", desc: "Portfolio & investment analysis" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="h-8 w-8 text-primary" /> AI Assistant</h1>
          <p className="text-muted-foreground mt-1">Smart AI with conversation memory and personalized insights</p>
        </div>

        <div className="flex gap-4 mb-4 items-center">
          <Select value={agentType} onValueChange={(v) => { setAgentType(v); setMessages([]); }}>
            <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {agents.map(a => (
                <SelectItem key={a.value} value={a.value}>
                  <div><span className="font-medium">{a.label}</span><br /><span className="text-xs text-muted-foreground">{a.desc}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {profile && (
            <div className="flex gap-2">
              <Badge variant="outline">Risk: {(profile as any).riskPreference}</Badge>
              <Badge variant="outline">Style: {(profile as any).communicationStyle}</Badge>
            </div>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearMutation.mutate()} className="ml-auto">
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <Card className="min-h-[500px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Sparkles className="h-12 w-12 text-primary/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me anything about business intelligence, market analysis, or strategy. I remember our conversations for personalized insights.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="bg-muted rounded-lg px-4 py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
            <div ref={scrollRef} />
          </CardContent>
          <div className="border-t p-4">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask anything about business intelligence..." className="flex-1" disabled={chatMutation.isPending} />
              <Button type="submit" disabled={!message.trim() || chatMutation.isPending}>
                {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
