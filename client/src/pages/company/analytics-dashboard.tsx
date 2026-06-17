import { isHighTier, TIER_DISPLAY_NAMES } from '@shared/schema';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { ArrowLeft, Eye, MessageSquare, Users, MousePointerClick, Activity, Clock, TrendingUp } from "lucide-react";

interface AnalyticsSummary {
  profile_view?: number;
  chatbot_interaction?: number;
  client_request?: number;
  directory_click?: number;
  [key: string]: number | undefined;
}

interface AnalyticsEvent {
  id: number;
  eventType: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface TrendPoint {
  date: string;
  profile_view: number;
  chatbot_interaction: number;
  client_request: number;
  directory_click: number;
}

const eventTypeConfig: Record<string, { label: string; color: string; fill: string }> = {
  profile_view:       { label: "Profile Views",       color: "bg-purple-100 text-purple-800", fill: "#9333ea" },
  chatbot_interaction:{ label: "Chatbot",             color: "bg-blue-100 text-blue-800",    fill: "#3b82f6" },
  client_request:     { label: "Client Requests",     color: "bg-green-100 text-green-800",  fill: "#22c55e" },
  directory_click:    { label: "Directory Clicks",    color: "bg-orange-100 text-orange-800",fill: "#f97316" },
};

function SummaryCard({ label, icon: Icon, count, color, bg, loading }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-8 w-12 mb-1" />
          ) : (
            <p className="text-2xl font-bold">{count ?? 0}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboardPage() {
  const { company } = useAuth();
  const [, setLocation] = useLocation();
  const [days, setDays] = useState("30");

  if (!company) {
    setLocation("/company/auth");
    return null;
  }

  const { data: rawSummary, isLoading: summaryLoading } = useQuery<any[]>({
    queryKey: ["/api/company/analytics/summary"],
  });

  const { data: trend, isLoading: trendLoading } = useQuery<TrendPoint[]>({
    queryKey: ["/api/company/analytics/trend", days],
    queryFn: async () => {
      const res = await fetch(`/api/company/analytics/trend?days=${days}`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery<AnalyticsEvent[]>({
    queryKey: ["/api/company/analytics/events"],
  });

  // Flatten summary array into a map
  const summary: AnalyticsSummary = {};
  if (Array.isArray(rawSummary)) {
    for (const row of rawSummary) {
      summary[row.eventType] = Number(row.count);
    }
  }

  const totalEvents = Object.values(summary).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;

  const stats = [
    { key: "profile_view",        label: "Profile Views",     icon: Eye,             color: "text-purple-600", bg: "bg-purple-100" },
    { key: "chatbot_interaction",  label: "Chatbot Sessions",  icon: MessageSquare,   color: "text-blue-600",   bg: "bg-blue-100"   },
    { key: "client_request",       label: "Client Requests",   icon: Users,           color: "text-green-600",  bg: "bg-green-100"  },
    { key: "directory_click",      label: "Directory Clicks",  icon: MousePointerClick,color: "text-orange-600",bg: "bg-orange-100" },
  ];

  // Format date labels for chart (show MM/DD)
  const formattedTrend = (trend ?? []).map(p => ({
    ...p,
    label: p.date.slice(5), // MM-DD
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/company/dashboard")} className="text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your company profile performance and engagement</p>
          </div>
          <Badge variant="outline" className="text-blue-700 border-blue-300 ml-auto">
            {TIER_DISPLAY_NAMES[company.subscriptionTier || 'free'] || 'Explorer'} Plan
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <SummaryCard
              key={s.key}
              label={s.label}
              icon={s.icon}
              count={summary[s.key]}
              color={s.color}
              bg={s.bg}
              loading={summaryLoading}
            />
          ))}
        </div>

        {/* Total Events */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Engagement Events (all time)</p>
              {summaryLoading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-blue-700">{totalEvents}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Engagement Over Time
                </CardTitle>
                <CardDescription>Daily event counts across all interaction types</CardDescription>
              </div>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={formattedTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="profile_view"        name="Profile Views"    stackId="1" stroke="#9333ea" fill="#e9d5ff" />
                  <Area type="monotone" dataKey="chatbot_interaction"  name="Chatbot"          stackId="1" stroke="#3b82f6" fill="#dbeafe" />
                  <Area type="monotone" dataKey="client_request"       name="Client Requests"  stackId="1" stroke="#22c55e" fill="#dcfce7" />
                  <Area type="monotone" dataKey="directory_click"      name="Directory Clicks" stackId="1" stroke="#f97316" fill="#ffedd5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Event Breakdown by Day
            </CardTitle>
            <CardDescription>Compare different interaction types side by side</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={formattedTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="profile_view"        name="Profile Views"    fill="#9333ea" radius={[2,2,0,0]} />
                  <Bar dataKey="chatbot_interaction"  name="Chatbot"          fill="#3b82f6" radius={[2,2,0,0]} />
                  <Bar dataKey="client_request"       name="Client Requests"  fill="#22c55e" radius={[2,2,0,0]} />
                  <Bar dataKey="directory_click"      name="Directory Clicks" fill="#f97316" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest events and interactions with your company profile</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !events || events.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No activity yet</p>
                <p className="text-sm text-gray-500">Events will appear here as users interact with your profile</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 20).map(event => {
                  const config = eventTypeConfig[event.eventType] || { label: event.eventType, color: "bg-gray-100 text-gray-800", fill: "#6b7280" };
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 rounded-full bg-gray-100">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={config.color}>{config.label}</Badge>
                          <span className="text-sm text-gray-400">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="text-sm text-gray-500">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                <span className="font-medium text-gray-600">{key}:</span> {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
