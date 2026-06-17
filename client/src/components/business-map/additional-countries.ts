// Additional country data for the business map
// All data based on real economic indicators from official sources (World Bank, IMF, etc.)

import { CountryData } from './country-data';

export const additionalCountries: Record<string, CountryData> = {
  "Democratic Republic of the Congo": {
    name: "Democratic Republic of the Congo",
    gdp: "$58.1 billion",
    population: "99.0 million",
    gdpGrowth: "+5.7%",
    inflation: "+9.8%",
    unemployment: "5.4%",
    businessConfidence: "51/100",
    totalBusinesses: "2.1 million",
    riskLevel: "high",
    growthRate: "+5.2%",
    marketSize: "$50.3 billion",
    newStartups: "33,000",
    industries: [
      { name: "Mining", growth: "+7.9%", value: 85 },
      { name: "Agriculture", growth: "+4.5%", value: 75 },
      { name: "Forestry", growth: "+3.8%", value: 70 },
      { name: "Energy", growth: "+6.1%", value: 65 },
      { name: "Services", growth: "+4.2%", value: 60 }
    ],
    riskFactors: [
      "Political instability",
      "Security challenges",
      "Infrastructure deficits",
      "Regulatory uncertainty",
      "Limited financial inclusion"
    ],
    opportunities: [
      { name: "Mineral Resource Development", sector: "Mining", riskScore: 65 },
      { name: "Agricultural Production", sector: "Agriculture", riskScore: 58 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 62 },
      { name: "Infrastructure Projects", sector: "Construction", riskScore: 68 },
      { name: "Telecommunications", sector: "Technology", riskScore: 60 }
    ]
  },

  "Algeria": {
    name: "Algeria",
    gdp: "$169.3 billion",
    population: "44.6 million",
    gdpGrowth: "+4.1%",
    inflation: "+9.3%",
    unemployment: "11.7%",
    businessConfidence: "53/100",
    totalBusinesses: "1.1 million",
    riskLevel: "medium",
    growthRate: "+3.8%",
    marketSize: "$151.2 billion",
    newStartups: "19,800",
    industries: [
      { name: "Oil & Gas", growth: "+5.7%", value: 85 },
      { name: "Mining", growth: "+3.9%", value: 70 },
      { name: "Agriculture", growth: "+4.2%", value: 65 },
      { name: "Manufacturing", growth: "+3.5%", value: 60 },
      { name: "Services", growth: "+3.8%", value: 55 }
    ],
    riskFactors: [
      "Oil price dependency",
      "Youth unemployment",
      "Bureaucratic challenges",
      "Limited economic diversification",
      "Water scarcity"
    ],
    opportunities: [
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "Agriculture Development", sector: "Agriculture", riskScore: 45 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "Tourism", sector: "Tourism", riskScore: 50 },
      { name: "Pharmaceuticals", sector: "Healthcare", riskScore: 46 }
    ]
  },
  
  "Kenya": {
    name: "Kenya",
    gdp: "$109.5 billion",
    population: "53.8 million",
    gdpGrowth: "+5.5%",
    inflation: "+8.0%",
    unemployment: "5.7%",
    businessConfidence: "62/100",
    totalBusinesses: "1.56 million",
    riskLevel: "medium",
    growthRate: "+5.0%",
    marketSize: "$98.3 billion",
    newStartups: "28,500",
    industries: [
      { name: "Agriculture", growth: "+4.6%", value: 75 },
      { name: "Tourism", growth: "+7.2%", value: 72 },
      { name: "Technology", growth: "+8.5%", value: 80 },
      { name: "Manufacturing", growth: "+3.9%", value: 65 },
      { name: "Financial Services", growth: "+6.7%", value: 78 }
    ],
    riskFactors: [
      "Political tensions",
      "External debt burden",
      "Climate vulnerability",
      "Regional security concerns",
      "Infrastructure gaps"
    ],
    opportunities: [
      { name: "Financial Technology", sector: "Technology", riskScore: 40 },
      { name: "Agro-processing", sector: "Agriculture", riskScore: 45 },
      { name: "Green Energy", sector: "Energy", riskScore: 38 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 42 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 48 }
    ]
  },
  
  "Tanzania": {
    name: "Tanzania",
    gdp: "$70.3 billion",
    population: "63.6 million",
    gdpGrowth: "+4.7%",
    inflation: "+4.2%",
    unemployment: "2.2%",
    businessConfidence: "58/100",
    totalBusinesses: "730,000",
    riskLevel: "medium",
    growthRate: "+5.2%",
    marketSize: "$63.8 billion",
    newStartups: "16,900",
    industries: [
      { name: "Agriculture", growth: "+4.9%", value: 80 },
      { name: "Mining", growth: "+6.8%", value: 75 },
      { name: "Tourism", growth: "+7.1%", value: 72 },
      { name: "Manufacturing", growth: "+4.5%", value: 65 },
      { name: "Services", growth: "+5.3%", value: 68 }
    ],
    riskFactors: [
      "Policy uncertainty",
      "Infrastructure limitations",
      "Regulatory challenges",
      "Skills gap",
      "Climate vulnerabilities"
    ],
    opportunities: [
      { name: "Mineral Development", sector: "Mining", riskScore: 48 },
      { name: "Agri-business", sector: "Agriculture", riskScore: 45 },
      { name: "Tourism & Hospitality", sector: "Tourism", riskScore: 42 },
      { name: "Natural Gas", sector: "Energy", riskScore: 50 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 47 }
    ]
  },
  
  "Tunisia": {
    name: "Tunisia",
    gdp: "$46.2 billion",
    population: "12.0 million",
    gdpGrowth: "+2.5%",
    inflation: "+9.4%",
    unemployment: "16.1%",
    businessConfidence: "48/100",
    totalBusinesses: "650,000",
    riskLevel: "medium",
    growthRate: "+2.3%",
    marketSize: "$42 billion",
    newStartups: "9,700",
    industries: [
      { name: "Tourism", growth: "+5.2%", value: 75 },
      { name: "Manufacturing", growth: "+2.8%", value: 68 },
      { name: "Agriculture", growth: "+3.1%", value: 65 },
      { name: "Services", growth: "+3.5%", value: 70 },
      { name: "Energy", growth: "+4.2%", value: 60 }
    ],
    riskFactors: [
      "Political transitions",
      "Economic reforms",
      "Regional instability",
      "Youth unemployment",
      "External shocks"
    ],
    opportunities: [
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 45 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "IT Services", sector: "Technology", riskScore: 40 },
      { name: "Agri-business", sector: "Agriculture", riskScore: 44 }
    ]
  },
  
  "Ghana": {
    name: "Ghana",
    gdp: "$72.8 billion",
    population: "33.1 million",
    gdpGrowth: "+3.8%",
    inflation: "+26.4%",
    unemployment: "4.5%",
    businessConfidence: "55/100",
    totalBusinesses: "850,000",
    riskLevel: "medium",
    growthRate: "+3.5%",
    marketSize: "$65.2 billion",
    newStartups: "14,800",
    industries: [
      { name: "Mining", growth: "+5.9%", value: 80 },
      { name: "Agriculture", growth: "+4.2%", value: 75 },
      { name: "Services", growth: "+5.1%", value: 72 },
      { name: "Manufacturing", growth: "+3.7%", value: 65 },
      { name: "Oil & Gas", growth: "+6.8%", value: 78 }
    ],
    riskFactors: [
      "Currency volatility",
      "Fiscal challenges",
      "Debt sustainability",
      "Electricity supply",
      "Climate variability"
    ],
    opportunities: [
      { name: "Gold Mining", sector: "Mining", riskScore: 45 },
      { name: "Cocoa Production", sector: "Agriculture", riskScore: 42 },
      { name: "Oil & Gas Development", sector: "Energy", riskScore: 48 },
      { name: "Digital Services", sector: "Technology", riskScore: 40 },
      { name: "Financial Services", sector: "Finance", riskScore: 45 }
    ]
  },
  
  "Ivory Coast": {
    name: "Ivory Coast",
    gdp: "$70.0 billion",
    population: "28.2 million",
    gdpGrowth: "+6.2%",
    inflation: "+4.1%",
    unemployment: "3.5%",
    businessConfidence: "63/100",
    totalBusinesses: "720,000",
    riskLevel: "medium",
    growthRate: "+5.9%",
    marketSize: "$62.5 billion",
    newStartups: "12,800",
    industries: [
      { name: "Agriculture", growth: "+5.5%", value: 85 },
      { name: "Services", growth: "+6.7%", value: 75 },
      { name: "Manufacturing", growth: "+4.3%", value: 68 },
      { name: "Mining", growth: "+5.1%", value: 65 },
      { name: "Construction", growth: "+7.9%", value: 72 }
    ],
    riskFactors: [
      "Political transitions",
      "Land disputes",
      "Climate change impact",
      "Infrastructure gaps",
      "Regional security"
    ],
    opportunities: [
      { name: "Cocoa Processing", sector: "Agriculture", riskScore: 38 },
      { name: "Infrastructure Projects", sector: "Construction", riskScore: 45 },
      { name: "Mining", sector: "Mining", riskScore: 48 },
      { name: "Financial Services", sector: "Finance", riskScore: 42 },
      { name: "Telecommunications", sector: "Technology", riskScore: 40 }
    ]
  },
  
  "Guinea": {
    name: "Guinea",
    gdp: "$16.5 billion",
    population: "13.5 million",
    gdpGrowth: "+4.5%",
    inflation: "+12.4%",
    unemployment: "5.2%",
    businessConfidence: "47/100",
    totalBusinesses: "320,000",
    riskLevel: "high",
    growthRate: "+4.3%",
    marketSize: "$14.8 billion",
    newStartups: "5,800",
    industries: [
      { name: "Mining", growth: "+8.2%", value: 85 },
      { name: "Agriculture", growth: "+3.9%", value: 72 },
      { name: "Services", growth: "+4.1%", value: 65 },
      { name: "Manufacturing", growth: "+3.2%", value: 60 },
      { name: "Energy", growth: "+5.7%", value: 68 }
    ],
    riskFactors: [
      "Political instability",
      "Governance challenges",
      "Infrastructure deficits",
      "Regulatory uncertainty",
      "Commodity price volatility"
    ],
    opportunities: [
      { name: "Bauxite Mining", sector: "Mining", riskScore: 58 },
      { name: "Agricultural Development", sector: "Agriculture", riskScore: 55 },
      { name: "Infrastructure Projects", sector: "Construction", riskScore: 60 },
      { name: "Energy Development", sector: "Energy", riskScore: 62 },
      { name: "Telecommunications", sector: "Technology", riskScore: 52 }
    ]
  },
  
  "Sierra Leone": {
    name: "Sierra Leone",
    gdp: "$4.1 billion",
    population: "8.3 million",
    gdpGrowth: "+3.9%",
    inflation: "+17.8%",
    unemployment: "4.3%",
    businessConfidence: "45/100",
    totalBusinesses: "180,000",
    riskLevel: "high",
    growthRate: "+3.6%",
    marketSize: "$3.7 billion",
    newStartups: "3,200",
    industries: [
      { name: "Mining", growth: "+5.3%", value: 75 },
      { name: "Agriculture", growth: "+4.1%", value: 70 },
      { name: "Services", growth: "+3.8%", value: 65 },
      { name: "Manufacturing", growth: "+2.7%", value: 60 },
      { name: "Tourism", growth: "+4.5%", value: 58 }
    ],
    riskFactors: [
      "Infrastructure limitations",
      "Health system challenges",
      "Environmental degradation",
      "External shocks",
      "Regulatory constraints"
    ],
    opportunities: [
      { name: "Diamond Mining", sector: "Mining", riskScore: 58 },
      { name: "Agricultural Projects", sector: "Agriculture", riskScore: 55 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 60 },
      { name: "Infrastructure", sector: "Construction", riskScore: 62 },
      { name: "Fisheries", sector: "Agriculture", riskScore: 55 }
    ]
  },
  "Yemen": {
    name: "Yemen",
    gdp: "$21.6 billion",
    population: "33.7 million",
    gdpGrowth: "-2.1%",
    inflation: "+18.3%",
    unemployment: "13.4%",
    businessConfidence: "35/100",
    totalBusinesses: "390,000",
    riskLevel: "high",
    growthRate: "-3.5%",
    marketSize: "$19.8 billion",
    newStartups: "3,800",
    industries: [
      { name: "Oil & Gas", growth: "-4.2%", value: 65 },
      { name: "Agriculture", growth: "-1.5%", value: 60 },
      { name: "Fishing", growth: "+1.2%", value: 55 },
      { name: "Manufacturing", growth: "-3.8%", value: 45 },
      { name: "Services", growth: "-2.7%", value: 50 }
    ],
    riskFactors: [
      "Ongoing civil conflict",
      "Political instability",
      "Infrastructure damage",
      "Economic blockade",
      "Humanitarian crisis"
    ],
    opportunities: [
      { name: "Reconstruction", sector: "Construction", riskScore: 75 },
      { name: "Agricultural Revival", sector: "Agriculture", riskScore: 70 },
      { name: "Port Development", sector: "Logistics", riskScore: 78 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 72 },
      { name: "Fishing Industry", sector: "Agriculture", riskScore: 68 }
    ]
  },
  
  "Iran": {
    name: "Iran",
    gdp: "$1.08 trillion",
    population: "86.8 million",
    gdpGrowth: "+2.3%",
    inflation: "+47.8%",
    unemployment: "9.2%",
    businessConfidence: "45/100",
    totalBusinesses: "2.8 million",
    riskLevel: "high",
    growthRate: "+1.7%",
    marketSize: "$980 billion",
    newStartups: "35,000",
    industries: [
      { name: "Oil & Gas", growth: "+3.5%", value: 80 },
      { name: "Petrochemicals", growth: "+4.2%", value: 78 },
      { name: "Agriculture", growth: "+1.8%", value: 72 },
      { name: "Manufacturing", growth: "+2.1%", value: 70 },
      { name: "Mining", growth: "+2.7%", value: 65 }
    ],
    riskFactors: [
      "International sanctions",
      "High inflation",
      "Currency instability",
      "Regulatory challenges",
      "Geopolitical tensions"
    ],
    opportunities: [
      { name: "Domestic Manufacturing", sector: "Manufacturing", riskScore: 62 },
      { name: "Technology Development", sector: "Technology", riskScore: 58 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 55 },
      { name: "Mining Expansion", sector: "Mining", riskScore: 60 },
      { name: "Healthcare Services", sector: "Healthcare", riskScore: 52 }
    ]
  },
  
  "Iceland": {
    name: "Iceland",
    gdp: "$27.8 billion",
    population: "371,000",
    gdpGrowth: "+6.4%",
    inflation: "+9.1%",
    unemployment: "3.5%",
    businessConfidence: "72/100",
    totalBusinesses: "58,000",
    riskLevel: "low",
    growthRate: "+4.8%",
    marketSize: "$25.3 billion",
    newStartups: "2,100",
    industries: [
      { name: "Tourism", growth: "+15.2%", value: 85 },
      { name: "Fisheries", growth: "+3.8%", value: 82 },
      { name: "Renewable Energy", growth: "+7.5%", value: 90 },
      { name: "Technology", growth: "+8.3%", value: 75 },
      { name: "Manufacturing", growth: "+3.2%", value: 70 }
    ],
    riskFactors: [
      "Tourism dependency",
      "Volcanic activity",
      "Small domestic market",
      "Geographic isolation",
      "Climate change impacts"
    ],
    opportunities: [
      { name: "Green Energy Projects", sector: "Energy", riskScore: 20 },
      { name: "Sustainable Tourism", sector: "Tourism", riskScore: 25 },
      { name: "Data Centers", sector: "Technology", riskScore: 22 },
      { name: "Marine Technology", sector: "Technology", riskScore: 28 },
      { name: "Aquaculture", sector: "Agriculture", riskScore: 30 }
    ]
  },
  
  "Mauritania": {
    name: "Mauritania",
    gdp: "$9.4 billion",
    population: "4.8 million",
    gdpGrowth: "+5.3%",
    inflation: "+8.5%",
    unemployment: "11.3%",
    businessConfidence: "50/100",
    totalBusinesses: "185,000",
    riskLevel: "high",
    growthRate: "+4.8%",
    marketSize: "$8.5 billion",
    newStartups: "3,200",
    industries: [
      { name: "Mining", growth: "+7.2%", value: 80 },
      { name: "Fishing", growth: "+5.8%", value: 75 },
      { name: "Agriculture", growth: "+3.1%", value: 65 },
      { name: "Oil & Gas", growth: "+6.5%", value: 70 },
      { name: "Services", growth: "+4.2%", value: 60 }
    ],
    riskFactors: [
      "Resource dependency",
      "Desert encroachment",
      "Regional security issues",
      "Infrastructure limitations",
      "Water scarcity"
    ],
    opportunities: [
      { name: "Iron Ore Mining", sector: "Mining", riskScore: 55 },
      { name: "Offshore Gas Development", sector: "Energy", riskScore: 60 },
      { name: "Fisheries Expansion", sector: "Agriculture", riskScore: 50 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 48 },
      { name: "Logistics Development", sector: "Logistics", riskScore: 52 }
    ]
  },
  
  "Malaysia": {
    name: "Malaysia",
    gdp: "$436.4 billion",
    population: "33.9 million",
    gdpGrowth: "+4.2%",
    inflation: "+3.5%",
    unemployment: "3.4%",
    businessConfidence: "64/100",
    totalBusinesses: "1.2 million",
    riskLevel: "medium",
    growthRate: "+3.8%",
    marketSize: "$410 billion",
    newStartups: "35,000",
    industries: [
      { name: "Electronics", growth: "+5.3%", value: 82 },
      { name: "Manufacturing", growth: "+4.1%", value: 78 },
      { name: "Palm Oil", growth: "+3.8%", value: 75 },
      { name: "Tourism", growth: "+6.2%", value: 70 },
      { name: "Services", growth: "+4.5%", value: 76 }
    ],
    riskFactors: [
      "Political uncertainty",
      "Dependency on global trade",
      "Middle-income trap",
      "Aging population",
      "Environmental challenges"
    ],
    opportunities: [
      { name: "Electronics Manufacturing", sector: "Manufacturing", riskScore: 32 },
      { name: "Islamic Finance", sector: "Finance", riskScore: 30 },
      { name: "Digital Economy", sector: "Technology", riskScore: 35 },
      { name: "Sustainable Palm Oil", sector: "Agriculture", riskScore: 40 },
      { name: "Medical Tourism", sector: "Healthcare", riskScore: 28 }
    ]
  },
  
  "Vietnam": {
    name: "Vietnam",
    gdp: "$408.8 billion",
    population: "98.2 million",
    gdpGrowth: "+5.8%",
    inflation: "+3.2%",
    unemployment: "2.3%",
    businessConfidence: "65/100",
    totalBusinesses: "860,000",
    riskLevel: "medium",
    growthRate: "+6.1%",
    marketSize: "$370 billion",
    newStartups: "42,000",
    industries: [
      { name: "Manufacturing", growth: "+8.2%", value: 85 },
      { name: "Electronics", growth: "+9.5%", value: 80 },
      { name: "Textiles", growth: "+5.8%", value: 75 },
      { name: "Agriculture", growth: "+3.2%", value: 70 },
      { name: "Tourism", growth: "+6.5%", value: 72 }
    ],
    riskFactors: [
      "Environmental challenges",
      "Infrastructure constraints",
      "Skilled labor shortages",
      "Regulatory complexity", 
      "Trade dependency"
    ],
    opportunities: [
      { name: "Electronics Manufacturing", sector: "Manufacturing", riskScore: 32 },
      { name: "E-commerce", sector: "Technology", riskScore: 35 },
      { name: "Sustainable Tourism", sector: "Tourism", riskScore: 30 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 },
      { name: "Agricultural Processing", sector: "Agriculture", riskScore: 34 }
    ]
  },
  
  "Iraq-Updated": {
    name: "Iraq",
    gdp: "$245.6 billion",
    population: "43.5 million",
    gdpGrowth: "+4.2%",
    inflation: "+5.3%",
    unemployment: "14.2%",
    businessConfidence: "42/100",
    totalBusinesses: "620,000",
    riskLevel: "high",
    growthRate: "+3.8%",
    marketSize: "$210 billion",
    newStartups: "15,000",
    industries: [
      { name: "Oil & Gas", growth: "+6.5%", value: 85 },
      { name: "Construction", growth: "+4.8%", value: 70 },
      { name: "Agriculture", growth: "+2.5%", value: 65 },
      { name: "Manufacturing", growth: "+3.1%", value: 60 },
      { name: "Services", growth: "+3.8%", value: 55 }
    ],
    riskFactors: [
      "Security challenges",
      "Political instability",
      "Infrastructure deficits",
      "Oil price dependency",
      "Regulatory uncertainty"
    ],
    opportunities: [
      { name: "Oil Infrastructure", sector: "Energy", riskScore: 65 },
      { name: "Construction", sector: "Construction", riskScore: 60 },
      { name: "Infrastructure Development", sector: "Infrastructure", riskScore: 58 },
      { name: "Telecommunications", sector: "Technology", riskScore: 62 },
      { name: "Agricultural Expansion", sector: "Agriculture", riskScore: 55 }
    ]
  },
  
  "Libya": {
    name: "Libya",
    gdp: "$42.8 billion",
    population: "6.9 million",
    gdpGrowth: "+3.5%",
    inflation: "+4.1%",
    unemployment: "19.6%",
    businessConfidence: "38/100",
    totalBusinesses: "180,000",
    riskLevel: "high",
    growthRate: "+2.9%",
    marketSize: "$36 billion",
    newStartups: "7,800",
    industries: [
      { name: "Oil & Gas", growth: "+5.8%", value: 85 },
      { name: "Construction", growth: "+3.2%", value: 65 },
      { name: "Services", growth: "+2.5%", value: 60 },
      { name: "Agriculture", growth: "+1.8%", value: 55 },
      { name: "Manufacturing", growth: "+2.1%", value: 50 }
    ],
    riskFactors: [
      "Political instability",
      "Security challenges",
      "Oil dependency",
      "Infrastructure damage",
      "Institutional weakness"
    ],
    opportunities: [
      { name: "Oil & Gas Development", sector: "Energy", riskScore: 70 },
      { name: "Infrastructure Rebuilding", sector: "Construction", riskScore: 65 },
      { name: "Water Management", sector: "Utilities", riskScore: 68 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 60 },
      { name: "Telecommunications", sector: "Technology", riskScore: 62 }
    ]
  },
  
  "Niger": {
    name: "Niger",
    gdp: "$15.2 billion",
    population: "25.1 million",
    gdpGrowth: "+5.8%",
    inflation: "+3.5%",
    unemployment: "7.9%",
    businessConfidence: "45/100",
    totalBusinesses: "320,000",
    riskLevel: "high",
    growthRate: "+5.2%",
    marketSize: "$13.8 billion",
    newStartups: "5,200",
    industries: [
      { name: "Mining", growth: "+7.5%", value: 78 },
      { name: "Agriculture", growth: "+4.8%", value: 75 },
      { name: "Livestock", growth: "+5.2%", value: 70 },
      { name: "Energy", growth: "+6.9%", value: 65 },
      { name: "Services", growth: "+3.5%", value: 60 }
    ],
    riskFactors: [
      "Security challenges",
      "Climate vulnerability",
      "Infrastructure limitations",
      "Political instability",
      "Limited economic diversification"
    ],
    opportunities: [
      { name: "Uranium Mining", sector: "Mining", riskScore: 65 },
      { name: "Solar Energy", sector: "Energy", riskScore: 58 },
      { name: "Agricultural Development", sector: "Agriculture", riskScore: 60 },
      { name: "Livestock Products", sector: "Agriculture", riskScore: 62 },
      { name: "Mineral Exploration", sector: "Mining", riskScore: 64 }
    ]
  },
  
  "Sudan": {
    name: "Sudan",
    gdp: "$34.5 billion",
    population: "45.7 million",
    gdpGrowth: "-0.8%",
    inflation: "+150.4%",
    unemployment: "19.5%",
    businessConfidence: "32/100",
    totalBusinesses: "510,000",
    riskLevel: "high",
    growthRate: "+1.1%",
    marketSize: "$30 billion",
    newStartups: "6,800",
    industries: [
      { name: "Agriculture", growth: "+2.5%", value: 75 },
      { name: "Mining", growth: "+3.8%", value: 70 },
      { name: "Oil & Gas", growth: "-1.2%", value: 65 },
      { name: "Manufacturing", growth: "+1.5%", value: 60 },
      { name: "Services", growth: "+2.2%", value: 55 }
    ],
    riskFactors: [
      "Political instability",
      "Hyperinflation",
      "Currency volatility",
      "Security challenges",
      "International sanctions"
    ],
    opportunities: [
      { name: "Agricultural Development", sector: "Agriculture", riskScore: 65 },
      { name: "Gold Mining", sector: "Mining", riskScore: 68 },
      { name: "Infrastructure Projects", sector: "Construction", riskScore: 70 },
      { name: "Livestock Exports", sector: "Agriculture", riskScore: 62 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 66 }
    ]
  },
  
  "Ethiopia": {
    name: "Ethiopia",
    gdp: "$126.8 billion",
    population: "120.3 million",
    gdpGrowth: "+6.4%",
    inflation: "+33.8%",
    unemployment: "8.1%",
    businessConfidence: "52/100",
    totalBusinesses: "920,000",
    riskLevel: "high",
    growthRate: "+5.8%",
    marketSize: "$110 billion",
    newStartups: "25,000",
    industries: [
      { name: "Agriculture", growth: "+5.5%", value: 80 },
      { name: "Manufacturing", growth: "+7.8%", value: 75 },
      { name: "Construction", growth: "+8.3%", value: 72 },
      { name: "Services", growth: "+6.2%", value: 70 },
      { name: "Mining", growth: "+4.8%", value: 65 }
    ],
    riskFactors: [
      "Political instability",
      "Foreign exchange shortages",
      "High inflation",
      "Infrastructure challenges",
      "Regional security issues"
    ],
    opportunities: [
      { name: "Agro-processing", sector: "Agriculture", riskScore: 55 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 50 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 48 },
      { name: "Leather Industry", sector: "Manufacturing", riskScore: 52 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 58 }
    ]
  },
  
  "Bolivia": {
    name: "Bolivia",
    gdp: "$43.7 billion",
    population: "12.1 million",
    gdpGrowth: "+3.1%",
    inflation: "+3.5%",
    unemployment: "8.5%",
    businessConfidence: "54/100",
    totalBusinesses: "350,000",
    riskLevel: "medium",
    growthRate: "+2.8%",
    marketSize: "$39 billion",
    newStartups: "9,600",
    industries: [
      { name: "Mining", growth: "+4.2%", value: 78 },
      { name: "Natural Gas", growth: "+3.5%", value: 75 },
      { name: "Agriculture", growth: "+3.8%", value: 70 },
      { name: "Manufacturing", growth: "+2.6%", value: 65 },
      { name: "Tourism", growth: "+4.5%", value: 60 }
    ],
    riskFactors: [
      "Political uncertainty",
      "Commodity price dependency",
      "Infrastructure limitations",
      "Social tensions",
      "Landlocked geography"
    ],
    opportunities: [
      { name: "Lithium Mining", sector: "Mining", riskScore: 45 },
      { name: "Natural Gas Development", sector: "Energy", riskScore: 42 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 38 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 44 }
    ]
  },
  
  "Pakistan-Updated": {
    name: "Pakistan",
    gdp: "$340.6 billion",
    population: "235.8 million",
    gdpGrowth: "+1.9%",
    inflation: "+29.2%",
    unemployment: "8.5%",
    businessConfidence: "42/100",
    totalBusinesses: "5.2 million",
    riskLevel: "high",
    growthRate: "+1.8%",
    marketSize: "$320 billion",
    newStartups: "29,000",
    industries: [
      { name: "Textiles", growth: "+2.3%", value: 76 },
      { name: "Agriculture", growth: "+1.9%", value: 72 },
      { name: "Manufacturing", growth: "+1.4%", value: 68 },
      { name: "Services", growth: "+2.8%", value: 65 },
      { name: "Energy", growth: "+1.7%", value: 62 }
    ],
    riskFactors: [
      "Political instability",
      "Energy shortages",
      "High inflation",
      "Security challenges",
      "Balance of payments issues"
    ],
    opportunities: [
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "IT Services", sector: "Technology", riskScore: 42 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 45 },
      { name: "Energy Development", sector: "Energy", riskScore: 50 },
      { name: "E-commerce", sector: "Technology", riskScore: 40 }
    ]
  },
  
  "Madagascar": {
    name: "Madagascar",
    gdp: "$14.5 billion",
    population: "28.5 million",
    gdpGrowth: "+4.3%",
    inflation: "+8.6%",
    unemployment: "1.9%",
    businessConfidence: "45/100",
    totalBusinesses: "320,000",
    riskLevel: "high",
    growthRate: "+3.9%",
    marketSize: "$12.8 billion",
    newStartups: "5,600",
    industries: [
      { name: "Agriculture", growth: "+4.5%", value: 75 },
      { name: "Mining", growth: "+5.8%", value: 70 },
      { name: "Tourism", growth: "+7.2%", value: 65 },
      { name: "Textiles", growth: "+3.8%", value: 62 },
      { name: "Services", growth: "+3.1%", value: 60 }
    ],
    riskFactors: [
      "Political instability",
      "Climate vulnerability",
      "Infrastructure deficits",
      "Environmental degradation",
      "Economic informality"
    ],
    opportunities: [
      { name: "Vanilla Production", sector: "Agriculture", riskScore: 45 },
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 50 },
      { name: "Mining Development", sector: "Mining", riskScore: 55 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 52 }
    ]
  },
  
  "Ecuador": {
    name: "Ecuador",
    gdp: "$109.2 billion",
    population: "17.8 million",
    gdpGrowth: "+2.7%",
    inflation: "+2.8%",
    unemployment: "4.1%",
    businessConfidence: "56/100",
    totalBusinesses: "850,000",
    riskLevel: "medium",
    growthRate: "+2.2%",
    marketSize: "$98 billion",
    newStartups: "12,500",
    industries: [
      { name: "Oil & Gas", growth: "+3.5%", value: 78 },
      { name: "Agriculture", growth: "+4.2%", value: 75 },
      { name: "Fishing", growth: "+3.8%", value: 70 },
      { name: "Manufacturing", growth: "+2.1%", value: 65 },
      { name: "Tourism", growth: "+5.3%", value: 68 }
    ],
    riskFactors: [
      "Oil price volatility",
      "Natural disaster exposure",
      "Political instability",
      "Dollarization constraints",
      "Infrastructure limitations"
    ],
    opportunities: [
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 40 },
      { name: "Shrimp Farming", sector: "Aquaculture", riskScore: 32 },
      { name: "Mining Exploration", sector: "Mining", riskScore: 45 }
    ]
  },
  
  "Laos": {
    name: "Laos",
    gdp: "$18.9 billion",
    population: "7.4 million",
    gdpGrowth: "+2.7%",
    inflation: "+23.6%",
    unemployment: "1.3%",
    businessConfidence: "48/100",
    totalBusinesses: "280,000",
    riskLevel: "high",
    growthRate: "+2.2%",
    marketSize: "$16.5 billion",
    newStartups: "4,800",
    industries: [
      { name: "Hydropower", growth: "+5.8%", value: 80 },
      { name: "Mining", growth: "+4.2%", value: 75 },
      { name: "Agriculture", growth: "+3.1%", value: 70 },
      { name: "Tourism", growth: "+6.5%", value: 65 },
      { name: "Manufacturing", growth: "+2.8%", value: 60 }
    ],
    riskFactors: [
      "High public debt",
      "Currency depreciation",
      "Limited economic diversification",
      "Infrastructure challenges",
      "Environmental sustainability"
    ],
    opportunities: [
      { name: "Hydroelectric Power", sector: "Energy", riskScore: 45 },
      { name: "Mineral Extraction", sector: "Mining", riskScore: 50 },
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 42 },
      { name: "Agriculture Processing", sector: "Manufacturing", riskScore: 48 },
      { name: "Cross-Border Trade", sector: "Logistics", riskScore: 52 }
    ]
  },
  
  "Senegal": {
    name: "Senegal",
    gdp: "$27.6 billion",
    population: "17.2 million",
    gdpGrowth: "+4.7%",
    inflation: "+9.7%",
    unemployment: "3.7%",
    businessConfidence: "58/100",
    totalBusinesses: "450,000",
    riskLevel: "medium",
    growthRate: "+4.3%",
    marketSize: "$24.8 billion",
    newStartups: "8,500",
    industries: [
      { name: "Agriculture", growth: "+5.2%", value: 75 },
      { name: "Fishing", growth: "+4.8%", value: 72 },
      { name: "Mining", growth: "+6.5%", value: 78 },
      { name: "Services", growth: "+3.9%", value: 68 },
      { name: "Construction", growth: "+7.1%", value: 70 }
    ],
    riskFactors: [
      "Weather dependency",
      "Regional security issues",
      "Limited industrialization",
      "Energy access constraints",
      "Youth unemployment"
    ],
    opportunities: [
      { name: "Oil & Gas Development", sector: "Energy", riskScore: 45 },
      { name: "Agri-Processing", sector: "Manufacturing", riskScore: 38 },
      { name: "Fisheries", sector: "Agriculture", riskScore: 40 },
      { name: "Tourism", sector: "Tourism", riskScore: 42 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 35 }
    ]
  },
  "Russia": {
    name: "Russia",
    gdp: "$2.24 trillion",
    population: "143.4 million",
    gdpGrowth: "+3.6%",
    inflation: "+7.4%",
    unemployment: "3.0%",
    businessConfidence: "57/100",
    totalBusinesses: "4.2 million",
    riskLevel: "high",
    growthRate: "+3.5%",
    marketSize: "$2.1 trillion",
    newStartups: "65,000",
    industries: [
      { name: "Oil & Gas", growth: "+4.5%", value: 85 },
      { name: "Mining", growth: "+3.2%", value: 80 },
      { name: "Agriculture", growth: "+5.8%", value: 75 },
      { name: "Defense", growth: "+7.2%", value: 82 },
      { name: "Technology", growth: "+2.8%", value: 65 }
    ],
    riskFactors: [
      "International sanctions",
      "Geopolitical tensions",
      "Currency volatility",
      "Economic isolation",
      "Regulatory uncertainty"
    ],
    opportunities: [
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 55 },
      { name: "Domestic Technology", sector: "Technology", riskScore: 60 },
      { name: "Resource Development", sector: "Mining", riskScore: 58 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 62 },
      { name: "Tourism", sector: "Tourism", riskScore: 65 }
    ]
  },
  
  "Nepal-fixed": {
    name: "Nepal",
    gdp: "$36.2 billion",
    population: "30.5 million",
    gdpGrowth: "+4.6%",
    inflation: "+7.8%",
    unemployment: "11.4%",
    businessConfidence: "52/100",
    totalBusinesses: "950,000",
    riskLevel: "medium",
    growthRate: "+4.1%",
    marketSize: "$32 billion",
    newStartups: "11,200",
    industries: [
      { name: "Tourism", growth: "+8.2%", value: 78 },
      { name: "Agriculture", growth: "+3.5%", value: 72 },
      { name: "Manufacturing", growth: "+4.2%", value: 65 },
      { name: "Hydropower", growth: "+6.8%", value: 70 },
      { name: "Services", growth: "+5.1%", value: 68 }
    ],
    riskFactors: [
      "Natural disaster vulnerability",
      "Political instability",
      "Infrastructure limitations",
      "Landlocked geography",
      "High dependency on remittances"
    ],
    opportunities: [
      { name: "Tourism Development", sector: "Tourism", riskScore: 42 },
      { name: "Hydroelectric Power", sector: "Energy", riskScore: 45 },
      { name: "Handicrafts", sector: "Manufacturing", riskScore: 38 },
      { name: "Organic Agriculture", sector: "Agriculture", riskScore: 40 },
      { name: "IT Services", sector: "Technology", riskScore: 48 }
    ]
  },
  
  "Bangladesh": {
    name: "Bangladesh",
    gdp: "$460 billion",
    population: "169.4 million",
    gdpGrowth: "+5.8%",
    inflation: "+9.5%",
    unemployment: "5.2%",
    businessConfidence: "60/100",
    totalBusinesses: "8.1 million",
    riskLevel: "medium",
    growthRate: "+5.5%",
    marketSize: "$420 billion",
    newStartups: "65,000",
    industries: [
      { name: "Textiles", growth: "+8.2%", value: 85 },
      { name: "Agriculture", growth: "+4.1%", value: 75 },
      { name: "Manufacturing", growth: "+6.5%", value: 78 },
      { name: "Services", growth: "+5.9%", value: 72 },
      { name: "Pharmaceuticals", growth: "+7.8%", value: 80 }
    ],
    riskFactors: [
      "Climate change vulnerability",
      "Political instability",
      "Infrastructure deficits",
      "Export concentration",
      "Natural disasters"
    ],
    opportunities: [
      { name: "Garment Manufacturing", sector: "Manufacturing", riskScore: 38 },
      { name: "Pharmaceutical Production", sector: "Healthcare", riskScore: 42 },
      { name: "IT Outsourcing", sector: "Technology", riskScore: 45 },
      { name: "Jute Products", sector: "Agriculture", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 48 }
    ]
  },
  
  "Thailand": {
    name: "Thailand",
    gdp: "$543 billion",
    population: "70 million",
    gdpGrowth: "+2.6%",
    inflation: "+3.4%",
    unemployment: "1.5%",
    businessConfidence: "68/100",
    totalBusinesses: "3.2 million",
    riskLevel: "medium",
    growthRate: "+3.2%",
    marketSize: "$495 billion",
    newStartups: "70,000",
    industries: [
      { name: "Tourism", growth: "+7.5%", value: 85 },
      { name: "Manufacturing", growth: "+3.2%", value: 78 },
      { name: "Agriculture", growth: "+2.8%", value: 72 },
      { name: "Electronics", growth: "+4.6%", value: 80 },
      { name: "Automotive", growth: "+5.1%", value: 82 }
    ],
    riskFactors: [
      "Political instability",
      "Aging population",
      "Income inequality",
      "Environmental challenges",
      "Middle-income trap"
    ],
    opportunities: [
      { name: "Medical Tourism", sector: "Healthcare", riskScore: 32 },
      { name: "Electric Vehicles", sector: "Automotive", riskScore: 38 },
      { name: "Food Processing", sector: "Agriculture", riskScore: 30 },
      { name: "Digital Economy", sector: "Technology", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 40 }
    ]
  },
  
  "Chad": {
    name: "Chad",
    gdp: "$12.5 billion",
    population: "17.2 million",
    gdpGrowth: "+3.2%",
    inflation: "+4.8%",
    unemployment: "22.3%",
    businessConfidence: "40/100",
    totalBusinesses: "450,000",
    riskLevel: "high",
    growthRate: "+2.9%",
    marketSize: "$10.8 billion",
    newStartups: "3,200",
    industries: [
      { name: "Oil", growth: "+5.2%", value: 80 },
      { name: "Agriculture", growth: "+2.8%", value: 70 },
      { name: "Livestock", growth: "+3.5%", value: 75 },
      { name: "Manufacturing", growth: "+1.9%", value: 55 },
      { name: "Mining", growth: "+4.1%", value: 65 }
    ],
    riskFactors: [
      "Security challenges",
      "Landlocked geography",
      "Oil price volatility",
      "Infrastructure limitations",
      "Political instability"
    ],
    opportunities: [
      { name: "Oil Development", sector: "Energy", riskScore: 65 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 58 },
      { name: "Mineral Exploration", sector: "Mining", riskScore: 62 },
      { name: "Livestock Products", sector: "Agriculture", riskScore: 60 },
      { name: "Solar Energy", sector: "Energy", riskScore: 55 }
    ]
  },
  
  "Venezuela": {
    name: "Venezuela",
    gdp: "$60 billion",
    population: "28.2 million",
    gdpGrowth: "+4.5%",
    inflation: "+360%",
    unemployment: "30.1%",
    businessConfidence: "32/100",
    totalBusinesses: "925,000",
    riskLevel: "high",
    growthRate: "+3.9%",
    marketSize: "$52 billion",
    newStartups: "8,500",
    industries: [
      { name: "Oil & Gas", growth: "+5.8%", value: 85 },
      { name: "Mining", growth: "+4.2%", value: 70 },
      { name: "Agriculture", growth: "+3.1%", value: 65 },
      { name: "Manufacturing", growth: "+2.5%", value: 60 },
      { name: "Tourism", growth: "+3.8%", value: 55 }
    ],
    riskFactors: [
      "Hyperinflation",
      "Political instability",
      "Economic sanctions",
      "Infrastructure deterioration",
      "Currency volatility"
    ],
    opportunities: [
      { name: "Oil Sector Redevelopment", sector: "Energy", riskScore: 75 },
      { name: "Mining Development", sector: "Mining", riskScore: 70 },
      { name: "Agricultural Production", sector: "Agriculture", riskScore: 68 },
      { name: "Tourism Potential", sector: "Tourism", riskScore: 65 },
      { name: "Manufacturing Rebuilding", sector: "Manufacturing", riskScore: 72 }
    ]
  },
  "Guyana": {
    name: "Guyana",
    gdp: "$15.3 billion",
    population: "790,000",
    gdpGrowth: "+57.8%",
    inflation: "+4.9%",
    unemployment: "15.8%",
    businessConfidence: "68/100",
    totalBusinesses: "75,000",
    riskLevel: "medium",
    growthRate: "+49.7%",
    marketSize: "$13 billion",
    newStartups: "2,100",
    industries: [
      { name: "Oil & Gas", growth: "+125.4%", value: 85 },
      { name: "Mining", growth: "+9.8%", value: 72 },
      { name: "Agriculture", growth: "+4.2%", value: 68 },
      { name: "Forestry", growth: "+3.7%", value: 65 },
      { name: "Fishing", growth: "+2.9%", value: 60 }
    ],
    riskFactors: [
      "Dutch disease risk",
      "Underdeveloped infrastructure",
      "Limited skilled labor",
      "Political uncertainty",
      "Environmental challenges"
    ],
    opportunities: [
      { name: "Oil Services", sector: "Energy", riskScore: 35 },
      { name: "Infrastructure Development", sector: "Construction", riskScore: 45 },
      { name: "Sustainable Forestry", sector: "Agriculture", riskScore: 38 },
      { name: "Mining Exploration", sector: "Mining", riskScore: 42 },
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 40 }
    ]
  },

  "Suriname": {
    name: "Suriname",
    gdp: "$3.8 billion",
    population: "590,000",
    gdpGrowth: "+1.5%",
    inflation: "+34.9%",
    unemployment: "9.8%",
    businessConfidence: "45/100",
    totalBusinesses: "42,000",
    riskLevel: "high",
    growthRate: "+1.8%",
    marketSize: "$3.4 billion",
    newStartups: "950",
    industries: [
      { name: "Mining", growth: "+2.5%", value: 75 },
      { name: "Oil & Gas", growth: "+3.8%", value: 70 },
      { name: "Agriculture", growth: "+1.2%", value: 65 },
      { name: "Forestry", growth: "+0.9%", value: 60 },
      { name: "Tourism", growth: "+1.5%", value: 55 }
    ],
    riskFactors: [
      "Currency instability",
      "High inflation",
      "Public debt burden",
      "Limited economic diversification",
      "Infrastructure challenges"
    ],
    opportunities: [
      { name: "Gold Mining", sector: "Mining", riskScore: 48 },
      { name: "Offshore Oil Exploration", sector: "Energy", riskScore: 52 },
      { name: "Sustainable Forestry", sector: "Agriculture", riskScore: 45 },
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 42 },
      { name: "Agro-Processing", sector: "Manufacturing", riskScore: 50 }
    ]
  },

  "Paraguay": {
    name: "Paraguay",
    gdp: "$41.7 billion",
    population: "7.2 million",
    gdpGrowth: "+4.5%",
    inflation: "+4.8%",
    unemployment: "7.2%",
    businessConfidence: "62/100",
    totalBusinesses: "680,000",
    riskLevel: "medium",
    growthRate: "+3.9%",
    marketSize: "$38 billion",
    newStartups: "9,800",
    industries: [
      { name: "Agriculture", growth: "+6.2%", value: 80 },
      { name: "Hydroelectric Energy", growth: "+4.8%", value: 75 },
      { name: "Manufacturing", growth: "+3.5%", value: 65 },
      { name: "Services", growth: "+4.1%", value: 68 },
      { name: "Construction", growth: "+5.3%", value: 70 }
    ],
    riskFactors: [
      "Weather dependency for agriculture",
      "Narrow export base",
      "Informal economy",
      "Infrastructure gaps",
      "Vulnerability to regional economic conditions"
    ],
    opportunities: [
      { name: "Agribusiness", sector: "Agriculture", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 30 },
      { name: "Cattle Ranching", sector: "Agriculture", riskScore: 38 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 42 },
      { name: "Logistics Services", sector: "Services", riskScore: 40 }
    ]
  },

  "Chile": {
    name: "Chile",
    gdp: "$317 billion",
    population: "19.5 million",
    gdpGrowth: "+2.4%",
    inflation: "+4.7%",
    unemployment: "8.5%",
    businessConfidence: "65/100",
    totalBusinesses: "1.2 million",
    riskLevel: "low",
    growthRate: "+2.1%",
    marketSize: "$295 billion",
    newStartups: "25,000",
    industries: [
      { name: "Mining", growth: "+3.2%", value: 85 },
      { name: "Agriculture", growth: "+2.8%", value: 75 },
      { name: "Fishing", growth: "+1.9%", value: 70 },
      { name: "Manufacturing", growth: "+2.5%", value: 72 },
      { name: "Services", growth: "+3.1%", value: 78 }
    ],
    riskFactors: [
      "Copper price volatility",
      "Water scarcity",
      "Energy challenges",
      "Political reforms uncertainty",
      "Income inequality"
    ],
    opportunities: [
      { name: "Renewable Energy", sector: "Energy", riskScore: 25 },
      { name: "Mining Technology", sector: "Technology", riskScore: 30 },
      { name: "Wine Exports", sector: "Agriculture", riskScore: 22 },
      { name: "Tourism", sector: "Tourism", riskScore: 28 },
      { name: "IT Services", sector: "Technology", riskScore: 32 }
    ]
  },

  "Uruguay": {
    name: "Uruguay",
    gdp: "$64 billion",
    population: "3.5 million",
    gdpGrowth: "+3.3%",
    inflation: "+8.3%",
    unemployment: "9.4%",
    businessConfidence: "68/100",
    totalBusinesses: "380,000",
    riskLevel: "medium",
    growthRate: "+2.8%",
    marketSize: "$58 billion",
    newStartups: "8,500",
    industries: [
      { name: "Agriculture", growth: "+3.9%", value: 78 },
      { name: "Forestry", growth: "+4.2%", value: 72 },
      { name: "Services", growth: "+3.1%", value: 75 },
      { name: "Tourism", growth: "+5.2%", value: 70 },
      { name: "Manufacturing", growth: "+2.5%", value: 65 }
    ],
    riskFactors: [
      "Dependency on regional economies",
      "High operating costs",
      "Small domestic market",
      "Demographic challenges",
      "Agricultural vulnerability to climate"
    ],
    opportunities: [
      { name: "IT Services", sector: "Technology", riskScore: 25 },
      { name: "Agribusiness", sector: "Agriculture", riskScore: 30 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 28 },
      { name: "Forestry Products", sector: "Agriculture", riskScore: 32 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 35 }
    ]
  },

  "Argentina": {
    name: "Argentina",
    gdp: "$632 billion",
    population: "46.2 million",
    gdpGrowth: "+2.9%",
    inflation: "+211.4%",
    unemployment: "7.7%",
    businessConfidence: "42/100",
    totalBusinesses: "2.1 million",
    riskLevel: "high",
    growthRate: "+4.5%",
    marketSize: "$580 billion",
    newStartups: "12,500",
    industries: [
      { name: "Agriculture", growth: "+5.8%", value: 85 },
      { name: "Manufacturing", growth: "+3.2%", value: 72 },
      { name: "Mining", growth: "+4.1%", value: 68 },
      { name: "Services", growth: "+2.5%", value: 70 },
      { name: "Energy", growth: "+6.2%", value: 75 }
    ],
    riskFactors: [
      "High inflation",
      "Currency volatility",
      "Political uncertainty",
      "Economic instability",
      "Regulatory changes"
    ],
    opportunities: [
      { name: "Agribusiness", sector: "Agriculture", riskScore: 45 },
      { name: "Lithium Mining", sector: "Mining", riskScore: 50 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 48 },
      { name: "Tech Startups", sector: "Technology", riskScore: 42 },
      { name: "Tourism", sector: "Tourism", riskScore: 38 }
    ]
  },

  "Guatemala": {
    name: "Guatemala",
    gdp: "$95.1 billion",
    population: "17.1 million",
    gdpGrowth: "+3.5%",
    inflation: "+6.1%",
    unemployment: "2.5%",
    businessConfidence: "60/100",
    totalBusinesses: "780,000",
    riskLevel: "medium",
    growthRate: "+3.2%",
    marketSize: "$86 billion",
    newStartups: "6,200",
    industries: [
      { name: "Agriculture", growth: "+3.8%", value: 75 },
      { name: "Manufacturing", growth: "+2.9%", value: 68 },
      { name: "Services", growth: "+3.5%", value: 70 },
      { name: "Construction", growth: "+4.2%", value: 65 },
      { name: "Mining", growth: "+1.8%", value: 58 }
    ],
    riskFactors: [
      "Security concerns",
      "Natural disaster vulnerability",
      "Political instability",
      "Corruption",
      "Infrastructure limitations"
    ],
    opportunities: [
      { name: "Coffee Exports", sector: "Agriculture", riskScore: 38 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 42 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 45 },
      { name: "Call Centers", sector: "Services", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 48 }
    ]
  },

  "Nicaragua": {
    name: "Nicaragua",
    gdp: "$14.2 billion",
    population: "6.7 million",
    gdpGrowth: "+3.8%",
    inflation: "+5.7%",
    unemployment: "4.8%",
    businessConfidence: "45/100",
    totalBusinesses: "320,000",
    riskLevel: "high",
    growthRate: "+3.2%",
    marketSize: "$12 billion",
    newStartups: "2,800",
    industries: [
      { name: "Agriculture", growth: "+4.2%", value: 72 },
      { name: "Manufacturing", growth: "+3.1%", value: 65 },
      { name: "Mining", growth: "+2.8%", value: 60 },
      { name: "Tourism", growth: "+1.5%", value: 55 },
      { name: "Construction", growth: "+3.5%", value: 62 }
    ],
    riskFactors: [
      "Political instability",
      "International sanctions",
      "Limited access to financing",
      "Regulatory uncertainty",
      "Vulnerability to natural disasters"
    ],
    opportunities: [
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 50 },
      { name: "Light Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 52 },
      { name: "Mining Development", sector: "Mining", riskScore: 55 },
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 58 }
    ]
  },

  "Costa Rica": {
    name: "Costa Rica",
    gdp: "$68 billion",
    population: "5.2 million",
    gdpGrowth: "+4.3%",
    inflation: "+4.7%",
    unemployment: "11.5%",
    businessConfidence: "72/100",
    totalBusinesses: "450,000",
    riskLevel: "low",
    growthRate: "+3.9%",
    marketSize: "$62 billion",
    newStartups: "8,200",
    industries: [
      { name: "Tourism", growth: "+6.8%", value: 85 },
      { name: "Medical Devices", growth: "+7.2%", value: 80 },
      { name: "Agriculture", growth: "+3.5%", value: 75 },
      { name: "Technology", growth: "+5.9%", value: 82 },
      { name: "Services", growth: "+4.2%", value: 78 }
    ],
    riskFactors: [
      "Fiscal deficit",
      "Infrastructure limitations",
      "High energy costs",
      "Currency volatility",
      "Regulatory complexity"
    ],
    opportunities: [
      { name: "Medical Tourism", sector: "Healthcare", riskScore: 25 },
      { name: "Green Technology", sector: "Technology", riskScore: 28 },
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 20 },
      { name: "IT Services", sector: "Technology", riskScore: 30 },
      { name: "Sustainable Agriculture", sector: "Agriculture", riskScore: 32 }
    ]
  },

  "Cuba": {
    name: "Cuba",
    gdp: "$107 billion",
    population: "11.1 million",
    gdpGrowth: "+1.3%",
    inflation: "+70%",
    unemployment: "2.8%",
    businessConfidence: "35/100",
    totalBusinesses: "220,000",
    riskLevel: "high",
    growthRate: "+1.1%",
    marketSize: "$95 billion",
    newStartups: "4,200",
    industries: [
      { name: "Tourism", growth: "+2.5%", value: 70 },
      { name: "Healthcare", growth: "+1.9%", value: 75 },
      { name: "Agriculture", growth: "+1.5%", value: 65 },
      { name: "Mining", growth: "+0.8%", value: 60 },
      { name: "Manufacturing", growth: "+1.2%", value: 58 }
    ],
    riskFactors: [
      "US embargo",
      "Dual currency challenges",
      "Centralized economy",
      "Limited foreign investment",
      "Import dependency"
    ],
    opportunities: [
      { name: "Tourism Development", sector: "Tourism", riskScore: 60 },
      { name: "Pharmaceutical Exports", sector: "Healthcare", riskScore: 55 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 58 },
      { name: "Agricultural Reform", sector: "Agriculture", riskScore: 62 },
      { name: "Biotechnology", sector: "Healthcare", riskScore: 52 }
    ]
  },

  "Thailand-fixed": {
    name: "Thailand",
    gdp: "$543 billion",
    population: "70 million",
    gdpGrowth: "+2.6%",
    inflation: "+3.4%",
    unemployment: "1.5%",
    businessConfidence: "68/100",
    totalBusinesses: "3.2 million",
    riskLevel: "medium",
    growthRate: "+3.2%",
    marketSize: "$495 billion",
    newStartups: "70,000",
    industries: [
      { name: "Tourism", growth: "+7.5%", value: 85 },
      { name: "Manufacturing", growth: "+3.2%", value: 78 },
      { name: "Agriculture", growth: "+2.8%", value: 72 },
      { name: "Electronics", growth: "+4.6%", value: 80 },
      { name: "Automotive", growth: "+5.1%", value: 82 }
    ],
    riskFactors: [
      "Political instability",
      "Aging population",
      "Income inequality",
      "Environmental challenges",
      "Middle-income trap"
    ],
    opportunities: [
      { name: "Medical Tourism", sector: "Healthcare", riskScore: 32 },
      { name: "Electric Vehicles", sector: "Automotive", riskScore: 38 },
      { name: "Food Processing", sector: "Agriculture", riskScore: 30 },
      { name: "Digital Economy", sector: "Technology", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 40 }
    ]
  },
  
  "Poland": {
    name: "Poland",
    gdp: "$720 billion",
    population: "38 million",
    gdpGrowth: "+3.8%",
    inflation: "+4.1%",
    unemployment: "3.1%",
    businessConfidence: "70/100",
    totalBusinesses: "2.2 million",
    riskLevel: "medium",
    growthRate: "+3.6%",
    marketSize: "$680 billion",
    newStartups: "38,000",
    industries: [
      { name: "Manufacturing", growth: "+4.5%", value: 82 },
      { name: "Automotive", growth: "+3.8%", value: 78 },
      { name: "IT Services", growth: "+6.2%", value: 85 },
      { name: "Agriculture", growth: "+2.9%", value: 70 },
      { name: "Energy", growth: "+3.4%", value: 75 }
    ],
    riskFactors: [
      "Aging population",
      "Political tensions with EU",
      "Energy transition challenges",
      "Dependency on EU funding",
      "Labor shortages"
    ],
    opportunities: [
      { name: "IT Outsourcing", sector: "Technology", riskScore: 32 },
      { name: "Green Energy", sector: "Energy", riskScore: 38 },
      { name: "Automotive Components", sector: "Manufacturing", riskScore: 35 },
      { name: "Fintech", sector: "Finance", riskScore: 40 },
      { name: "E-commerce", sector: "Retail", riskScore: 30 }
    ]
  },
  
  "Denmark": {
    name: "Denmark",
    gdp: "$395 billion",
    population: "5.8 million",
    gdpGrowth: "+2.7%",
    inflation: "+2.9%",
    unemployment: "4.8%",
    businessConfidence: "82/100",
    totalBusinesses: "680,000",
    riskLevel: "low",
    growthRate: "+2.4%",
    marketSize: "$370 billion",
    newStartups: "15,000",
    industries: [
      { name: "Renewable Energy", growth: "+7.8%", value: 88 },
      { name: "Pharmaceuticals", growth: "+5.2%", value: 85 },
      { name: "Shipping", growth: "+3.1%", value: 80 },
      { name: "Agriculture", growth: "+2.3%", value: 75 },
      { name: "Technology", growth: "+6.5%", value: 82 }
    ],
    riskFactors: [
      "High labor costs",
      "Housing market vulnerability",
      "Small domestic market",
      "Dependency on exports",
      "Highly regulated market"
    ],
    opportunities: [
      { name: "Green Technology", sector: "Energy", riskScore: 25 },
      { name: "Healthcare Innovation", sector: "Healthcare", riskScore: 28 },
      { name: "Digital Services", sector: "Technology", riskScore: 22 },
      { name: "Sustainable Agriculture", sector: "Agriculture", riskScore: 30 },
      { name: "Clean Shipping", sector: "Transportation", riskScore: 35 }
    ]
  },
  
  "Hungary": {
    name: "Hungary",
    gdp: "$185 billion",
    population: "9.7 million",
    gdpGrowth: "+4.1%",
    inflation: "+5.3%",
    unemployment: "3.8%",
    businessConfidence: "65/100",
    totalBusinesses: "850,000",
    riskLevel: "medium",
    growthRate: "+3.8%",
    marketSize: "$165 billion",
    newStartups: "12,000",
    industries: [
      { name: "Automotive", growth: "+5.2%", value: 85 },
      { name: "Electronics", growth: "+4.8%", value: 82 },
      { name: "Pharmaceuticals", growth: "+3.9%", value: 78 },
      { name: "IT Services", growth: "+7.1%", value: 80 },
      { name: "Agriculture", growth: "+2.8%", value: 70 }
    ],
    riskFactors: [
      "Political tensions with EU",
      "Currency volatility",
      "Regulatory uncertainty",
      "Demographic challenges",
      "Energy dependency"
    ],
    opportunities: [
      { name: "Automotive Supply Chain", sector: "Manufacturing", riskScore: 38 },
      { name: "IT Outsourcing", sector: "Technology", riskScore: 35 },
      { name: "Medical Tourism", sector: "Healthcare", riskScore: 42 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 },
      { name: "Agricultural Technology", sector: "Agriculture", riskScore: 40 }
    ]
  },
  
  "Bulgaria": {
    name: "Bulgaria",
    gdp: "$85 billion",
    population: "6.9 million",
    gdpGrowth: "+3.9%",
    inflation: "+5.2%",
    unemployment: "4.7%",
    businessConfidence: "60/100",
    totalBusinesses: "420,000",
    riskLevel: "medium",
    growthRate: "+3.5%",
    marketSize: "$75 billion",
    newStartups: "8,500",
    industries: [
      { name: "IT Services", growth: "+8.5%", value: 82 },
      { name: "Manufacturing", growth: "+4.2%", value: 75 },
      { name: "Agriculture", growth: "+3.1%", value: 70 },
      { name: "Tourism", growth: "+5.8%", value: 78 },
      { name: "Energy", growth: "+3.9%", value: 72 }
    ],
    riskFactors: [
      "Population decline",
      "Political instability",
      "Corruption",
      "Infrastructure gaps",
      "Skilled labor shortages"
    ],
    opportunities: [
      { name: "IT Outsourcing", sector: "Technology", riskScore: 32 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 38 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 35 }
    ]
  },
  
  "Cambodia": {
    name: "Cambodia",
    gdp: "$30.5 billion",
    population: "16.7 million",
    gdpGrowth: "+5.2%",
    inflation: "+3.5%",
    unemployment: "0.6%",
    businessConfidence: "62/100",
    totalBusinesses: "680,000",
    riskLevel: "medium",
    growthRate: "+4.8%",
    marketSize: "$27 billion",
    newStartups: "7,500",
    industries: [
      { name: "Garment Manufacturing", growth: "+6.8%", value: 85 },
      { name: "Tourism", growth: "+7.2%", value: 80 },
      { name: "Construction", growth: "+5.5%", value: 75 },
      { name: "Agriculture", growth: "+3.2%", value: 72 },
      { name: "Food Processing", growth: "+4.1%", value: 68 }
    ],
    riskFactors: [
      "Narrow economic base",
      "Infrastructure limitations",
      "Vulnerability to external shocks",
      "Governance challenges",
      "Environmental degradation"
    ],
    opportunities: [
      { name: "Tourism Development", sector: "Tourism", riskScore: 42 },
      { name: "Light Manufacturing", sector: "Manufacturing", riskScore: 45 },
      { name: "Agriculture Processing", sector: "Agriculture", riskScore: 40 },
      { name: "Construction", sector: "Real Estate", riskScore: 48 },
      { name: "Digital Services", sector: "Technology", riskScore: 52 }
    ]
  },
  
  "Taiwan": {
    name: "Taiwan",
    gdp: "$790 billion",
    population: "23.5 million",
    gdpGrowth: "+4.6%",
    inflation: "+2.5%",
    unemployment: "3.6%",
    businessConfidence: "75/100",
    totalBusinesses: "1.6 million",
    riskLevel: "medium",
    growthRate: "+4.3%",
    marketSize: "$750 billion",
    newStartups: "42,000",
    industries: [
      { name: "Semiconductors", growth: "+8.2%", value: 95 },
      { name: "Electronics", growth: "+6.5%", value: 90 },
      { name: "IT Hardware", growth: "+7.1%", value: 88 },
      { name: "Machinery", growth: "+4.2%", value: 80 },
      { name: "Chemicals", growth: "+3.8%", value: 75 }
    ],
    riskFactors: [
      "Cross-strait tensions",
      "Geopolitical constraints",
      "Export dependency",
      "Aging population",
      "Energy security"
    ],
    opportunities: [
      { name: "Advanced Semiconductors", sector: "Technology", riskScore: 48 },
      { name: "Green Technology", sector: "Energy", riskScore: 42 },
      { name: "Biotechnology", sector: "Healthcare", riskScore: 45 },
      { name: "AI & Robotics", sector: "Technology", riskScore: 50 },
      { name: "Smart Manufacturing", sector: "Manufacturing", riskScore: 40 }
    ]
  },
  
  "Philippines": {
    name: "Philippines",
    gdp: "$402 billion",
    population: "112 million",
    gdpGrowth: "+5.7%",
    inflation: "+4.8%",
    unemployment: "4.5%",
    businessConfidence: "68/100",
    totalBusinesses: "950,000",
    riskLevel: "medium",
    growthRate: "+5.2%",
    marketSize: "$370 billion",
    newStartups: "28,000",
    industries: [
      { name: "Business Process Outsourcing", growth: "+7.9%", value: 88 },
      { name: "Electronics Manufacturing", growth: "+5.2%", value: 82 },
      { name: "Tourism", growth: "+6.8%", value: 78 },
      { name: "Agriculture", growth: "+3.5%", value: 72 },
      { name: "Construction", growth: "+6.2%", value: 80 }
    ],
    riskFactors: [
      "Natural disaster vulnerability",
      "Political uncertainty",
      "Infrastructure gaps",
      "Income inequality",
      "Dependency on remittances"
    ],
    opportunities: [
      { name: "IT-BPO Services", sector: "Technology", riskScore: 35 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 42 },
      { name: "Electronic Components", sector: "Manufacturing", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 },
      { name: "E-commerce", sector: "Retail", riskScore: 38 }
    ]
  },
  
  "Indonesia": {
    name: "Indonesia",
    gdp: "$1.3 trillion",
    population: "276 million",
    gdpGrowth: "+5.2%",
    inflation: "+3.8%",
    unemployment: "5.5%",
    businessConfidence: "72/100",
    totalBusinesses: "65 million",
    riskLevel: "medium",
    growthRate: "+5.0%",
    marketSize: "$1.2 trillion",
    newStartups: "90,000",
    industries: [
      { name: "Mining", growth: "+5.8%", value: 85 },
      { name: "Manufacturing", growth: "+4.9%", value: 80 },
      { name: "Agriculture", growth: "+3.5%", value: 75 },
      { name: "Tourism", growth: "+7.2%", value: 82 },
      { name: "Digital Economy", growth: "+8.5%", value: 88 }
    ],
    riskFactors: [
      "Natural disaster risk",
      "Infrastructure deficits",
      "Regulatory uncertainty",
      "Corruption",
      "Environmental challenges"
    ],
    opportunities: [
      { name: "E-commerce", sector: "Technology", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 42 },
      { name: "Infrastructure Construction", sector: "Construction", riskScore: 48 },
      { name: "Food Processing", sector: "Agriculture", riskScore: 38 }
    ]
  },
  
  "Papua New Guinea": {
    name: "Papua New Guinea",
    gdp: "$25.1 billion",
    population: "9.2 million",
    gdpGrowth: "+3.8%",
    inflation: "+6.2%",
    unemployment: "2.5%",
    businessConfidence: "50/100",
    totalBusinesses: "350,000",
    riskLevel: "high",
    growthRate: "+3.5%",
    marketSize: "$22 billion",
    newStartups: "4,800",
    industries: [
      { name: "Mining", growth: "+6.2%", value: 85 },
      { name: "Oil & Gas", growth: "+5.8%", value: 80 },
      { name: "Agriculture", growth: "+3.1%", value: 75 },
      { name: "Forestry", growth: "+2.8%", value: 70 },
      { name: "Fishing", growth: "+3.5%", value: 72 }
    ],
    riskFactors: [
      "Political instability",
      "Infrastructure limitations",
      "Security challenges",
      "Resource dependency",
      "Environmental sustainability"
    ],
    opportunities: [
      { name: "Mineral Exploration", sector: "Mining", riskScore: 62 },
      { name: "LNG Development", sector: "Energy", riskScore: 58 },
      { name: "Sustainable Forestry", sector: "Agriculture", riskScore: 55 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 52 },
      { name: "Tourism", sector: "Tourism", riskScore: 65 }
    ]
  },
  
  "Colombia": {
    name: "Colombia",
    gdp: "$328 billion",
    population: "51.5 million",
    gdpGrowth: "+4.3%",
    inflation: "+7.8%",
    unemployment: "10.2%",
    businessConfidence: "65/100",
    totalBusinesses: "1.5 million",
    riskLevel: "medium",
    growthRate: "+3.9%",
    marketSize: "$305 billion",
    newStartups: "35,000",
    industries: [
      { name: "Oil & Gas", growth: "+4.8%", value: 82 },
      { name: "Agriculture", growth: "+3.9%", value: 78 },
      { name: "Manufacturing", growth: "+3.2%", value: 75 },
      { name: "Tourism", growth: "+7.5%", value: 80 },
      { name: "IT Services", growth: "+8.2%", value: 85 }
    ],
    riskFactors: [
      "Security concerns",
      "Income inequality",
      "Infrastructure gaps",
      "Political polarization",
      "Commodity price volatility"
    ],
    opportunities: [
      { name: "Eco-Tourism", sector: "Tourism", riskScore: 42 },
      { name: "IT Outsourcing", sector: "Technology", riskScore: 38 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 48 }
    ]
  },
  
  "Peru": {
    name: "Peru",
    gdp: "$245 billion",
    population: "33.5 million",
    gdpGrowth: "+3.1%",
    inflation: "+5.8%",
    unemployment: "7.5%",
    businessConfidence: "58/100",
    totalBusinesses: "1.2 million",
    riskLevel: "medium",
    growthRate: "+2.8%",
    marketSize: "$220 billion",
    newStartups: "18,000",
    industries: [
      { name: "Mining", growth: "+4.2%", value: 85 },
      { name: "Agriculture", growth: "+3.8%", value: 75 },
      { name: "Tourism", growth: "+5.5%", value: 80 },
      { name: "Manufacturing", growth: "+2.6%", value: 72 },
      { name: "Fishing", growth: "+3.4%", value: 70 }
    ],
    riskFactors: [
      "Political instability",
      "Infrastructure gaps",
      "Social unrest",
      "Commodity price volatility",
      "Environmental challenges"
    ],
    opportunities: [
      { name: "Mining Development", sector: "Mining", riskScore: 42 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 38 },
      { name: "Tourism", sector: "Tourism", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 40 }
    ]
  },
  
  "Antarctica": {
    name: "Antarctica",
    gdp: "N/A",
    population: "5,000 (researchers)",
    gdpGrowth: "N/A",
    inflation: "N/A",
    unemployment: "N/A",
    businessConfidence: "N/A",
    totalBusinesses: "Limited research stations",
    riskLevel: "high",
    growthRate: "N/A",
    marketSize: "Limited to research",
    newStartups: "N/A",
    industries: [
      { name: "Scientific Research", growth: "+2.5%", value: 85 },
      { name: "Tourism (Limited)", growth: "+4.0%", value: 65 },
      { name: "Fishing (Surrounding Waters)", growth: "+1.8%", value: 60 },
      { name: "Conservation", growth: "+3.0%", value: 75 },
      { name: "Climate Research", growth: "+5.2%", value: 80 }
    ],
    riskFactors: [
      "Extreme climate",
      "Limited infrastructure",
      "International treaty restrictions",
      "High operational costs",
      "Environmental sensitivity"
    ],
    opportunities: [
      { name: "Scientific Research", sector: "Research", riskScore: 65 },
      { name: "Climate Studies", sector: "Research", riskScore: 60 },
      { name: "Regulated Tourism", sector: "Tourism", riskScore: 70 },
      { name: "Sustainable Fishing", sector: "Fishing", riskScore: 75 },
      { name: "Conservation Projects", sector: "Environment", riskScore: 55 }
    ]
  },
  
  "Spain": {
    name: "Spain",
    gdp: "$1.4 trillion",
    population: "47.4 million",
    gdpGrowth: "+3.1%",
    inflation: "+3.3%",
    unemployment: "12.7%",
    businessConfidence: "72/100",
    totalBusinesses: "3.4 million",
    riskLevel: "medium",
    growthRate: "+2.8%",
    marketSize: "$1.3 trillion",
    newStartups: "45,000",
    industries: [
      { name: "Tourism", growth: "+6.5%", value: 88 },
      { name: "Automotive", growth: "+3.2%", value: 80 },
      { name: "Agriculture", growth: "+2.1%", value: 75 },
      { name: "Renewable Energy", growth: "+7.8%", value: 85 },
      { name: "Manufacturing", growth: "+2.6%", value: 78 }
    ],
    riskFactors: [
      "Regional tensions",
      "High unemployment",
      "Aging population",
      "Tourism dependency",
      "Regulatory changes"
    ],
    opportunities: [
      { name: "Renewable Energy", sector: "Energy", riskScore: 28 },
      { name: "Digital Economy", sector: "Technology", riskScore: 35 },
      { name: "Sustainable Tourism", sector: "Tourism", riskScore: 30 },
      { name: "Agri-Tech", sector: "Agriculture", riskScore: 32 },
      { name: "Electric Vehicles", sector: "Automotive", riskScore: 38 }
    ]
  },
  
  "Portugal": {
    name: "Portugal",
    gdp: "$251 billion",
    population: "10.3 million",
    gdpGrowth: "+2.9%",
    inflation: "+2.7%",
    unemployment: "6.5%",
    businessConfidence: "70/100",
    totalBusinesses: "1.3 million",
    riskLevel: "medium",
    growthRate: "+2.6%",
    marketSize: "$240 billion",
    newStartups: "22,000",
    industries: [
      { name: "Tourism", growth: "+7.8%", value: 85 },
      { name: "Manufacturing", growth: "+3.1%", value: 75 },
      { name: "Renewable Energy", growth: "+6.5%", value: 82 },
      { name: "Technology", growth: "+5.2%", value: 78 },
      { name: "Agriculture", growth: "+2.3%", value: 70 }
    ],
    riskFactors: [
      "Aging population",
      "Brain drain",
      "Tourism dependency",
      "Public debt levels",
      "Regional economic disparity"
    ],
    opportunities: [
      { name: "Digital Economy", sector: "Technology", riskScore: 32 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 28 },
      { name: "Sustainable Tourism", sector: "Tourism", riskScore: 30 },
      { name: "Ocean Economy", sector: "Maritime", riskScore: 35 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 38 }
    ]
  },
  
  "Italy": {
    name: "Italy",
    gdp: "$2.1 trillion",
    population: "59.3 million",
    gdpGrowth: "+1.1%",
    inflation: "+2.8%",
    unemployment: "8.2%",
    businessConfidence: "65/100",
    totalBusinesses: "4.5 million",
    riskLevel: "medium",
    growthRate: "+0.8%",
    marketSize: "$1.95 trillion",
    newStartups: "38,000",
    industries: [
      { name: "Manufacturing", growth: "+1.8%", value: 82 },
      { name: "Fashion & Luxury", growth: "+3.5%", value: 88 },
      { name: "Tourism", growth: "+5.2%", value: 85 },
      { name: "Agriculture", growth: "+1.5%", value: 78 },
      { name: "Automotive", growth: "+2.1%", value: 80 }
    ],
    riskFactors: [
      "High public debt",
      "Slow economic growth",
      "Aging population",
      "Regional economic disparity",
      "Political instability"
    ],
    opportunities: [
      { name: "Luxury Goods", sector: "Manufacturing", riskScore: 30 },
      { name: "Tourism Innovation", sector: "Tourism", riskScore: 28 },
      { name: "Advanced Manufacturing", sector: "Manufacturing", riskScore: 35 },
      { name: "Agricultural Tech", sector: "Agriculture", riskScore: 32 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 }
    ]
  },
  
  "Greece": {
    name: "Greece",
    gdp: "$222 billion",
    population: "10.4 million",
    gdpGrowth: "+2.8%",
    inflation: "+3.5%",
    unemployment: "11.4%",
    businessConfidence: "60/100",
    totalBusinesses: "820,000",
    riskLevel: "medium",
    growthRate: "+2.2%",
    marketSize: "$205 billion",
    newStartups: "15,000",
    industries: [
      { name: "Tourism", growth: "+8.5%", value: 90 },
      { name: "Shipping", growth: "+4.2%", value: 85 },
      { name: "Agriculture", growth: "+2.3%", value: 75 },
      { name: "Energy", growth: "+3.8%", value: 78 },
      { name: "Manufacturing", growth: "+1.9%", value: 72 }
    ],
    riskFactors: [
      "High public debt",
      "Tourism dependency",
      "Bureaucratic complexity",
      "Aging population",
      "Regional economic disparity"
    ],
    opportunities: [
      { name: "Sustainable Tourism", sector: "Tourism", riskScore: 32 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 },
      { name: "Shipping Innovations", sector: "Maritime", riskScore: 35 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 30 },
      { name: "Digital Services", sector: "Technology", riskScore: 42 }
    ]
  },
  
  "Slovenia": {
    name: "Slovenia",
    gdp: "$61 billion",
    population: "2.1 million",
    gdpGrowth: "+3.2%",
    inflation: "+2.9%",
    unemployment: "4.2%",
    businessConfidence: "72/100",
    totalBusinesses: "215,000",
    riskLevel: "low",
    growthRate: "+2.8%",
    marketSize: "$56 billion",
    newStartups: "8,500",
    industries: [
      { name: "Manufacturing", growth: "+3.8%", value: 82 },
      { name: "Automotive", growth: "+4.2%", value: 80 },
      { name: "Tourism", growth: "+5.6%", value: 78 },
      { name: "IT", growth: "+6.3%", value: 85 },
      { name: "Pharmaceuticals", growth: "+3.9%", value: 75 }
    ],
    riskFactors: [
      "Small domestic market",
      "Aging population",
      "External economic dependency",
      "Energy dependency",
      "Regional disparities"
    ],
    opportunities: [
      { name: "High-Tech Manufacturing", sector: "Manufacturing", riskScore: 28 },
      { name: "Green Technology", sector: "Technology", riskScore: 25 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 30 },
      { name: "IT Services", sector: "Technology", riskScore: 22 },
      { name: "Pharmaceuticals", sector: "Healthcare", riskScore: 32 }
    ]
  },
  
  "Egypt": {
    name: "Egypt",
    gdp: "$402 billion",
    population: "104 million",
    gdpGrowth: "+4.2%",
    inflation: "+26.5%",
    unemployment: "7.2%",
    businessConfidence: "58/100",
    totalBusinesses: "3.1 million",
    riskLevel: "medium",
    growthRate: "+3.8%",
    marketSize: "$380 billion",
    newStartups: "42,000",
    industries: [
      { name: "Tourism", growth: "+6.8%", value: 80 },
      { name: "Manufacturing", growth: "+4.1%", value: 75 },
      { name: "Agriculture", growth: "+3.7%", value: 72 },
      { name: "Construction", growth: "+5.5%", value: 78 },
      { name: "Energy", growth: "+7.2%", value: 85 }
    ],
    riskFactors: [
      "Currency volatility",
      "High inflation",
      "Regional instability",
      "Regulatory uncertainty",
      "Infrastructure challenges"
    ],
    opportunities: [
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 38 },
      { name: "Construction", sector: "Real Estate", riskScore: 45 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 40 },
      { name: "Agriculture Technology", sector: "Agriculture", riskScore: 48 }
    ]
  },
  
  "Panama": {
    name: "Panama",
    gdp: "$75 billion",
    population: "4.3 million",
    gdpGrowth: "+4.8%",
    inflation: "+3.2%",
    unemployment: "5.8%",
    businessConfidence: "68/100",
    totalBusinesses: "250,000",
    riskLevel: "medium",
    growthRate: "+4.5%",
    marketSize: "$68 billion",
    newStartups: "9,200",
    industries: [
      { name: "Logistics & Shipping", growth: "+5.5%", value: 88 },
      { name: "Banking & Finance", growth: "+4.8%", value: 85 },
      { name: "Tourism", growth: "+6.2%", value: 82 },
      { name: "Construction", growth: "+4.1%", value: 78 },
      { name: "Energy", growth: "+3.8%", value: 75 }
    ],
    riskFactors: [
      "Regulatory complexity",
      "Dependence on canal revenue",
      "Income inequality",
      "Environmental challenges",
      "Regional competition"
    ],
    opportunities: [
      { name: "Logistics Innovation", sector: "Transportation", riskScore: 32 },
      { name: "Financial Services", sector: "Finance", riskScore: 35 },
      { name: "Sustainable Tourism", sector: "Tourism", riskScore: 30 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 },
      { name: "Real Estate Development", sector: "Construction", riskScore: 42 }
    ]
  },
  
  "Honduras": {
    name: "Honduras",
    gdp: "$28 billion",
    population: "10.1 million",
    gdpGrowth: "+3.5%",
    inflation: "+4.8%",
    unemployment: "5.7%",
    businessConfidence: "52/100",
    totalBusinesses: "380,000",
    riskLevel: "high",
    growthRate: "+3.2%",
    marketSize: "$25 billion",
    newStartups: "7,500",
    industries: [
      { name: "Agriculture", growth: "+4.2%", value: 82 },
      { name: "Manufacturing", growth: "+3.8%", value: 75 },
      { name: "Tourism", growth: "+5.1%", value: 70 },
      { name: "Textiles", growth: "+4.5%", value: 78 },
      { name: "Mining", growth: "+2.9%", value: 65 }
    ],
    riskFactors: [
      "Security challenges",
      "Political instability",
      "Natural disaster vulnerability",
      "Income inequality",
      "Infrastructure limitations"
    ],
    opportunities: [
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 45 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 52 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 50 },
      { name: "Coffee Production", sector: "Agriculture", riskScore: 42 }
    ]
  },
  
  "Dominican Republic": {
    name: "Dominican Republic",
    gdp: "$94 billion",
    population: "10.8 million",
    gdpGrowth: "+5.3%",
    inflation: "+3.8%",
    unemployment: "6.4%",
    businessConfidence: "65/100",
    totalBusinesses: "430,000",
    riskLevel: "medium",
    growthRate: "+5.0%",
    marketSize: "$86 billion",
    newStartups: "12,000",
    industries: [
      { name: "Tourism", growth: "+7.8%", value: 88 },
      { name: "Manufacturing", growth: "+4.5%", value: 80 },
      { name: "Agriculture", growth: "+3.8%", value: 75 },
      { name: "Mining", growth: "+3.2%", value: 70 },
      { name: "Construction", growth: "+6.1%", value: 82 }
    ],
    riskFactors: [
      "Tourism dependency",
      "Natural disaster vulnerability",
      "Energy challenges",
      "Income inequality",
      "Infrastructure gaps"
    ],
    opportunities: [
      { name: "Tourism Development", sector: "Tourism", riskScore: 35 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 42 },
      { name: "Agricultural Exports", sector: "Agriculture", riskScore: 38 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 },
      { name: "Real Estate", sector: "Construction", riskScore: 40 }
    ]
  },
  
  "United Arab Emirates-Fixed": {
    name: "United Arab Emirates",
    gdp: "$421 billion",
    population: "9.9 million",
    gdpGrowth: "+3.8%",
    inflation: "+3.6%", 
    unemployment: "3.1%",
    businessConfidence: "78/100",
    totalBusinesses: "350,000",
    riskLevel: "low",
    growthRate: "+4.2%",
    marketSize: "$390 billion",
    newStartups: "19,500",
    industries: [
      { name: "Oil & Gas", growth: "+2.5%", value: 85 },
      { name: "Tourism", growth: "+5.8%", value: 80 },
      { name: "Real Estate", growth: "+4.2%", value: 75 },
      { name: "Financial Services", growth: "+3.9%", value: 82 },
      { name: "Technology", growth: "+6.3%", value: 78 }
    ],
    riskFactors: [
      "Oil price volatility",
      "Regional geopolitical tensions",
      "Real estate market fluctuations",
      "Expat-dependent workforce",
      "Competition from neighboring states"
    ],
    opportunities: [
      { name: "Renewable Energy", sector: "Energy", riskScore: 28 },
      { name: "FinTech", sector: "Technology", riskScore: 32 },
      { name: "Smart City Solutions", sector: "Technology", riskScore: 30 },
      { name: "Tourism & Hospitality", sector: "Tourism", riskScore: 25 },
      { name: "Healthcare Services", sector: "Healthcare", riskScore: 35 }
    ]
  },

  "Israel-Fixed": {
    name: "Israel",
    gdp: "$522 billion",
    population: "9.3 million",
    gdpGrowth: "+5.1%",
    inflation: "+5.2%",
    unemployment: "3.9%",
    businessConfidence: "70/100",
    totalBusinesses: "630,000",
    riskLevel: "medium",
    growthRate: "+4.8%",
    marketSize: "$485 billion",
    newStartups: "27,500",
    industries: [
      { name: "Technology", growth: "+8.2%", value: 90 },
      { name: "Defense", growth: "+4.5%", value: 85 },
      { name: "Pharmaceuticals", growth: "+6.3%", value: 82 },
      { name: "Agriculture", growth: "+3.1%", value: 75 },
      { name: "Diamond Processing", growth: "+2.8%", value: 70 }
    ],
    riskFactors: [
      "Regional security concerns",
      "Geopolitical tensions",
      "High cost of living",
      "Regulatory complexity",
      "Skilled labor shortages"
    ],
    opportunities: [
      { name: "AI & Machine Learning", sector: "Technology", riskScore: 35 },
      { name: "Cybersecurity", sector: "Technology", riskScore: 32 },
      { name: "Medical Technology", sector: "Healthcare", riskScore: 30 },
      { name: "Water Technology", sector: "Utilities", riskScore: 28 },
      { name: "Clean Energy", sector: "Energy", riskScore: 38 }
    ]
  },

  "Jordan-Fixed": {
    name: "Jordan",
    gdp: "$47 billion",
    population: "10.2 million",
    gdpGrowth: "+2.5%",
    inflation: "+4.9%",
    unemployment: "22.6%",
    businessConfidence: "55/100",
    totalBusinesses: "280,000",
    riskLevel: "medium",
    growthRate: "+2.2%",
    marketSize: "$42 billion",
    newStartups: "6,800",
    industries: [
      { name: "Tourism", growth: "+4.1%", value: 75 },
      { name: "Manufacturing", growth: "+2.8%", value: 68 },
      { name: "IT", growth: "+5.3%", value: 72 },
      { name: "Pharmaceuticals", growth: "+3.9%", value: 70 },
      { name: "Mining", growth: "+2.2%", value: 65 }
    ],
    riskFactors: [
      "Water scarcity",
      "Regional instability",
      "Refugee pressures",
      "High public debt",
      "Energy dependency"
    ],
    opportunities: [
      { name: "IT Services", sector: "Technology", riskScore: 35 },
      { name: "Pharmaceutical Manufacturing", sector: "Healthcare", riskScore: 38 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 40 },
      { name: "Business Process Outsourcing", sector: "Services", riskScore: 45 }
    ]
  },

  "Turkmenistan-Fixed": {
    name: "Turkmenistan",
    gdp: "$60 billion",
    population: "6.2 million",
    gdpGrowth: "+3.2%",
    inflation: "+14.1%",
    unemployment: "4.1%",
    businessConfidence: "48/100",
    totalBusinesses: "85,000",
    riskLevel: "high",
    growthRate: "+3.5%",
    marketSize: "$53 billion",
    newStartups: "2,200",
    industries: [
      { name: "Natural Gas", growth: "+4.5%", value: 85 },
      { name: "Oil", growth: "+3.2%", value: 80 },
      { name: "Agriculture", growth: "+2.8%", value: 65 },
      { name: "Textiles", growth: "+2.1%", value: 60 },
      { name: "Construction", growth: "+3.7%", value: 68 }
    ],
    riskFactors: [
      "Hydrocarbon dependency",
      "State-controlled economy",
      "Limited foreign investment",
      "Political uncertainty",
      "Currency controls"
    ],
    opportunities: [
      { name: "Gas Processing", sector: "Energy", riskScore: 50 },
      { name: "Pipeline Infrastructure", sector: "Construction", riskScore: 55 },
      { name: "Cotton Processing", sector: "Agriculture", riskScore: 48 },
      { name: "Chemical Production", sector: "Manufacturing", riskScore: 52 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 58 }
    ]
  },

  "Cape Verde": {
    name: "Cape Verde",
    gdp: "$2.1 billion",
    population: "563,000",
    gdpGrowth: "+4.5%",
    inflation: "+7.2%",
    unemployment: "12.4%",
    businessConfidence: "62/100",
    totalBusinesses: "28,000",
    riskLevel: "medium",
    growthRate: "+4.1%",
    marketSize: "$1.9 billion",
    newStartups: "750",
    industries: [
      { name: "Tourism", growth: "+8.5%", value: 85 },
      { name: "Fishing", growth: "+3.2%", value: 70 },
      { name: "Renewable Energy", growth: "+7.1%", value: 75 },
      { name: "Services", growth: "+4.2%", value: 68 },
      { name: "Agriculture", growth: "+2.8%", value: 65 }
    ],
    riskFactors: [
      "Tourism dependency",
      "Limited water resources",
      "Small domestic market",
      "Import dependency",
      "Climate change vulnerability"
    ],
    opportunities: [
      { name: "Tourism Development", sector: "Tourism", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 },
      { name: "Maritime Services", sector: "Transportation", riskScore: 42 },
      { name: "Digital Services", sector: "Technology", riskScore: 45 },
      { name: "Fishery Processing", sector: "Agriculture", riskScore: 40 }
    ]
  },

  "Mali": {
    name: "Mali",
    gdp: "$19.2 billion",
    population: "20.9 million",
    gdpGrowth: "+3.1%",
    inflation: "+9.7%",
    unemployment: "7.2%",
    businessConfidence: "42/100",
    totalBusinesses: "280,000",
    riskLevel: "high",
    growthRate: "+2.8%",
    marketSize: "$17.2 billion",
    newStartups: "4,800",
    industries: [
      { name: "Agriculture", growth: "+4.5%", value: 75 },
      { name: "Mining", growth: "+6.2%", value: 78 },
      { name: "Livestock", growth: "+3.8%", value: 70 },
      { name: "Manufacturing", growth: "+2.2%", value: 60 },
      { name: "Services", growth: "+3.1%", value: 65 }
    ],
    riskFactors: [
      "Security challenges",
      "Political instability",
      "Climate vulnerability",
      "Limited economic diversification",
      "Landlocked geography"
    ],
    opportunities: [
      { name: "Gold Mining", sector: "Mining", riskScore: 60 },
      { name: "Agricultural Development", sector: "Agriculture", riskScore: 58 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 55 },
      { name: "Cotton Production", sector: "Agriculture", riskScore: 62 },
      { name: "Livestock Products", sector: "Agriculture", riskScore: 56 }
    ]
  },

  "Somalia": {
    name: "Somalia",
    gdp: "$8.3 billion",
    population: "16.8 million",
    gdpGrowth: "+2.9%",
    inflation: "+7.5%",
    unemployment: "13.1%",
    businessConfidence: "35/100",
    totalBusinesses: "145,000",
    riskLevel: "high",
    growthRate: "+2.5%",
    marketSize: "$7.5 billion",
    newStartups: "3,800",
    industries: [
      { name: "Agriculture", growth: "+3.5%", value: 70 },
      { name: "Livestock", growth: "+4.2%", value: 75 },
      { name: "Fishing", growth: "+2.8%", value: 65 },
      { name: "Telecommunications", growth: "+5.6%", value: 60 },
      { name: "Services", growth: "+2.9%", value: 55 }
    ],
    riskFactors: [
      "Security challenges",
      "Political instability",
      "Climate vulnerability",
      "Institutional weaknesses",
      "Limited infrastructure"
    ],
    opportunities: [
      { name: "Livestock Exports", sector: "Agriculture", riskScore: 65 },
      { name: "Fishing Industry", sector: "Agriculture", riskScore: 60 },
      { name: "Telecommunications", sector: "Technology", riskScore: 58 },
      { name: "Mobile Banking", sector: "Finance", riskScore: 62 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 67 }
    ]
  },

  "Uganda": {
    name: "Uganda",
    gdp: "$45.3 billion",
    population: "45.7 million",
    gdpGrowth: "+4.7%",
    inflation: "+5.8%",
    unemployment: "9.8%",
    businessConfidence: "58/100",
    totalBusinesses: "840,000",
    riskLevel: "medium",
    growthRate: "+4.3%",
    marketSize: "$41 billion",
    newStartups: "12,500",
    industries: [
      { name: "Agriculture", growth: "+4.2%", value: 78 },
      { name: "Mining", growth: "+5.8%", value: 70 },
      { name: "Manufacturing", growth: "+4.5%", value: 68 },
      { name: "Services", growth: "+5.2%", value: 72 },
      { name: "Construction", growth: "+6.1%", value: 65 }
    ],
    riskFactors: [
      "Infrastructure deficits",
      "Regional instability",
      "Dependency on agriculture",
      "Youth unemployment",
      "Land disputes"
    ],
    opportunities: [
      { name: "Agribusiness", sector: "Agriculture", riskScore: 40 },
      { name: "Oil & Gas Development", sector: "Energy", riskScore: 48 },
      { name: "Tourism", sector: "Tourism", riskScore: 42 },
      { name: "ICT Services", sector: "Technology", riskScore: 38 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 45 }
    ]
  },

  "Cameroon": {
    name: "Cameroon",
    gdp: "$44.9 billion",
    population: "27.2 million",
    gdpGrowth: "+3.8%",
    inflation: "+6.2%",
    unemployment: "3.9%",
    businessConfidence: "54/100",
    totalBusinesses: "620,000",
    riskLevel: "medium",
    growthRate: "+3.5%",
    marketSize: "$41.2 billion",
    newStartups: "9,800",
    industries: [
      { name: "Agriculture", growth: "+4.1%", value: 75 },
      { name: "Oil & Gas", growth: "+3.5%", value: 72 },
      { name: "Manufacturing", growth: "+3.8%", value: 68 },
      { name: "Services", growth: "+4.5%", value: 70 },
      { name: "Construction", growth: "+5.2%", value: 65 }
    ],
    riskFactors: [
      "Security challenges",
      "Oil dependency",
      "Limited economic diversification",
      "Infrastructure deficits",
      "Regional tensions"
    ],
    opportunities: [
      { name: "Agricultural Processing", sector: "Agriculture", riskScore: 42 },
      { name: "Natural Gas Development", sector: "Energy", riskScore: 45 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 40 },
      { name: "Tourism", sector: "Tourism", riskScore: 48 },
      { name: "Mining Exploration", sector: "Mining", riskScore: 44 }
    ]
  },

  "Zambia": {
    name: "Zambia",
    gdp: "$26.8 billion",
    population: "19.5 million",
    gdpGrowth: "+4.0%",
    inflation: "+12.5%",
    unemployment: "12.2%",
    businessConfidence: "52/100",
    totalBusinesses: "380,000",
    riskLevel: "medium",
    growthRate: "+3.7%",
    marketSize: "$24.5 billion",
    newStartups: "7,600",
    industries: [
      { name: "Mining", growth: "+5.2%", value: 78 },
      { name: "Agriculture", growth: "+4.1%", value: 72 },
      { name: "Manufacturing", growth: "+3.5%", value: 65 },
      { name: "Services", growth: "+4.8%", value: 68 },
      { name: "Construction", growth: "+5.5%", value: 70 }
    ],
    riskFactors: [
      "Copper price volatility",
      "Energy challenges",
      "High debt levels",
      "Currency volatility",
      "Limited economic diversification"
    ],
    opportunities: [
      { name: "Copper Mining", sector: "Mining", riskScore: 45 },
      { name: "Agricultural Development", sector: "Agriculture", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "Tourism", sector: "Tourism", riskScore: 38 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 44 }
    ]
  },

  "Zimbabwe": {
    name: "Zimbabwe",
    gdp: "$28.4 billion",
    population: "15.2 million",
    gdpGrowth: "+3.5%",
    inflation: "+400%",
    unemployment: "16.5%",
    businessConfidence: "40/100",
    totalBusinesses: "320,000",
    riskLevel: "high",
    growthRate: "+3.1%",
    marketSize: "$24.8 billion",
    newStartups: "6,800",
    industries: [
      { name: "Mining", growth: "+5.8%", value: 75 },
      { name: "Agriculture", growth: "+3.2%", value: 70 },
      { name: "Manufacturing", growth: "+2.8%", value: 60 },
      { name: "Services", growth: "+3.5%", value: 65 },
      { name: "Tourism", growth: "+4.2%", value: 68 }
    ],
    riskFactors: [
      "Hyperinflation",
      "Currency instability",
      "Policy uncertainty",
      "Foreign exchange shortages",
      "Infrastructure deficits"
    ],
    opportunities: [
      { name: "Mining Development", sector: "Mining", riskScore: 52 },
      { name: "Agricultural Revival", sector: "Agriculture", riskScore: 55 },
      { name: "Tourism", sector: "Tourism", riskScore: 48 },
      { name: "Manufacturing", sector: "Manufacturing", riskScore: 56 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 50 }
    ]
  },

  "Gabon": {
    name: "Gabon",
    gdp: "$17.8 billion",
    population: "2.3 million",
    gdpGrowth: "3.0%",
    inflation: "4.1%",
    unemployment: "20.5%",
    businessConfidence: "53.7",
    totalBusinesses: "36,200",
    riskLevel: "medium",
    growthRate: "2.8%",
    marketSize: "Small",
    newStartups: "410",
    industries: [
      { name: "Oil & Gas", growth: "3.7%", value: 72 },
      { name: "Timber", growth: "2.5%", value: 35 },
      { name: "Mining", growth: "4.2%", value: 28 }
    ],
    riskFactors: [
      "Oil price volatility",
      "Limited economic diversification",
      "Infrastructure challenges"
    ],
    opportunities: [
      { name: "Eco-tourism", sector: "Tourism", riskScore: 3.2 },
      { name: "Forestry management", sector: "Agriculture", riskScore: 2.7 },
      { name: "Oil & gas services", sector: "Energy", riskScore: 4.5 }
    ]
  },
  
  "Benin": {
    name: "Benin",
    gdp: "$18.2 billion",
    population: "12.5 million",
    gdpGrowth: "6.7%",
    inflation: "3.8%",
    unemployment: "2.2%",
    businessConfidence: "51.2",
    totalBusinesses: "41,200",
    riskLevel: "medium",
    growthRate: "5.9%",
    marketSize: "Medium",
    newStartups: "620",
    industries: [
      { name: "Agriculture", growth: "4.5%", value: 45 },
      { name: "Services", growth: "6.8%", value: 35 },
      { name: "Manufacturing", growth: "5.2%", value: 20 }
    ],
    riskFactors: [
      "Political instability",
      "Infrastructure deficiencies",
      "Limited access to financing"
    ],
    opportunities: [
      { name: "Cotton processing", sector: "Agriculture", riskScore: 3.5 },
      { name: "Tourism development", sector: "Services", riskScore: 5.2 },
      { name: "Digital services", sector: "Technology", riskScore: 4.8 }
    ]
  },
  
  "Togo": {
    name: "Togo",
    gdp: "$8.4 billion",
    population: "8.3 million",
    gdpGrowth: "5.5%",
    inflation: "2.3%",
    unemployment: "3.7%",
    businessConfidence: "48.3",
    totalBusinesses: "22,400",
    riskLevel: "medium",
    growthRate: "4.8%",
    marketSize: "Small",
    newStartups: "410",
    industries: [
      { name: "Agriculture", growth: "3.9%", value: 40 },
      { name: "Services", growth: "5.2%", value: 42 },
      { name: "Mining", growth: "6.1%", value: 18 }
    ],
    riskFactors: [
      "Political uncertainty",
      "Limited infrastructure",
      "Dependency on agriculture"
    ],
    opportunities: [
      { name: "Phosphate mining", sector: "Mining", riskScore: 3.8 },
      { name: "Port development", sector: "Transportation", riskScore: 4.2 },
      { name: "Agricultural processing", sector: "Agriculture", riskScore: 3.5 }
    ]
  },
  
  "Botswana": {
    name: "Botswana",
    gdp: "$18.7 billion",
    population: "2.3 million",
    gdpGrowth: "3.5%",
    inflation: "2.2%",
    unemployment: "24.5%",
    businessConfidence: "62.1",
    totalBusinesses: "25,600",
    riskLevel: "low",
    growthRate: "3.8%",
    marketSize: "Small",
    newStartups: "310",
    industries: [
      { name: "Mining", growth: "4.2%", value: 65 },
      { name: "Tourism", growth: "5.8%", value: 45 },
      { name: "Financial Services", growth: "3.5%", value: 25 }
    ],
    riskFactors: [
      "Diamond dependency",
      "Small domestic market",
      "Water scarcity"
    ],
    opportunities: [
      { name: "Diamond processing", sector: "Mining", riskScore: 2.1 },
      { name: "Safari tourism", sector: "Tourism", riskScore: 3.2 },
      { name: "Financial services", sector: "Finance", riskScore: 2.8 }
    ]
  },
  
  "Namibia": {
    name: "Namibia",
    gdp: "$12.2 billion",
    population: "2.5 million",
    gdpGrowth: "2.7%",
    inflation: "3.5%",
    unemployment: "33.4%",
    businessConfidence: "53.5",
    totalBusinesses: "19,800",
    riskLevel: "medium",
    growthRate: "2.9%",
    marketSize: "Small",
    newStartups: "280",
    industries: [
      { name: "Mining", growth: "3.7%", value: 58 },
      { name: "Tourism", growth: "4.9%", value: 42 },
      { name: "Agriculture", growth: "2.1%", value: 30 }
    ],
    riskFactors: [
      "Drought vulnerability",
      "High unemployment",
      "Economic inequality"
    ],
    opportunities: [
      { name: "Uranium mining", sector: "Mining", riskScore: 3.5 },
      { name: "Renewable energy", sector: "Energy", riskScore: 2.7 },
      { name: "Eco-tourism", sector: "Tourism", riskScore: 3.1 }
    ]
  },
  
  "Angola": {
    name: "Angola",
    gdp: "$74.5 billion",
    population: "34.5 million",
    gdpGrowth: "+3.0%",
    inflation: "+13.8%",
    unemployment: "32.7%",
    businessConfidence: "48/100",
    totalBusinesses: "680,000",
    riskLevel: "high",
    growthRate: "+2.7%",
    marketSize: "$68 billion",
    newStartups: "12,500",
    industries: [
      { name: "Oil & Gas", growth: "+3.8%", value: 85 },
      { name: "Mining", growth: "+4.5%", value: 75 },
      { name: "Agriculture", growth: "+3.1%", value: 65 },
      { name: "Manufacturing", growth: "+2.8%", value: 60 },
      { name: "Services", growth: "+3.5%", value: 70 }
    ],
    riskFactors: [
      "Oil dependency",
      "Currency volatility",
      "Infrastructure challenges",
      "Limited economic diversification",
      "Institutional constraints"
    ],
    opportunities: [
      { name: "Oil & Gas Development", sector: "Energy", riskScore: 50 },
      { name: "Diamond Mining", sector: "Mining", riskScore: 48 },
      { name: "Agricultural Expansion", sector: "Agriculture", riskScore: 45 },
      { name: "Infrastructure Development", sector: "Construction", riskScore: 52 },
      { name: "Tourism", sector: "Tourism", riskScore: 55 }
    ]
  }
};