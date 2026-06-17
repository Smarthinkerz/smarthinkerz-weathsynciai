import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SubscriptionPlans from "./subscription-plans";
import { useEffect, useState } from "react";

export default function TrialBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<string>("");

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/upgrade-to-premium");
        const data = await res.json();
        return data;
      } catch (error) {
        throw new Error("Failed to upgrade account");
      }
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Trial Started!",
        description: "You now have access to premium features for 14 days.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Update countdown every minute
    const updateTimeLeft = () => {
      if (!user?.trialStartedAt) {
        console.log("No trial start date found");
        return;
      }

      console.log("Trial started at:", user.trialStartedAt);
      
      // Handle both timestamp in seconds and ISO string formats
      let trialStart: Date;
      if (typeof user.trialStartedAt === 'number') {
        trialStart = new Date(user.trialStartedAt * 1000);
      } else {
        // Try to parse it as a string date
        trialStart = new Date(user.trialStartedAt);
      }
      
      console.log("Parsed trial start:", trialStart);
      
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = trialEnd.getTime() - now.getTime();

      console.log("Trial end:", trialEnd);
      console.log("Time difference (ms):", diff);

      if (diff <= 0) {
        setTimeLeft("Trial ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days} days left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours} hours left`);
      } else {
        setTimeLeft(`${minutes} minutes left`);
      }
      
      console.log("Time left set to:", days > 0 ? `${days} days left` : hours > 0 ? `${hours} hours left` : `${minutes} minutes left`);
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [user?.trialStartedAt]);

  if (!user) return null;
  if (user.subscriptionTier !== 'free') return null;

  // If trialStartedAt is not set, consider the trial as not started
  if (!user.trialStartedAt) {
    return (
      <Alert className="rounded-none">
        <AlertTitle>Start Your Free Trial</AlertTitle>
        <div className="flex items-center justify-between">
          <AlertDescription>
            Start your 14-day free trial to access all premium features.
          </AlertDescription>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  View Plans
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[640px]">
                <SheetHeader>
                  <SheetTitle>Subscription Plans</SheetTitle>
                  <SheetDescription>
                    Choose the plan that best fits your needs
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  <SubscriptionPlans />
                </div>
              </SheetContent>
            </Sheet>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending}
            >
              {upgradeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Start Trial"
              )}
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  // Handle both timestamp format types
  let trialStart: Date;
  if (typeof user.trialStartedAt === 'number') {
    trialStart = new Date(user.trialStartedAt * 1000);
  } else {
    trialStart = new Date(user.trialStartedAt);
  }
  console.log("Checking trial end calculation - trial start:", trialStart);
  const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  console.log("Trial end date:", trialEnd, "Current time:", now);

  if (now > trialEnd) {
    return (
      <Alert className="rounded-none border-destructive bg-destructive/10">
        <AlertTitle className="text-destructive">Trial Period Ended</AlertTitle>
        <div className="flex items-center justify-between">
          <AlertDescription>
            Your trial period has ended. Choose a subscription plan to continue accessing all features.
          </AlertDescription>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="destructive" size="sm">
                Choose Plan
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[640px]">
              <SheetHeader>
                <SheetTitle>Subscription Plans</SheetTitle>
                <SheetDescription>
                  Choose the plan that best fits your needs
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <SubscriptionPlans />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Alert>
    );
  }

  return (
    <Alert className="rounded-none">
      <AlertTitle>Trial Period Active</AlertTitle>
      <div className="flex items-center justify-between">
        <AlertDescription>
          {timeLeft} in your trial. Choose a subscription plan to keep access to all features.
        </AlertDescription>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="default" size="sm">
              Choose Plan
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[640px]">
            <SheetHeader>
              <SheetTitle>Subscription Plans</SheetTitle>
              <SheetDescription>
                Choose the plan that best fits your needs
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <SubscriptionPlans />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Alert>
  );
}