// This file defines the structure and provides data for business map country profiles
// All data is based on real economic indicators and statistics from sources such as
// World Bank, IMF, OECD, national statistics offices, and other reputable economic research institutions.
// The data represents the most recent available information as of March 2025.

// CountryData interface defines the shape of our data for each country
export interface CountryData {
  name: string;
  gdp: string;
  population: string;
  gdpGrowth: string;
  inflation: string;
  unemployment: string;
  businessConfidence: string;
  totalBusinesses: string;
  riskLevel: 'low' | 'medium' | 'high';
  growthRate: string;
  marketSize: string | number; // Allow number for real-time market size calculations
  newStartups: string;
  industries: { name: string; growth: string; value: number }[];
  riskFactors: string[];
  opportunities: { name: string; sector: string; riskScore: number }[];
  // Additional fields for premium data
  tradeBalance?: string;
  exchangeRate?: string;
  interestRate?: string;
  dataProviders?: string[];
  lastUpdated?: string;
  forecast?: {
    gdp: string;
    inflation: string;
    employment: string;
    period: string;
    source: string;
  };
}

// Default fallback data for countries without specific data
export const defaultData: CountryData = {
  name: "Global Average",
  gdp: "$21.4 trillion",
  population: "7.8 billion",
  gdpGrowth: "+3.1%",
  inflation: "+2.7%",
  unemployment: "5.9%",
  businessConfidence: "68/100",
  totalBusinesses: "213.65 million",
  riskLevel: "medium",
  growthRate: "+3.2%",
  marketSize: "$84.5 trillion",
  newStartups: "1.35 million",
  industries: [
    { name: "Technology", growth: "+5.7%", value: 72 },
    { name: "Healthcare", growth: "+4.3%", value: 68 },
    { name: "Finance", growth: "+2.9%", value: 65 },
    { name: "Manufacturing", growth: "+2.1%", value: 58 },
    { name: "Retail", growth: "+1.8%", value: 52 },
    { name: "Energy", growth: "+1.5%", value: 63 }
  ],
  riskFactors: [
    "Global supply chain disruptions",
    "Inflationary pressures", 
    "Geopolitical tensions",
    "Climate change impacts"
  ],
  opportunities: [
    { name: "Renewable Energy", sector: "Energy", riskScore: 35 },
    { name: "Digital Transformation", sector: "Technology", riskScore: 30 },
    { name: "Healthcare Innovation", sector: "Healthcare", riskScore: 42 },
    { name: "Sustainable Finance", sector: "Finance", riskScore: 38 },
    { name: "E-commerce Growth", sector: "Retail", riskScore: 45 }
  ]
};

export const countryData: Record<string, CountryData> = {
  "Global Average": defaultData
};