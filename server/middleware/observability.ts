import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

// Stricter per-endpoint limiters for AI / cost-sensitive routes.
// Keyed by user id when available so multi-tenant abuse is isolated.
const userKeyGenerator = (req: Request) =>
  String((req as any).user?.id || (req as any).session?.company?.id || req.ip);

export const aiHeavyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  keyGenerator: userKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Try again in an hour.' },
});

export const aiMediumLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  keyGenerator: userKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again later.' },
});

// Observability: capture duration + optional token usage on AI endpoints
export function observe(label: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalJson = res.json.bind(res);
    let captured: any = null;
    res.json = (body: any) => {
      captured = body;
      return originalJson(body);
    };
    res.on('finish', () => {
      const duration = Date.now() - start;
      const userId = (req as any).user?.id || (req as any).session?.company?.id || 'anon';
      const tokens =
        captured?.usage?.total_tokens ||
        captured?._tokens ||
        (typeof captured === 'object' && captured?.tokensUsed) ||
        null;
      const log = {
        observability: label,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        userId,
        ...(tokens ? { tokens } : {}),
      };
      console.log(`[obs] ${JSON.stringify(log)}`);
    });
    next();
  };
}
