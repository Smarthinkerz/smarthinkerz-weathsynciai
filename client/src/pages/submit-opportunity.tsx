import { OpportunityForm } from "@/components/opportunity-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InsertOpportunity } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function SubmitOpportunityPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const submitMutation = useMutation({
    mutationFn: async (data: InsertOpportunity) => {
      const res = await apiRequest("POST", "/api/opportunities/submit", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Opportunity Submitted",
        description: "Thank you for submitting your opportunity. Our team will review it shortly.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fix the type error by making onSubmit return a Promise
  const handleSubmit = async (data: InsertOpportunity) => {
    return submitMutation.mutateAsync(data);
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Link href="/company/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Submit an Opportunity</CardTitle>
          <p className="text-muted-foreground text-center mt-2">
            Looking for skilled professionals? Submit your opportunity and we'll match you with the best talent.
          </p>
        </CardHeader>
        <CardContent>
          <OpportunityForm
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}