import { useState, useEffect } from 'react';
import { Map, Marker, Popup } from 'react-map-gl';
import { Opportunity } from '@shared/schema';
import { KnowledgeGraph } from './business-intelligence/knowledge-graph';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Filter, Info, Loader2 } from 'lucide-react';
import { LegalGuidance } from './legal-guidance';

// Updated North America and Caribbean countries
const countryToRegion: Record<string, string> = {
  'Mexico': 'North America',
  'Dominican Republic': 'North America',
  'Puerto Rico': 'North America',
  'Jamaica': 'North America',
  'Bahamas': 'North America',
  'Greenland': 'North America',
  'United States': 'North America',
  'US': 'North America',
  'USA': 'North America',
  'Canada': 'North America',
  'Bahrain': 'Middle East',
  'Cyprus': 'Middle East',
  'Côte d\'Ivoire': 'Africa',
  'Ivory Coast': 'Africa',
  'Egypt': 'Middle East',
  'Iran': 'Middle East',
  'Iraq': 'Middle East',
  'Israel': 'Middle East',
  'Jordan': 'Middle East',
  'Kuwait': 'Middle East',
  'Lebanon': 'Middle East',
  'Oman': 'Middle East',
  'Qatar': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Syria': 'Middle East',
  'Turkey': 'Middle East',
  'United Arab Emirates': 'Middle East',
  'UAE': 'Middle East',
  'Yemen': 'Middle East',
  'Palestine': 'Middle East',
  'Algeria': 'Africa',
  'Angola': 'Africa',
  'Benin': 'Africa',
  'Botswana': 'Africa',
  'Burkina Faso': 'Africa',
  'Burundi': 'Africa',
  'Cabo Verde': 'Africa',
  'Cameroon': 'Africa',
  'Central African Republic': 'Africa',
  'Chad': 'Africa',
  'Comoros': 'Africa',
  'Congo': 'Africa',
  'Democratic Republic of the Congo': 'Africa',
  'Djibouti': 'Africa',
  'Equatorial Guinea': 'Africa',
  'Eritrea': 'Africa',
  'Eswatini': 'Africa',
  'Ethiopia': 'Africa',
  'Gabon': 'Africa',
  'Gambia': 'Africa',
  'Ghana': 'Africa',
  'Guinea': 'Africa',
  'Guinea-Bissau': 'Africa',
  'Kenya': 'Africa',
  'Lesotho': 'Africa',
  'Liberia': 'Africa',
  'Libya': 'Africa',
  'Madagascar': 'Africa',
  'Malawi': 'Africa',
  'Mali': 'Africa',
  'Mauritania': 'Africa',
  'Mauritius': 'Africa',
  'Morocco': 'Africa',
  'Mozambique': 'Africa',
  'Namibia': 'Africa',
  'Niger': 'Africa',
  'Nigeria': 'Africa',
  'Rwanda': 'Africa',
  'São Tomé and Príncipe': 'Africa',
  'Senegal': 'Africa',
  'Seychelles': 'Africa',
  'Sierra Leone': 'Africa',
  'Somalia': 'Africa',
  'South Africa': 'Africa',
  'South Sudan': 'Africa',
  'Sudan': 'Africa',
  'Tanzania': 'Africa',
  'Togo': 'Africa',
  'Tunisia': 'Africa',
  'Uganda': 'Africa',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',
  'Argentina': 'South America',
  'Bolivia': 'South America',
  'Brazil': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Ecuador': 'South America',
  'Guyana': 'South America',
  'Paraguay': 'South America',
  'Peru': 'South America',
  'Suriname': 'South America',
  'Uruguay': 'South America',
  'Venezuela': 'South America',
  'Afghanistan': 'Asia',
  'Armenia': 'Asia',
  'Azerbaijan': 'Asia',
  'Bangladesh': 'Asia',
  'Bhutan': 'Asia',
  'Brunei': 'Asia',
  'Cambodia': 'Asia',
  'China': 'Asia',
  'Georgia': 'Asia',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Japan': 'Asia',
  'Kazakhstan': 'Asia',
  'North Korea': 'Asia',
  'South Korea': 'Asia',
  'Kyrgyzstan': 'Asia',
  'Laos': 'Asia',
  'Malaysia': 'Asia',
  'Maldives': 'Asia',
  'Mongolia': 'Asia',
  'Myanmar': 'Asia',
  'Nepal': 'Asia',
  'Pakistan': 'Asia',
  'Philippines': 'Asia',
  'Russia': 'Asia',
  'Singapore': 'Asia',
  'Sri Lanka': 'Asia',
  'Tajikistan': 'Asia',
  'Thailand': 'Asia',
  'Timor-Leste': 'Asia',
  'Turkmenistan': 'Asia',
  'Uzbekistan': 'Asia',
  'Vietnam': 'Asia',
  'Albania': 'Europe',
  'Andorra': 'Europe',
  'Austria': 'Europe',
  'Belarus': 'Europe',
  'Belgium': 'Europe',
  'Bosnia and Herzegovina': 'Europe',
  'Bulgaria': 'Europe',
  'Croatia': 'Europe',
  'Czech Republic': 'Europe',
  'Denmark': 'Europe',
  'Estonia': 'Europe',
  'Finland': 'Europe',
  'France': 'Europe',
  'Germany': 'Europe',
  'Greece': 'Europe',
  'Hungary': 'Europe',
  'Iceland': 'Europe',
  'Ireland': 'Europe',
  'Italy': 'Europe',
  'Latvia': 'Europe',
  'Liechtenstein': 'Europe',
  'Lithuania': 'Europe',
  'Luxembourg': 'Europe',
  'Malta': 'Europe',
  'Moldova': 'Europe',
  'Monaco': 'Europe',
  'Montenegro': 'Europe',
  'Netherlands': 'Europe',
  'North Macedonia': 'Europe',
  'Norway': 'Europe',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'Romania': 'Europe',
  'San Marino': 'Europe',
  'Serbia': 'Europe',
  'Slovakia': 'Europe',
  'Slovenia': 'Europe',
  'Spain': 'Europe',
  'Sweden': 'Europe',
  'Switzerland': 'Europe',
  'Ukraine': 'Europe',
  'United Kingdom': 'Europe',
  'UK': 'Europe',
  'Vatican City': 'Europe',
  'Belize': 'Central America',
  'Costa Rica': 'Central America',
  'El Salvador': 'Central America',
  'Guatemala': 'Central America',
  'Honduras': 'Central America',
  'Nicaragua': 'Central America',
  'Panama': 'Central America'
};

