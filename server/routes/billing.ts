import type { Express, Request, Response } from "express";
import { db } from "../db";
import { invoices, users, SubscriptionTier, TIER_DISPLAY_NAMES } from "@shared/schema";
import { desc, eq, and, or } from "drizzle-orm";
import { storage } from "../storage";
import { logAudit } from "../services/audit-log";

async function sendDunningEmail(userEmail: string, userName: string, tier: string, reason: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("[billing] SendGrid not configured, skipping dunning email");
    return;
  }
  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to: userEmail,
      from: process.env.FROM_EMAIL || "billing@wealthsync.ai",
      subject: "Payment Failed — Action Required",
      text: `Hi ${userName},\n\nYour payment for the ${TIER_DISPLAY_NAMES[tier] || tier} plan could not be processed.\nReason: ${reason}\n\nPlease update your payment method at https://wealthsync.ai/billing to keep your subscription active.\n\n— WealthSync Billing`,
      html: `<p>Hi ${userName},</p><p>Your payment for the <strong>${TIER_DISPLAY_NAMES[tier] || tier}</strong> plan could not be processed.</p><p><strong>Reason:</strong> ${reason}</p><p>Please <a href="https://wealthsync.ai/billing">update your payment method</a> to keep your subscription active.</p><p>— WealthSync Billing</p>`,
    });
  } catch (e: any) {
    console.error("[billing] dunning email failed:", e.message);
  }
}

export function registerBillingRoutes(app: Express) {
  // Webhook for upstream payment hub (Smarthinkerz / Tap / Stripe-compatible event shape)
  app.post("/api/billing/webhook", async (req: Request, res: Response) => {
    try {
      // Authenticity check: shared-secret header must match BILLING_WEBHOOK_SECRET
      const expected = process.env.BILLING_WEBHOOK_SECRET;
      const provided = (req.headers["x-webhook-secret"] as string) || (req.headers["x-billing-signature"] as string);
      if (!expected) {
        console.error("[billing webhook] BILLING_WEBHOOK_SECRET not configured; rejecting webhook");
        return res.status(503).json({ error: "Webhook handler not configured" });
      }
      if (!provided || provided !== expected) {
        console.warn("[billing webhook] rejected: invalid or missing signature");
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
      const event = req.body || {};
      const type: string = event.type || event.event;
      const data = event.data || event;
      const userId = data.userId ? Number(data.userId) : null;
      const companyId = data.companyId ? Number(data.companyId) : null;
      const tier = data.tier || data.plan || SubscriptionTier.FREE;
      const cycle = data.cycle || "monthly";

      switch (type) {
        case "subscription.activated":
        case "payment.confirmed": {
          if (userId) {
            await storage.updateUser(userId, {
              subscriptionTier: tier,
              isPremium: tier !== SubscriptionTier.FREE,
              pendingSubscriptionTier: null,
              pendingSubscriptionId: null,
            } as any);
          }
          await db.insert(invoices).values({
            userId, companyId,
            externalId: data.invoiceId || data.id || null,
            tier, cycle,
            amountCents: Number(data.amountCents || data.amount || 0),
            currency: data.currency || "USD",
            status: "paid",
            invoiceUrl: data.invoiceUrl || null,
            paidAt: new Date(),
          });
          break;
        }
        case "payment.failed": {
          await db.insert(invoices).values({
            userId, companyId,
            externalId: data.invoiceId || data.id || null,
            tier, cycle,
            amountCents: Number(data.amountCents || data.amount || 0),
            currency: data.currency || "USD",
            status: "failed",
            failedReason: data.reason || "Payment declined",
          });
          if (userId) {
            const u = await storage.getUser(userId);
            if (u?.email) {
              await sendDunningEmail(u.email, u.fullName || u.username, tier, data.reason || "Payment declined");
            }
          }
          break;
        }
        case "subscription.cancelled": {
          if (userId) {
            await storage.updateUser(userId, {
              subscriptionTier: SubscriptionTier.FREE,
              isPremium: false,
            } as any);
          }
          break;
        }
        default:
          console.log("[billing webhook] unhandled event type:", type);
      }
      res.json({ received: true });
    } catch (e: any) {
      console.error("[billing webhook] error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // List invoices for current user
  app.get("/api/billing/invoices", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    try {
      const userId = (req.user as any).id;
      const rows = await db.select().from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt))
        .limit(100);
      res.json({ invoices: rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Current subscription summary
  app.get("/api/billing/subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const u = req.user as any;
    res.json({
      tier: u.subscriptionTier || SubscriptionTier.FREE,
      tierLabel: TIER_DISPLAY_NAMES[u.subscriptionTier || SubscriptionTier.FREE],
      isPremium: !!u.isPremium,
      pendingTier: u.pendingSubscriptionTier || null,
      renewalDate: u.subscriptionEndDate || null,
    });
  });

  // Cancel current subscription (downgrade to Free)
  app.post("/api/billing/cancel", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    try {
      const id = (req.user as any).id;
      const updated = await storage.updateUser(id, {
        subscriptionTier: SubscriptionTier.FREE,
        isPremium: false,
      } as any);
      try { await logAudit(req, "subscription.cancelled" as any, "user", String(id), {}); } catch {}
      const { password, ...safe } = updated as any;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
