import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, ChartPie, LineChart, Info } from "lucide-react";
import { CountryData } from "./country-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IndustryTabProps {
  data: CountryData;
  isPremium?: boolean;
}

export function IndustryTab({ data, isPremium = false }: IndustryTabProps) {
  // Check if data has the real-time data flag
  const hasRealTimeData = (data as any).hasRealTimeData === true;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Industry Growth Analysis</CardTitle>
              <CardDescription>Growth rates across major industrial sectors</CardDescription>
            </div>
            {isPremium && hasRealTimeData && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Live Data
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.industries.map((industry, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{industry.name}</span>
                    {isPremium && hasRealTimeData && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Real-time data from official sources</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${
                      parseFloat(industry.growth.replace("%", "").replace("+", "")) > 5 
                        ? "text-green-600" 
                        : parseFloat(industry.growth.replace("%", "").replace("+", "")) > 2 
                          ? "text-amber-600" 
                          : "text-muted-foreground"
                    }`}>
                      {industry.growth}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={industry.value} 
                  className={`h-2 ${
                    industry.value > 80 
                      ? "bg-green-600" 
                      : industry.value > 60 
                        ? "bg-amber-600" 
                        : ""
                  }`} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Performance Score: {industry.value}/100</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Business Formation</CardTitle>
            <CardDescription>Annual business creation statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Total Businesses</dt>
                <dd>{data.totalBusinesses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">New Startups</dt>
                <dd>{data.newStartups}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Business Confidence</dt>
                <dd>{data.businessConfidence}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Growth Rate</dt>
                <dd className="text-green-600">{data.growthRate}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Opportunity Analysis</CardTitle>
            <CardDescription>High potential business sectors</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.opportunities.slice(0, 5).map((opportunity, index) => (
                <li key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{opportunity.name}</p>
                    <p className="text-xs text-muted-foreground">{opportunity.sector}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    opportunity.riskScore < 30 
                      ? 'bg-green-100 text-green-800'
                      : opportunity.riskScore < 45
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    Risk: {opportunity.riskScore}/100
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Economic Factors</CardTitle>
          <CardDescription>Influences on industry performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Risk Factors</h4>
              <ul className="space-y-1 list-disc pl-5">
                {data.riskFactors?.map((factor, index) => (
                  <li key={index} className="text-sm">{factor}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Growth Indicators</h4>
              <ul className="space-y-2">
                <li className="text-sm flex justify-between">
                  <span>GDP Growth:</span>
                  <span className="text-green-600">{data.gdpGrowth}</span>
                </li>
                <li className="text-sm flex justify-between">
                  <span>Inflation:</span>
                  <span className={parseFloat(data.inflation.replace("%", "")) > 3 ? "text-amber-600" : "text-green-600"}>
                    {data.inflation}
                  </span>
                </li>
                <li className="text-sm flex justify-between">
                  <span>Unemployment:</span>
                  <span className={parseFloat(data.unemployment.replace("%", "")) > 5 ? "text-amber-600" : "text-green-600"}>
                    {data.unemployment}
                  </span>
                </li>
                <li className="text-sm flex justify-between">
                  <span>Market Size:</span>
                  <span>{data.marketSize}</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium data source indicator */}
      {isPremium ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Industry Analytics</CardTitle>
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Premium</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm">
              <ChartPie className="h-4 w-4 text-primary" />
              <span>Advanced industry analytics with real-time data</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Premium subscribers receive in-depth industry performance metrics from UNIDO Industrial Analytics, World Bank Enterprise Surveys, and regional development banks.
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-3">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BarChart className="h-3 w-3 text-primary" />
                <span>Industry forecasts from IMF Sectoral Database 2025</span>
              </div>
              <div className="flex items-center gap-1">
                <LineChart className="h-3 w-3 text-primary" />  
                <span>Real-time analytics from World Bank Global Economic Monitor 2025</span>
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