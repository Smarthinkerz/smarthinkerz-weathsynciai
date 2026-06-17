import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!supplied || !stored) {
      console.log("Missing password(s)");
      return false;
    }

    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("Invalid stored hash format");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    const result = hashedBuf.length === suppliedBuf.length && timingSafeEqual(hashedBuf, suppliedBuf);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export async function setupAuth(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (usernameOrEmail: string, password: string, done) => {
      try {
        // Clean up whitespace from username/email
        const cleanIdentifier = usernameOrEmail.trim();
        console.log("Login attempt for:", cleanIdentifier);
        
        // Check if the identifier is an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
        
        // Log the cleaned identifier to debug invisible characters
        console.log(`Login attempt for: [${cleanIdentifier}] (length: ${cleanIdentifier.length})`);
        
        // First try to find a company by email
        if (isEmail) {
          console.log("Identifier is an email, checking for company account");
          const company = await storage.getCompanyByEmail(cleanIdentifier);
          if (company) {
            console.log("Found company:", company.id);
            const isValidPassword = await comparePasswords(password, company.password);
            if (isValidPassword) {
              console.log("Company password valid, completing authentication");
              return done(null, company);
            }
            console.log("Invalid company password");
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // If no company found but it's an email, try to find a user with this email
          console.log("No company found, checking for user with this email");
          const userByEmail = await storage.getUserByEmail(cleanIdentifier);
          if (userByEmail) {
            console.log("Found user by email:", userByEmail.id);
            const isValidPassword = await comparePasswords(password, userByEmail.password);
            if (isValidPassword) {
              // Auto-grant edit permissions to authenticated users
              userByEmail.canEdit = true;
              console.log("Login successful for user by email");
              return done(null, userByEmail);
            }
            console.log("Invalid password for user email");
            return done(null, false, { message: "Invalid email or password" });
          }
        }

        // If not an email or no email-based accounts found, try regular username authentication
        console.log("No matching email accounts, trying username authentication");
        const user = await storage.getUserByUsername(cleanIdentifier);
        if (!user) {
          console.log("No user found with username:", cleanIdentifier);
          return done(null, false, { message: "Invalid username or password" });
        }

        // Auto-grant edit permissions to authenticated users
        user.canEdit = true;

        console.log("Found user:", { 
          id: user.id, 
          username: user.username,
          hasPassword: !!user.password
        });

        const isValidPassword = await comparePasswords(password, user.password);

        if (!isValidPassword) {
          console.log("Invalid password for user:", cleanIdentifier);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log("Login successful for user:", cleanIdentifier);
        return done(null, user);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error);
    }
  });
}