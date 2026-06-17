import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StockQuote {
  symbol: string;
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  prevClose: number;
}

interface FinnhubTickerProps {
  symbols?: string[];
  title?: string;
  compact?: boolean;
}

export function FinnhubTicker({ symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'], title = 'Live Market Prices', compact = false }: FinnhubTickerProps) {
  const symbolsStr = symbols.join(',');

  const { data: quotes, isLoading, refetch, dataUpdatedAt } = useQuery<StockQuote[]>({
    queryKey: ['/api/finnhub/quotes', symbolsStr],
    queryFn: () => fetch(`/api/finnhub/quotes?symbols=${symbolsStr}`).then(r => r.json()),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {quotes?.map(q => (
          <div key={q.symbol} className="flex items-center gap-1.5 shrink-0 bg-muted/40 rounded-md px-2 py-1">
            <span className="text-xs font-semibold">{q.symbol}</span>
            <span className="text-xs font-mono">${q.current?.toFixed(2)}</span>
            <span className={`text-xs flex items-center ${q.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {q.changePercent >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {Math.abs(q.changePercent ?? 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-br from-emerald-50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              Live via Finnhub
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="ml-2 text-sm text-muted-foreground">Fetching live prices...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes?.map(q => (
              <div key={q.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-700">{q.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{q.symbol}</p>
                    <p className="text-xs text-muted-foreground">H: ${q.high?.toFixed(2)} · L: ${q.low?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${q.current?.toFixed(2)}</p>
                  <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${q.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {q.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {q.change >= 0 ? '+' : ''}{q.change?.toFixed(2)} ({Math.abs(q.changePercent ?? 0).toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinnhubNewsWidget() {
  const { data: news, isLoading } = useQuery<any[]>({
    queryKey: ['/api/finnhub/news'],
    queryFn: () => fetch('/api/finnhub/news?category=general').then(r => r.json()),
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 15,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-transparent">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Market News</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {news?.slice(0, 5).map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                className="block hover:bg-muted/40 rounded-lg p-2 transition-colors group">
                <p className="text-sm font-medium leading-snug group-hover:text-blue-600 line-clamp-2">{item.headline}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {item.datetime ? new Date(item.datetime * 1000).toLocaleDateString() : ''}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
