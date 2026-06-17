import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', { email });
      return res.json();
    },
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-muted-foreground">
              If an account with <strong>{email}</strong> exists, we've sent a password reset link. It expires in 1 hour.
            </p>
            <p className="text-sm text-muted-foreground">Didn't receive it? Check your spam folder.</p>
            <Link href="/auth">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center">
              <Mail className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && email && mutation.mutate(email)}
              autoFocus
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as any)?.message || 'Something went wrong'}</p>
          )}

          <Button className="w-full" onClick={() => mutation.mutate(email)}
            disabled={!email || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Send Reset Link
          </Button>

          <Link href="/auth">
            <Button variant="ghost" className="w-full flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
