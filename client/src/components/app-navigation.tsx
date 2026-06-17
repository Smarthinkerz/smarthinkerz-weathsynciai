import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Globe,
  Map,
  Wallet,
  Users,
  FileText,
  Lightbulb,
  Search,
  BookmarkCheck,
  Bot,
  BarChart3,
  Crown,
  Target,
  ShieldCheck,
  Zap,
  LineChart,
  Briefcase,
  Brain,
  Shield,
  Plug,
  GraduationCap,
  MessageSquare,
  Key,
  Scale,
  Users2,
} from "lucide-react";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  beta?: boolean;
}

function NavCard({ href, icon, label, description, badge, badgeVariant = "secondary", beta }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <NavigationMenuLink
        className={cn(
          "flex flex-col gap-1 p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium leading-none">{label}</span>
          {badge && (
            <Badge variant={badgeVariant} className="ml-auto text-[10px] px-1 py-0">
              {badge}
            </Badge>
          )}
          {beta && (
            <Badge variant="outline" className={cn("text-[10px] px-1 py-0", !badge && "ml-auto")} data-testid="badge-beta">
              Beta
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {description}
          </p>
        )}
      </NavigationMenuLink>
    </Link>
  );
}

export function AppNavigation() {
  const [location] = useLocation();

  return (
    <NavigationMenu>
      <NavigationMenuList className="flex-wrap gap-1">

        {/* Dashboard */}
        <NavigationMenuItem>
          <Link href="/dashboard">
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                location === "/dashboard" && "bg-accent"
              )}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Finance */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Wallet className="h-4 w-4 mr-2" />
            Finance
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[420px] gap-1 p-3 md:grid-cols-2">
              <NavCard
                href="/personal-finance"
                icon={<Wallet className="h-4 w-4" />}
                label="Personal Finance AI"
                description="Smart budget builder, spending analysis, savings goals"
                badge="Basic+"
              />
              <NavCard
                href="/team-financial-health"
                icon={<Users className="h-4 w-4" />}
                label="Team Financial Health"
                description="Monitor and analyse your team's financial wellness"
                badge="Basic+"
              />
              <NavCard
                href="/investment-strategist"
                icon={<TrendingUp className="h-4 w-4" />}
                label="Investment Strategist"
                description="AI-powered portfolio recommendations and risk assessment"
                badge="Premium"
                badgeVariant="default"
              />
              <NavCard
                href="/basic-tier"
                icon={<BarChart3 className="h-4 w-4" />}
                label="Economic Dashboard"
                description="Live GDP, inflation, and market data by country"
                badge="Basic+"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Intelligence */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Zap className="h-4 w-4 mr-2" />
            Intelligence
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[440px] gap-1 p-3 md:grid-cols-2">
              <NavCard
                href="/premium-dashboard"
                icon={<Crown className="h-4 w-4" />}
                label="Premium AI Agents"
                description="Investment Strategist, Geopolitical Analyst, Opportunity Mapper, Scenario Simulation"
                badge="Premium"
                badgeVariant="default"
              />
              <NavCard
                href="/deep-research"
                icon={<Search className="h-4 w-4" />}
                label="Deep Research"
                description="AI research across hundreds of sources with confidence scoring"
                badge="Premium"
                badgeVariant="default"
              />
              <NavCard
                href="/business-map"
                icon={<Map className="h-4 w-4" />}
                label="Business Map"
                description="Interactive world map with economic data and business locations"
              />
              <NavCard
                href="/virtual-assistant"
                icon={<Bot className="h-4 w-4" />}
                label="Virtual Assistant"
                description="AI chatbot, email drafter, business plan generator"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Opportunities */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Target className="h-4 w-4 mr-2" />
            Opportunities
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[400px] gap-1 p-3 md:grid-cols-2">
              <NavCard
                href="/lead-generation"
                icon={<Lightbulb className="h-4 w-4" />}
                label="Lead Generation"
                description="Discover and enrich leads via Apollo, LinkedIn, and Apify"
                badge="Premium"
                badgeVariant="default"
              />
              <NavCard
                href="/dashboard"
                icon={<Globe className="h-4 w-4" />}
                label="Funding Opportunities"
                description="Global grants, loans, and accelerators matched to your profile"
              />
              <NavCard
                href="/ai-opportunities"
                icon={<Zap className="h-4 w-4" />}
                label="AI Opportunities"
                description="AI-matched business opportunities based on your skills"
              />
              <NavCard
                href="/bookmarks"
                icon={<BookmarkCheck className="h-4 w-4" />}
                label="Bookmarks"
                description="Saved opportunities, leads, and funding sources"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Contracts */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <FileText className="h-4 w-4 mr-2" />
            Contracts
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[360px] gap-1 p-3 md:grid-cols-2">
              <NavCard
                href="/smart-contracts"
                icon={<FileText className="h-4 w-4" />}
                label="Smart Contracts"
                description="Create and manage AI-generated business contracts"
              />
              <NavCard
                href="/manage-contracts"
                icon={<LineChart className="h-4 w-4" />}
                label="Manage Contracts"
                description="View, track, and manage all your active contracts"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Verification & Portfolio */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verify
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[380px] gap-1 p-3 md:grid-cols-2">
              <NavCard
                href="/experience-verification"
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Verify Experience"
                description="Upload credentials, references, and certifications for a verified badge"
              />
              <NavCard
                href="/portfolio"
                icon={<Briefcase className="h-4 w-4" />}
                label="Portfolio"
                description="Showcase projects, endorsements, and client feedback"
              />
              <NavCard
                href="/company-verification"
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Company Verification"
                description="View and manage verification status for companies"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Platform */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Globe className="h-4 w-4 mr-2" />
            Platform
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[460px] gap-1 p-3 md:grid-cols-2">
              <NavCard
                href="/ai-assistant"
                icon={<Brain className="h-4 w-4" />}
                label="AI Assistant"
                description="Smart AI with conversation memory and personalized insights"
                badge="Pro+"
              />
              <NavCard
                href="/threat-simulation"
                icon={<Shield className="h-4 w-4" />}
                label="Threat Simulation"
                description="AI-powered fraud detection and risk simulation"
                badge="Elite"
                badgeVariant="default"
                beta
              />
              <NavCard
                href="/marketplace"
                icon={<Plug className="h-4 w-4" />}
                label="Marketplace"
                description="Extend WealthSync with plugins and integrations"
              />
              <NavCard
                href="/community"
                icon={<MessageSquare className="h-4 w-4" />}
                label="Community"
                description="Connect and share insights with other members"
              />
              <NavCard
                href="/learning"
                icon={<GraduationCap className="h-4 w-4" />}
                label="Learning Center"
                description="Structured learning tracks with certifications"
              />
              <NavCard
                href="/developer"
                icon={<Key className="h-4 w-4" />}
                label="Developer & Partners"
                description="API keys, usage analytics, and affiliate program"
                badge="Elite"
                badgeVariant="default"
              />
              <NavCard
                href="/multi-agent"
                icon={<Users2 className="h-4 w-4" />}
                label="Multi-Agent Collaboration"
                description="Have multiple AI specialists answer one query together"
                badge="Elite"
                badgeVariant="default"
                beta
              />
              <NavCard
                href="/policy-modeling"
                icon={<Scale className="h-4 w-4" />}
                label="Co-Policy Modeling"
                description="Compare policy scenarios with AI-driven impact analysis"
                badge="Elite"
                badgeVariant="default"
                beta
              />
              <NavCard
                href="/integrations"
                icon={<Plug className="h-4 w-4" />}
                label="Integration Status"
                description="Connected APIs, status, and configuration"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

      </NavigationMenuList>
    </NavigationMenu>
  );
}
