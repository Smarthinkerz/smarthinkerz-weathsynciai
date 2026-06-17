import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { auditLogs, users, companies } from "@shared/schema";
import { desc, eq, sql, gte } from "drizzle-orm";
import { SubscriptionTier } from "@shared/schema";
import { logAudit } from "../services/audit-log";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = req.user as any;
  if (!u || !u.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = ((req.query.search as string) || "").toLowerCase();
      const all = await storage.getAllUsers();
      const filtered = search
        ? all.filter((u: any) =>
            (u.username || "").toLowerCase().includes(search) ||
            (u.email || "").toLowerCase().includes(search) ||
            (u.name || "").toLowerCase().includes(search)
          )
        : all;
      const sanitized = filtered.map(({ password, passwordResetToken, ...rest }: any) => rest);
      res.json({ users: sanitized, total: sanitized.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/users/:id/tier", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid user id" });
      const { tier, reason } = req.body || {};
      const valid = Object.values(SubscriptionTier);
      if (!valid.includes(tier)) return res.status(400).json({ error: "Invalid tier" });
      const existing = await storage.getUser(id);
      if (!existing) return res.status(404).json({ error: "User not found" });
      const updated = await storage.updateUser(id, { subscriptionTier: tier, isPremium: tier !== SubscriptionTier.FREE });
      try { await logAudit(req, "admin.action" as any, "user", String(id), { event: "tier_changed", from: (existing as any).subscriptionTier, tier, reason: (typeof reason === "string" && reason.trim()) ? reason.trim() : null }); } catch {}
      const { password, ...safe } = updated as any;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/users/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid user id" });
      const { suspended, reason } = req.body || {};
      if (typeof suspended !== "boolean") return res.status(400).json({ error: "'suspended' must be boolean" });
      const existing = await storage.getUser(id);
      if (!existing) return res.status(404).json({ error: "User not found" });
      const updated = await storage.updateUser(id, { isSuspended: !!suspended } as any);
      try { await logAudit(req, "admin.action" as any, "user", String(id), { event: suspended ? "suspended" : "unsuspended", reason: (typeof reason === "string" && reason.trim()) ? reason.trim() : null }); } catch {}
      const { password, ...safe } = updated as any;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 500);
      const action = req.query.action as string | undefined;
      let q = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
      const rows = action
        ? await db.select().from(auditLogs).where(eq(auditLogs.action, action)).orderBy(desc(auditLogs.createdAt)).limit(limit)
        : await q;
      res.json({ logs: rows, total: rows.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const tierCounts: Record<string, number> = {};
      let suspended = 0;
      for (const u of allUsers as any[]) {
        const t = u.subscriptionTier || SubscriptionTier.FREE;
        tierCounts[t] = (tierCounts[t] || 0) + 1;
        if (u.isSuspended) suspended++;
      }
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, since));
      const companyCount = await db.select({ count: sql<number>`count(*)::int` }).from(companies);
      res.json({
        users: {
          total: allUsers.length,
          suspended,
          byTier: tierCounts,
        },
        companies: { total: companyCount[0]?.count || 0 },
        activity24h: { auditEvents: recentLogs[0]?.count || 0 },
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
