import { TIER_DISPLAY_NAMES } from '@shared/schema';
import { RISK_ANALYTICS_LIVE } from '@shared/feature-flags';
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, Building2, LogOut, TrendingUp, Globe, Shield, Brain,
  Zap, Target, MapPin, FileText, BarChart3, Crown, Search,
  ArrowRight, ArrowLeft, CheckCircle2, DollarSign, Users, Lock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";
import featAgents from "@/assets/features/agents.jpg";
import featDeepResearch from "@/assets/features/deep-research.png";
import featLeadGen from "@/assets/features/lead-gen.jpg";
import featFunding from "@/assets/features/funding.jpg";
import featBusinessMap from "@/assets/features/business-map.jpg";
import featVerification from "@/assets/features/verification.jpg";
import featContracts from "@/assets/features/contracts.jpg";
import featEconomic from "@/assets/features/economic.jpg";

const FEATURES = [
  { image: featAgents, title: "AI-Powered Agents", desc: "Investment Strategist, Geopolitical Analyst, Opportunity Mapper, and Scenario Simulation — all powered by GPT-4o." },
  { image: featDeepResearch, title: "Deep Research", desc: "AI research across hundreds of sources with confidence scoring, data attribution, and exportable reports." },
  { image: featLeadGen, title: "Lead Generation", desc: "Multi-source lead discovery via Apollo, LinkedIn, and Apify with geographic and industry targeting." },
  { image: featFunding, title: "Funding Opportunities", desc: "Global database of grants, loans, accelerators, and venture capital — matched to your profile." },
  { image: featBusinessMap, title: "Interactive Business Map", desc: "Explore economic data, business locations, and market opportunities on a real-time world map." },
  { image: featVerification, title: "Company Verification", desc: "Badge system, employee verification, case studies, and premium directory listing for credibility." },
  { image: featContracts, title: "Smart Contracts", desc: "AI-generated business contracts with customizable templates, status tracking, and management." },
  { image: featEconomic, title: "Economic Dashboard", desc: "Live GDP, inflation, unemployment, and market data for any country — powered by World Bank and Finnhub." },
];

const PLANS = [
  { tier: "Explorer", price: "Free", period: "", features: ["Limited AI agent access", "Basic summarized insights", "3D opportunity map (view-only)", "Basic alerts", "Limited daily queries"], highlight: false },
  { tier: "Professional", price: "$49", period: "/month", features: ["Full multi-agent system (Beta)", "Advanced deep analysis", "Interactive 3D opportunity map", "Scenario simulations (Beta)", "Personalized tracking", "Priority AI processing", RISK_ANALYTICS_LIVE ? "Risk analytics: volatility, Sharpe, beta, max drawdown" : "Risk analytics (volatility, Sharpe, beta, max drawdown) — Coming soon"], highlight: true },
  { tier: "Elite", price: "$149", period: "/month", features: ["Everything in Professional", "Predictive modeling", "Multi-agent collaboration (Beta)", "Real-time global signals", "Custom dashboards", "Lead generation & contracts"], highlight: false },
  { tier: "Enterprise", price: "Custom", period: "starting ~$500–$5,000+/mo or annual contracts", features: ["Everything in Elite", "API integrations", "Dedicated AI models", "Team roles & collaboration", "Private data integration", "Dedicated account manager"], highlight: false },
];

function RotatingCounter({ target, duration = 2000, pause = 1500 }: { target: number; duration?: number; pause?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let timeout = 0;
    let cancelled = false;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          timeout = window.setTimeout(() => {
            setValue(0);
            run();
          }, pause);
        }
      };
      raf = requestAnimationFrame(tick);
    };
    run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [target, duration, pause]);
  return <>{value}</>;
}

