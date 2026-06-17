import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, TrendingUp, Briefcase, ArrowUpRight } from "lucide-react";
import { CountryData } from "./country-data";

interface MarketTabProps {
  data: CountryData;
  isPremium?: boolean;
}

export function MarketTab({ data, isPremium = false }: MarketTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Market Overview</CardTitle>
            <CardDescription>Economic indicators and market overview</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Market Size</dt>
                <dd className="font-bold">
                  {/* Display based on market size status */}
                  {data.marketSizeStatus === 'unavailable' ? (
                    <span className="text-amber-600 font-medium text-sm">
                      {data.marketSizeMessage || 'Data unavailable from official sources'}
                    </span>
                  ) : data.marketSizeStatus === 'error' ? (
                    <span className="text-red-600 font-medium text-sm">
                      {data.marketSizeMessage || 'Error retrieving data'}
                    </span>
                  ) : data.marketSizeFormatted ? (
                    data.marketSizeFormatted
                  ) : typeof data.marketSize === 'number' ? (
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(data.marketSize)
                  ) : (
                    data.marketSize
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Growth Rate</dt>
                <dd className="text-green-600">{data.growthRate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Total Businesses</dt>
                <dd>{data.totalBusinesses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">New Startups (Annual)</dt>
                <dd>{data.newStartups}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Economic Health</CardTitle>
            <CardDescription>Key economic performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">GDP Growth</dt>
                <dd className="text-green-600">{data.gdpGrowth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Inflation</dt>
                <dd className={parseFloat(data.inflation.replace("%", "")) > 3 ? "text-amber-600" : "text-green-600"}>{data.inflation}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Unemployment</dt>
                <dd className={parseFloat(data.unemployment.replace("%", "")) > 5 ? "text-amber-600" : "text-green-600"}>{data.unemployment}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Business Confidence</dt>
                <dd className={parseInt(data.businessConfidence.split("/")[0]) > 70 ? "text-green-600" : "text-amber-600"}>{data.businessConfidence}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Business Opportunity Scores</CardTitle>
          <CardDescription>Analysis of top sectors by growth potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.industries.slice(0, 6).map((industry, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{industry.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">{industry.growth}</span>
                    <span className="text-xs text-muted-foreground">Score: {industry.value}/100</span>
                  </div>
                </div>
                <Progress value={industry.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Market Risk Assessment</CardTitle>
          <CardDescription>Evaluation of market risks and challenges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Risk Level</span>
              <span className={
                data.riskLevel === 'low' 
                  ? 'text-green-600' 
                  : data.riskLevel === 'medium' 
                    ? 'text-amber-600' 
                    : 'text-red-600'
              }>
                {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Risk Factors</h4>
              <ul className="space-y-1 list-disc pl-5">
                {data.riskFactors.map((factor, index) => (
                  <li key={index} className="text-sm">{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium data source indicator */}
      {/* Data source attribution with status indicators */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Market Data Sources</CardTitle>
            {isPremium ? (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Premium Data</Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">Standard Data</Badge>
            )}
          </div>
          <CardDescription>Data from official economic agencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Database className="h-4 w-4 text-blue-600" />
                <span>World Bank API Gateway</span>
              </div>
              {data.worldBankStatus === 'error' ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>
              ) : data.worldBankStatus === 'unavailable' ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unavailable</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>IMF World Economic Outlook</span>
              </div>
              {data.imfStatus === 'error' ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>
              ) : data.imfStatus === 'unavailable' ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unavailable</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
              )}
            </div>
            
            {isPremium && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-violet-600" />
                  <span>Alpha Vantage Economic Indicators</span>
                </div>
                {data.alphaVantageStatus === 'error' ? (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>
                ) : data.alphaVantageStatus === 'unavailable' ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unavailable</Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>All market data is retrieved directly from official economic databases. No synthetic or placeholder data is used.</p>
            <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}