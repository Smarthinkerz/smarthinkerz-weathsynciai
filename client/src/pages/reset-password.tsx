import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (password !== confirm) throw new Error("Passwords don't match");
      const res = await apiRequest('POST', '/api/auth/reset-password', { token, password });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      return data;
    },
    onSuccess: () => setDone(true),
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Invalid Link</h2>
            <p className="text-muted-foreground">This reset link is invalid or has expired.</p>
            <Link href="/forgot-password"><Button className="w-full">Request New Link</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Password Reset!</h2>
            <p className="text-muted-foreground">Your password has been updated. You can now sign in with your new password.</p>
            <Link href="/auth"><Button className="w-full">Sign In</Button></Link>
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
              <Lock className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Enter a new password — at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" placeholder="Repeat new password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && mutation.mutate()} />
            {confirm && password !== confirm && (
              <p className="text-xs text-destructive">Passwords don't match</p>
            )}
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {(mutation.error as any)?.message || 'Failed to reset password'}
            </div>
          )}

          <Button className="w-full" onClick={() => mutation.mutate()}
            disabled={!password || password !== confirm || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            Reset Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
