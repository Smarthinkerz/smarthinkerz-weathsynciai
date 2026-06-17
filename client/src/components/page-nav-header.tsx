import { Link } from "wouter";
import { AppNavigation } from "@/components/app-navigation";
import { MobileNavSheet } from "@/components/mobile-nav";
import { GlobalSearch } from "@/components/search/global-search";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";

export function PageNavHeader() {
  const { user } = useAuth();

  return (
    <div className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer px-2 py-1 rounded-md hover:bg-accent transition-colors" data-testid="link-brand-home">
            <img src={wealthSyncLogo} alt="WealthSync AI" className="h-8 w-8 object-contain" />
            <span className="font-bold text-sm hidden sm:inline">WealthSync AI</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="flex-1 hidden md:block overflow-x-auto">
          <AppNavigation />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile hamburger */}
          <MobileNavSheet />
          <GlobalSearch />
          <Tooltip>
            <TooltipTrigger asChild>
              <span><NotificationBell /></span>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full" data-testid="button-profile-avatar">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any)?.avatarUrl} alt={user?.name} />
                      <AvatarFallback className="text-xs">{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Profile</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