// Excluded regions that should not respond to clicks
const EXCLUDED_REGIONS = ['Antarctica'];

interface MapViewProps {
  opportunities: Opportunity[];
  onPursue: (id: number) => void;
  isPursuing: boolean;
  onRegionSelect: (region: string) => void;
  onCountrySelect?: (country: string | null) => void;
}

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];
const RISK_LEVELS = ['Low', 'Medium', 'High'];
const INVESTMENT_SIZES = ['< $10k', '$10k-$50k', '$50k-$200k', '> $200k'];

export default function MapView({ opportunities, onPursue, isPursuing, onRegionSelect, onCountrySelect }: MapViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  // Removed selectedOpp state - no longer showing fake opportunities
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    riskLevel: '',
    investmentSize: ''
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const handleRegionClick = async (lng: number, lat: number) => {
    try {
      setIsLoadingRegion(true);

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=country`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch region data');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const countryName = data.features[0].text;
        console.log('Detected country:', countryName);

        // Silently ignore excluded regions
        if (EXCLUDED_REGIONS.includes(countryName)) {
          setIsLoadingRegion(false);
          return;
        }

        // Case-insensitive country name matching
        const normalizedCountryName = Object.keys(countryToRegion).find(
          country => country.toLowerCase() === countryName.toLowerCase()
        );

        if (!normalizedCountryName) {
          console.log('Country not supported:', countryName);
          toast({
            title: 'Region Not Available',
            description: 'This region is not currently supported in our coverage.',
            variant: 'default',
          });
          return;
        }

        const region = countryToRegion[normalizedCountryName];
        console.log('Setting country and region:', { country: normalizedCountryName, region });

        setSelectedCountry(normalizedCountryName);
        setSelectedRegion(region);

        // Call both callbacks with the country name
        if (onRegionSelect) onRegionSelect(region);
        if (onCountrySelect) onCountrySelect(normalizedCountryName);
        
        // Show country-specific funding opportunities
        toast({
          title: `${normalizedCountryName} Selected`,
          description: `Click "Explore Funding" below to see authentic funding opportunities for ${normalizedCountryName}`,
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error in region click handler:', error);
      toast({
        title: 'Error',
        description: 'Failed to load region data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRegion(false);
    }
  };

  // No fake opportunities on map - only country-specific funding exploration
  const mappableOpportunities: Opportunity[] = [];

  return (
    <div className="space-y-4">
      <Card className="w-full h-[600px] relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Global Opportunities Map</CardTitle>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Investment Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry</label>
                      <Select
                        value={filters.industry}
                        onValueChange={(value) => setFilters(f => ({ ...f, industry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(industry => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Risk Level</label>
                      <Select
                        value={filters.riskLevel}
                        onValueChange={(value) => setFilters(f => ({ ...f, riskLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Risk Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Investment Size</label>
                      <Select
                        value={filters.investmentSize}
                        onValueChange={(value) => setFilters(f => ({ ...f, investmentSize: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Investment Size" />
                        </SelectTrigger>
                        <SelectContent>
                          {INVESTMENT_SIZES.map(size => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>



            <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Info className="h-4 w-4 mr-2" />
                        Country Insights
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[640px]">
                      <SheetHeader>
                        <SheetTitle>
                          {isLoadingRegion ? (
                            'Loading Country Data...'
                          ) : selectedCountry ? (
                            `${selectedCountry} Economic Insights`
                          ) : (
                            'Select a Country'
                          )}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="py-4">
                        {isLoadingRegion ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        ) : selectedCountry && selectedRegion ? (
                          <KnowledgeGraph
                            industry="Technology"
                            region={selectedRegion}
                            selectedCountry={selectedCountry}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            Please select a country on the map to view insights.
                          </div>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Legal Guidance
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Legal Guidance & Compliance</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <LegalGuidance country={selectedCountry} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-[500px]">
          {mapboxToken ? (
            <Map
              initialViewState={{
                latitude: 25,
                longitude: 45,
                zoom: 4
              }}
              mapboxAccessToken={mapboxToken}
              mapStyle="mapbox://styles/mapbox/light-v11"
              style={{ width: '100%', height: '100%' }}
              renderWorldCopies={true}
              onClick={evt => handleRegionClick(evt.lngLat.lng, evt.lngLat.lat)}
              minZoom={2}
              maxBounds={[
                [-180, -85], // Southwest coordinates
                [180, 85]    // Northeast coordinates
              ]}
            >
              {/* No fake opportunity markers - only authentic country-specific funding exploration */}
            </Map>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Map visualization requires a Mapbox access token.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCountry && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🏛️ Funding Opportunities - {selectedCountry}</span>
              <Button
                onClick={() => onPursue(999999)} // Special ID to trigger country-specific pursue
                disabled={isPursuing}
                variant="default"
              >
                {isPursuing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Explore Funding"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click "Explore Funding" to discover authentic government funding programs available in {selectedCountry}.
              We only show verified opportunities from official sources.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedRegion && (
        <KnowledgeGraph
          industry="Technology"
          region={selectedRegion}
          selectedCountry={selectedCountry}
        />
      )}
    </div>
  );
}