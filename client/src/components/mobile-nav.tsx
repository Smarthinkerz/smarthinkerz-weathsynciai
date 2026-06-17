import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { isHighTier, isPaidTier, TIER_DISPLAY_NAMES } from "@shared/schema";
import { Menu, X, LayoutDashboard, Wallet, TrendingUp, Users, Map, Bot, Search, Lightbulb, BookmarkCheck, FileText, BarChart3, Crown, ShieldCheck, Target, Zap, LineChart, Briefcase, Brain, Shield, Plug, GraduationCap, MessageSquare, Key, Scale, Users2, CreditCard, Settings, type LucideIcon } from "lucide-react";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";

type NavItem = { href: string; icon: LucideIcon; label: string; badge?: string; premium?: boolean; beta?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/business-map", icon: Map, label: "Business Map" },
      { href: "/bookmarks", icon: BookmarkCheck, label: "Bookmarks" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/personal-finance", icon: Wallet, label: "Personal Finance AI", badge: "Basic+" },
      { href: "/team-financial-health", icon: Users, label: "Team Finance", badge: "Basic+" },
      { href: "/basic-tier", icon: BarChart3, label: "Economic Dashboard", badge: "Basic+" },
      { href: "/investment-strategist", icon: TrendingUp, label: "Investment Strategist", badge: "Elite", premium: true },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/premium-dashboard", icon: Crown, label: "Elite AI Agents", badge: "Elite", premium: true },
      { href: "/deep-research", icon: Search, label: "Deep Research", badge: "Elite", premium: true },
      { href: "/virtual-assistant", icon: Bot, label: "Virtual Assistant" },
      { href: "/ai-assistant", icon: Brain, label: "AI Assistant", badge: "Pro+" },
    ],
  },
  {
    label: "Opportunities",
    items: [
      { href: "/lead-generation", icon: Lightbulb, label: "Lead Generation", badge: "Elite", premium: true },
      { href: "/ai-opportunities", icon: Zap, label: "AI Opportunities" },
    ],
  },
  {
    label: "Contracts",
    items: [
      { href: "/smart-contracts", icon: FileText, label: "Smart Contracts" },
      { href: "/manage-contracts", icon: LineChart, label: "Manage Contracts" },
    ],
  },
  {
    label: "Verify & Portfolio",
    items: [
      { href: "/experience-verification", icon: ShieldCheck, label: "Verify Experience" },
      { href: "/portfolio", icon: Briefcase, label: "Portfolio" },
      { href: "/company-verification", icon: ShieldCheck, label: "Company Directory" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/marketplace", icon: Plug, label: "Marketplace" },
      { href: "/community", icon: MessageSquare, label: "Community" },
      { href: "/learning", icon: GraduationCap, label: "Learning Center" },
      { href: "/threat-simulation", icon: Shield, label: "Threat Simulation", badge: "Elite", premium: true, beta: true },
      { href: "/multi-agent", icon: Users2, label: "Multi-Agent", badge: "Elite", premium: true, beta: true },
      { href: "/policy-modeling", icon: Scale, label: "Policy Modeling", badge: "Elite", premium: true, beta: true },
      { href: "/developer", icon: Key, label: "Developer & Partners", badge: "Elite", premium: true },
      { href: "/integrations", icon: Plug, label: "Integrations" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", icon: Settings, label: "Profile & Settings" },
      { href: "/billing", icon: CreditCard, label: "Billing & Invoices" },
    ],
  },
];

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const isPremium = isHighTier(user?.subscriptionTier);
  const isBasicPlus = isPaidTier(user?.subscriptionTier) || isPremium;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden h-9 w-9 p-0"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        data-testid="button-mobile-nav"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={wealthSyncLogo} alt="WealthSync AI" className="h-8 w-8 object-contain" />
                <SheetTitle className="text-base font-bold">WealthSync AI</SheetTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {user && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground truncate">{user.name}</span>
                <Badge variant={isPremium ? "default" : "secondary"} className="text-[10px] px-1 py-0 flex-shrink-0">
                  {TIER_DISPLAY_NAMES[user.subscriptionTier || "free"] || "Explorer"}
                </Badge>
              </div>
            )}
          </SheetHeader>

          <nav className="overflow-y-auto flex-1 p-3 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    const isLocked = item.premium && !isPremium;

                    return (
                      <li key={item.href}>
                        <Link href={isLocked ? "/dashboard" : item.href}>
                          <a
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors min-h-[40px]",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent hover:text-accent-foreground",
                              isLocked && "opacity-50"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                            <span className="flex-1 leading-tight">{item.label}</span>
                            {item.badge && (
                              <Badge variant={item.premium ? "default" : "secondary"} className="text-[9px] px-1 py-0 flex-shrink-0">
                                {item.badge}
                              </Badge>
                            )}
                            {item.beta && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 flex-shrink-0" data-testid="badge-beta">
                                Beta
                              </Badge>
                            )}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
