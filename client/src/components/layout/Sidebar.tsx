import { isHighTier, isPaidTier, TIER_DISPLAY_NAMES } from '@shared/schema';
import wealthSyncLogo from '@/assets/wealthsync-logo.png';
import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Users,
  Map,
  Bot,
  Search,
  Lightbulb,
  BookmarkCheck,
  FileText,
  BarChart3,
  Crown,
  ShieldCheck,
  Target,
  Zap,
  LineChart,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  premiumOnly?: boolean;
  basicOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isPremium = isHighTier(user?.subscriptionTier);
  const isBasicOrAbove = isPaidTier(user?.subscriptionTier) || isPremium;

  const navGroups: NavGroup[] = [
    {
      label: 'Main',
      items: [
        { href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
        { href: '/business-map', icon: <Map className="h-4 w-4" />, label: 'Business Map' },
        { href: '/bookmarks', icon: <BookmarkCheck className="h-4 w-4" />, label: 'Bookmarks' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/personal-finance', icon: <Wallet className="h-4 w-4" />, label: 'Personal Finance AI', badge: 'Pro+', basicOnly: true },
        { href: '/team-financial-health', icon: <Users className="h-4 w-4" />, label: 'Team Finance', badge: 'Pro+', basicOnly: true },
        { href: '/basic-tier', icon: <BarChart3 className="h-4 w-4" />, label: 'Economic Dashboard', badge: 'Pro+', basicOnly: true },
        { href: '/investment-strategist', icon: <TrendingUp className="h-4 w-4" />, label: 'Investment Strategist', badge: 'Elite', premiumOnly: true },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { href: '/premium-dashboard', icon: <Crown className="h-4 w-4" />, label: 'Elite AI Agents', badge: 'Elite', premiumOnly: true },
        { href: '/deep-research', icon: <Search className="h-4 w-4" />, label: 'Deep Research', badge: 'Elite', premiumOnly: true },
        { href: '/virtual-assistant', icon: <Bot className="h-4 w-4" />, label: 'Virtual Assistant' },
      ],
    },
    {
      label: 'Opportunities',
      items: [
        { href: '/lead-generation', icon: <Lightbulb className="h-4 w-4" />, label: 'Lead Generation', badge: 'Elite', premiumOnly: true },
        { href: '/ai-opportunities', icon: <Zap className="h-4 w-4" />, label: 'AI Opportunities' },
      ],
    },
    {
      label: 'Contracts',
      items: [
        { href: '/smart-contracts', icon: <FileText className="h-4 w-4" />, label: 'Smart Contracts' },
        { href: '/manage-contracts', icon: <LineChart className="h-4 w-4" />, label: 'Manage Contracts' },
      ],
    },
    {
      label: 'Verification',
      items: [
        { href: '/experience-verification', icon: <ShieldCheck className="h-4 w-4" />, label: 'Verify Experience' },
        { href: '/company-verification', icon: <ShieldCheck className="h-4 w-4" />, label: 'Company Directory' },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full w-64 bg-background border-r z-40 transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <img src={wealthSyncLogo} alt="WealthSync AI" className="h-9 w-9 object-contain" />
          <h2 className="font-bold text-lg">WealthSync AI</h2>
        </div>
        {user && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{user.name}</span>
            <Badge variant={isPremium ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
              {TIER_DISPLAY_NAMES[user.subscriptionTier || 'free'] || 'Explorer'}
            </Badge>
          </div>
        )}
      </div>

      <nav className="overflow-y-auto h-[calc(100%-80px)] p-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href;
                const isLocked = (item.premiumOnly && !isPremium) || (item.basicOnly && !isBasicOrAbove);

                return (
                  <li key={item.href}>
                    <Link href={isLocked ? '/dashboard' : item.href}>
                      <a
                        className={cn(
                          'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground',
                          isLocked && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={item.premiumOnly ? 'default' : 'secondary'}
                            className="text-[9px] px-1 py-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
