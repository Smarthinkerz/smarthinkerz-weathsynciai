import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import BasicEconomicDashboard from '@/components/dashboards/basic-economic-dashboard';
import { formatEconomicData } from '@/components/dashboards/economics-data-adapter';

interface EconomicDashboardTabProps {
  selectedCountry: string | null;
  selectedIndustry: string;
  isPremium?: boolean;
}

export function EconomicDashboardTab({ 
  selectedCountry, 
  selectedIndustry,
  isPremium = false 
}: EconomicDashboardTabProps) {
  const [economicData, setEconomicData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data when a country is selected
    if (!selectedCountry) {
      setEconomicData(null);
      return;
    }

    const fetchEconomicData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch country's economic data
        const response = await apiRequest(
          'GET', 
          `/api/business-intelligence?country=${encodeURIComponent(selectedCountry)}&industry=${encodeURIComponent(selectedIndustry)}&premium=${isPremium}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch economic data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEconomicData(data);
      } catch (err) {
        console.error('Error fetching economic data:', err);
        setError('Unable to load economic data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEconomicData();
  }, [selectedCountry, selectedIndustry, isPremium]);

  // If no country is selected, show an instruction message
  if (!selectedCountry) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <p>Select a country on the map to view economic insights.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 sm:h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-60 sm:h-80 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <Skeleton className="h-48 sm:h-64 w-full" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If we have data, format it and display the dashboard
  if (economicData) {
    const formattedData = formatEconomicData(economicData, selectedCountry);
    return <BasicEconomicDashboard data={formattedData} isPremium={isPremium} />;
  }

  // Fallback (shouldn't reach here in normal operation)
  return null;
}