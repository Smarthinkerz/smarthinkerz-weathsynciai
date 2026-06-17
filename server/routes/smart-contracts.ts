import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { smartContractService } from "../services/smart-contracts";
import { aiContractGenerator } from "../services/ai-contract-generator";

const router = Router();

router.post("/generate-ai-contract", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { 
      title,
      contractType,
      counterpartyName,
      terms,
      amount,
      deadline
    } = req.body;
    
    // Validate required fields
    if (!title || !contractType || !counterpartyName || !terms) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Use the simpleContract method which accepts more basic parameters
    const contractText = await aiContractGenerator.generateSimpleContract(
      title,
      contractType,
      "Creator", // Will be replaced with authenticated user in a real scenario
      counterpartyName,
      terms,
      parseFloat(amount || "0"),
      deadline || undefined
    );
    
    return res.status(200).json({ 
      contractText,
      message: "Contract generated successfully" 
    });
  } catch (error: any) {
    console.error("Error generating AI contract:", error);
    return res.status(500).json({ 
      error: "Failed to generate AI contract", 
      message: error.message 
    });
  }
});

// Create a new smart contract
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user!.id;
    
    // Validate the request body
    const { name, description, counterparty_id, terms } = req.body;
    
    if (!name || !description || !counterparty_id || !terms?.agreement) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create the smart contract
    const contract = await smartContractService.createContract({
      name,
      description,
      creator_id: userId,
      counterparty_id: Number(counterparty_id),
      terms: {
        agreement: terms.agreement,
        conditions: terms.conditions || [],
        compensation: {
          amount: terms.compensation?.amount || 0,
          currency: terms.compensation?.currency || "USD",
          paymentSchedule: terms.compensation?.paymentSchedule || "milestone"
        }
      },
      validation_rules: {}, // Add empty validation rules
      execution_conditions: {
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });
    
    return res.status(201).json(contract);
  } catch (error: any) {
    console.error("Error creating smart contract:", error);
    return res.status(500).json({ 
      error: "Failed to create smart contract", 
      message: error.message 
    });
  }
});

// Get a specific smart contract by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user!.id;
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ error: "Invalid contract ID" });
    }
    
    const contract = await smartContractService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    // Check if the user is authorized to access this contract
    if (contract.creator_id !== userId && contract.counterparty_id !== userId) {
      return res.status(403).json({ error: "Unauthorized access to contract" });
    }
    
    return res.status(200).json(contract);
  } catch (error: any) {
    console.error("Error retrieving smart contract:", error);
    return res.status(500).json({ 
      error: "Failed to retrieve smart contract", 
      message: error.message 
    });
  }
});

// Get all smart contracts for the authenticated user
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user!.id;
    
    // Get all contracts where the user is either creator or counterparty
    const contracts = await smartContractService.getContractsByUser(userId);
    
    return res.status(200).json(contracts);
  } catch (error: any) {
    console.error("Error retrieving smart contracts:", error);
    return res.status(500).json({ 
      error: "Failed to retrieve smart contracts", 
      message: error.message 
    });
  }
});

// Activate a smart contract
router.post("/:id/activate", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user!.id;
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ error: "Invalid contract ID" });
    }
    
    const contract = await smartContractService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    // Only the creator can activate a contract
    if (contract.creator_id !== userId) {
      return res.status(403).json({ error: "Only the creator can activate this contract" });
    }
    
    // Activate the contract
    const activatedContract = await smartContractService.activateContract(contractId);
    
    return res.status(200).json(activatedContract);
  } catch (error: any) {
    console.error("Error activating smart contract:", error);
    return res.status(500).json({ 
      error: "Failed to activate smart contract", 
      message: error.message 
    });
  }
});

// Delete a smart contract
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user!.id;
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ error: "Invalid contract ID" });
    }
    
    const contract = await smartContractService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    // Only the creator can delete a contract
    if (contract.creator_id !== userId) {
      return res.status(403).json({ error: "Only the creator can delete this contract" });
    }
    
    // Delete the contract
    await smartContractService.deleteContract(contractId);
    
    return res.status(200).json({ message: "Contract deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting smart contract:", error);
    return res.status(500).json({ 
      error: "Failed to delete smart contract", 
      message: error.message 
    });
  }
});

export const smartContractRoutes = router;