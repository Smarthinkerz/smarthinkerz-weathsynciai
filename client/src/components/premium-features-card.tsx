import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Database, Zap } from "lucide-react";
import { Link } from "wouter";

export function PremiumFeaturesCard() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5 text-yellow-500" />
          Premium Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center text-lg font-medium">
              <Users className="mr-2 h-5 w-5" />
              Lead Generation
            </div>
            <p className="text-sm text-muted-foreground">
              Generate verified business leads from authentic data sources for any country and industry.
            </p>
            <Button 
              asChild 
              variant="default"
              className="mt-2"
              size="sm"
            >
              <Link href="/lead-generation">
                Access Lead Generation
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center text-lg font-medium">
              <BarChart3 className="mr-2 h-5 w-5" />
              Market Analytics
            </div>
            <p className="text-sm text-muted-foreground">
              Access real-time market data and analytics from authoritative economic sources globally.
            </p>
            <Button 
              asChild 
              variant="outline"
              className="mt-2"
              size="sm"
            >
              <Link href="/business-map">
                View Market Analytics
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center text-lg font-medium">
              <Database className="mr-2 h-5 w-5" />
              Business Directory
            </div>
            <p className="text-sm text-muted-foreground">
              Access verified business listings and connect with potential partners and customers.
            </p>
            <Button 
              asChild 
              variant="outline"
              className="mt-2"
              size="sm"
            >
              <Link href="/business-directory">
                Explore Directory
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}