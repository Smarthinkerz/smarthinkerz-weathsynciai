import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertBusinessLocationSchema, InsertBusinessLocation } from "@shared/schema";
import { z } from "zod";
import axios from "axios";

interface AuthenticatedRequest extends Request {
  isAuthenticated(): boolean;
  user?: any;
}

// Check if company subscription is premium
async function checkCompanyPremium(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.session?.company?.id) {
      return res.status(401).json({ error: "Company not authenticated" });
    }

    const company = await storage.getCompany(req.session.company.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (company.subscriptionTier !== 'premium' && company.subscriptionTier !== 'elite' && company.subscriptionTier !== 'enterprise') {
      return res.status(403).json({ 
        error: "Elite subscription required", 
        message: "This feature requires an Elite or Enterprise subscription",
        subscriptionTier: company.subscriptionTier
      });
    }

    return null; // No error - company is premium
  } catch (error) {
    console.error("Error checking company premium status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}


export function registerBusinessMapRoutes(app: Express) {
  // Get all business locations
  app.get("/api/business-map/locations", async (req: Request, res: Response) => {
    try {
      const locations = await storage.getAllBusinessLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error getting business locations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get API configuration and available data sources for map
  app.get("/api/business-map/api-config", async (req: Request, res: Response) => {
    try {
      // Share data-source availability with the client. SECURITY: never return
      // the raw Alpha Vantage API key to the browser — expose only a capability
      // flag. (Browser-side Alpha Vantage calls must be proxied server-side if
      // ever re-enabled; returning the key leaks a server secret to any caller.)
      const apiConfig = {
        dataSources: {
          worldBank: true,
          imf: true,
          oecd: true,
          unComtrade: true,
          alphaVantage: !!process.env.ALPHA_VANTAGE_API_KEY
        },
        // Include data sources version and last updated timestamp
        lastUpdated: new Date().toISOString(),
        datasourceVersion: '2024.05'
      };
      
      res.json(apiConfig);
    } catch (error) {
      console.error('Error providing API configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get economic data from reliable sources (World Bank, IMF)
  app.get("/api/business-map/economic-data/:countryCode", async (req: Request, res: Response) => {
    try {
      const { countryCode } = req.params;
      if (!countryCode || countryCode.length !== 3) {
        return res.status(400).json({ error: "Invalid country code. Must be 3-letter ISO code." });
      }
      
      // Fetch data from World Bank API
      const worldBankData = await fetchWorldBankData(countryCode);
      
      // Fetch data from IMF API
      const imfData = await fetchIMFData(countryCode);
      
      // Store everything in a cache for client-side use
      const economicData = {
        countryCode,
        timestamp: new Date().toISOString(),
        sources: ["World Bank", "IMF"],
        worldBank: worldBankData,
        imf: imfData,
        // Include properly formatted data for the client to use
        indicators: {
          gdp: worldBankData.gdp || imfData.gdp,
          gdpGrowth: worldBankData.gdpGrowth || imfData.gdpGrowth,
          gdpPerCapita: worldBankData.gdpPerCapita,
          inflation: worldBankData.inflation || imfData.inflation,
          unemployment: worldBankData.unemployment || imfData.unemployment,
          population: worldBankData.population,
          exports: imfData.exports,
          imports: imfData.imports,
          tradeBalance: imfData.exports && imfData.imports ? 
            (imfData.exports - imfData.imports) : undefined,
          foreignInvestment: worldBankData.foreignInvestment,
          businessConfidence: imfData.businessConfidence,
        },
        // 2024-2025 forecasts from IMF World Economic Outlook
        forecasts: {
          gdpGrowth: imfData.gdpGrowthForecast || "Data not available",
          inflation: imfData.inflationForecast || "Data not available",
          unemployment: imfData.unemploymentForecast || "Data not available"
        }
      };
      
      res.json(economicData);
    } catch (error) {
      console.error(`Error fetching economic data for ${req.params.countryCode}:`, error);
      res.status(500).json({ 
        error: "Error fetching economic data", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Helper function to fetch data from World Bank API
  async function fetchWorldBankData(countryCode: string) {
    try {
      // World Bank API URLs - free and doesn't require API key
      const baseUrl = "https://api.worldbank.org/v2/country";
      const format = "?format=json";
      
      // Fetch multiple indicators in parallel
      const [gdpResponse, gdpGrowthResponse, gdpPerCapitaResponse, 
             inflationResponse, unemploymentResponse, populationResponse, 
             fdiResponse] = await Promise.all([
        // GDP (current US$)
        axios.get(`${baseUrl}/${countryCode}/indicator/NY.GDP.MKTP.CD${format}`),
        // GDP growth (annual %)
        axios.get(`${baseUrl}/${countryCode}/indicator/NY.GDP.MKTP.KD.ZG${format}`),
        // GDP per capita (current US$)
        axios.get(`${baseUrl}/${countryCode}/indicator/NY.GDP.PCAP.CD${format}`),
        // Inflation, consumer prices (annual %)
        axios.get(`${baseUrl}/${countryCode}/indicator/FP.CPI.TOTL.ZG${format}`),
        // Unemployment, total (% of total labor force)
        axios.get(`${baseUrl}/${countryCode}/indicator/SL.UEM.TOTL.ZS${format}`),
        // Population, total
        axios.get(`${baseUrl}/${countryCode}/indicator/SP.POP.TOTL${format}`),
        // Foreign direct investment, net inflows (BoP, current US$)
        axios.get(`${baseUrl}/${countryCode}/indicator/BX.KLT.DINV.CD.WD${format}`)
      ]).catch(error => {
        console.error("World Bank API fetch error:", error);
        return Array(7).fill({ data: [null] });
      });
      
      // Helper to extract the latest value from World Bank API response
      const getLatestValue = (response: any): number | undefined => {
        if (response && response.data && response.data[1] && response.data[1].length > 0) {
          // Filter out null values and sort by date descending
          const validData = response.data[1]
            .filter((item: any) => item.value !== null)
            .sort((a: any, b: any) => b.date - a.date);
          
          if (validData.length > 0) {
            return validData[0].value;
          }
        }
        return undefined;
      };
      
      // Process and return the data
      return {
        gdp: getLatestValue(gdpResponse),
        gdpGrowth: getLatestValue(gdpGrowthResponse),
        gdpPerCapita: getLatestValue(gdpPerCapitaResponse),
        inflation: getLatestValue(inflationResponse),
        unemployment: getLatestValue(unemploymentResponse),
        population: getLatestValue(populationResponse),
        foreignInvestment: getLatestValue(fdiResponse),
        dataYear: new Date().getFullYear() - 1, // World Bank usually has data up to previous year
      };
    } catch (error) {
      console.error(`Error fetching World Bank data for ${countryCode}:`, error);
      return {}; // Return empty object in case of error
    }
  }
  
  // Helper function to fetch data from IMF API
  async function fetchIMFData(countryCode: string) {
    try {
      // IMF APIs and endpoints
      const weoApi = "https://www.imf.org/external/datamapper/api/v1";
      
      // Fetch IMF World Economic Outlook (WEO) data for forecasts
      const [gdpGrowthResponse, inflationResponse, unemploymentResponse] = await Promise.all([
        // Real GDP growth (%)
        axios.get(`${weoApi}/NGDP_RPCH@WEO/latest/${countryCode}`),
        // Inflation rate, average consumer prices (%)
        axios.get(`${weoApi}/PCPIPCH@WEO/latest/${countryCode}`),
        // Unemployment rate (%)
        axios.get(`${weoApi}/LUR@WEO/latest/${countryCode}`)
      ]).catch(error => {
        console.error("IMF API fetch error:", error);
        return Array(3).fill({ data: null });
      });
      
      // Helper to extract forecast values for current and next year
      const getForecasts = (response: any, countryCode: string): { current: number | null, next: number | null } => {
        try {
          const currentYear = new Date().getFullYear().toString();
          const nextYear = (new Date().getFullYear() + 1).toString();
          
          if (response && response.data && response.data.values && response.data.values[countryCode]) {
            return {
              current: response.data.values[countryCode][currentYear] || null,
              next: response.data.values[countryCode][nextYear] || null
            };
          }
        } catch (e) {
          console.error("Error parsing IMF forecast data:", e);
        }
        return { current: null, next: null };
      };
      
      // Extract forecasts
      const gdpGrowthForecast = getForecasts(gdpGrowthResponse, countryCode);
      const inflationForecast = getForecasts(inflationResponse, countryCode);
      const unemploymentForecast = getForecasts(unemploymentResponse, countryCode);
      
      // Format the forecast data
      const formatForecast = (forecast: { current: number | null, next: number | null }): string | null => {
        if (forecast.current !== null && forecast.next !== null) {
          return `${forecast.current}% (${new Date().getFullYear()}) | ${forecast.next}% (${new Date().getFullYear() + 1})`;
        } else if (forecast.current !== null) {
          return `${forecast.current}% (${new Date().getFullYear()})`;
        } else if (forecast.next !== null) {
          return `${forecast.next}% (${new Date().getFullYear() + 1})`;
        }
        return null;
      };
      
      // Process and return the data
      return {
        // Current economic indicators
        gdp: null, // IMF doesn't provide absolute GDP in this API
        gdpGrowth: gdpGrowthForecast.current,
        inflation: inflationForecast.current,
        unemployment: unemploymentForecast.current,
        
        // Forecasts in human-readable format
        gdpGrowthForecast: formatForecast(gdpGrowthForecast),
        inflationForecast: formatForecast(inflationForecast),
        unemploymentForecast: formatForecast(unemploymentForecast),
        
        // Other data
        businessConfidence: null, // Not available in the public IMF API
        exports: null, // Not available in this API
        imports: null // Not available in this API
      };
    } catch (error) {
      console.error(`Error fetching IMF data for ${countryCode}:`, error);
      return {}; // Return empty object in case of error
    }
  }

  // Get business locations by type
  app.get("/api/business-map/locations/type/:type", async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const locations = await storage.getBusinessLocationsByType(type);
      res.json(locations);
    } catch (error) {
      console.error(`Error getting business locations by type ${req.params.type}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get business locations by country
  app.get("/api/business-map/locations/country/:country", async (req: Request, res: Response) => {
    try {
      const { country } = req.params;
      const locations = await storage.getBusinessLocationsByCountry(country);
      res.json(locations);
    } catch (error) {
      console.error(`Error getting business locations by country ${req.params.country}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get business locations for the authenticated company
  app.get("/api/business-map/locations/company", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.session?.company?.id) {
        return res.status(401).json({ error: "Company not authenticated" });
      }

      const companyId = req.session.company.id;
      const locations = await storage.getBusinessLocationsByCompany(companyId);
      res.json(locations);
    } catch (error) {
      console.error("Error getting company business locations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get business location by ID - must come after specific routes
  app.get("/api/business-map/locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      const location = await storage.getBusinessLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Business location not found" });
      }

      res.json(location);
    } catch (error) {
      console.error(`Error getting business location ${req.params.id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new business location (Premium companies only)
  app.post("/api/business-map/locations", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if company is premium
      const premiumError = await checkCompanyPremium(req, res);
      if (premiumError) return; // Response already sent in checkCompanyPremium

      // Validate the location data
      const validationResult = insertBusinessLocationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid location data", 
          details: validationResult.error.format() 
        });
      }

      const location = validationResult.data;
      // Tenant isolation: a company pin must reference the CREATING company —
      // never a client-supplied entityId — so a tenant can't plant a pin that
      // impersonates another company.
      if (location.type === "company") {
        location.entityId = req.session!.company!.id;
      }
      const newLocation = await storage.createBusinessLocation(location);
      res.status(201).json(newLocation);
    } catch (error) {
      console.error("Error creating business location:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a business location (Premium companies only)
  app.put("/api/business-map/locations/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if company is premium
      const premiumError = await checkCompanyPremium(req, res);
      if (premiumError) return; // Response already sent in checkCompanyPremium

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      // Check if location exists
      const existingLocation = await storage.getBusinessLocation(id);
      if (!existingLocation) {
        return res.status(404).json({ error: "Business location not found" });
      }

      // Tenant isolation: locations have no first-class owner column; a company
      // pin is owned when type === 'company' and entityId === the session company.
      // Anything else (another company's pin, or an opportunity/funding pin with
      // no company owner) is rejected so one premium tenant can't edit another's.
      const ownsLocation =
        existingLocation.type === "company" &&
        existingLocation.entityId === req.session?.company?.id;
      if (!ownsLocation) {
        return res.status(403).json({ error: "You do not have permission to modify this location" });
      }

      // Whitelist updatable fields: ownership/identity columns (id, type,
      // entityId, createdAt) can never be reassigned via this endpoint, so an
      // owner can't mutate a pin to point at or impersonate another tenant.
      const { id: _id, type: _type, entityId: _entityId, createdAt: _createdAt, ...updates } = req.body || {};
      const updatedLocation = await storage.updateBusinessLocation(id, updates);
      res.json(updatedLocation);
    } catch (error) {
      console.error(`Error updating business location ${req.params.id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a business location (Premium companies only)
  app.delete("/api/business-map/locations/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if company is premium
      const premiumError = await checkCompanyPremium(req, res);
      if (premiumError) return; // Response already sent in checkCompanyPremium

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      // Check if location exists
      const existingLocation = await storage.getBusinessLocation(id);
      if (!existingLocation) {
        return res.status(404).json({ error: "Business location not found" });
      }

      // Tenant isolation: locations have no first-class owner column; a company
      // pin is owned when type === 'company' and entityId === the session company.
      // Anything else is rejected so one premium tenant can't delete another's.
      const ownsLocation =
        existingLocation.type === "company" &&
        existingLocation.entityId === req.session?.company?.id;
      if (!ownsLocation) {
        return res.status(403).json({ error: "You do not have permission to delete this location" });
      }

      await storage.deleteBusinessLocation(id);
      res.json({ success: true, message: "Business location deleted successfully" });
    } catch (error) {
      console.error(`Error deleting business location ${req.params.id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}