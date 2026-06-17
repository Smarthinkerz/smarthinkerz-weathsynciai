import { isHighTier } from '@shared/schema';
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Link as LinkIcon,
  Share2,
  CheckCircle2,
  Eye,
  Crown,
  Copy,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// Form schema with validation
const directoryFormSchema = z.object({
  displayName: z.string().min(3, "Business name must be at least 3 characters"),
  tagline: z.string().max(100, "Tagline must be 100 characters or less"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  industry: z.string().min(1, "Please select an industry"),
  website: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  location: z.string().min(3, "Please enter your business location"),
  phone: z.string().optional(),
  publicEmail: z.string().email("Please enter a valid email").optional(),
  featuredHighlight: z.boolean().default(true),
  showContactInfo: z.boolean().default(true),
});

type DirectoryFormValues = z.infer<typeof directoryFormSchema>;

const industryOptions = [
  { value: "technology", label: "Technology & Software" },
  { value: "finance", label: "Finance & Banking" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "education", label: "Education & Training" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "manufacturing", label: "Manufacturing & Engineering" },
  { value: "consulting", label: "Consulting & Business Services" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "legal", label: "Legal Services" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "construction", label: "Construction & Real Estate" },
  { value: "media", label: "Media & Entertainment" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "agriculture", label: "Agriculture & Farming" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "nonprofit", label: "Nonprofit & NGO" },
  { value: "other", label: "Other" },
];

export default function PremiumDirectoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [directoryData, setDirectoryData] = useState<DirectoryFormValues | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { company, isLoading: authLoading } = useAuth();
  
  // Redirect non-authenticated users or non-premium users
  useEffect(() => {
    if (!authLoading && !company) {
      navigate("/company/auth");
    } else if (!authLoading && company && !isHighTier(company.subscriptionTier)) {
      toast({
        title: "Elite Feature",
        description: "This feature is only available to Elite and Enterprise subscribers. Please upgrade your plan.",
        variant: "destructive",
      });
      navigate("/company/dashboard");
    }
  }, [company, authLoading, navigate, toast]);

  // Initialize form with existing company data
  const form = useForm<DirectoryFormValues>({
    resolver: zodResolver(directoryFormSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      description: "",
      industry: "",
      website: "",
      location: "",
      phone: "",
      publicEmail: "",
      featuredHighlight: true,
      showContactInfo: true,
    }
  });

  // Fetch existing directory data
  useEffect(() => {
    const fetchDirectoryData = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/company/directory-listing");
        const data = await response.json();
        
        if (response.ok) {
          setDirectoryData(data);
          // Update form values with fetched data
          form.reset({
            displayName: data.displayName || "",
            tagline: data.tagline || "",
            description: data.description || "",
            industry: data.industry || "",
            website: data.website || "",
            location: data.location || "",
            phone: data.phone || "",
            publicEmail: data.publicEmail || "",
            featuredHighlight: data.featuredHighlight ?? true,
            showContactInfo: data.showContactInfo ?? true,
          });
        }
      } catch (error) {
        console.error("Failed to fetch directory data:", error);
        // Set fallback data from session if API fails
        const companyData = await apiRequest("GET", "/api/company").then(res => res.json());
        
        if (companyData) {
          form.reset({
            displayName: companyData.name || "",
            tagline: "",
            description: companyData.description || "",
            industry: companyData.industry || "",
            website: companyData.website || "",
            location: companyData.city ? `${companyData.city}, ${companyData.country || ""}` : "",
            phone: companyData.phoneNumber || "",
            publicEmail: companyData.primaryContactEmail || "",
            featuredHighlight: true,
            showContactInfo: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectoryData();
  }, [form]);

  const onSubmit = async (values: DirectoryFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/company/directory-listing", values);
      
      if (response.ok) {
        setIsSaved(true);
        toast({
          title: "Directory listing saved",
          description: "Your business is now featured in our premium directory",
          variant: "default",
        });
        // Refresh data
        const data = await response.json();
        setDirectoryData(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save directory listing");
      }
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Preview component to show how the listing will appear
  const DirectoryListingPreview = ({ data }: { data: DirectoryFormValues }) => (
    <Card className="mb-2 overflow-hidden border shadow-sm">
      <CardHeader className="bg-muted/50 pb-2 px-3 pt-3">
        <div className="flex justify-between items-start gap-2">
          <div className="overflow-hidden">
            <CardTitle className="flex items-center text-base flex-wrap">
              <span className="truncate mr-1">{data.displayName || "Your Business Name"}</span>
              {data.featuredHighlight && (
                <Badge className="ml-1 bg-amber-500 hover:bg-amber-600 whitespace-nowrap">
                  <Crown className="h-3 w-3 mr-1" /> Featured
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="truncate">{data.tagline || "Your business tagline"}</CardDescription>
          </div>
          <div className="flex-shrink-0">
            <Badge variant="outline" className="bg-background text-xs">
              {industryOptions.find(i => i.value === data.industry)?.label || data.industry || "Industry"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 px-3 text-sm">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {data.description || "Your business description will appear here. This is a preview of how your listing will look in the directory."}
        </p>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {data.showContactInfo && (
            <>
              <div className="flex items-center overflow-hidden">
                <MapPin className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{data.location || "Business location"}</span>
              </div>
              {data.phone && (
                <div className="flex items-center overflow-hidden">
                  <Phone className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{data.phone}</span>
                </div>
              )}
              {data.publicEmail && (
                <div className="flex items-center overflow-hidden">
                  <Mail className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{data.publicEmail}</span>
                </div>
              )}
            </>
          )}
          {data.website && (
            <div className="flex items-center overflow-hidden">
              <Globe className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {data.website?.replace(/^https?:\/\/(www\.)?/, '') || data.website}
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 flex flex-wrap justify-between gap-2 px-3 py-2">
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => {
              if (data.displayName) {
                toast({
                  title: "Preview Only",
                  description: `This would navigate to ${data.displayName}'s profile in a live directory.`,
                  duration: 3000,
                });
              }
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => {
              // Create a dropdown with sharing options
              const businessName = data.displayName || "our business";
              const tagline = data.tagline || "";
              const website = data.website || "";
              
              // Create full share text with URL
              const shareText = `Check out ${businessName} - ${tagline}${website ? ` | ${website}` : ''}`;
              
              // Create share URLs for different platforms
              const emailSubject = `Check out ${businessName}`;
              const emailBody = `I thought you might be interested in ${businessName}.\n\n${tagline}\n\n${website || ''}`;
              const emailURL = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
              
              const whatsappURL = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
              const twitterURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
              const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(website || window.location.href)}&quote=${encodeURIComponent(shareText)}`;
              const linkedinURL = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(website || window.location.href)}&summary=${encodeURIComponent(shareText)}`;
              
              // Show a toast with sharing options
              toast({
                title: "Share options",
                description: (
                  <div className="flex flex-col space-y-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(shareText).then(() => {
                          toast({
                            title: "Copied to clipboard",
                            description: "Business info with URL copied for sharing",
                            duration: 3000,
                          });
                        });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-2" /> Copy to clipboard
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs" 
                      size="sm"
                      onClick={() => window.open(emailURL, '_blank')}
                    >
                      <Mail className="h-3.5 w-3.5 mr-2" /> Share via Email
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs" 
                      size="sm"
                      onClick={() => window.open(whatsappURL, '_blank')}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-2" /> Share via WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs" 
                      size="sm"
                      onClick={() => window.open(twitterURL, '_blank')}
                    >
                      <Twitter className="h-3.5 w-3.5 mr-2" /> Share on Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs" 
                      size="sm"
                      onClick={() => window.open(facebookURL, '_blank')}
                    >
                      <Facebook className="h-3.5 w-3.5 mr-2" /> Share on Facebook
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs" 
                      size="sm"
                      onClick={() => window.open(linkedinURL, '_blank')}
                    >
                      <Linkedin className="h-3.5 w-3.5 mr-2" /> Share on LinkedIn
                    </Button>
                  </div>
                ),
                duration: 10000,
              });
            }}
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">Added: {new Date().toLocaleDateString()}</span>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container max-w-5xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate("/company/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Premium Directory Listing</h1>
        </div>
        <Badge variant="secondary" className="ml-auto">
          <Crown className="h-3.5 w-3.5 mr-1" />
          Premium Feature
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    This information will be displayed in the business directory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief tagline for your business" {...field} />
                        </FormControl>
                        <FormDescription>
                          A short, memorable phrase that describes what you do
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {industryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business and services" 
                            className="resize-none min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Highlight your expertise, services, and what makes your business unique
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    How potential clients can reach your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.yourbusiness.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="publicEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@yourbusiness.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="showContactInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Display Contact Information</FormLabel>
                          <FormDescription>
                            Show your phone and email in the directory listing
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Visibility Options</CardTitle>
                  <CardDescription>
                    Control how your business appears in the directory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="featuredHighlight"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Featured Highlight</FormLabel>
                          <FormDescription>
                            Promote your business as a featured listing with premium placement
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
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : isSaved ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      "Save Directory Listing"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
        
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Directory Preview
              </CardTitle>
              <CardDescription>
                How your business will appear in the premium directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <DirectoryListingPreview data={form.getValues()} />
              )}
              <p className="text-xs text-muted-foreground mt-4">
                This preview shows how your listing will appear to potential clients in the business directory.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}