import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function CompanyPaymentVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extract session_id from URL query params
        const params = new URLSearchParams(window.location.search);
        const tapId = params.get('tap_id');

        if (!tapId) {
          setVerificationStatus('error');
          setErrorMessage('No payment ID found in URL');
          return;
        }

        const response = await apiRequest('GET', `/api/verify-company-subscription?tap_id=${tapId}`);
        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          toast({
            title: 'Subscription Successful',
            description: 'Your subscription has been activated successfully!',
            variant: 'default',
          });
        } else {
          throw new Error(data.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        toast({
          title: 'Verification Failed',
          description: 'There was a problem verifying your payment.',
          variant: 'destructive',
        });
      }
    };

    verifyPayment();
  }, [toast]);

  const handleContinue = () => {
    setLocation('/dashboard');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Subscription Verification</CardTitle>
          <CardDescription>
            {verificationStatus === 'loading'
              ? 'Please wait while we verify your payment...'
              : verificationStatus === 'success'
              ? 'Your subscription has been activated!'
              : 'There was a problem with your subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-8 space-y-4">
          {verificationStatus === 'loading' ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          ) : verificationStatus === 'success' ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}

          {verificationStatus === 'success' ? (
            <div className="text-center max-w-xs mx-auto">
              <p className="text-green-600 font-medium text-lg mb-2">Payment Successful!</p>
              <p className="text-muted-foreground">
                Your subscription has been activated and all premium features are now available in your account.
              </p>
            </div>
          ) : verificationStatus === 'error' ? (
            <div className="text-center max-w-xs mx-auto">
              <p className="text-destructive font-medium text-lg mb-2">Verification Failed</p>
              <p className="text-muted-foreground">
                {errorMessage || 'We could not verify your payment. Please try again or contact support.'}
              </p>
              {errorMessage && errorMessage.includes('session') && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Your payment may have been successful, but we couldn't verify it. Please check your email for a receipt
                    and contact support if needed.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus === 'loading' ? (
            <Button disabled>Please wait...</Button>
          ) : verificationStatus === 'success' ? (
            <Button onClick={handleContinue}>Continue to Dashboard</Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry}>
                Try Again
              </Button>
              <Button onClick={handleContinue}>Return to Dashboard</Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}