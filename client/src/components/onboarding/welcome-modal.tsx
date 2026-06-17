import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Brain, Search, Target, DollarSign, ArrowRight, Sparkles, X } from "lucide-react";
import { useLocation } from "wouter";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to WealthSync AI",
    body: "Your AI-powered command center for lead generation, funding discovery, and market intelligence. Let's take a quick tour.",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: Brain,
    title: "AI Agents that work for you",
    body: "Investment Strategist, Geopolitical Analyst, Opportunity Mapper, and Scenario Simulation — all powered by GPT-4o. Find them in the Intelligence menu.",
    color: "text-purple-600 bg-purple-100",
  },
  {
    icon: Search,
    title: "Search anything, anywhere",
    body: "Press ⌘K (or Ctrl+K) on any page to instantly search across companies, opportunities, and funding.",
    color: "text-green-600 bg-green-100",
  },
  {
    icon: Target,
    title: "Generate qualified leads",
    body: "Use the Lead Generation tool to discover prospects via Apollo, LinkedIn, and Apify with geographic and industry targeting.",
    color: "text-amber-600 bg-amber-100",
  },
  {
    icon: DollarSign,
    title: "Discover funding",
    body: "Browse a global database of grants, loans, accelerators, and venture capital — matched to your profile.",
    color: "text-rose-600 bg-rose-100",
  },
];

const STORAGE_KEY = "wealthsync.onboarding.dismissed";

export function WelcomeModal() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  const finishAndExplore = () => {
    dismiss();
    setLocation("/dashboard");
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md" data-testid="dialog-welcome">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          data-testid="button-welcome-close"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader className="items-center text-center pt-2">
          {step === 0 ? (
            <img src={wealthSyncLogo} alt="WealthSync AI" className="h-16 w-16 object-contain mb-2" />
          ) : (
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-2 ${current.color}`}>
              <Icon className="h-8 w-8" />
            </div>
          )}
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-1">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button variant="ghost" onClick={dismiss} className="sm:mr-auto" data-testid="button-welcome-skip">
            Skip tour
          </Button>
          {isLast ? (
            <Button onClick={finishAndExplore} data-testid="button-welcome-finish">
              Explore Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={next} data-testid="button-welcome-next">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
