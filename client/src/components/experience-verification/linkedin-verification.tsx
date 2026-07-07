import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Linkedin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function LinkedInVerification() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinProfile || "");

  const verifyLinkedInMutation = useMutation({
    mutationFn: async (profile: string) => {
      const res = await apiRequest("POST", "/api/verify-linkedin", { profile });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "LinkedIn URL saved",
        description: "Your LinkedIn URL was validated and linked to your profile. It is pending manual review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL",
        variant: "destructive",
      });
      return;
    }
    verifyLinkedInMutation.mutate(linkedinUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
        <h3 className="text-lg font-medium">LinkedIn Verification</h3>
      </div>

      <Card className="p-6">
        <form onSubmit={handleVerification} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">LinkedIn Profile URL</label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/your-profile"
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={verifyLinkedInMutation.isPending}
              className="flex items-center gap-2"
            >
              {verifyLinkedInMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Linkedin className="h-4 w-4" />
                  Link Profile
                </>
              )}
            </Button>

            {user?.linkedinVerified && (
              <span className="text-sm text-amber-600 font-medium">
                ✓ URL validated · pending review
              </span>
            )}
          </div>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Link your LinkedIn profile URL to your account. We validate the URL format and save it;
          the profile is then submitted for manual review. We do not automatically verify your work
          history or certifications from LinkedIn.
        </p>
      </Card>
    </div>
  );
}

