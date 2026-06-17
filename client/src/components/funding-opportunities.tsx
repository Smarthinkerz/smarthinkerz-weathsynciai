import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FundingOpportunity } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Building2, AlertCircle, Globe, Briefcase, Award, FolderGit2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FundingOpportunitiesProps {
  onOpenProfileEditor: () => void;
  selectedCountry?: string | null;
  onCountrySelect?: (country: string | null) => void;
}

export function FundingOpportunities({ 
  onOpenProfileEditor, 
  selectedCountry: externalSelectedCountry,
  onCountrySelect 
}: FundingOpportunitiesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [internalSelectedCountry, setInternalSelectedCountry] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<FundingOpportunity | null>(null);
  const [, setLocation] = useLocation();

  // Use external country if provided, otherwise use internal state
  const selectedCountry = externalSelectedCountry ?? internalSelectedCountry;

  // Sync with external country changes
  useEffect(() => {
    if (externalSelectedCountry !== undefined) {
      setInternalSelectedCountry(externalSelectedCountry);
    }
  }, [externalSelectedCountry]);

  // Fetch funding opportunities with enhanced matching for architectural engineering
  const { data: opportunities = [], error, isLoading, refetch } = useQuery<FundingOpportunity[]>({
    queryKey: ['/api/funding-opportunities', selectedCountry || 'all'],
    queryFn: async () => {
      console.log('Fetching funding opportunities:', { 
        selectedCountry 
      });

      const response = await fetch(`/api/funding-opportunities${selectedCountry ? `?country=${encodeURIComponent(selectedCountry)}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch funding opportunities');
      }

      const data = await response.json();
      
      // Filter out opportunities with zero match scores (irrelevant to user skills)
      const relevantOpportunities = data.filter((opp: FundingOpportunity) => 
        !opp.matchScore || opp.matchScore > 0
      );
      
      console.log('Received opportunities:', {
        totalCount: data.length,
        relevantCount: relevantOpportunities.length,
        filteredOut: data.length - relevantOpportunities.length,
        selectedCountry,
        sample: relevantOpportunities[0]
      });
      console.log('Rendering opportunities:', relevantOpportunities);
      return relevantOpportunities;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Fetch verified experience when dialog is open
  const { data: verifiedExperience, isLoading: isLoadingExperience } = useQuery({
    queryKey: [`/api/user/${user?.id}/verified-experience`],
    queryFn: async () => {
      console.log("Fetching verified experience for user:", user?.id);
      const response = await fetch(`/api/user/${user?.id}/verified-experience`);
      if (!response.ok) {
        throw new Error('Failed to fetch verified experience');
      }
      const data = await response.json();
      console.log("Received verified experience:", data);
      return data;
    },
    enabled: !!user?.id && dialogOpen,
    retry: 2
  });

  // Handle country selection
  const handleCountrySelect = (country: string | null) => {
    console.log('Selecting country:', country);
    setInternalSelectedCountry(country);
    if (onCountrySelect) {
      onCountrySelect(country);
    }
    setDialogOpen(false);

    // Force refetch with new data
    setTimeout(() => {
      refetch();
    }, 100);

    if (country) {
      toast({
        title: `Showing Funding Opportunities in ${country}`,
        description: "Filtered by location"
      });
    } else {
      toast({
        title: "Showing All Opportunities",
        description: "Country filter cleared"
      });
    }
  };

  // Handle application clicks with proper error handling
  const handleApplicationClick = (opportunity: FundingOpportunity, e: React.MouseEvent) => {
    e.stopPropagation();

    if (opportunity.applicationUrl) {
      try {
        const url = new URL(opportunity.applicationUrl);

        // Special handling for US grants
        const finalUrl = opportunity.country === 'United States' 
          ? `${url.toString()}${url.search ? '&' : '?'}location=US`
          : url.toString();

        if (url.protocol === 'https:') {
          toast({
            title: "Redirecting to External Application",
            description: `You'll be taken to ${opportunity.provider}'s website to complete your application.`,
          });
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast({
            title: "Using Internal Application Process",
            description: "The external URL is not secure. Redirecting to our internal application system.",
            variant: "default"
          });
          setLocation(`/opportunities/${opportunity.id}/apply`);
        }
      } catch (error) {
        console.error("Invalid URL:", error);
        toast({
          title: "Using Internal Application Process",
          description: "The external application link is not valid. Using our internal application system.",
          variant: "default"
        });
        setLocation(`/opportunities/${opportunity.id}/apply`);
      }
    } else {
      toast({
        title: "Internal Application Process",
        description: "Using our secure internal application system.",
        variant: "default"
      });
      setLocation(`/opportunities/${opportunity.id}/apply`);
    }
  };

  const renderVerifiedExperience = () => {
    if (!verifiedExperience) return null;

    const hasVerifiedData = 
      (verifiedExperience.workHistory?.length > 0) ||
      (verifiedExperience.certificates?.length > 0) ||
      (verifiedExperience.projects?.length > 0);

    if (!hasVerifiedData) {
      return (
        <div className="mt-4 text-sm text-muted-foreground">
          No verified experience available. Add and verify your experience to increase your chances.
        </div>
      );
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Verified Experience</h3>

        {verifiedExperience.workHistory?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Work History
            </h4>
            <div className="space-y-2">
              {verifiedExperience.workHistory.map((work) => (
                <div key={work.id} className="p-3 bg-secondary/10 rounded-md">
                  <p className="font-medium">{work.companyName}</p>
                  <p className="text-sm text-muted-foreground">{work.position}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(work.startDate).toLocaleDateString()} - 
                    {work.currentlyWorking ? 'Present' : new Date(work.endDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {verifiedExperience.certificates?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Verified Certificates
            </h4>
            <div className="space-y-2">
              {verifiedExperience.certificates.map((cert) => (
                <div key={cert.id} className="p-3 bg-secondary/10 rounded-md">
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Issued by: {cert.issuingAuthority}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                  </p>
                  {cert.certificateFile && (
                    <a
                      href={cert.certificateFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Certificate
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {verifiedExperience.projects?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2 flex items-center gap-2">
              <FolderGit2 className="h-4 w-4" />
              Verified Projects
            </h4>
            <div className="space-y-2">
              {verifiedExperience.projects.map((project) => (
                <div key={project.id} className="p-3 bg-secondary/10 rounded-md">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                  {project.completionDate && (
                    <p className="text-sm text-muted-foreground">
                      Completed: {new Date(project.completionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed to load funding opportunities. Please try again.
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Funding Opportunities...</CardTitle>
          <CardDescription>
            {selectedCountry 
              ? `Searching for opportunities in ${selectedCountry}...`
              : 'Searching for funding opportunities...'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!opportunities?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Funding Opportunities Found</CardTitle>
          <CardDescription>
            {selectedCountry
              ? `No funding opportunities available in ${selectedCountry}. Try another country or clear the filter.`
              : 'No funding opportunities match your profile. Try updating your profile.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onOpenProfileEditor}>
            Update Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  console.log('Rendering opportunities:', opportunities);

  return (
    <div key={selectedCountry || 'all'} className="space-y-6">
      {/* Header with country name */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Funding Opportunities
          {selectedCountry && (
            <>
              <span className="text-muted-foreground mx-2">in</span>
              <span className="text-primary">{selectedCountry}</span>
            </>
          )}
        </h2>
        <Badge variant="outline">
          {opportunities.length} available
        </Badge>
      </div>

      {/* Country filter control */}
      {selectedCountry && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCountrySelect(null)}
        >
          Clear Country Filter
        </Button>
      )}

      {/* Opportunities grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <Card
            key={opportunity.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setSelectedGrant(opportunity);
              setDialogOpen(true);
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{opportunity.type}</Badge>
                {opportunity.sector && (
                  <Badge variant="outline">{opportunity.sector}</Badge>
                )}
              </div>
              <CardTitle className="mt-2">{opportunity.name || 'Unnamed Opportunity'}</CardTitle>
              <div className="text-sm text-muted-foreground">
                <div className="flex flex-col gap-2">
                  {opportunity.provider && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{opportunity.provider}</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => handleApplicationClick(opportunity, e)}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Apply for Funding
                  </Button>

                  {opportunity.country && opportunity.region && (
                    <button
                      className="flex items-center gap-2 w-full text-left rounded-md py-2 px-3 mt-2 transition-all hover:bg-secondary hover:text-primary group border border-border hover:border-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCountrySelect(opportunity.country);
                      }}
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        {opportunity.country}, {opportunity.region}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Grant Amount</p>
                  <p className="text-2xl font-bold">
                    ${opportunity.amount?.toLocaleString() ?? 'Not specified'}
                  </p>
                </div>
                {opportunity.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {opportunity.description}
                  </p>
                )}
                {opportunity.requirementScore && (
                  <div>
                    <p className="text-sm font-medium mb-1">Requirements Match</p>
                    <Progress value={opportunity.requirementScore} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {opportunity.requirementScore}% match with eligibility criteria
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedGrant && (
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedGrant.name}</DialogTitle>
              <DialogDescription>
                <div className="flex flex-col gap-2 mt-2">
                  {selectedGrant.provider && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {selectedGrant.provider}
                      </span>
                    </div>
                  )}

                  {selectedGrant.country && selectedGrant.region && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        {selectedGrant.country}, {selectedGrant.region}
                      </span>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedGrant.type}</Badge>
                {selectedGrant.sector && (
                  <Badge variant="outline">{selectedGrant.sector}</Badge>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {selectedGrant.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Grant Amount</h3>
                <p className="text-3xl font-bold">
                  ${selectedGrant.amount?.toLocaleString() ?? 'Not specified'}
                </p>
              </div>

              {selectedGrant.applicationDeadline && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Application Deadline</h3>
                  <p className="text-muted-foreground">
                    {new Date(selectedGrant.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
              )}

              {isLoadingExperience ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 animate-pulse" />
                  Loading your verified experience...
                </div>
              ) : (
                renderVerifiedExperience()
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={(e) => handleApplicationClick(selectedGrant, e)}
                className="w-full sm:w-auto"
              >
                <Globe className="h-4 w-4 mr-2" />
                Apply for Funding
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}