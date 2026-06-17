import { isHighTier, isPaidTier, TIER_DISPLAY_NAMES } from '@shared/schema';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2, Save, User, Mail, Phone, Lock, Globe, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LANGUAGES = ['en', 'ar', 'fr', 'es', 'de', 'zh', 'ja', 'pt', 'ru', 'hi'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'JPY', 'CNY', 'INR', 'BRL', 'RUB'];
const LANG_NAMES: Record<string, string> = { en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish', de: 'German', zh: 'Chinese', ja: 'Japanese', pt: 'Portuguese', ru: 'Russian', hi: 'Hindi' };

export default function UserProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: (user as any)?.bio || '',
    phone: (user as any)?.phone || '',
    avatarUrl: (user as any)?.avatarUrl || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    preferredCurrency: user?.preferredCurrency || 'USD',
    preferredRegion: user?.preferredRegion || '',
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const profileMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest('PATCH', '/api/user/profile', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({ title: 'Profile saved', description: 'Your profile has been updated successfully.' });
    },
    onError: (err: any) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (pwForm.newPassword !== pwForm.confirmPassword) throw new Error("Passwords don't match");
      if (pwForm.newPassword.length < 8) throw new Error("Password must be at least 8 characters");
      const res = await apiRequest('PATCH', '/api/user/profile', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
    },
    onError: (err: any) => toast({ title: 'Password change failed', description: err.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) { setLocation('/auth'); return null; }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => setLocation('/dashboard')} className="mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={(user as any)?.avatarUrl} alt={user.name} />
          <AvatarFallback className="text-xl">{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <Badge variant={isHighTier(user.subscriptionTier) ? 'default' : 'secondary'} className="mt-1">
            {TIER_DISPLAY_NAMES[user.subscriptionTier || 'free'] || 'Explorer'}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" /> Personal Information</CardTitle>
            <CardDescription>Update your name, contact details, and bio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
              <Input placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea rows={3} placeholder="Tell us about yourself..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input placeholder="https://example.com/avatar.jpg" value={form.avatarUrl} onChange={e => setForm(p => ({ ...p, avatarUrl: e.target.value }))} />
            </div>
            <Button onClick={() => profileMutation.mutate(form)} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-green-600" /> Preferences</CardTitle>
            <CardDescription>Language, currency, and regional settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={form.preferredLanguage} onValueChange={v => setForm(p => ({ ...p, preferredLanguage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l} value={l}>{LANG_NAMES[l]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.preferredCurrency} onValueChange={v => setForm(p => ({ ...p, preferredCurrency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input placeholder="e.g. Middle East, Europe..." value={form.preferredRegion} onChange={e => setForm(p => ({ ...p, preferredRegion: e.target.value }))} />
              </div>
            </div>
            <Button onClick={() => profileMutation.mutate(form)} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-red-600" /> Change Password</CardTitle>
            <CardDescription>Update your password — minimum 8 characters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input type={showCurrent ? 'text' : 'password'} value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
                <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showNew ? 'text' : 'password'} value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                  <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={pwForm.confirmPassword}
                  onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
            </div>
            <Button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !pwForm.currentPassword || !pwForm.newPassword}>
              {passwordMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Username</span><span>@{user.username}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span>
              <Badge variant={isHighTier(user.subscriptionTier) ? 'default' : 'secondary'}>
                {TIER_DISPLAY_NAMES[user.subscriptionTier || 'free'] || 'Explorer'}
              </Badge>
            </div>
            {user.subscriptionEndDate && <>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Renews</span>
                <span>{new Date(user.subscriptionEndDate).toLocaleDateString()}</span>
              </div>
            </>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
