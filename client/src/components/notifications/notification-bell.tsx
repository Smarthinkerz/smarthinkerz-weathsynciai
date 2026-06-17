import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Bell, X, CheckCheck, Loader2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  lead: 'text-blue-600',
  client_request: 'text-green-600',
  funding: 'text-purple-600',
  verification: 'text-orange-600',
  system: 'text-gray-500',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiRequest('PATCH', '/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const unreadCount = countData?.count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && <Badge variant="secondary" className="text-xs py-0">{unreadCount} new</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 flex items-center gap-1"
              onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
              {markAllMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((n, idx) => (
                <div key={n.id}>
                  {idx > 0 && <Separator />}
                  <div className={cn("relative px-4 py-3 hover:bg-muted/50 transition-colors group", !n.isRead && "bg-blue-50/50 dark:bg-blue-950/20")}>
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex-shrink-0", TYPE_COLORS[n.type] || 'text-gray-500')}>
                        {!n.isRead && <Circle className="h-2 w-2 fill-current mt-1.5" />}
                        {n.isRead && <div className="h-2 w-2" />}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id); }}>
                        <p className={cn("text-sm font-medium leading-tight", !n.isRead && "text-foreground", n.isRead && "text-muted-foreground")}>
                          {n.link ? (
                            <Link href={n.link} onClick={() => setOpen(false)} className="hover:underline">{n.title}</Link>
                          ) : n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => deleteMutation.mutate(n.id)}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