export default function IndexPage() {
  const [, setLocation] = useLocation();
  const { user, company, isLoading, logoutMutation, companyAuth } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      if (user) await logoutMutation.mutateAsync();
      else if (company) await fetch('/api/company/logout', { method: 'POST', credentials: 'include' });
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      window.location.href = '/';
    } catch (error) {
      toast({ title: "Logout failed", description: "There was an error logging you out.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user || company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <img src={wealthSyncLogo} alt="WealthSync AI" className="h-16 w-16 object-contain" />
            </div>
            <CardTitle className="text-2xl">Welcome back{user ? `, ${user.name || user.username}` : company ? `, ${company.name}` : ''}!</CardTitle>
            <CardDescription>
              {user ? `${TIER_DISPLAY_NAMES[user.subscriptionTier || 'free'] || 'Explorer'} account` : 'Company account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Button className="w-full h-12 text-base" onClick={() => setLocation(user ? '/dashboard' : '/company/dashboard')}>
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/hero-poster.jpg"
          aria-hidden="true"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-purple-900/30" />
        <div className="absolute inset-0 bg-black/10" />
        <nav className="relative container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={wealthSyncLogo} alt="WealthSync AI" className="h-11 w-11 object-contain drop-shadow-lg" />
            <span className="text-xl font-bold text-white drop-shadow">WealthSync AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://www.smarthinkerz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-md px-3 py-1.5 transition-colors"
              data-testid="link-smarthinkerz-hub"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Smarthinkerz Hub</span>
              <span className="sm:hidden">Hub</span>
            </a>
            <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm hidden sm:inline-flex" onClick={() => setLocation('/auth')}>
              Sign In
            </Button>
            <Button size="sm" className="bg-white text-blue-700 hover:bg-white/90 shadow-lg" onClick={() => setLocation('/auth')}>
              Get Started
            </Button>
          </div>
        </nav>
        <div className="relative container mx-auto px-4 pt-16 pb-24 text-center">
          <Badge className="mb-6 bg-white/15 text-white border-white/20 backdrop-blur px-4 py-1.5">
            <Zap className="h-3 w-3 mr-1" /> AI-Powered Business Intelligence
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto">
            Grow your business with
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-amber-300"> AI-driven insights</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            Lead generation, funding discovery, market analysis, and smart contracts — all in one platform for individuals and companies.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90 h-14 px-8 text-lg shadow-xl" onClick={() => setLocation('/auth')}>
              <User className="mr-2 h-5 w-5" /> Start as Individual
            </Button>
            <Button size="lg" className="bg-white/20 backdrop-blur text-yellow-300 border border-white/40 hover:bg-white/30 h-14 px-8 text-lg" onClick={() => setLocation('/company/auth')}>
              <Building2 className="mr-2 h-5 w-5" /> Start as Company
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white text-sm px-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free tier available</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 px-3 py-1">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to scale</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">From AI agents to market data, WealthSync gives you the tools to make smarter business decisions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <Card key={i} className="group hover:shadow-xl transition-all border-0 shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 px-3 py-1">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free, upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan) => (
              <Card key={plan.tier} className={`relative ${plan.highlight ? 'border-2 border-blue-600 shadow-xl lg:scale-105' : 'border shadow-sm'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 px-3"><Crown className="h-3 w-3 mr-1" /> Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl">{plan.tier === 'Enterprise' ? 'Enterprise / Institutional' : plan.tier}</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <div className="text-sm text-muted-foreground mt-1">{plan.period}</div>}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-blue-600' : 'text-green-600'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full mt-6 ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.highlight ? 'default' : 'outline'}
                    onClick={() => setLocation('/auth')}>
                    {plan.tier === 'Explorer' ? 'Start Free' : plan.tier === 'Enterprise' ? 'Contact Sales' : `Get ${plan.tier}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dual audience */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 px-3 py-1">For Everyone</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Built for individuals and companies</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">
              <User className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">For Individuals</h3>
            <p className="text-muted-foreground mb-5">Entrepreneurs, freelancers, and professionals seeking investment opportunities, market insights, and business growth tools.</p>
            <ul className="space-y-2 text-sm mb-6">
              {["Personal finance AI", "Investment strategist", "AI opportunity matching", "Experience verification"].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />{item}</li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => setLocation('/auth')}>
              <User className="mr-2 h-4 w-4" /> Get Started
            </Button>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center mb-5">
              <Building2 className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">For Companies</h3>
            <p className="text-muted-foreground mb-5">Businesses seeking verification, client acquisition, market expansion, and AI-powered competitive intelligence.</p>
            <ul className="space-y-2 text-sm mb-6">
              {["Company verification badges", "Client request management", "Premium directory listing", "Market reports & analytics"].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />{item}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => setLocation('/company/auth')}>
              <Building2 className="mr-2 h-4 w-4" /> Register Company
            </Button>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { target: 19, suffix: "+", label: "Registered Companies", duration: 2400 },
              { target: 19, suffix: "+", label: "Funding Opportunities", duration: 2400 },
              { target: 4, suffix: "", label: "AI Agents", duration: 1200 },
              { target: 177, suffix: "", label: "API Endpoints", duration: 3000 },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold tabular-nums">
                  <RotatingCounter target={stat.target} duration={stat.duration} />{stat.suffix}
                </div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Ready to accelerate your growth?</h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">Join WealthSync today and access AI-powered business intelligence that helps you make smarter decisions.</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="h-12 px-8" onClick={() => setLocation('/auth')}>
            Start Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8" onClick={() => setLocation('/company/auth')}>
            <Building2 className="mr-2 h-4 w-4" /> Company Sign Up
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={wealthSyncLogo} alt="WealthSync AI" className="h-9 w-9 object-contain" />
              <span className="font-bold">WealthSync AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure & Encrypted</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Enterprise-Grade Security</span>
            </div>
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} WealthSync AI. All rights reserved.</p>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Part of the{" "}
            <a
              href="https://www.smarthinkerz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
              data-testid="link-smarthinkerz-hub-landing-footer"
            >
              SmarThinkerz Unified Intelligence Hub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
