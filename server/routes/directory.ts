import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertDirectory } from "@shared/schema";
import { z } from "zod";

// Extend Request interface to include session
declare module 'express-session' {
  interface SessionData {
    company?: {
      id: number;
      name: string;
      [key: string]: any;
    };
  }
}

// Schema for directory listing validation
const directorySchema = z.object({
  displayName: z.string().min(3, "Business name must be at least 3 characters"),
  tagline: z.string().max(100, "Tagline must be 100 characters or less"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  industry: z.string().min(1, "Please select an industry"),
  website: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  location: z.string().min(3, "Please enter your business location"),
  phone: z.string().optional(),
  publicEmail: z.string().email("Please enter a valid email").optional(),
  featuredHighlight: z.boolean().default(true),
  showContactInfo: z.boolean().default(true),
});

// Get directory listing for a company
export async function getDirectoryListing(req: Request, res: Response) {
  try {
    // Debug session information
    console.log("Directory listing - session info:", {
      hasSession: !!req.session,
      sessionID: req.session?.id,
      hasCompanyData: !!req.session?.company,
      companyId: req.session?.company?.id,
      companyName: req.session?.company?.name
    });

    // Check if company is authenticated
    if (!req.session?.company?.id) {
      console.log("Directory listing access denied - no company session");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const companyId = req.session.company.id;
    console.log("Getting directory listing for company:", companyId);
    
    // Query the database for the company's directory listing
    const directoryListing = await storage.getDirectoryListing(companyId);

    if (!directoryListing) {
      // Return 404 with empty object if no listing found
      return res.status(404).json({ message: "Directory listing not found" });
    }

    res.status(200).json(directoryListing);
  } catch (error) {
    console.error("Error fetching directory listing:", error);
    res.status(500).json({ message: "Failed to fetch directory listing" });
  }
}

// Create or update a company's directory listing
export async function saveDirectoryListing(req: Request, res: Response) {
  try {
    // Check if company is authenticated
    if (!req.session.company?.id) {
      console.log("Directory save access denied - no company session");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const companyId = req.session.company.id;
    console.log("Saving directory listing for company:", companyId);
    
    // Validate request body
    const validatedData = directorySchema.parse(req.body);
    
    // Check if the company has a premium subscription
    const isAllowedFeature = req.session.company.subscriptionTier === 'premium' || req.session.company.subscriptionTier === 'elite' || req.session.company.subscriptionTier === 'enterprise';
    
    if (!isAllowedFeature) {
      return res.status(403).json({ 
        message: "Premium subscription required to manage directory listings" 
      });
    }

    // Check if the company already has a directory listing
    const existingListing = await storage.getDirectoryListing(companyId);
    
    let directoryListing;
    
    if (existingListing) {
      // Update existing listing
      directoryListing = await storage.updateDirectoryListing(companyId, {
        ...validatedData,
        updatedAt: new Date()
      });
    } else {
      // Create new listing
      const insertData: InsertDirectory = {
        ...validatedData,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        clicks: 0
      };
      
      directoryListing = await storage.createDirectoryListing(insertData);
    }

    res.status(200).json(directoryListing);
  } catch (error) {
    console.error("Error saving directory listing:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Failed to save directory listing" });
  }
}

// Get all directory listings (public)
export async function getAllDirectoryListings(req: Request, res: Response) {
  try {
    // Get all listings first
    const allListings = await storage.getAllDirectoryListings();
    
    // Get query parameters for filtering
    const { industry, featured } = req.query;
    
    // Filter results based on query parameters
    let listings = allListings;
    
    if (industry) {
      listings = listings.filter(listing => listing.industry === industry);
    }
    
    if (featured === 'true') {
      listings = listings.filter(listing => listing.featuredHighlight);
    }
    
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching directory listings:", error);
    res.status(500).json({ message: "Failed to fetch directory listings" });
  }
}

// Record a view on a directory listing
export async function recordDirectoryView(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid directory ID" });
    }
    
    const directoryId = parseInt(id);
    
    await storage.incrementDirectoryViews(directoryId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error recording directory view:", error);
    res.status(500).json({ message: "Failed to record view" });
  }
}

// Record a click on a directory listing
export async function recordDirectoryClick(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid directory ID" });
    }
    
    const directoryId = parseInt(id);
    
    await storage.incrementDirectoryClicks(directoryId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error recording directory click:", error);
    res.status(500).json({ message: "Failed to record click" });
  }
}

// Delete a directory listing
export async function deleteDirectoryListing(req: Request, res: Response) {
  try {
    // Check if company is authenticated
    if (!req.session.company?.id) {
      console.log("Directory delete access denied - no company session");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const companyId = req.session.company.id;
    console.log("Deleting directory listing for company:", companyId);
    
    await storage.deleteDirectoryListing(companyId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting directory listing:", error);
    res.status(500).json({ message: "Failed to delete directory listing" });
  }
}