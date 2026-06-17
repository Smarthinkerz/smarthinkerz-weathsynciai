import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { CountryData } from "./country-data";

interface RiskTabProps {
  data: CountryData;
  isPremium?: boolean;
}

export function RiskTab({ data, isPremium = false }: RiskTabProps) {
  // Get risk level color
  const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 45) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Risk Assessment</CardTitle>
          <CardDescription>Overview of market risk factors and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Overall Risk Level</h3>
                <p className="text-sm text-muted-foreground">Comprehensive evaluation based on multiple factors</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${getRiskLevelColor(data.riskLevel)}`}>
                {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Key Risk Factors</h4>
              <ul className="space-y-2 list-disc pl-5">
                {data.riskFactors?.map((factor, index) => (
                  <li key={index} className="text-sm">{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Business Opportunity Risk Analysis</CardTitle>
          <CardDescription>Detailed risk assessment of top opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Risk Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.opportunities.slice(0, 5).map((opportunity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{opportunity.name}</TableCell>
                  <TableCell>{opportunity.sector}</TableCell>
                  <TableCell className={`text-right ${getScoreColor(opportunity.riskScore)}`}>
                    {opportunity.riskScore}/100
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>* Lower scores indicate lower risk.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Economic Stability Indicators</CardTitle>
            <CardDescription>Factors affecting business stability</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Inflation</dt>
                <dd className={parseFloat(data.inflation.replace("%", "")) > 3 ? "text-amber-600" : "text-green-600"}>
                  {data.inflation}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Unemployment</dt>
                <dd className={parseFloat(data.unemployment.replace("%", "")) > 5 ? "text-amber-600" : "text-green-600"}>
                  {data.unemployment}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">GDP Growth</dt>
                <dd className="text-green-600">{data.gdpGrowth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Business Confidence</dt>
                <dd className={parseInt(data.businessConfidence.split("/")[0]) > 70 ? "text-green-600" : "text-amber-600"}>
                  {data.businessConfidence}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Risk Mitigation Strategies</CardTitle>
            <CardDescription>Recommendations for reducing business risk</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="mt-0.5 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">Strategy</span>
                <span className="text-sm">Diversify across multiple sectors to reduce exposure to any single risk factor</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">Strategy</span>
                <span className="text-sm">Partner with established local businesses for market entry</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">Strategy</span>
                <span className="text-sm">Implement flexible supply chain arrangements to manage disruptions</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">Strategy</span>
                <span className="text-sm">Conduct thorough regulatory compliance reviews before market entry</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Premium data source indicator */}
      {isPremium ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Risk Intelligence</CardTitle>
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Premium</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>Advanced risk analytics updated with real-time data</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Premium subscribers receive comprehensive risk assessments with detailed mitigation strategies.
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-3">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>Real-time risk alerts based on political and economic developments</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3 text-primary" />  
                <span>Data sourced from international regulatory and financial institutions</span>
              </div>
              <div className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />  
                <span>Risk assessments include links to source documentation</span>
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