import { z } from "zod";
import { 
  WorkHistory, 
  ReferenceCheck, 
  Certificate,
  Project,
  VerificationStatus 
} from "@shared/schema";
import { storage } from "../storage";
import OpenAI from "openai";
import fetch from "node-fetch";
import crypto from 'crypto'; 

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ExperienceVerificationService {
  // LinkedIn profile verification
  async verifyLinkedInProfile(userId: number, linkedinUrl: string): Promise<boolean> {
    try {
      console.log(`Verifying LinkedIn profile for user ${userId}: ${linkedinUrl}`);
      
      // Extract LinkedIn username from URL
      const profileMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/]+)/);
      if (!profileMatch) {
        throw new Error("Invalid LinkedIn profile URL");
      }

      // Here you would integrate with LinkedIn's API
      // For now, we'll do basic verification
      const isValid = linkedinUrl.startsWith('https://www.linkedin.com/in/') && 
                     linkedinUrl.length > 28;

      if (isValid) {
        await storage.updateUser(userId, {
          linkedinProfile: linkedinUrl,
          linkedinVerified: true
        });
      }

      return isValid;
    } catch (error) {
      console.error("LinkedIn verification failed:", error);
      throw error;
    }
  }

  // Work history verification
  async verifyWorkHistory(workHistoryId: number): Promise<WorkHistory> {
    try {
      const workHistory = await storage.getWorkHistory(workHistoryId);
      if (!workHistory) {
        throw new Error("Work history not found");
      }

      // Mark as PENDING REVIEW — verification must rest on a real check, not an
      // automatic pass. A "verified" badge that isn't truly verified is a trust
      // and liability problem, so submissions await a genuine review step.
      const updatedWorkHistory = await storage.updateWorkHistory(workHistoryId, {
        verificationStatus: 'pending'
      });

      return updatedWorkHistory;
    } catch (error) {
      console.error("Work history verification failed:", error);
      throw error;
    }
  }

  // Reference check
  async verifyReference(referenceId: number): Promise<ReferenceCheck> {
    try {
      const reference = await storage.getReferenceCheck(referenceId);
      if (!reference) {
        throw new Error("Reference not found");
      }

      // Generate unique verification link
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Send verification email to referent
      // This would typically integrate with your email service
      console.log(`Sending verification email to ${reference.referentEmail}`);

      // Update reference status
      const updatedReference = await storage.updateReferenceCheck(referenceId, {
        verificationStatus: VerificationStatus.PENDING
      });

      return updatedReference;
    } catch (error) {
      console.error("Reference verification failed:", error);
      throw error;
    }
  }

  // Certificate verification
  async verifyCertificate(certificateId: number): Promise<Certificate> {
    try {
      const certificate = await storage.getCertificate(certificateId);
      if (!certificate) {
        throw new Error("Certificate not found");
      }

      // Mark as PENDING REVIEW — see verifyWorkHistory. No automatic "verified".
      const updatedCertificate = await storage.updateCertificate(certificateId, {
        verificationStatus: 'pending'
      });

      return updatedCertificate;
    } catch (error) {
      console.error("Certificate verification failed:", error);
      throw error;
    }
  }

  // Project verification
  async verifyProject(projectId: number): Promise<Project> {
    try {
      const project = await storage.getProject(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Mark as PENDING REVIEW — see verifyWorkHistory. No automatic "verified".
      const updatedProject = await storage.updateProject(projectId, {
        verificationStatus: 'pending'
      });

      return updatedProject;
    } catch (error) {
      console.error("Project verification failed:", error);
      throw error;
    }
  }

  // Update work experience with verification proof
  async updateWorkExperienceProof(workExperienceId: number, userId: number, filePath: string): Promise<WorkHistory> {
    try {
      const workHistory = await storage.getWorkHistory(workExperienceId);
      if (!workHistory) {
        throw new Error("Work history not found");
      }

      if (workHistory.userId !== userId) {
        throw new Error("Unauthorized access to work history");
      }

      // Update work experience with verification proof file
      const updatedWorkHistory = await storage.updateWorkHistory(workExperienceId, {
        verificationProof: filePath,
        verificationStatus: 'pending'
      });

      return updatedWorkHistory;
    } catch (error) {
      console.error("Work experience proof update failed:", error);
      throw error;
    }
  }
}

export const experienceVerification = new ExperienceVerificationService();