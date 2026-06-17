import { Request, Response } from 'express';
import { storage } from '../storage';
import { TIER_DISPLAY_NAMES, isHighTier } from '../../shared/schema';
import { logAudit } from '../services/audit-log';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    company?: {
      id: number;
      name: string;
      email?: string;
      primaryContactEmail: string;
      verificationStatus: string | null;
      subscriptionTier?: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      password: string;
      [key: string]: any;
    }
  }
}

const CHECKOUT_URL = 'https://smarthinkerz.replit.app/api/checkout';

const PLAN_SLUGS: Record<string, Record<string, string>> = {
  user: {
    professional: 'wealthsync-professional',
    elite: 'wealthsync-elite',
    enterprise: 'wealthsync-enterprise',
  },
  company: {
    professional: 'wealthsync-biz-professional',
    elite: 'wealthsync-biz-elite',
    enterprise: 'wealthsync-biz-enterprise',
  },
};

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { tier } = req.body;
    if (!tier || !PLAN_SLUGS.user[tier]) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const cycle = (req.body.cycle === 'yearly' || req.body.cycle === 'annual') ? 'yearly' : 'monthly';

    if (!req.user.phone || !/^\+\d{6,15}$/.test(req.user.phone)) {
      return res.status(400).json({ error: 'Phone number with country code (e.g. +96599887766) required for checkout. Please update your profile.' });
    }
    if (!req.user.email) {
      return res.status(400).json({ error: 'Email required for checkout. Please update your profile.' });
    }

    await storage.updateUser(req.user.id, {
      pendingSubscriptionTier: tier,
      pendingSubscriptionId: `tap_${Date.now()}_${cycle}`,
    });

    const formData = {
      plan: PLAN_SLUGS.user[tier],
      cycle,
      name: req.user.fullName || req.user.username,
      email: req.user.email,
      phone: req.user.phone,
    };

    console.log('Checkout session created:', { tier, cycle, userId: req.user.id, plan: formData.plan });
    res.json({ checkoutUrl: CHECKOUT_URL, formData });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function createCompanyCheckoutSession(req: Request, res: Response) {
  try {
    if (!req.session.company) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { tier } = req.body;
    if (!tier || !PLAN_SLUGS.company[tier]) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const company = req.session.company;
    const cycle = (req.body.cycle === 'yearly' || req.body.cycle === 'annual') ? 'yearly' : 'monthly';
    const companyEmail = company.primaryContactEmail || company.email || '';

    if (!company.phoneNumber || !/^\+\d{6,15}$/.test(company.phoneNumber)) {
      return res.status(400).json({ error: 'Company phone with country code (e.g. +96599887766) required for checkout. Please update company settings.' });
    }
    if (!companyEmail) {
      return res.status(400).json({ error: 'Company email required for checkout. Please update company settings.' });
    }

    await storage.updateCompany(company.id, {
      pendingSubscriptionTier: tier,
      pendingSubscriptionId: `tap_${Date.now()}_${cycle}`,
    });

    const formData = {
      plan: PLAN_SLUGS.company[tier],
      cycle,
      name: company.name,
      email: companyEmail,
      phone: company.phoneNumber,
    };

    console.log('Company checkout session created:', { tier, cycle, companyId: company.id, plan: formData.plan });
    res.json({ checkoutUrl: CHECKOUT_URL, formData });
  } catch (error) {
    console.error('Failed to create company checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

const CONFIRM_WINDOW_MS = 60 * 60 * 1000;

function extractPendingTimestamp(pendingId: string): number {
  const parts = pendingId.split('_');
  if (parts.length >= 2) {
    const ts = parseInt(parts[1], 10);
    if (!isNaN(ts)) return ts;
  }
  return 0;
}

async function verifyTapCharge(tapId: string): Promise<{ ok: boolean; status?: string; reason?: string; charge?: any }> {
  const tapKey = process.env.TAP_PAY_API_KEY;
  if (!tapKey) return { ok: false, reason: 'Payment verification not configured' };
  try {
    const response = await fetch(`https://api.tap.company/v2/charges/${encodeURIComponent(tapId)}`, {
      headers: { Authorization: `Bearer ${tapKey}` },
    });
    if (!response.ok) {
      return { ok: false, reason: `Tap charge lookup failed (${response.status})` };
    }
    const charge = await response.json() as any;
    if (charge?.status !== 'CAPTURED') {
      return { ok: false, status: charge?.status, reason: `Charge not captured (status=${charge?.status})`, charge };
    }
    return { ok: true, status: 'CAPTURED', charge };
  } catch (e: any) {
    return { ok: false, reason: `Tap verify error: ${e?.message || 'unknown'}` };
  }
}

async function isTapChargeConsumed(tapId: string): Promise<boolean> {
  try {
    const anyStorage: any = storage;
    if (typeof anyStorage.getInvoiceByExternalId === 'function') {
      const inv = await anyStorage.getInvoiceByExternalId(tapId);
      return !!inv;
    }
    const { invoices } = await import('../../shared/schema');
    const { db } = await import('../db');
    const { eq } = await import('drizzle-orm');
    const rows = await (db as any).select().from(invoices).where(eq((invoices as any).externalId, tapId)).limit(1);
    return rows && rows.length > 0;
  } catch (e) {
    console.error('isTapChargeConsumed lookup error:', e);
    return false;
  }
}

async function recordConsumedTapCharge(params: {
  userId?: number; companyId?: number; tapId: string; tier: string; cycle: string; amountCents: number; currency: string;
}): Promise<void> {
  const anyStorage: any = storage;
  const payload = {
    userId: params.userId ?? null,
    companyId: params.companyId ?? null,
    externalId: params.tapId,
    tier: params.tier,
    cycle: params.cycle,
    amountCents: params.amountCents,
    currency: params.currency,
    status: 'paid',
    paidAt: new Date(),
  };
  if (typeof anyStorage.createInvoice === 'function') {
    await anyStorage.createInvoice(payload);
    return;
  }
  const { invoices } = await import('../../shared/schema');
  const { db } = await import('../db');
  await (db as any).insert(invoices).values(payload);
}

export function chargeMatchesPendingPlan(charge: any, actorType: 'user' | 'company', tier: string, cycle: string): boolean {
  const expectedSlug = PLAN_SLUGS[actorType]?.[tier];
  if (!expectedSlug) return false;
  const planFields = [
    charge?.metadata?.plan,
    charge?.metadata?.plan_slug,
    charge?.description,
    charge?.statement_descriptor,
  ].filter(Boolean).map((s: any) => String(s).toLowerCase());
  const slugMatch = planFields.some(s => s.includes(expectedSlug.toLowerCase()));
  if (!slugMatch) return false;
  const rawCycle = (charge?.metadata?.cycle || charge?.metadata?.billing_cycle || '').toString().toLowerCase();
  const slugIndicatesYearly = planFields.some(s => s.includes('yearly') || s.includes('annual'));
  const normalizedChargeCycle = rawCycle
    ? (rawCycle === 'annual' ? 'yearly' : rawCycle)
    : (slugIndicatesYearly ? 'yearly' : 'monthly');
  if (normalizedChargeCycle !== cycle) return false;
  const amount = Number(charge?.amount || 0);
  if (!(amount > 0)) return false;
  return true;
}

function chargeMatchesIdentity(charge: any, opts: { email?: string | null; userId?: number | null; companyId?: number | null }): boolean {
  const chargeEmail = (charge?.receipt?.email || charge?.customer?.email || '').toString().toLowerCase();
  const expectedEmail = (opts.email || '').toString().toLowerCase();
  if (expectedEmail && chargeEmail && chargeEmail === expectedEmail) return true;
  const meta = charge?.metadata || {};
  if (opts.userId && (Number(meta.user_id) === opts.userId || Number(meta.userId) === opts.userId)) return true;
  if (opts.companyId && (Number(meta.company_id) === opts.companyId || Number(meta.companyId) === opts.companyId)) return true;
  return false;
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user || !user.pendingSubscriptionTier) {
      return res.status(400).json({ error: 'No pending subscription found' });
    }

    const tapId = (req.body?.tap_id || req.body?.tapId || req.query?.tap_id || '').toString().trim();
    if (!tapId) {
      return res.status(400).json({ error: 'Missing tap_id. Payment must be verified with Tap before activation.' });
    }

    if (await isTapChargeConsumed(tapId)) {
      console.warn('Payment replay rejected:', { userId: req.user.id, tapId });
      return res.status(409).json({ error: 'This payment has already been applied.' });
    }

    const verification = await verifyTapCharge(tapId);
    if (!verification.ok) {
      console.warn('Payment verification rejected:', { userId: req.user.id, tapId, reason: verification.reason });
      return res.status(402).json({ error: verification.reason || 'Payment not verified', status: verification.status });
    }

    if (!chargeMatchesIdentity(verification.charge, { email: user.email, userId: user.id })) {
      console.warn('Payment identity mismatch:', { userId: req.user.id, tapId });
      return res.status(403).json({ error: 'Payment does not belong to this account.' });
    }

    const pendingId = user.pendingSubscriptionId || '';
    const expectedCycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
    if (!chargeMatchesPendingPlan(verification.charge, 'user', user.pendingSubscriptionTier, expectedCycle)) {
      console.warn('Payment plan mismatch:', { userId: req.user.id, tapId, tier: user.pendingSubscriptionTier, cycle: expectedCycle });
      return res.status(403).json({ error: 'Payment does not match the pending subscription plan.' });
    }
    const checkoutTime = extractPendingTimestamp(pendingId);
    if (Date.now() - checkoutTime > CONFIRM_WINDOW_MS) {
      await storage.updateUser(req.user.id, {
        pendingSubscriptionTier: null,
        pendingSubscriptionId: null,
      });
      console.log('Payment confirmation expired:', { userId: req.user.id, pendingId });
      return res.status(400).json({ error: 'Payment session expired. Please start a new checkout.' });
    }

    const cycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
    const durationDays = cycle === 'yearly' ? 365 : 30;
    const newTier = user.pendingSubscriptionTier;

    console.log('Payment confirmed:', { userId: req.user.id, tier: newTier, cycle, tapId });

    try {
      await recordConsumedTapCharge({
        userId: req.user.id,
        tapId,
        tier: newTier,
        cycle,
        amountCents: Number(verification.charge?.amount ? Math.round(Number(verification.charge.amount) * 100) : 0),
        currency: (verification.charge?.currency || 'USD').toString(),
      });
    } catch (e) {
      console.warn('Refusing to activate: tap_id consumption failed (likely replay):', { userId: req.user.id, tapId });
      return res.status(409).json({ error: 'This payment has already been applied.' });
    }

    await storage.updateUser(req.user.id, {
      subscriptionTier: newTier,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      isPremium: isHighTier(newTier),
      pendingSubscriptionTier: null,
      pendingSubscriptionId: null,
    });

    const displayName = TIER_DISPLAY_NAMES[newTier] || newTier;
    storage.createNotification({
      userId: req.user.id,
      type: 'system',
      title: `Upgraded to ${displayName}!`,
      message: isHighTier(newTier)
        ? 'You now have full access to AI agents, deep research, lead generation, predictive modeling, and smart contracts.'
        : 'You now have access to multi-agent insights, interactive opportunity maps, and personalized tracking.',
      link: '/dashboard',
    }).catch(e => console.error('Payment confirmation notification error:', e));

    logAudit(req, 'subscription.activated', 'user_subscription', req.user!.id, { tier: newTier, cycle, durationDays, tapId }).catch(() => {});

    return res.json({ success: true, tier: newTier });
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function confirmCompanyPayment(req: Request, res: Response) {
  try {
    if (!req.session.company) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const company = await storage.getCompany(req.session.company.id);
    if (!company || !company.pendingSubscriptionTier) {
      return res.status(400).json({ error: 'No pending subscription found' });
    }

    const tapId = (req.body?.tap_id || req.body?.tapId || req.query?.tap_id || '').toString().trim();
    if (!tapId) {
      return res.status(400).json({ error: 'Missing tap_id. Payment must be verified with Tap before activation.' });
    }

    if (await isTapChargeConsumed(tapId)) {
      console.warn('Company payment replay rejected:', { companyId: company.id, tapId });
      return res.status(409).json({ error: 'This payment has already been applied.' });
    }

    const verification = await verifyTapCharge(tapId);
    if (!verification.ok) {
      console.warn('Company payment verification rejected:', { companyId: company.id, tapId, reason: verification.reason });
      return res.status(402).json({ error: verification.reason || 'Payment not verified', status: verification.status });
    }

    if (!chargeMatchesIdentity(verification.charge, { email: company.primaryContactEmail || (company as any).email, companyId: company.id })) {
      console.warn('Company payment identity mismatch:', { companyId: company.id, tapId });
      return res.status(403).json({ error: 'Payment does not belong to this company.' });
    }

    const pendingId = company.pendingSubscriptionId || '';
    const expectedCycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
    if (!chargeMatchesPendingPlan(verification.charge, 'company', company.pendingSubscriptionTier, expectedCycle)) {
      console.warn('Company payment plan mismatch:', { companyId: company.id, tapId, tier: company.pendingSubscriptionTier, cycle: expectedCycle });
      return res.status(403).json({ error: 'Payment does not match the pending subscription plan.' });
    }
    const checkoutTime = extractPendingTimestamp(pendingId);
    if (Date.now() - checkoutTime > CONFIRM_WINDOW_MS) {
      await storage.updateCompany(company.id, {
        pendingSubscriptionTier: null,
        pendingSubscriptionId: null,
      });
      console.log('Company payment confirmation expired:', { companyId: company.id, pendingId });
      return res.status(400).json({ error: 'Payment session expired. Please start a new checkout.' });
    }

    const cycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
    const durationDays = cycle === 'yearly' ? 365 : 30;
    const newTier = company.pendingSubscriptionTier;

    console.log('Company payment confirmed:', { companyId: company.id, tier: newTier, cycle });

    try {
      await recordConsumedTapCharge({
        companyId: company.id,
        tapId,
        tier: newTier,
        cycle,
        amountCents: Number(verification.charge?.amount ? Math.round(Number(verification.charge.amount) * 100) : 0),
        currency: (verification.charge?.currency || 'USD').toString(),
      });
    } catch (e) {
      console.warn('Refusing to activate: company tap_id consumption failed:', { companyId: company.id, tapId });
      return res.status(409).json({ error: 'This payment has already been applied.' });
    }

    await storage.updateCompany(company.id, {
      subscriptionTier: newTier,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      pendingSubscriptionTier: null,
      pendingSubscriptionId: null,
    });

    if (req.session.company) {
      req.session.company.subscriptionTier = newTier;
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
    }

    return res.json({ success: true, tier: newTier });
  } catch (error) {
    console.error('Failed to confirm company payment:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function verifySubscription(req: Request, res: Response) {
  try {
    const tapId = req.query.tap_id as string;
    if (!tapId) {
      return res.status(400).json({ error: 'No payment ID provided' });
    }

    const tapKey = process.env.TAP_PAY_API_KEY;
    if (!tapKey) {
      return res.status(503).json({ error: 'Payment verification not configured' });
    }

    const response = await fetch(`https://api.tap.company/v2/charges/${tapId}`, {
      headers: { Authorization: `Bearer ${tapKey}` },
    });

    const charge = await response.json() as any;
    console.log('Tap Pay charge status:', { id: tapId, status: charge.status });

    if (charge.status === 'CAPTURED') {
      if (await isTapChargeConsumed(tapId)) {
        return res.status(409).json({ error: 'This payment has already been applied.' });
      }
      const chargeEmail = charge.receipt?.email || charge.customer?.email || '';
      const user = chargeEmail ? await storage.getUserByEmail(chargeEmail) : null;

      if (!user || !user.pendingSubscriptionTier) {
        return res.status(404).json({ error: 'No pending subscription found for this payment' });
      }

      if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user as any).id !== user.id) {
        return res.status(403).json({ error: 'Payment does not belong to this account.' });
      }

      const newTier = user.pendingSubscriptionTier;
      const pendingId = user.pendingSubscriptionId || '';
      const cycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
      const durationDays = cycle === 'yearly' ? 365 : 30;

      if (!chargeMatchesPendingPlan(charge, 'user', newTier, cycle)) {
        return res.status(403).json({ error: 'Payment does not match the pending subscription plan.' });
      }

      try {
        await recordConsumedTapCharge({
          userId: user.id, tapId, tier: newTier, cycle,
          amountCents: Number(charge.amount ? Math.round(Number(charge.amount) * 100) : 0),
          currency: (charge.currency || 'USD').toString(),
        });
      } catch (e) {
        return res.status(409).json({ error: 'This payment has already been applied.' });
      }

      await storage.updateUser(user.id, {
        subscriptionTier: newTier,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        isPremium: isHighTier(newTier),
        pendingSubscriptionTier: null,
        pendingSubscriptionId: null,
      });

      const displayName = TIER_DISPLAY_NAMES[newTier] || newTier;
      storage.createNotification({
        userId: user.id,
        type: 'system',
        title: `Upgraded to ${displayName}!`,
        message: isHighTier(newTier)
          ? 'You now have full access to AI agents, deep research, lead generation, predictive modeling, and smart contracts.'
          : 'You now have access to multi-agent insights, interactive opportunity maps, and personalized tracking.',
        link: '/dashboard',
      }).catch(e => console.error('Subscription notification error:', e));

      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Payment not completed', status: charge.status });
  } catch (error) {
    console.error('Failed to verify subscription:', error);
    res.status(500).json({
      error: 'Failed to verify subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function verifyCompanySubscription(req: Request, res: Response) {
  try {
    const tapId = req.query.tap_id as string;
    if (!tapId) {
      return res.status(400).json({ error: 'No payment ID provided' });
    }

    const tapKey = process.env.TAP_PAY_API_KEY;
    if (!tapKey) {
      return res.status(503).json({ error: 'Payment verification not configured' });
    }

    const response = await fetch(`https://api.tap.company/v2/charges/${tapId}`, {
      headers: { Authorization: `Bearer ${tapKey}` },
    });

    const charge = await response.json() as any;

    if (charge.status === 'CAPTURED') {
      if (await isTapChargeConsumed(tapId)) {
        return res.status(409).json({ error: 'This payment has already been applied.' });
      }
      const chargeEmail = charge.receipt?.email || charge.customer?.email || '';
      const company = chargeEmail ? await storage.getCompanyByEmail(chargeEmail) : null;

      if (!company || !company.pendingSubscriptionTier) {
        return res.status(404).json({ error: 'No pending subscription found for this payment' });
      }

      if (req.session.company && req.session.company.id !== company.id) {
        return res.status(403).json({ error: 'Payment does not belong to this company.' });
      }

      const pendingId = company.pendingSubscriptionId || '';
      const cycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
      const durationDays = cycle === 'yearly' ? 365 : 30;

      if (!chargeMatchesPendingPlan(charge, 'company', company.pendingSubscriptionTier, cycle)) {
        return res.status(403).json({ error: 'Payment does not match the pending subscription plan.' });
      }

      try {
        await recordConsumedTapCharge({
          companyId: company.id, tapId, tier: company.pendingSubscriptionTier, cycle,
          amountCents: Number(charge.amount ? Math.round(Number(charge.amount) * 100) : 0),
          currency: (charge.currency || 'USD').toString(),
        });
      } catch (e) {
        return res.status(409).json({ error: 'This payment has already been applied.' });
      }

      await storage.updateCompany(company.id, {
        subscriptionTier: company.pendingSubscriptionTier,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        pendingSubscriptionTier: null,
        pendingSubscriptionId: null,
      });

      if (req.session.company && req.session.company.id === company.id) {
        req.session.company.subscriptionTier = company.pendingSubscriptionTier;
        await new Promise<void>((resolve) => req.session.save(() => resolve()));
      }

      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Payment not completed', status: charge.status });
  } catch (error) {
    console.error('Failed to verify company subscription:', error);
    res.status(500).json({
      error: 'Failed to verify subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
