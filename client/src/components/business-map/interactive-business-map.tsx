import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import type { LayerProps } from 'react-map-gl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { OverviewTab } from './overview-tab';
import { MarketTab } from './market-tab';
import { IndustryTab } from './industry-tab';
import { RiskTab } from './risk-tab';
import { DirectMarketWidget } from './direct-market-widget';
import { DirectMarketOverview } from './direct-market-overview';
import { RealTimeMarketDisplay } from './real-time-market-display';
import { defaultData } from './country-data';
import { mergedCountryData, getCountryData } from './country-merge';
import { getCountryCodes } from './country-codes';
import { economicDataService } from '@/services/economic-data-service';
import { AlertCircle, Info } from 'lucide-react';
import { Link } from 'wouter';
import { KnowledgeGraph } from '@/components/business-intelligence/knowledge-graph';
import { DeepResearchPanel } from './deep-research-panel';

interface InteractiveBusinessMapProps {
  isPremium?: boolean;
  onCountrySelect?: (country: string | null) => void;
}

export function InteractiveBusinessMap({ isPremium = false, onCountrySelect }: InteractiveBusinessMapProps) {
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 10,
    latitude: 20,
    zoom: window.innerWidth < 768 ? 1.2 : 2, // Adjust initial zoom for mobile
    minZoom: window.innerWidth < 768 ? 1 : 1.5,
    maxZoom: 8,
    bearing: 0,
    pitch: 0
  });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeDataLayer, setActiveDataLayer] = useState<string>('default');
  const [showRegionInfo, setShowRegionInfo] = useState(false);
  const [realtimeData, setRealtimeData] = useState<Record<string, any>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [countrySearchResults, setCountrySearchResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string>('technology');
  const [panelHeight, setPanelHeight] = useState(40); // Percentage of screen height
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);

  // Fetch the MapBox token from our secure endpoint
  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        const response = await apiRequest('GET', '/api/map-token');
        if (response.ok) {
          const data = await response.json();
          setMapToken(data.token);
        } else {
          console.warn('MapBox token not available, map will run in demo mode');
          setError('MapBox token not available. Contact support for full map functionality.');
        }
      } catch (error) {
        console.warn('Failed to fetch MapBox token, running in demo mode');
        setError('Unable to load map token. Some features may be limited.');
      }
    };

    fetchMapToken();
  }, []);

  const onMapClick = async (event: any) => {
    const { lng, lat } = event.lngLat;
    
    try {
      setIsLoadingData(true);
      setError(null);
      
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapToken}&types=country`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch country data');
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const country = data.features[0].properties?.short_code?.toUpperCase() || 
                       data.features[0].text || 
                       data.features[0].place_name;
        
        if (country) {
          setSelectedRegion(country);
          setSelectedCountry(country);
          setShowRegionInfo(true);
          
          if (onCountrySelect) {
            onCountrySelect(country);
          }
          
          // Load real-time economic data directly from World Bank API
          try {
            // Map country names and codes to World Bank country codes
            const countryCodeMap: Record<string, string> = {
              'Saudi Arabia': 'SAU',
              'SA': 'SAU', // MapBox short code for Saudi Arabia
              'United Arab Emirates': 'ARE', 
              'Kuwait': 'KWT',
              'Qatar': 'QAT',
              'Bahrain': 'BHR',
              'Oman': 'OMN',
              'Yemen': 'YEM',
              'Jordan': 'JOR',
              'Lebanon': 'LBN',
              'Syria': 'SYR',
              'Iraq': 'IRQ',
              'IQ': 'IRQ', // MapBox short code for Iraq
              'Israel': 'ISR',
              'Palestine': 'PSE',
              'Egypt': 'EGY',
              'Libya': 'LBY',
              'Tunisia': 'TUN',
              'Algeria': 'DZA',
              'DZ': 'DZA',
              'Morocco': 'MAR',
              'MA': 'MAR',
              'Sudan': 'SDN',
              'SD': 'SDN',
              'Ethiopia': 'ETH',
              'Kenya': 'KEN',
              'Tanzania': 'TZA',
              'Uganda': 'UGA',
              'Rwanda': 'RWA',
              'Somalia': 'SOM',
              'South Sudan': 'SSD',
              'Eritrea': 'ERI',
              'Djibouti': 'DJI',
              'United States': 'USA',
              'US': 'USA',
              'Canada': 'CAN',
              'CA': 'CAN',
              'Mexico': 'MEX',
              'MX': 'MEX',
              'Brazil': 'BRA',
              'BR': 'BRA',
              'Argentina': 'ARG',
              'AR': 'ARG',
              'Chile': 'CHL',
              'CL': 'CHL',
              'Peru': 'PER',
              'PE': 'PER',
              'Colombia': 'COL',
              'CO': 'COL',
              'Venezuela': 'VEN',
              'VE': 'VEN',
              'Guyana': 'GUY',
              'GY': 'GUY',
              'Uruguay': 'URY',
              'UY': 'URY',
              'Paraguay': 'PRY',
              'PY': 'PRY',
              'Bolivia': 'BOL',
              'BO': 'BOL',
              'Ecuador': 'ECU',
              'EC': 'ECU',
              'Suriname': 'SUR',
              'SR': 'SUR',
              'United Kingdom': 'GBR',
              'GB': 'GBR',
              'UK': 'GBR',
              'France': 'FRA',
              'FR': 'FRA',
              'Germany': 'DEU',
              'DE': 'DEU',
              'Italy': 'ITA',
              'IT': 'ITA',
              'Spain': 'ESP',
              'ES': 'ESP',
              'Netherlands': 'NLD',
              'Belgium': 'BEL',
              'Switzerland': 'CHE',
              'Austria': 'AUT',
              'Sweden': 'SWE',
              'Norway': 'NOR',
              'Denmark': 'DNK',
              'Finland': 'FIN',
              'Poland': 'POL',
              'Czech Republic': 'CZE',
              'Hungary': 'HUN',
              'Slovakia': 'SVK',
              'Slovenia': 'SVN',
              'Croatia': 'HRV',
              'Serbia': 'SRB',
              'Bosnia and Herzegovina': 'BIH',
              'Montenegro': 'MNE',
              'North Macedonia': 'MKD',
              'Albania': 'ALB',
              'Greece': 'GRC',
              'Bulgaria': 'BGR',
              'Romania': 'ROU',
              'Moldova': 'MDA',
              'Ukraine': 'UKR',
              'Belarus': 'BLR',
              'Russia': 'RUS',
              'Estonia': 'EST',
              'Latvia': 'LVA',
              'Lithuania': 'LTU',
              'China': 'CHN',
              'Japan': 'JPN',
              'South Korea': 'KOR',
              'North Korea': 'PRK',
              'Mongolia': 'MNG',
              'India': 'IND',
              'Pakistan': 'PAK',
              'Bangladesh': 'BGD',
              'Sri Lanka': 'LKA',
              'Nepal': 'NPL',
              'Bhutan': 'BTN',
              'Afghanistan': 'AFG',
              'Iran': 'IRN',
              'Turkey': 'TUR',
              'Georgia': 'GEO',
              'Armenia': 'ARM',
              'Azerbaijan': 'AZE',
              'Kazakhstan': 'KAZ',
              'Uzbekistan': 'UZB',
              'Turkmenistan': 'TKM',
              'Kyrgyzstan': 'KGZ',
              'Tajikistan': 'TJK',
              'Thailand': 'THA',
              'Vietnam': 'VNM',
              'Malaysia': 'MYS',
              'Singapore': 'SGP',
              'Indonesia': 'IDN',
              'Philippines': 'PHL',
              'Cambodia': 'KHM',
              'Laos': 'LAO',
              'Myanmar': 'MMR',
              'Brunei': 'BRN',
              'Australia': 'AUS',
              'New Zealand': 'NZL',
              'Papua New Guinea': 'PNG',
              'Fiji': 'FJI',
              'South Africa': 'ZAF',
              'Nigeria': 'NGA',
              'Ghana': 'GHA',
              'Senegal': 'SEN',
              'Mali': 'MLI',
              'Burkina Faso': 'BFA',
              'Niger': 'NER',
              'Chad': 'TCD',
              'Cameroon': 'CMR',
              'Central African Republic': 'CAF',
              'Democratic Republic of the Congo': 'COD',
              'Republic of the Congo': 'COG',
              'Gabon': 'GAB',
              'Equatorial Guinea': 'GNQ',
              'Sao Tome and Principe': 'STP',
              'Angola': 'AGO',
              'Zambia': 'ZMB',
              'Zimbabwe': 'ZWE',
              'Botswana': 'BWA',
              'Namibia': 'NAM',
              'Lesotho': 'LSO',
              'Swaziland': 'SWZ',
              'Madagascar': 'MDG',
              'Mauritius': 'MUS',
              'Seychelles': 'SYC',
              'Comoros': 'COM'
            };

            const worldBankCode = countryCodeMap[country];
            
            if (worldBankCode) {
              // Call our server endpoint that connects to World Bank API
              const response = await fetch(`/api/business-map/economic-data/${worldBankCode}`);
              const economicData = await response.json();
              
              if (economicData && economicData.worldBank) {
                const data = economicData.worldBank;
                setRealtimeData(prev => ({
                  ...prev,
                  [country]: {
                    name: country,
                    gdp: data.gdp ? `$${(data.gdp / 1e12).toFixed(2)}T` : 'Data not available',
                    population: data.population ? `${(data.population / 1e6).toFixed(1)}M` : 'Data not available',
                    gdpGrowth: data.gdpGrowth ? `${data.gdpGrowth.toFixed(2)}%` : 'Data not available',
                    inflation: data.inflation ? `${data.inflation.toFixed(2)}%` : 'Data not available',
                    unemployment: data.unemployment ? `${data.unemployment.toFixed(2)}%` : 'Data not available',
                    source: 'World Bank API',
                    lastUpdated: economicData.timestamp
                  }
                }));
                console.log(`[BusinessMap] Loaded World Bank data for ${country}:`, data);
              } else if (economicData && economicData.indicators) {
                // Fallback to indicators structure if available
                const data = economicData.indicators;
                setRealtimeData(prev => ({
                  ...prev,
                  [country]: {
                    name: country,
                    gdp: data.gdp ? `$${(data.gdp / 1e12).toFixed(2)}T` : 'Data not available',
                    population: data.population ? `${(data.population / 1e6).toFixed(1)}M` : 'Data not available',
                    gdpGrowth: data.gdpGrowth ? `${data.gdpGrowth.toFixed(2)}%` : 'Data not available',
                    inflation: data.inflation ? `${data.inflation.toFixed(2)}%` : 'Data not available',
                    unemployment: data.unemployment ? `${data.unemployment.toFixed(2)}%` : 'Data not available',
                    source: 'World Bank API',
                    lastUpdated: economicData.lastUpdated || economicData.timestamp
                  }
                }));
                console.log(`[BusinessMap] Loaded World Bank data for ${country}:`, data);
              }
            } else {
              console.warn(`No World Bank country code mapping found for ${country}`);
            }
          } catch (error) {
            console.warn(`Failed to load economic data for ${country}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching country data:', error);
      setError('Failed to load country information. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle drag functionality for resizing panel
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const newPanelHeight = Math.max(20, Math.min(80, ((windowHeight - mouseY) / windowHeight) * 100));
    setPanelHeight(newPanelHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="relative w-full h-screen bg-gray-50 flex flex-col">


      {/* Map Container */}
      <div className="relative" style={{ height: `${100 - panelHeight}%` }}>
        {mapToken ? (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState({ 
              ...evt.viewState, 
              minZoom: viewState.minZoom, 
              maxZoom: viewState.maxZoom 
            })}
            onClick={onMapClick}
            mapboxAccessToken={mapToken}
            mapStyle="mapbox://styles/mapbox/light-v11"
            style={{ width: '100%', height: '100%' }}
            interactiveLayerIds={['country-fills']}
          >
            <NavigationControl position="top-right" />
            
            {/* Error popup */}
            {error && (
              <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoadingData && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Loading country data...</span>
                </div>
              </div>
            )}
          </Map>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interactive map...</p>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          </div>
        )}
        
            {/* Clean Map Info Panel */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold text-gray-800 mb-2">Global Business Map</h3>
              <p className="text-sm text-gray-600 mb-3">Click any country for market insights and opportunities</p>
              
              {!isPremium && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="flex items-center mb-2">
                    <Info className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">Premium Features Available</span>
                  </div>
                  <Link to="/pricing">
                    <Button variant="outline" size="sm" className="w-full text-sm">
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>


      </div>

      {/* Simple Panel Divider */}
      <div className="w-full bg-gray-100 border-y border-gray-200 py-1">
        <div className="text-center text-sm text-gray-500">
          {selectedRegion ? `Market Intelligence: ${selectedRegion}` : 'Click on any country to view market data'}
        </div>
      </div>

      {/* Business Intelligence Insights Panel */}
      <div 
        className="bg-white border-t border-gray-200 overflow-y-auto"
        style={{ height: `${panelHeight}%` }}
      >
        {selectedRegion && showRegionInfo ? (
          <div className="container mx-auto p-4">
            <div className="space-y-6">
              {/* Traditional Knowledge Graph */}
              <KnowledgeGraph 
                industry={industry} 
                region={selectedRegion} 
                selectedCountry={selectedCountry}
              />
              
              {/* Deep Research Panel */}
              <DeepResearchPanel
                selectedCountry={selectedRegion}
                industry={industry}
                isPremium={isPremium}
                onCountryChange={(country) => {
                  setSelectedRegion(country);
                  setSelectedCountry(country);
                  onCountrySelect?.(country);
                }}
                onIndustryChange={(newIndustry) => {
                  setIndustry(newIndustry);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="flex items-center justify-center mb-4">
              <Info className="h-8 w-8 text-blue-500 mr-3" />
              <span className="text-lg">Click on any country to view Business Intelligence insights</span>
            </div>
            <p>Access detailed market analysis, economic indicators, competitor data, funding opportunities, and AI-powered deep research</p>
          </div>
        )}
      </div>

      {/* Data source attribution */}
      <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg shadow-sm p-2 text-xs text-muted-foreground">
        <div>Data sources: World Bank, IMF (including WEO forecasts), OECD, UN Comtrade, National Statistical Offices (2024-2025)</div>
        <div>Data compiled from official national and international economic databases with forward-looking projections</div>
      </div>
    </div>
  );
}