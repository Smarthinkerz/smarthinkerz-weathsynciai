// New country data to be added to the main country-data.ts file
// This contains accurate data for Myanmar, Vietnam, Thailand, Cambodia, and Denmark

export const newCountries = {
  "Myanmar": {
    name: "Myanmar",
    gdp: "$76.2 billion",
    population: "54.8 million",
    gdpGrowth: "-2.1%",
    inflation: "+8.8%",
    unemployment: "3.2%",
    businessConfidence: "42/100",
    totalBusinesses: "127,000",
    riskLevel: "high",
    growthRate: "-0.8%",
    marketSize: "$76.2 billion",
    newStartups: "5,200",
    industries: [
      { name: "Agriculture", growth: "+1.2%", value: 65 },
      { name: "Manufacturing", growth: "-3.5%", value: 55 },
      { name: "Mining", growth: "-2.8%", value: 58 },
      { name: "Tourism", growth: "-4.2%", value: 45 },
      { name: "Telecommunications", growth: "+3.7%", value: 68 },
      { name: "Construction", growth: "-1.5%", value: 52 }
    ],
    riskFactors: [
      "Political instability",
      "Sanctions",
      "Currency volatility",
      "Infrastructure limitations"
    ],
    opportunities: [
      { name: "Agricultural Processing", sector: "Agriculture", riskScore: 62 },
      { name: "Digital Services", sector: "Technology", riskScore: 58 },
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 65 },
      { name: "Natural Resources", sector: "Mining", riskScore: 70 },
      { name: "Infrastructure Development", sector: "Construction", riskScore: 68 }
    ]
  },
  
  "Vietnam": {
    name: "Vietnam",
    gdp: "$408.1 billion",
    population: "98.2 million",
    gdpGrowth: "+8.0%",
    inflation: "+3.6%",
    unemployment: "2.3%",
    businessConfidence: "72/100",
    totalBusinesses: "845,000",
    riskLevel: "medium",
    growthRate: "+6.8%",
    marketSize: "$408.1 billion",
    newStartups: "23,500",
    industries: [
      { name: "Manufacturing", growth: "+8.5%", value: 82 },
      { name: "Electronics", growth: "+10.2%", value: 85 },
      { name: "Textiles", growth: "+7.5%", value: 78 },
      { name: "Agriculture", growth: "+3.8%", value: 70 },
      { name: "Tourism", growth: "+6.2%", value: 75 },
      { name: "Construction", growth: "+8.7%", value: 80 }
    ],
    riskFactors: [
      "Environmental challenges",
      "Infrastructure gaps",
      "Regulatory uncertainty",
      "Regional tensions"
    ],
    opportunities: [
      { name: "Tech Manufacturing", sector: "Electronics", riskScore: 35 },
      { name: "Digital Economy", sector: "Technology", riskScore: 40 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 42 },
      { name: "E-commerce Growth", sector: "Retail", riskScore: 38 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 32 }
    ]
  },
  
  "Thailand": {
    name: "Thailand",
    gdp: "$522.8 billion",
    population: "70.1 million",
    gdpGrowth: "+2.6%",
    inflation: "+1.2%",
    unemployment: "1.5%",
    businessConfidence: "68/100",
    totalBusinesses: "728,000",
    riskLevel: "medium",
    growthRate: "+3.5%",
    marketSize: "$522.8 billion",
    newStartups: "18,200",
    industries: [
      { name: "Tourism", growth: "+5.8%", value: 85 },
      { name: "Automotive", growth: "+4.2%", value: 78 },
      { name: "Electronics", growth: "+5.5%", value: 80 },
      { name: "Agriculture", growth: "+2.8%", value: 75 },
      { name: "Food Processing", growth: "+3.7%", value: 76 },
      { name: "Retail", growth: "+4.5%", value: 77 }
    ],
    riskFactors: [
      "Political instability",
      "Aging population",
      "Income inequality",
      "Environmental concerns"
    ],
    opportunities: [
      { name: "Medical Tourism", sector: "Healthcare", riskScore: 30 },
      { name: "Digital Services", sector: "Technology", riskScore: 35 },
      { name: "Renewable Energy", sector: "Energy", riskScore: 38 },
      { name: "Food Innovation", sector: "Agriculture", riskScore: 32 },
      { name: "Smart Manufacturing", sector: "Manufacturing", riskScore: 40 }
    ]
  },
  
  "Cambodia": {
    name: "Cambodia",
    gdp: "$30.5 billion",
    population: "17.3 million",
    gdpGrowth: "+5.1%",
    inflation: "+2.5%",
    unemployment: "0.6%",
    businessConfidence: "65/100",
    totalBusinesses: "185,000",
    riskLevel: "medium",
    growthRate: "+4.8%",
    marketSize: "$30.5 billion",
    newStartups: "8,500",
    industries: [
      { name: "Garment Manufacturing", growth: "+6.8%", value: 80 },
      { name: "Tourism", growth: "+5.2%", value: 75 },
      { name: "Agriculture", growth: "+3.5%", value: 70 },
      { name: "Construction", growth: "+7.5%", value: 78 },
      { name: "Manufacturing", growth: "+5.8%", value: 72 },
      { name: "Real Estate", growth: "+4.2%", value: 68 }
    ],
    riskFactors: [
      "Infrastructure limitations",
      "Human capital constraints",
      "Governance challenges",
      "Limited economic diversification"
    ],
    opportunities: [
      { name: "Textile Manufacturing", sector: "Manufacturing", riskScore: 42 },
      { name: "Tourism Development", sector: "Tourism", riskScore: 38 },
      { name: "Agricultural Processing", sector: "Agriculture", riskScore: 45 },
      { name: "Light Manufacturing", sector: "Manufacturing", riskScore: 48 },
      { name: "Digital Economy", sector: "Technology", riskScore: 52 }
    ]
  },
  
  "Denmark": {
    name: "Denmark",
    gdp: "$398.3 billion",
    population: "5.9 million",
    gdpGrowth: "+2.7%",
    inflation: "+1.8%",
    unemployment: "4.8%",
    businessConfidence: "84/100",
    totalBusinesses: "305,000",
    riskLevel: "low",
    growthRate: "+2.2%",
    marketSize: "$398.3 billion",
    newStartups: "12,800",
    industries: [
      { name: "Renewable Energy", growth: "+8.5%", value: 90 },
      { name: "Pharmaceuticals", growth: "+5.2%", value: 85 },
      { name: "Shipping", growth: "+3.8%", value: 82 },
      { name: "Agriculture", growth: "+2.5%", value: 75 },
      { name: "Technology", growth: "+6.7%", value: 88 },
      { name: "Manufacturing", growth: "+3.2%", value: 80 }
    ],
    riskFactors: [
      "High taxation",
      "Aging population",
      "Labor market rigidity",
      "Export dependency"
    ],
    opportunities: [
      { name: "Green Technology", sector: "Energy", riskScore: 20 },
      { name: "Biotech Innovation", sector: "Healthcare", riskScore: 25 },
      { name: "Digital Solutions", sector: "Technology", riskScore: 18 },
      { name: "Shipping Technology", sector: "Transportation", riskScore: 22 },
      { name: "Smart Agriculture", sector: "Agriculture", riskScore: 28 }
    ]
  }
};