import { isHighTier } from '@shared/schema';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Image, Paperclip, Sparkles, Upload, Plus, Settings2, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  context?: string;
}

interface ChatbotResponse {
  response: string;
  premium: boolean;
  sentiment?: {
    positive: boolean;
    negative: boolean;
    neutral: boolean;
    score: number;
  } | null;
  context?: string;
  sessionId: string;
  timestamp: string;
  availableFeatures: string[];
}

// URL patterns to detect when users are asking about websites
const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/[^\s]*)?/i;
const websiteQueryPattern = /(?:tell me about|analyze|info on|information about|what is|who is|website|check out|look at|details on)\s+(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/[^\s]*)?/i;

const AdvancedAIChatbot: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [languagePreference, setLanguagePreference] = useState('English');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customContext, setCustomContext] = useState('');
  const [directWebsiteUrl, setDirectWebsiteUrl] = useState('');
  const { toast } = useToast();
  const { company } = useAuth();
  const isPremium = isHighTier(company?.subscriptionTier);
  
  // Initialize a default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultSession: ChatSession = {
        id: `session_${Date.now()}`,
        name: 'New Conversation',
        messages: [
          {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: isPremium 
              ? 'Welcome to the premium AI chatbot! You have unlimited interactions, personalized assistance, and advanced features. How can I assist you today?'
              : 'Welcome to the AI chatbot! How can I assist you today?',
            timestamp: new Date()
          }
        ],
      };
      
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
    }
  }, [sessions.length, isPremium]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  // Get the current active session
  const activeSession = sessions.find(session => session.id === activeSessionId) || sessions[0];

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: `Conversation ${sessions.length + 1}`,
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'system',
          content: isPremium 
            ? 'Welcome to the premium AI chatbot! You have unlimited interactions, personalized assistance, and advanced features. How can I assist you today?'
            : 'Welcome to the AI chatbot! How can I assist you today?',
          timestamp: new Date()
        }
      ],
    };
    
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
    setImageFile(null);
    setImagePreview(null);
    setCustomContext('');
  };

  const renameSession = (sessionId: string, newName: string) => {
    setSessions(sessions.map(session => 
      session.id === sessionId 
        ? { ...session, name: newName || session.name } 
        : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    // Don't delete if it's the only session
    if (sessions.length <= 1) {
      toast({
        title: "Cannot delete session",
        description: "At least one conversation must exist",
        variant: "destructive"
      });
      return;
    }
    
    // Filter out the deleted session
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    
    // If the active session was deleted, set the first available one as active
    if (sessionId === activeSessionId) {
      setActiveSessionId(updatedSessions[0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      toast({
        title: "Premium feature",
        description: "Image analysis is only available for premium users",
        variant: "destructive"
      });
      e.target.value = ''; // Reset the input
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageUpload = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !imageFile) || isProcessing) {
      return;
    }

    setIsProcessing(true);

    // Prepare the message text
    const messageText = inputMessage.trim() || (imageFile ? 'What can you tell me about this image?' : '');
    
    // Check if the message contains a website URL or is asking about a website
    const hasWebsiteUrl = urlPattern.test(messageText);
    const isWebsiteQuery = websiteQueryPattern.test(messageText);
    const isWebsiteRelated = hasWebsiteUrl || isWebsiteQuery;
    
    if (isWebsiteRelated && !isPremium) {
      toast({
        title: "Premium feature",
        description: "Website analysis is only available for premium users",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }
    
    if (isWebsiteRelated || directWebsiteUrl) {
      setIsAnalyzingWebsite(true);
    }
    
    // Add user message to chat
    const userMessageId = `msg_${Date.now()}`;
    const updatedSessions = sessions.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: [
            ...session.messages,
            {
              id: userMessageId,
              role: 'user',
              content: messageText + (imagePreview ? ' [Image attached]' : '') + 
                      (isWebsiteRelated && isPremium ? ' [Website analysis requested]' : ''),
              timestamp: new Date()
            }
          ]
        };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    setInputMessage('');
    
    // Add placeholder for AI response
    const aiPlaceholderId = `msg_${Date.now() + 1}`;
    const sessionsWithPlaceholder = updatedSessions.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: [
            ...session.messages,
            {
              id: aiPlaceholderId,
              role: 'assistant',
              content: 'Thinking...',
              timestamp: new Date(),
              isProcessing: true
            }
          ]
        };
      }
      return session;
    });
    
    setSessions(sessionsWithPlaceholder);
    
    // Prepare image data if present
    let imageUrl = null;
    if (imageFile && imagePreview) {
      imageUrl = imagePreview;
    }
    
    // Get chat history for context (limited to last 10 messages)
    const activeSessionData = sessionsWithPlaceholder.find(s => s.id === activeSessionId);
    const chatHistory = activeSessionData?.messages
      .filter(m => m.role !== 'system' && !m.isProcessing)
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    try {
      // Extract website URL if present
      let websiteUrl = null;
      if (isPremium) {
        // First check if there's a direct URL input
        if (directWebsiteUrl) {
          websiteUrl = directWebsiteUrl.startsWith('http') ? directWebsiteUrl : `https://${directWebsiteUrl}`;
          // Clear the direct URL input after using it
          setDirectWebsiteUrl('');
          
          toast({
            title: "Website Analysis",
            description: `Analyzing website: ${websiteUrl} (from direct input)`,
            variant: "default"
          });
        }
        // If no direct URL but message content contains URL
        else if (isWebsiteRelated) {
          // Extract the URL from the message
          const matches = messageText.match(urlPattern);
          if (matches && matches[0]) {
            // Ensure URL has proper prefix
            websiteUrl = matches[0].startsWith('http') ? matches[0] : `https://${matches[0]}`;
          } else {
            // Try to extract domain from a more complex query like "tell me about example.com"
            const queryMatches = messageText.match(websiteQueryPattern);
            if (queryMatches && queryMatches[1]) {
              websiteUrl = `https://${queryMatches[1]}`;
            }
          }
          
          if (websiteUrl) {
            toast({
              title: "Website Analysis",
              description: `Analyzing website: ${websiteUrl} (extracted from message)`,
              variant: "default"
            });
          }
        }
      }
      
      // Call the advanced chatbot API
      const response = await apiRequest("POST", "/api/virtual-assistant/advanced-chat", {
        message: messageText,
        sessionId: activeSessionId,
        chatHistory,
        languagePreference,
        requestContext: customContext || undefined,
        imageUrl,
        websiteUrl, // Pass the extracted website URL
        // Add testing mode if needed
        // forcePremium: 'test_premium_mode_xc782'
      });
      
      const data: ChatbotResponse = await response.json();
      
      // Update the session with the AI response
      const updatedSessionsWithResponse = sessionsWithPlaceholder.map(session => {
        if (session.id === activeSessionId) {
          // Replace the placeholder with the actual response
          const updatedMessages = session.messages.map(msg => 
            msg.id === aiPlaceholderId
              ? {
                  id: aiPlaceholderId,
                  role: 'assistant' as const,
                  content: data.response,
                  timestamp: new Date(data.timestamp),
                  isProcessing: false
                }
              : msg
          );
          
          return {
            ...session,
            messages: updatedMessages,
            context: data.context
          };
        }
        return session;
      });
      
      setSessions(updatedSessionsWithResponse);
      
      // If this is the first message, rename the session based on the content
      if (activeSessionData && activeSessionData.messages.length <= 2) {
        // Generate a name from the first user message
        const sessionName = messageText.length > 30
          ? `${messageText.substring(0, 30)}...`
          : messageText;
          
        renameSession(activeSessionId, sessionName);
      }

      // Show premium features toast if applicable
      if (data.premium && data.availableFeatures) {
        toast({
          title: "Premium Features Active",
          description: `Using advanced capabilities: ${data.availableFeatures.join(', ').replace(/_/g, ' ')}`,
          variant: "default"
        });
      }
      
      // Clear image after sending
      clearImageUpload();
      
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      
      // Update the placeholder message to show error
      const sessionsWithError = sessionsWithPlaceholder.map(session => {
        if (session.id === activeSessionId) {
          const updatedMessages = session.messages.map(msg => 
            msg.id === aiPlaceholderId
              ? {
                  id: aiPlaceholderId,
                  role: 'assistant' as const,
                  content: "Sorry, I encountered an error processing your request. Please try again.",
                  timestamp: new Date(),
                  isProcessing: false
                }
              : msg
          );
          
          return {
            ...session,
            messages: updatedMessages
          };
        }
        return session;
      });
      
      setSessions(sessionsWithError);
      
      toast({
        title: "Error",
        description: "Failed to get response from the AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsAnalyzingWebsite(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {/* Sidebar for chat history */}
        <div className="hidden md:flex flex-col bg-muted/50 rounded-lg p-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Conversations</h3>
            <Button variant="ghost" size="icon" onClick={handleNewSession}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                  session.id === activeSessionId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <div className="truncate flex-1">{session.name}</div>
                {session.id === activeSessionId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main chat area */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>AI Business Assistant {isPremium && <span className="text-xs text-primary ml-2 font-semibold">PREMIUM</span>}</CardTitle>
                  <CardDescription>
                    {isPremium 
                      ? "Enhanced AI assistant with unlimited interactions and advanced capabilities." 
                      : "Basic AI assistant for business inquiries."}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Mobile new chat button */}
                  <Button variant="outline" size="icon" className="md:hidden" onClick={handleNewSession}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  {/* Settings button */}
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Advanced options panel */}
              {showAdvancedOptions && (
                <div className="mt-4 p-4 bg-muted/30 rounded-md space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={languagePreference} 
                      onValueChange={setLanguagePreference}
                    >
                      <SelectTrigger id="language" className="w-full mt-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Arabic">Arabic</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isPremium && (
                    <>
                      <div>
                        <Label htmlFor="context">Additional Context</Label>
                        <Textarea 
                          id="context" 
                          placeholder="Add specific context for more relevant responses"
                          value={customContext}
                          onChange={(e) => setCustomContext(e.target.value)}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="directWebsiteUrl">Analyze Website URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            id="directWebsiteUrl" 
                            placeholder="Enter a website URL to analyze (e.g., example.com)"
                            value={directWebsiteUrl}
                            onChange={(e) => setDirectWebsiteUrl(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              if (!directWebsiteUrl) {
                                toast({
                                  title: "Missing URL",
                                  description: "Please enter a website URL to analyze",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              // Format URL if needed
                              let formattedUrl = directWebsiteUrl;
                              if (!formattedUrl.startsWith('http')) {
                                formattedUrl = `https://${formattedUrl}`;
                              }
                              
                              // Set the input message to analyze the website
                              setInputMessage(`Analyze this website: ${formattedUrl}`);
                              
                              // Close advanced options
                              setShowAdvancedOptions(false);
                              
                              // Send the message
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                            size="sm"
                          >
                            Analyze
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Direct website analysis allows you to get insights about any website
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="flex-grow overflow-y-auto px-4">
              <div className="space-y-4">
                {activeSession?.messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : message.role === 'system' 
                            ? 'bg-muted text-muted-foreground italic' 
                            : 'bg-muted/80 text-foreground'
                      } ${message.isProcessing ? 'animate-pulse' : ''}`}
                    >
                      {message.role === 'assistant' && !message.isProcessing && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/avatar-ai.png" alt="AI" />
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">AI Assistant</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              {/* Image preview */}
              {imagePreview && (
                <div className="w-full mb-4 relative">
                  <div className="relative w-32 h-32 rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={clearImageUpload}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="w-full flex items-center space-x-2">
                {isPremium && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    <Image className="h-4 w-4" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                )}
                
                <div className="relative flex-grow">
                  <Input
                    placeholder={isPremium 
                      ? "Ask anything (unlimited premium questions)"
                      : "Ask a question (basic plan)"}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    className={`w-full ${isAnalyzingWebsite ? 'pr-[120px]' : ''}`}
                  />
                  {isAnalyzingWebsite && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3 text-primary animate-pulse" />
                      <span>Analyzing website</span>
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !imageFile) || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {!isPremium && (
                <div className="w-full mt-4 pt-2 border-t border-muted flex justify-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> 
                    Upgrade to Premium for unlimited AI interactions and advanced features
                  </span>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIChatbot;