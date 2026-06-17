import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function PaymentVerification() {
  console.log('PaymentVerification component mounted', {
    path: window.location.pathname,
    search: window.location.search
  });

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the session_id from URL parameters
        const params = new URLSearchParams(window.location.search);
        const tapId = params.get('tap_id');

        console.log('Payment verification started:', {
          tapId,
          currentLocation: window.location.pathname + window.location.search
        });

        if (!tapId) {
          console.error('No payment ID found in URL parameters');
          toast({
            title: "Verification Failed",
            description: "No payment ID found",
            variant: "destructive",
          });
          setLocation('/');
          return;
        }

        const response = await apiRequest('GET', `/api/verify-subscription?tap_id=${tapId}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Verification error data:', errorData);
          throw new Error(errorData.error || 'Payment verification failed');
        }

        const data = await response.json();
        console.log('Verification successful:', data);

        toast({
          title: "Payment Successful",
          description: "Your subscription has been activated!",
        });

        // Wait a moment before redirecting
        setTimeout(() => {
          setLocation('/'); // Redirect to home instead of dashboard
        }, 2000);
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Verification Failed",
          description: error instanceof Error ? error.message : "Failed to verify payment",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/'); // Redirect to home on error
        }, 2000);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [setLocation, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <h2 className="text-lg font-semibold">Verifying your payment...</h2>
      <p className="text-muted-foreground">Please wait while we confirm your subscription.</p>
    </div>
  );
}

export default PaymentVerification;