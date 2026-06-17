import { db } from '../db';
import { auditLogs, type InsertAuditLog } from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { Request } from 'express';

export type AuditAction =
  | 'plugin.install' | 'plugin.uninstall' | 'plugin.config_changed'
  | 'api_key.created' | 'api_key.deleted' | 'api_key.rotated'
  | 'subscription.upgraded' | 'subscription.downgraded' | 'subscription.activated' | 'subscription.cancelled'
  | 'payment.confirmed' | 'payment.failed'
  | 'auth.login' | 'auth.logout' | 'auth.password_changed' | 'auth.password_reset'
  | 'admin.action';

export async function logAudit(
  req: Request | null,
  action: AuditAction,
  resourceType: string,
  resourceId: string | number | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const user = (req as any)?.user;
    const company = (req as any)?.session?.company;
    const entry: InsertAuditLog = {
      userId: user?.id || null,
      companyId: company?.id || null,
      action,
      resourceType,
      resourceId: resourceId !== null && resourceId !== undefined ? String(resourceId) : null,
      metadata,
      ipAddress: req ? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || null : null,
      userAgent: req ? (req.headers['user-agent'] || null) : null,
    };
    await db.insert(auditLogs).values(entry);
  } catch (e: any) {
    console.error('[audit-log] failed to write:', e.message);
  }
}

export async function getAuditLogs(opts: { userId?: number; companyId?: number; limit?: number } = {}) {
  const limit = opts.limit ?? 100;
  if (opts.userId && opts.companyId) {
    return db.select().from(auditLogs)
      .where(sql`${auditLogs.userId} = ${opts.userId} OR ${auditLogs.companyId} = ${opts.companyId}`)
      .orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  if (opts.userId) {
    return db.select().from(auditLogs).where(eq(auditLogs.userId, opts.userId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  if (opts.companyId) {
    return db.select().from(auditLogs).where(eq(auditLogs.companyId, opts.companyId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
