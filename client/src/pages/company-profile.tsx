import { isHighTier, isPaidTier, TIER_DISPLAY_NAMES } from '@shared/schema';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Building2, Globe, Phone, MapPin, Users, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import VideoUploader from '@/components/company/VideoUploader';

const INDUSTRY_OPTIONS = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Consulting", "Real Estate", "Legal", "Marketing",
  "Logistics", "Energy", "Agriculture", "Media", "Non-profit"
];

export default function CompanyProfilePage() {
  const { company, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string | null>(company?.profileVideo || null);
  const [industryInput, setIndustryInput] = useState('');

  const [form, setForm] = useState({
    name: company?.name || '',
    description: company?.description || '',
    website: company?.website || '',
    headquarters: company?.headquarters || '',
    primaryContact: company?.primaryContact || '',
    primaryContactEmail: company?.primaryContactEmail || '',
    primaryContactPhone: company?.primaryContactPhone || '',
    foundedYear: company?.foundedYear?.toString() || '',
    employeeCount: company?.employeeCount?.toString() || '',
    industries: (company?.industries || []) as string[],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        foundedYear: data.foundedYear ? parseInt(data.foundedYear) : undefined,
        employeeCount: data.employeeCount ? parseInt(data.employeeCount) : undefined,
      };
      const res = await apiRequest('PUT', '/api/company/profile', payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company'] });
      toast({ title: 'Profile updated', description: 'Your company profile has been saved successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Update failed', description: err.message || 'Failed to save profile', variant: 'destructive' });
    },
  });

  const handleVideoUploadComplete = (uploadedVideoUrl: string) => {
    setVideoUrl(uploadedVideoUrl);
    toast({ title: 'Video uploaded', description: 'Your company profile video has been updated.' });
  };

  const toggleIndustry = (industry: string) => {
    setForm(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry],
    }));
  };

  const addCustomIndustry = () => {
    const trimmed = industryInput.trim();
    if (trimmed && !form.industries.includes(trimmed)) {
      setForm(prev => ({ ...prev, industries: [...prev.industries, trimmed] }));
    }
    setIndustryInput('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    setLocation('/company/auth');
    return null;
  }

  const isPremium = isHighTier(company.subscriptionTier);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setLocation('/company/dashboard')} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
            <p className="text-muted-foreground mt-1">Edit your company information and public profile</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isPremium ? "default" : "secondary"}>
              {TIER_DISPLAY_NAMES[company.subscriptionTier || 'free'] || 'Explorer'}
            </Badge>
            <Badge variant={company.verificationStatus === 'verified' ? 'default' : 'outline'}
              className={company.verificationStatus === 'verified' ? 'bg-green-600' : ''}>
              {company.verificationStatus === 'verified' ? '✓ Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — core info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Company Information
              </CardTitle>
              <CardDescription>Your company's core details shown on your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input id="name" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Website
                  </Label>
                  <Input id="website" placeholder="https://yourcompany.com" value={form.website}
                    onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea id="description" rows={4} placeholder="Describe your company, mission, and services..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headquarters" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Headquarters
                  </Label>
                  <Input id="headquarters" placeholder="City, Country" value={form.headquarters}
                    onChange={e => setForm(p => ({ ...p, headquarters: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foundedYear" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Founded Year
                  </Label>
                  <Input id="foundedYear" type="number" placeholder="e.g. 2015" value={form.foundedYear}
                    onChange={e => setForm(p => ({ ...p, foundedYear: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount" className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> Number of Employees
                </Label>
                <Input id="employeeCount" type="number" placeholder="e.g. 50" value={form.employeeCount}
                  onChange={e => setForm(p => ({ ...p, employeeCount: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Contact Information
              </CardTitle>
              <CardDescription>Primary contact details for your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContact">Primary Contact Name</Label>
                <Input id="primaryContact" value={form.primaryContact}
                  onChange={e => setForm(p => ({ ...p, primaryContact: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryContactEmail">Contact Email</Label>
                  <Input id="primaryContactEmail" type="email" value={form.primaryContactEmail}
                    onChange={e => setForm(p => ({ ...p, primaryContactEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryContactPhone">Contact Phone</Label>
                  <Input id="primaryContactPhone" placeholder="+1 (555) 123-4567" value={form.primaryContactPhone}
                    onChange={e => setForm(p => ({ ...p, primaryContactPhone: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Industries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-600" />
                Industries
              </CardTitle>
              <CardDescription>Select the industries your company operates in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map(industry => (
                  <button key={industry} type="button" onClick={() => toggleIndustry(industry)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.industries.includes(industry)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary'
                    }`}>
                    {industry}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add custom industry..." value={industryInput}
                  onChange={e => setIndustryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomIndustry())} />
                <Button type="button" variant="outline" onClick={addCustomIndustry}>Add</Button>
              </div>
              {form.industries.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.industries.map(ind => (
                    <Badge key={ind} variant="secondary" className="cursor-pointer" onClick={() => toggleIndustry(ind)}>
                      {ind} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save button */}
          <Button className="w-full" size="lg" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Right column — status & video */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {TIER_DISPLAY_NAMES[company.subscriptionTier || 'free'] || 'Explorer'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verification</span>
                <span className={company.verificationStatus === 'verified' ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                  {company.verificationStatus === 'verified' ? 'Verified ✓' : 'Pending'}
                </span>
              </div>
              {company.subscriptionEndDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Renews</span>
                  <span>{new Date(company.subscriptionEndDate).toLocaleDateString()}</span>
                </div>
              )}
              <Separator />
              {!isPremium && (
                <Button size="sm" className="w-full" onClick={() => setLocation('/company/subscription')}>
                  Upgrade to Premium
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Profile Video — Premium only */}
          <Card className={!isPremium ? 'opacity-70' : ''}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Profile Video
                {!isPremium && <Badge variant="secondary" className="text-xs">Premium</Badge>}
              </CardTitle>
              <CardDescription>
                {isPremium ? "Showcase your company with an intro video" : "Upgrade to Premium to add a video"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                videoUrl ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <video src={videoUrl} controls className="w-full h-full object-contain" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setVideoUrl(null)}>
                      Replace Video
                    </Button>
                  </div>
                ) : (
                  <VideoUploader onUploadComplete={handleVideoUploadComplete} maxSizeMB={100} companyId={company.id} />
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Video profile is a Premium feature</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
