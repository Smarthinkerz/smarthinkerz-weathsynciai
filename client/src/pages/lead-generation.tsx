import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { countries } from "@/data/countries";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Target, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

const leadGenerationSchema = z.object({
  industry: z.string().min(1, { message: "Industry is required" }),
  targetMarket: z.string().min(1, { message: "Target market is required" }),
  leadType: z.string().min(1, { message: "Lead type is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  city: z.string().optional(),
  useLinkedIn: z.boolean().default(true),
  useWebSearch: z.boolean().default(true),
  qualificationCriteria: z.string().min(10, { message: "Please provide more detailed qualification criteria" }),
  valueProposition: z.string().min(10, { message: "Please provide your value proposition" }),
  additionalNotes: z.string().optional(),
});

type LeadGenerationFormValues = z.infer<typeof leadGenerationSchema>;

const leadNegotiationSchema = z.object({
  leadName: z.string().min(1, { message: "Lead name is required" }),
  contactInfo: z.string().min(1, { message: "Contact information is required" }),
  interests: z.string().min(10, { message: "Please provide information about lead interests" }),
  budget: z.string().min(1, { message: "Budget range is required" }),
  timeline: z.string().min(1, { message: "Timeline is required" }),
  challenges: z.string().min(10, { message: "Please describe challenges or pain points" }),
  negotiationGoals: z.string().min(10, { message: "Please specify your negotiation goals" }),
});

type LeadNegotiationFormValues = z.infer<typeof leadNegotiationSchema>;

type Lead = {
  id: number;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  industry: string;
  score: number;
  status: 'New' | 'In Progress' | 'Qualified' | 'Not Qualified';
  notes: string;
  lastContact: string;
};

export default function LeadGenerationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { company, user } = useAuth();
  const isPremium = isHighTier(company?.subscriptionTier) || isHighTier(user?.subscriptionTier);
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedLeads, setGeneratedLeads] = useState<Lead[]>([]);
  const [negotiationInsights, setNegotiationInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  
  const leadGenerationForm = useForm<LeadGenerationFormValues>({
    resolver: zodResolver(leadGenerationSchema),
    defaultValues: {
      industry: "",
      targetMarket: "",
      leadType: "",
      country: "",
      city: "",
      useLinkedIn: true,
      useWebSearch: true,
      qualificationCriteria: "",
      valueProposition: "",
      additionalNotes: "",
    },
  });
  
  const leadNegotiationForm = useForm<LeadNegotiationFormValues>({
    resolver: zodResolver(leadNegotiationSchema),
    defaultValues: {
      leadName: "",
      contactInfo: "",
      interests: "",
      budget: "",
      timeline: "",
      challenges: "",
      negotiationGoals: "",
    },
  });
  
  const generateLeadsMutation = useMutation({
    mutationFn: async (data: LeadGenerationFormValues) => {
      // Call the real backend API endpoint for lead generation
      const response = await apiRequest("POST", "/api/lead-generation", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedLeads(data);
      
      if (data.length === 0) {
        toast({
          title: "No Verified Leads Found",
          description: "No leads were found from verified API sources for your criteria. This system only returns data from authenticated sources and does not use synthetic data.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: `Generated ${data.length} verified leads based on your criteria.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate leads. Please check your API keys or try different search criteria.",
        variant: "destructive",
      });
    },
  });
  
  const negotiateLeadMutation = useMutation({
    mutationFn: async (data: LeadNegotiationFormValues) => {
      const response = await apiRequest("POST", "/api/leads/negotiate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setNegotiationInsights(data.insights);
      toast({
        title: "Success",
        description: "AI negotiation analysis completed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze negotiation strategy",
        variant: "destructive",
      });
    },
  });
  
  function onGenerateLeadsSubmit(data: LeadGenerationFormValues) {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "AI Lead Generation is available only for Premium plan subscribers. Upgrade to access this feature.",
        variant: "default",
      });
      return;
    }
    
    generateLeadsMutation.mutate(data);
  }
  
  function onNegotiateLeadSubmit(data: LeadNegotiationFormValues) {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "AI Lead Negotiation is available only for Premium plan subscribers. Upgrade to access this feature.",
        variant: "default",
      });
      return;
    }
    
    negotiateLeadMutation.mutate(data);
  }
  
  const handleBackClick = () => {
    setLocation('/company/dashboard');
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
          <h1 className="text-3xl font-bold">AI Lead Generation & Negotiation</h1>
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
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI-Powered Lead Assistance</CardTitle>
          <CardDescription>
            Use artificial intelligence to identify potential leads that match your criteria and develop negotiation strategies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Target className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium text-center">Lead Generation</h3>
              <p className="text-sm text-muted-foreground text-center">
                AI identifies potential leads based on your specific requirements
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <ArrowRight className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium text-center">Lead Qualification</h3>
              <p className="text-sm text-muted-foreground text-center">
                AI evaluates and scores leads based on fit and potential value
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium text-center">Negotiation Strategy</h3>
              <p className="text-sm text-muted-foreground text-center">
                AI helps craft personalized negotiation approaches for each lead
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Leads</TabsTrigger>
          <TabsTrigger value="negotiate">Negotiation Assistance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Generation Criteria</CardTitle>
                <CardDescription>
                  Specify the characteristics of leads you're looking for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...leadGenerationForm}>
                  <form onSubmit={leadGenerationForm.handleSubmit(onGenerateLeadsSubmit)} className="space-y-4">
                    <FormField
                      control={leadGenerationForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Industry</FormLabel>
                          <div className="flex items-center space-x-2 mb-2">
                            <Switch 
                              id="custom-industry" 
                              checked={isCustomIndustry}
                              onCheckedChange={setIsCustomIndustry}
                            />
                            <label htmlFor="custom-industry" className="text-sm text-muted-foreground cursor-pointer">
                              Use custom industry
                            </label>
                          </div>
                          
                          {isCustomIndustry ? (
                            <FormControl>
                              <Input 
                                placeholder="Enter custom industry (e.g., Fitness, Hospitality)" 
                                {...field}
                              />
                            </FormControl>
                          ) : (
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="real-estate">Real Estate</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <FormDescription>
                            Industry that your product or service targets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadGenerationForm.control}
                      name="targetMarket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Market</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a market segment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small-business">Small Business</SelectItem>
                              <SelectItem value="mid-market">Mid-Market</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                              <SelectItem value="government">Government</SelectItem>
                              <SelectItem value="nonprofit">Non-Profit</SelectItem>
                              <SelectItem value="consumer">Consumer/B2C</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The market segment you're targeting
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadGenerationForm.control}
                      name="leadType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lead type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="decision-maker">Decision Makers</SelectItem>
                              <SelectItem value="influencer">Influencers</SelectItem>
                              <SelectItem value="technical-buyer">Technical Buyers</SelectItem>
                              <SelectItem value="economic-buyer">Economic Buyers</SelectItem>
                              <SelectItem value="end-user">End Users</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of leads you're seeking
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadGenerationForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80 overflow-y-auto">
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Country to search for leads in
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={leadGenerationForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter a specific city"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Narrow search to a specific city or region
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={leadGenerationForm.control}
                        name="useLinkedIn"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>LinkedIn Search</FormLabel>
                              <FormDescription>
                                Find leads from LinkedIn profiles
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leadGenerationForm.control}
                        name="useWebSearch"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Web Search</FormLabel>
                              <FormDescription>
                                Find leads from web search results
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={leadGenerationForm.control}
                      name="qualificationCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualification Criteria</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the criteria that make a lead qualified for your business" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Budget range, decision-making authority, timeline, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadGenerationForm.control}
                      name="valueProposition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value Proposition</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your unique value proposition" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            What makes your offering unique and valuable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadGenerationForm.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any other information that might help with lead generation" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={generateLeadsMutation.isPending || !isPremium}
                    >
                      {generateLeadsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Leads...
                        </>
                      ) : (
                        "Generate AI Leads"
                      )}
                    </Button>
                    
                    {!isPremium && (
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        This feature requires a Premium subscription.
                        <Button variant="link" className="p-0 h-auto" onClick={() => setLocation('/company/subscription')}>
                          Upgrade now
                        </Button>
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Leads</CardTitle>
                  <CardDescription>
                    AI-identified leads based on your criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generateLeadsMutation.isPending ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Analyzing markets and identifying potential leads...</p>
                    </div>
                  ) : generatedLeads.length > 0 ? (
                    <div className="space-y-4">
                      {generatedLeads.map((lead) => (
                        <Card key={lead.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{lead.name}</h3>
                                <p className="text-sm text-muted-foreground">{lead.position} at {lead.company}</p>
                              </div>
                              <Badge className={`${
                                lead.status === 'Qualified' ? 'bg-green-500' :
                                lead.status === 'In Progress' ? 'bg-blue-500' :
                                lead.status === 'New' ? 'bg-amber-500' : 'bg-red-500'
                              }`}>
                                {lead.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <span className="text-muted-foreground">Email:</span> {lead.email}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone:</span> {lead.phone}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Industry:</span> {lead.industry}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Contact:</span> {lead.lastContact}
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="flex items-center gap-2 mt-2">
                              <div className="text-sm font-medium">Match Score:</div>
                              <Progress value={lead.score} className="h-2 flex-1" />
                              <div className="text-sm font-medium">{lead.score}%</div>
                            </div>
                            
                            <p className="text-sm mt-2">
                              <span className="font-medium">Notes:</span> {lead.notes}
                            </p>
                            
                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setActiveTab("negotiate");
                                  leadNegotiationForm.setValue("leadName", lead.name);
                                  leadNegotiationForm.setValue("contactInfo", `${lead.email} | ${lead.phone}`);
                                }}
                              >
                                Prepare Negotiation
                              </Button>
                              <Button size="sm">Contact Lead</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Target className="h-12 w-12 text-muted-foreground mb-4" />
                      {generateLeadsMutation.isSuccess ? (
                        <>
                          <h3 className="font-medium mb-1">No Verified Leads Found</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            No leads were found from verified API sources for your search criteria. Our system only returns data from authenticated sources and does not use synthetic data. Try adjusting your search criteria or try a different country/industry combination.
                          </p>
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                            <h4 className="text-sm font-semibold text-amber-700">About Our Data Integrity Policy</h4>
                            <p className="text-xs text-amber-700 mt-1">
                              To ensure data accuracy, we only return leads from verified API sources. When no verified leads are found, we display this message instead of generating synthetic data. This ensures you only receive authentic business leads.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="font-medium mb-1">No Leads Generated Yet</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Fill out the lead generation form with your criteria to have our AI identify potential leads that match your business needs.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="negotiate" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Negotiation Assistant</CardTitle>
                <CardDescription>
                  Get AI-powered insights to approach and negotiate with your leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...leadNegotiationForm}>
                  <form onSubmit={leadNegotiationForm.handleSubmit(onNegotiateLeadSubmit)} className="space-y-4">
                    <FormField
                      control={leadNegotiationForm.control}
                      name="leadName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter lead name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadNegotiationForm.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Information</FormLabel>
                          <FormControl>
                            <Input placeholder="Email or phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadNegotiationForm.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Interests</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What is the lead interested in?" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={leadNegotiationForm.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Range</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select budget" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="under-5k">Under $5K</SelectItem>
                                <SelectItem value="5k-25k">$5K - $25K</SelectItem>
                                <SelectItem value="25k-50k">$25K - $50K</SelectItem>
                                <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                                <SelectItem value="over-100k">Over $100K</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={leadNegotiationForm.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeline</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timeline" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="immediate">Immediate (0-30 days)</SelectItem>
                                <SelectItem value="short-term">Short Term (1-3 months)</SelectItem>
                                <SelectItem value="medium-term">Medium Term (3-6 months)</SelectItem>
                                <SelectItem value="long-term">Long Term (6+ months)</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={leadNegotiationForm.control}
                      name="challenges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Challenges/Pain Points</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What challenges is the lead facing?" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadNegotiationForm.control}
                      name="negotiationGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Negotiation Goals</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What do you want to achieve with this negotiation?" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={negotiateLeadMutation.isPending || !isPremium}
                    >
                      {negotiateLeadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Strategy...
                        </>
                      ) : (
                        "Generate Negotiation Strategy"
                      )}
                    </Button>
                    
                    {!isPremium && (
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        This feature requires a Premium subscription.
                        <Button variant="link" className="p-0 h-auto" onClick={() => setLocation('/company/subscription')}>
                          Upgrade now
                        </Button>
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Negotiation Insights</CardTitle>
                <CardDescription>
                  Recommended strategies and talking points for lead negotiation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {negotiateLeadMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Analyzing lead information and generating negotiation strategy...</p>
                  </div>
                ) : negotiationInsights ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {negotiationInsights}
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-2">Recommended Resources</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">Case studies relevant to lead's industry</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">ROI calculator tailored to their budget range</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">Testimonials addressing similar challenges</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-2">Next Actions</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button size="sm">Schedule Follow-up</Button>
                          <Button size="sm" variant="outline">Export Strategy</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-1">No Negotiation Insights Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Fill out the form with information about your lead to receive AI-powered negotiation strategies tailored to their profile.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for premium feature cards
function PremiumFeatureCard({ 
  title, 
  description, 
  icon, 
  isPremium,
  onClick
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  isPremium: boolean;
  onClick: () => void;
}) {
  return (
    <Card className={`overflow-hidden transition duration-300 hover:shadow-md ${!isPremium ? "opacity-80" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {!isPremium && <Sparkles className="h-4 w-4 text-amber-500" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2">
            {icon}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{description}</p>
            <Button 
              variant="default" 
              className="w-full" 
              disabled={!isPremium}
              onClick={onClick}
            >
              {!isPremium ? "Upgrade to Access" : "Access Feature"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}