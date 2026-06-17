import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Briefcase, Award, FolderGit2, Eye } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function FundingApplicationPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: opportunity, error, isLoading } = useQuery({
    queryKey: [`/api/funding-opportunities/${id}/apply`],
    queryFn: async () => {
      const response = await fetch(`/api/funding-opportunities/${id}/apply`);
      if (!response.ok) {
        throw new Error('Failed to fetch funding opportunity details');
      }
      return response.json();
    }
  });

  const { data: verifiedExperience, isLoading: isLoadingExperience, error: experienceError } = useQuery({
    queryKey: [`/api/user/${user?.id}/verified-experience`],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      console.log("Fetching verified experience for user:", user.id);
      const response = await fetch(`/api/user/${user.id}/verified-experience`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch verified experience');
      }
      const data = await response.json();
      console.log("Received verified experience data:", data);
      return data;
    },
    enabled: !!user?.id,
    retry: 2
  });

  if (isLoading || isLoadingExperience) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load funding opportunity details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please try again later or contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!opportunity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Found</CardTitle>
          <CardDescription>Funding opportunity not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The funding opportunity you're looking for doesn't exist or has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleApply = () => {
    if (opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Contact Provider",
        description: `Please contact ${opportunity.provider} directly to apply for this funding opportunity.`,
      });
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{opportunity.name}</CardTitle>
          <CardDescription>
            <div className="flex flex-col gap-2 mt-2">
              {opportunity.provider && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{opportunity.provider}</span>
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{opportunity.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Grant Amount</h3>
              <p className="text-2xl font-bold">
                ${opportunity.amount?.toLocaleString() ?? 'Not specified'}
              </p>
            </div>

            {opportunity.applicationDeadline && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Application Deadline</h3>
                <p className="text-muted-foreground">
                  {new Date(opportunity.applicationDeadline).toLocaleDateString()}
                </p>
              </div>
            )}

            {experienceError && (
              <div className="text-destructive text-sm mt-4">
                Failed to load verified experience data: {experienceError.message}
              </div>
            )}

            {isLoadingExperience && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading verified experience...
              </div>
            )}

            {verifiedExperience && (
              (verifiedExperience.workHistory?.length > 0 ||
                verifiedExperience.certificates?.length > 0 ||
                verifiedExperience.projects?.length > 0) ? (
                <div>
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
                            <p className="text-sm text-muted-foreground">
                              {new Date(project.completionDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No verified experience data available yet.
                </div>
              )
            )}
          </div>
          <Button onClick={handleApply} className="w-full mt-4">
            <Globe className="h-4 w-4 mr-2" />
            Apply for Funding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}