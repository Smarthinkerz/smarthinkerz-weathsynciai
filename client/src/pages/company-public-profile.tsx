import { isHighTier } from '@shared/schema';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Loader2, Globe, MapPin, Users, Calendar, Star, CheckCircle2, Building2, ArrowLeft, Phone, Mail, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PublicCompany {
  id: number;
  name: string;
  description: string;
  website?: string;
  logo?: string;
  profileVideo?: string;
  headquarters?: string;
  industries?: string[];
  foundedYear?: number;
  employeeCount?: number;
  verificationStatus: string;
  subscriptionTier: string;
  primaryContact?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  services: Array<{ id: number; name: string; description: string; price?: string; category?: string }>;
  reviews: Array<{ id: number; rating: number; review: string; reviewerName?: string; createdAt?: string }>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function CompanyPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: company, isLoading, error } = useQuery<PublicCompany>({
    queryKey: ['/api/companies', id, 'public'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!id,
  });

  // Build the correct API URL manually since queryKey is used as URL
  const { data: companyData, isLoading: loadingCompany } = useQuery<PublicCompany>({
    queryKey: [`/api/companies/${id}/public`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!id,
  });

  const data = companyData;

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Company Not Found</h1>
        <p className="text-muted-foreground">This company profile doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation('/business-map')}>Browse Companies</Button>
      </div>
    );
  }

  const isVerified = data.verificationStatus === 'verified';
  const isPremium = isHighTier(data.subscriptionTier);
  const avgRating = data.reviews?.length
    ? Math.round(data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <Button variant="ghost" className="text-white/80 hover:text-white mb-6"
            onClick={() => setLocation('/business-map')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </Button>

          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 rounded-xl border-4 border-white/30 flex-shrink-0">
              <AvatarImage src={data.logo || ''} alt={data.name} />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold rounded-xl">
                {data.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{data.name}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 bg-green-500/20 text-green-200 text-sm px-2 py-1 rounded-full border border-green-400/30">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
                {isPremium && (
                  <Badge className="bg-yellow-500/20 text-yellow-200 border border-yellow-400/30">Premium</Badge>
                )}
              </div>

              {data.description && (
                <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">{data.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-blue-200 text-sm">
                {data.headquarters && (
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{data.headquarters}</span>
                )}
                {data.foundedYear && (
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Founded {data.foundedYear}</span>
                )}
                {data.employeeCount && (
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{data.employeeCount.toLocaleString()} employees</span>
                )}
                {data.reviews?.length > 0 && (
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{avgRating}/5 ({data.reviews.length} reviews)</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {(data.industries || []).map(ind => (
                  <span key={ind} className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full border border-white/20">
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            {data.website && (
              <a href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 flex-shrink-0">
                  <Globe className="h-4 w-4 mr-2" /> Visit Website
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Video */}
            {data.profileVideo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" /> Company Introduction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={data.profileVideo} controls className="w-full h-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {data.services?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.services.map(svc => (
                      <div key={svc.id} className="p-4 rounded-lg border bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{svc.name}</h3>
                          {svc.price && <span className="text-sm text-green-600 font-medium">{svc.price}</span>}
                        </div>
                        {svc.category && <Badge variant="outline" className="text-xs">{svc.category}</Badge>}
                        {svc.description && <p className="text-sm text-muted-foreground">{svc.description}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {data.reviews?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Client Reviews
                    <Badge variant="secondary">{data.reviews.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.reviews.map((review, idx) => (
                    <div key={review.id}>
                      {idx > 0 && <Separator className="my-4" />}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{review.reviewerName || 'Anonymous'}</span>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground">{review.review}</p>
                        {review.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.services?.length === 0 && data.reviews?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No additional details listed yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right — contact sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.primaryContact && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{data.primaryContact}</span>
                  </div>
                )}
                {data.primaryContactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${data.primaryContactEmail}`} className="text-blue-600 hover:underline truncate">
                      {data.primaryContactEmail}
                    </a>
                  </div>
                )}
                {data.primaryContactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${data.primaryContactPhone}`} className="hover:underline">
                      {data.primaryContactPhone}
                    </a>
                  </div>
                )}
                {data.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                      target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      {data.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {!data.primaryContact && !data.primaryContactEmail && !data.primaryContactPhone && (
                  <p className="text-muted-foreground text-xs">No contact information listed</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={isVerified ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                    {isVerified ? '✓ Verified' : 'Unverified'}
                  </span>
                </div>
                {data.foundedYear && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Founded</span>
                    <span>{data.foundedYear}</span>
                  </div>
                )}
                {data.employeeCount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team size</span>
                    <span>{data.employeeCount.toLocaleString()}</span>
                  </div>
                )}
                {data.headquarters && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HQ</span>
                    <span className="text-right">{data.headquarters}</span>
                  </div>
                )}
                {data.reviews?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span>{avgRating}/5 stars</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
