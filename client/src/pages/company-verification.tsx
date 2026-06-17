import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, CheckCircle, Upload, FileText, Star, Shield, Trophy, Target, Edit, Trash2 } from "lucide-react";
import { z } from "zod";

// Form schemas
const caseStudySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  clientName: z.string().optional(),
  industry: z.string().optional(),
  projectDuration: z.string().optional(),
  budget: z.number().optional(),
  results: z.string().min(1, "Results are required"),
  technologies: z.array(z.string()).optional(),
  challenges: z.string().optional(),
  solution: z.string().min(1, "Solution is required"),
  testimonial: z.string().optional(),
});

const credentialSchema = z.object({
  credentialType: z.string().min(1, "Credential type is required"),
  title: z.string().min(1, "Title is required"),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  verificationUrl: z.string().optional(),
  description: z.string().optional(),
});

type CaseStudyForm = z.infer<typeof caseStudySchema>;
type CredentialForm = z.infer<typeof credentialSchema>;

export default function CompanyVerification() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("badges");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingStudy, setEditingStudy] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch company verification data
  const { data: companyData } = useQuery({
    queryKey: ["/api/company"],
  });

  const { data: badges } = useQuery({
    queryKey: ["/api/company/badges"],
  });

  const { data: caseStudies } = useQuery({
    queryKey: ["/api/company/case-studies"],
  });

  const { data: credentials } = useQuery({
    queryKey: ["/api/company/credentials"],
  });

  // Case Study Form
  const caseStudyForm = useForm<CaseStudyForm>({
    resolver: zodResolver(caseStudySchema),
    defaultValues: {
      title: "",
      description: "",
      clientName: "",
      industry: "",
      projectDuration: "",
      results: "",
      challenges: "",
      solution: "",
      testimonial: "",
      technologies: [],
    },
  });

  // Credential Form
  const credentialForm = useForm<CredentialForm>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      credentialType: "",
      title: "",
      issuingOrganization: "",
      issueDate: "",
      description: "",
    },
  });

  // Mutations
  const submitCaseStudyMutation = useMutation({
    mutationFn: async (data: CaseStudyForm) => {
      const res = await apiRequest("POST", "/api/company/case-studies", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Study Submitted",
        description: "Your case study has been submitted for review.",
      });
      caseStudyForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/company/case-studies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitCredentialMutation = useMutation({
    mutationFn: async (data: CredentialForm) => {
      const res = await apiRequest("POST", "/api/company/credentials", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential Submitted",
        description: "Your credential has been submitted for verification.",
      });
      credentialForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/company/credentials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const credentialActionMutation = useMutation({
    mutationFn: async ({ action, credentialId, ...data }: { action: string; credentialId: number; [key: string]: any }) => {
      const res = await apiRequest("POST", "/api/company/credentials/action", { action, credentialId, ...data });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === 'delete' ? "Credential Deleted" : "Credential Updated",
        description: variables.action === 'delete' ? "Your credential has been deleted." : "Your credential has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/credentials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditCredential = (credential: any) => {
    credentialForm.reset({
      title: credential.title,
      credentialType: credential.credentialType,
      issuingOrganization: credential.issuingOrganization,
      issueDate: credential.issueDate ? credential.issueDate.split('T')[0] : "",
      expiryDate: credential.expiryDate ? credential.expiryDate.split('T')[0] : "",
      credentialNumber: credential.credentialNumber || "",
      verificationUrl: credential.verificationUrl || "",
      description: credential.description || ""
    });
    setEditingCredential(credential);
    setShowCredentialForm(true);
  };

  const handleDeleteCredential = (credentialId: number) => {
    credentialActionMutation.mutate({ 
      action: 'delete', 
      credentialId 
    });
  };

  const requestBadgeMutation = useMutation({
    mutationFn: async (badgeType: string) => {
      const res = await apiRequest("POST", "/api/company/request-badge", { badgeType });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Badge Request Submitted",
        description: "Your badge request has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/badges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Badge types with descriptions
  const badgeTypes = [
    {
      type: "verified_company",
      title: "Verified Company",
      description: "Basic company verification with valid business registration",
      icon: CheckCircle,
      color: "bg-blue-500",
    },
    {
      type: "premium_partner",
      title: "Premium Partner",
      description: "Enhanced partnership status with proven track record",
      icon: Star,
      color: "bg-purple-500",
    },
    {
      type: "certified_provider",
      title: "Certified Provider",
      description: "Industry-certified service provider with validated expertise",
      icon: Shield,
      color: "bg-green-500",
    },
    {
      type: "excellence_award",
      title: "Excellence Award",
      description: "Outstanding performance and client satisfaction",
      icon: Trophy,
      color: "bg-yellow-500",
    },
    {
      type: "industry_expert",
      title: "Industry Expert",
      description: "Recognized expertise in specific industry domains",
      icon: Target,
      color: "bg-red-500",
    },
  ];

  const credentialTypes = [
    "certification",
    "license",
    "degree",
    "professional_membership",
    "award",
    "accreditation",
    "training_completion",
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "verified":
      case "published":
        return "bg-green-100 text-green-800";
      case "pending":
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Company Verification Center</h1>
        <p className="text-muted-foreground">
          Enhance your company's credibility with verification badges, case studies, and credentials
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="badges">Verification Badges</TabsTrigger>
          <TabsTrigger value="case-studies">Case Studies</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Verification Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Verification Badges
              </CardTitle>
              <CardDescription>
                Request verification badges to showcase your company's credibility and expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {badgeTypes.map((badge) => {
                  const Icon = badge.icon;
                  const hasThisBadge = badges?.some((b: any) => b.badgeType === badge.type && b.isActive);
                  
                  return (
                    <Card key={badge.type} className="relative">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${badge.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{badge.title}</CardTitle>
                            {hasThisBadge && (
                              <Badge variant="secondary" className="mt-1">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {badge.description}
                        </p>
                        <Button
                          onClick={() => requestBadgeMutation.mutate(badge.type)}
                          disabled={hasThisBadge || requestBadgeMutation.isPending}
                          className="w-full"
                          variant={hasThisBadge ? "secondary" : "default"}
                        >
                          {hasThisBadge ? "Verified" : "Request Badge"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Badges */}
          {badges && badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {badges.map((badge: any) => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Award className="h-6 w-6 text-blue-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">{badge.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Awarded: {new Date(badge.awardedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Case Studies Tab */}
        <TabsContent value="case-studies" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Submit New Case Study */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submit Case Study
                </CardTitle>
                <CardDescription>
                  Showcase your successful projects to build credibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...caseStudyForm}>
                  <form
                    onSubmit={caseStudyForm.handleSubmit((data) => submitCaseStudyMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={caseStudyForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter project title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={caseStudyForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe the project" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={caseStudyForm.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Client or company name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={caseStudyForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Healthcare, Finance" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={caseStudyForm.control}
                      name="solution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solution Provided</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe the solution you provided" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={caseStudyForm.control}
                      name="results"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Results Achieved</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Quantifiable results and outcomes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormLabel>Project Documents (Optional)</FormLabel>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Upload project reports, case study documents, or client testimonials
                          </p>
                          <p className="text-xs text-gray-500">
                            Supports PDF, DOC, DOCX files (max 10MB each)
                          </p>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setSelectedFiles(files);
                              console.log("Files selected:", files);
                            }}
                            className="hidden"
                            id="case-study-files"
                          />
                          <label
                            htmlFor="case-study-files"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Choose Files
                          </label>
                        </div>
                      </div>
                      
                      {/* Display selected files */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFiles(files => files.filter((_, i) => i !== index));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={submitCaseStudyMutation.isPending}
                      className="w-full"
                    >
                      {submitCaseStudyMutation.isPending ? "Submitting..." : "Submit Case Study"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Existing Case Studies */}
            <Card>
              <CardHeader>
                <CardTitle>Your Case Studies</CardTitle>
              </CardHeader>
              <CardContent>
                {caseStudies && caseStudies.length > 0 ? (
                  <div className="space-y-4">
                    {caseStudies.map((study: any) => (
                      <div key={study.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{study.title}</h4>
                          <Badge className={getStatusColor(study.status)}>
                            {study.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {study.description}
                        </p>
                        {study.clientName && (
                          <p className="text-sm">
                            <strong>Client:</strong> {study.clientName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Submitted: {new Date(study.submittedAt).toLocaleDateString()}
                        </p>
                        
                        {/* Edit/Delete actions for pending case studies */}
                        {(study.status === 'pending' || study.status === 'pending_review' || study.status === 'draft') && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Populate the form with the case study data for editing
                                caseStudyForm.reset({
                                  title: study.title || "",
                                  description: study.description || "",
                                  clientName: study.clientName || "",
                                  industry: study.industry || "",
                                  projectDuration: study.projectDuration || "",
                                  budget: study.budget || undefined,
                                  results: study.results || study.outcome || "",
                                  technologies: study.technologies || [],
                                  challenges: study.challenges || "",
                                  solution: study.solution || "",
                                  testimonial: study.testimonial || "",
                                });
                                setActiveTab("case-studies");
                                toast({
                                  title: "Editing Case Study",
                                  description: "Case study loaded for editing. Update the form below.",
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this case study? This action cannot be undone.')) {
                                  try {
                                    // Use the correct delete action endpoint
                                    await apiRequest("POST", "/api/company/case-studies/action", {
                                      action: 'delete',
                                      caseStudyId: study.id
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/company/case-studies"] });
                                    toast({
                                      title: "Case Study Deleted",
                                      description: "Your case study has been successfully deleted.",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Delete Failed",
                                      description: "Failed to delete case study. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No case studies submitted yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Submit New Credential */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Submit Credential
                </CardTitle>
                <CardDescription>
                  Add your professional credentials and certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...credentialForm}>
                  <form
                    onSubmit={credentialForm.handleSubmit((data) => submitCredentialMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={credentialForm.control}
                      name="credentialType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credential Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select credential type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {credentialTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credential Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., AWS Certified Solutions Architect" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialForm.control}
                      name="issuingOrganization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Organization</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Amazon Web Services" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={credentialForm.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={credentialForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={credentialForm.control}
                      name="verificationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="URL to verify this credential" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Brief description of this credential" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={submitCredentialMutation.isPending}
                      className="w-full"
                    >
                      {submitCredentialMutation.isPending ? "Submitting..." : "Submit Credential"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Existing Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Your Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                {credentials && credentials.length > 0 ? (
                  <div className="space-y-4">
                    {credentials.map((credential: any) => (
                      <div key={credential.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{credential.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(credential.status)}>
                              {credential.status}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCredential(credential)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCredential(credential.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {credential.issuingOrganization}
                        </p>
                        <p className="text-sm">
                          <strong>Type:</strong> {credential.credentialType.replace('_', ' ')}
                        </p>
                        <p className="text-sm">
                          <strong>Issued:</strong> {new Date(credential.issueDate).toLocaleDateString()}
                        </p>
                        {credential.expiryDate && (
                          <p className="text-sm">
                            <strong>Expires:</strong> {new Date(credential.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                        
                        {credential.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Load credential data into form for editing
                                credentialForm.reset({
                                  credentialType: credential.credentialType,
                                  title: credential.title,
                                  issuingOrganization: credential.issuingOrganization,
                                  issueDate: credential.issueDate?.split('T')[0],
                                  expiryDate: credential.expiryDate?.split('T')[0] || '',
                                  credentialId: credential.credentialId || '',
                                  verificationUrl: credential.verificationUrl || '',
                                  description: credential.description || ''
                                });
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this credential?')) {
                                  credentialActionMutation.mutate({
                                    action: 'delete',
                                    credentialId: credential.id
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No credentials submitted yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Badges:</span>
                    <Badge variant="secondary">{badges?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Case Studies:</span>
                    <Badge variant="secondary">{caseStudies?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Credentials:</span>
                    <Badge variant="secondary">{credentials?.length || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.min(100, ((badges?.length || 0) * 30 + (caseStudies?.length || 0) * 25 + (credentials?.length || 0) * 20))}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete verification process
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(!badges || badges.length === 0) && (
                    <p>• Request verification badges</p>
                  )}
                  {(!caseStudies || caseStudies.length === 0) && (
                    <p>• Submit case studies</p>
                  )}
                  {(!credentials || credentials.length === 0) && (
                    <p>• Add credentials</p>
                  )}
                  {badges?.length > 0 && caseStudies?.length > 0 && credentials?.length > 0 && (
                    <p className="text-green-600">✓ All verification types completed!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}