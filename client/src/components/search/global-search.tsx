import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Globe, DollarSign, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface SearchResult {
  type: 'opportunity' | 'company' | 'funding';
  id: number;
  title: string;
  subtitle?: string;
  link: string;
}

const TYPE_CONFIG = {
  company: { icon: Building2, label: 'Company', color: 'bg-blue-100 text-blue-700' },
  opportunity: { icon: Globe, label: 'Opportunity', color: 'bg-green-100 text-green-700' },
  funding: { icon: DollarSign, label: 'Funding', color: 'bg-purple-100 text-purple-700' },
};

function useDebounce(value: string, ms: number) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [, setLocation] = useLocation();
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data, isLoading } = useQuery<{ results: SearchResult[] }>({
    queryKey: [`/api/search?q=${debouncedQuery}`],
    enabled: debouncedQuery.length >= 2,
    staleTime: 10000,
  });

  const results = data?.results || [];

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    setLocation(result.link);
  };

  return (
    <>
      <Button variant="outline" size="sm"
        className="hidden md:flex items-center gap-2 text-muted-foreground w-48 justify-start h-9 px-3"
        onClick={() => setOpen(true)}>
        <Search className="h-3.5 w-3.5" />
        <span className="text-sm">Search...</span>
        <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded border">⌘K</kbd>
      </Button>

      <Button variant="ghost" size="sm" className="md:hidden h-9 w-9 p-0" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden max-w-xl">
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies, opportunities, funding..."
              className="border-0 shadow-none focus-visible:ring-0 text-base py-4"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
            {debouncedQuery.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Type at least 2 characters to search</p>
                <p className="text-xs mt-1 opacity-70">Search across opportunities, companies, and funding</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No results for "<strong>{debouncedQuery}</strong>"</p>
              </div>
            ) : (
              <div className="p-2">
                {['company', 'opportunity', 'funding'].map(type => {
                  const typeResults = results.filter(r => r.type === type);
                  if (typeResults.length === 0) return null;
                  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                  const Icon = config.icon;
                  return (
                    <div key={type} className="mb-2">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{config.label}s</p>
                      {typeResults.map(result => (
                        <button key={result.id} onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">{config.label}</Badge>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
