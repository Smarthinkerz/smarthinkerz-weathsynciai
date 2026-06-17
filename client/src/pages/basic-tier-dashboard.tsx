import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Building, BarChart3,
  AlertCircle, Activity, Target, Calendar, ChevronRight, Globe
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface EconomicData {
  gdp: number;
  gdpGrowth: number;
  inflation: number;
  unemployment: number;
  interestRate: number;
  marketSentiment: string;
  lastUpdated: string;
  dataSource: string;
  country?: string;
}

interface TeamFinancialHealth {
  monthlyBudget: number;
  currentSpending: number;
  teamSize: number;
  budgetUtilization: number;
  savingsGoal: number;
  actualSavings: number;
  costPerEmployee: number;
  projectedBurnRate: number;
}

interface FinancialMetric {
  name: string;
  value: string;
  change: number;
  status: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

// Comprehensive worldwide country database
const countries = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CD', name: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' }
];

export default function BasicTierDashboard() {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Economic Data Query
  const { data: economicData, isLoading: economicLoading, error: economicError } = useQuery({
    queryKey: ['/api/economic-data', selectedCountry],
    queryFn: async () => {
      const response = await fetch(`/api/economic-data?country=${encodeURIComponent(selectedCountry)}`);
      if (!response.ok) throw new Error('Failed to fetch economic data');
      return response.json();
    }
  });

  // Team Financial Health Query
  const { data: teamHealth, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ['/api/teams/financial-health'],
    queryFn: async () => {
      const response = await fetch('/api/teams/financial-health');
      if (!response.ok) throw new Error('Failed to fetch team financial health');
      return response.json();
    }
  });

  // Economic indicators for display
  const economicMetrics: FinancialMetric[] = economicData ? [
    {
      name: 'GDP Growth',
      value: `${economicData.gdpGrowth}%`,
      change: economicData.gdpGrowth,
      status: economicData.gdpGrowth > 0 ? 'positive' : 'negative',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      name: 'Inflation Rate',
      value: `${economicData.inflation}%`,
      change: economicData.inflation,
      status: economicData.inflation < 3 ? 'positive' : economicData.inflation < 5 ? 'neutral' : 'negative',
      icon: <Activity className="h-4 w-4" />
    },
    {
      name: 'Unemployment',
      value: `${economicData.unemployment}%`,
      change: -economicData.unemployment,
      status: economicData.unemployment < 5 ? 'positive' : economicData.unemployment < 8 ? 'neutral' : 'negative',
      icon: <Users className="h-4 w-4" />
    },
    {
      name: 'Interest Rate',
      value: `${economicData.interestRate}%`,
      change: economicData.interestRate,
      status: 'neutral',
      icon: <DollarSign className="h-4 w-4" />
    }
  ] : [];

  // Team financial metrics
  const teamMetrics: FinancialMetric[] = teamHealth ? [
    {
      name: 'Budget Utilization',
      value: `${teamHealth.budgetUtilization}%`,
      change: teamHealth.budgetUtilization - 75, // Compare to 75% target
      status: teamHealth.budgetUtilization < 80 ? 'positive' : teamHealth.budgetUtilization < 95 ? 'neutral' : 'negative',
      icon: <Target className="h-4 w-4" />
    },
    {
      name: 'Cost per Employee',
      value: `$${teamHealth.costPerEmployee.toLocaleString()}`,
      change: 0, // Would need historical data for change
      status: 'neutral',
      icon: <Users className="h-4 w-4" />
    },
    {
      name: 'Monthly Savings',
      value: `$${teamHealth.actualSavings.toLocaleString()}`,
      change: ((teamHealth.actualSavings / teamHealth.savingsGoal) - 1) * 100,
      status: teamHealth.actualSavings >= teamHealth.savingsGoal ? 'positive' : 'negative',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      name: 'Burn Rate',
      value: `$${teamHealth.projectedBurnRate.toLocaleString()}/mo`,
      change: 0, // Would need historical data
      status: teamHealth.projectedBurnRate < teamHealth.monthlyBudget ? 'positive' : 'negative',
      icon: <TrendingDown className="h-4 w-4" />
    }
  ] : [];

  // Sample historical data for charts
  const economicTrendData = [
    { month: 'Jan', gdp: 2.1, inflation: 3.2, unemployment: 4.5 },
    { month: 'Feb', gdp: 2.3, inflation: 3.1, unemployment: 4.3 },
    { month: 'Mar', gdp: 2.2, inflation: 3.4, unemployment: 4.2 },
    { month: 'Apr', gdp: 2.4, inflation: 3.6, unemployment: 4.1 },
    { month: 'May', gdp: 2.6, inflation: 3.5, unemployment: 4.0 },
    { month: 'Jun', gdp: 2.5, inflation: 3.7, unemployment: 3.9 }
  ];

  const teamBudgetData = teamHealth ? [
    { month: 'Jan', budget: teamHealth.monthlyBudget, spending: teamHealth.currentSpending * 0.85, savings: teamHealth.actualSavings * 0.7 },
    { month: 'Feb', budget: teamHealth.monthlyBudget, spending: teamHealth.currentSpending * 0.92, savings: teamHealth.actualSavings * 0.8 },
    { month: 'Mar', budget: teamHealth.monthlyBudget, spending: teamHealth.currentSpending * 0.88, savings: teamHealth.actualSavings * 0.9 },
    { month: 'Apr', budget: teamHealth.monthlyBudget, spending: teamHealth.currentSpending * 0.95, savings: teamHealth.actualSavings * 0.85 },
    { month: 'May', budget: teamHealth.monthlyBudget, spending: teamHealth.currentSpending * 0.98, savings: teamHealth.actualSavings * 0.95 },
    { month: 'Jun', budget: teamHealth.monthlyBudget, spending: teamHealth.currentSpending, savings: teamHealth.actualSavings }
  ] : [];

  const MetricCard = ({ metric }: { metric: FinancialMetric }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${
              metric.status === 'positive' ? 'bg-green-100 text-green-600' :
              metric.status === 'negative' ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
            </div>
          </div>
          {metric.change !== 0 && metric.change !== null && (
            <Badge variant={metric.status === 'positive' ? 'default' : metric.status === 'negative' ? 'destructive' : 'secondary'}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (economicLoading || teamLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Basic Tier Dashboard</h1>
          <p className="text-muted-foreground">
            Economic insights and team financial health monitoring for small businesses
          </p>
          {economicData && (
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {countries.find(c => c.code === selectedCountry)?.flag} {countries.find(c => c.code === selectedCountry)?.name} Economic Data
              </Badge>
              <Badge variant="outline" className="text-xs">
                Source: {economicData.dataSource}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[280px] justify-between"
                >
                  {selectedCountry
                    ? (
                      <div className="flex items-center space-x-2">
                        <span>{countries.find((country) => country.code === selectedCountry)?.flag}</span>
                        <span>{countries.find((country) => country.code === selectedCountry)?.name}</span>
                      </div>
                    )
                    : "Select country..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput placeholder="Search countries..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={country.name}
                          onSelect={() => {
                            setSelectedCountry(country.code);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedCountry === country.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Basic Tier
          </Badge>
        </div>
      </div>

      {/* Error Handling */}
      {(economicError || teamError) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {economicError && `Economic data: ${economicError.message}. `}
            {teamError && `Team data: ${teamError.message}. `}
            Some features may be limited.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="economic">Economic Data</TabsTrigger>
          <TabsTrigger value="team">Team Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {economicMetrics.slice(0, 2).map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
            {teamMetrics.slice(0, 2).map((metric, index) => (
              <MetricCard key={index + 2} metric={metric} />
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Economic Outlook</span>
                </CardTitle>
                <CardDescription>Key indicators for {selectedCountry}</CardDescription>
              </CardHeader>
              <CardContent>
                {economicData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Market Sentiment</span>
                      <Badge variant={economicData.marketSentiment === 'Positive' ? 'default' : 'secondary'}>
                        {economicData.marketSentiment}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      GDP growing at {economicData.gdpGrowth}% with inflation at {economicData.inflation}%. 
                      Economic conditions appear {economicData.gdpGrowth > 2 ? 'favorable' : 'cautious'} for small business growth.
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setLocation('/company/dashboard')}
                    >
                      View Detailed Analysis
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Economic data unavailable</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Team Financial Health</span>
                </CardTitle>
                <CardDescription>Your team's financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                {teamHealth ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Team Size</span>
                      <span className="font-semibold">{teamHealth.teamSize} members</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget Utilization</span>
                        <span>{teamHealth.budgetUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            teamHealth.budgetUtilization < 80 ? 'bg-green-500' : 
                            teamHealth.budgetUtilization < 95 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(teamHealth.budgetUtilization, 100)}%` }}
                        />
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setLocation('/team-financial-health')}
                    >
                      Manage Team Budget
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Team data unavailable</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="economic" className="space-y-6">
          {/* Economic Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {economicMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>

          {/* Economic Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Economic Trends</CardTitle>
              <CardDescription>6-month historical data for key indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={economicTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="gdp" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="GDP Growth (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="inflation" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Inflation (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unemployment" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="Unemployment (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Team Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>

          {/* Budget Tracking Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Spending Trends</CardTitle>
              <CardDescription>6-month budget utilization and savings tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={teamBudgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="budget" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="Budget"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spending" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="Spending"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    stackId="3"
                    stroke="#ffc658" 
                    fill="#ffc658"
                    fillOpacity={0.8}
                    name="Savings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Team Financial Actions</CardTitle>
              <CardDescription>Quick actions for team financial management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Budget Goals
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team Members
                </Button>
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}