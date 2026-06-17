import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CountryData } from "./country-data";
import { AlertCircle, Database, CheckCircle2 } from "lucide-react";

interface OverviewTabProps {
  data: CountryData;
  isPremium?: boolean;
}

export function OverviewTab({ data, isPremium = false }: OverviewTabProps) {
  // Validate data
  if (!data || !data.gdp || !data.population) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Economic data currently unavailable. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Economic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">GDP</dt>
                <dd>{data.gdp}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Population</dt>
                <dd>{data.population}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">GDP Growth</dt>
                <dd className="text-green-600">{data.gdpGrowth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Inflation</dt>
                <dd className="text-amber-600">{data.inflation}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Unemployment</dt>
                <dd>{data.unemployment}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Business Climate</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Business Confidence</dt>
                <dd>{data.businessConfidence}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Total Businesses</dt>
                <dd>{data.totalBusinesses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Market Size</dt>
                <dd>{typeof data.marketSize === 'number' 
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(data.marketSize)
                  : data.marketSize}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">New Startups (Annual)</dt>
                <dd>{data.newStartups}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Risk Level</dt>
                <dd className={
                  data.riskLevel === 'low' 
                    ? 'text-green-600' 
                    : data.riskLevel === 'medium' 
                      ? 'text-amber-600' 
                      : 'text-red-600'
                }>
                  {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Top Industry Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.industries.slice(0, 5).map((industry, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{industry.name}</span>
                  <span className="text-sm text-green-600">{industry.growth}</span>
                </div>
                <Progress value={industry.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Top Business Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.opportunities.slice(0, 5).map((opportunity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{opportunity.name}</p>
                  <p className="text-sm text-muted-foreground">{opportunity.sector}</p>
                </div>
                <div className="flex items-center">
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    opportunity.riskScore < 30 
                      ? 'bg-green-100 text-green-800'
                      : opportunity.riskScore < 45
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    Risk: {opportunity.riskScore}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Premium data source indicator */}
      {isPremium ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Data Source</CardTitle>
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Premium</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm">
              <Database className="h-4 w-4 text-primary" />
              <span>Real-time data from official sources</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span>Premium access includes real-time economic data directly from World Bank DataBank API, IMF World Economic Outlook, OECD.Stat, and UN Comtrade International Trade Statistics.</span>
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-3">
            <div className="text-xs flex flex-col gap-1 text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span>GDP & Growth Forecasts: IMF World Economic Outlook (2025)</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />  
                <span>Business & Trade Data: OECD.Stat, UN Comtrade (2025)</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="text-xs text-muted-foreground mt-4 italic">
          <div>Data sources: World Bank, IMF, OECD, UN Comtrade, National Statistical Offices (2023-2024)</div>
          <div>Data compiled from official national and international economic databases</div>
        </div>
      )}
    </div>
  );
}