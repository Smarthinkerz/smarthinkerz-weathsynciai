import type { Express, Request, Response } from "express";

const PUBLIC_ROUTES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/auth", priority: "0.6", changefreq: "monthly" },
  { loc: "/portfolio", priority: "0.7", changefreq: "weekly" },
  { loc: "/community", priority: "0.7", changefreq: "daily" },
  { loc: "/learning", priority: "0.6", changefreq: "weekly" },
  { loc: "/marketplace", priority: "0.6", changefreq: "weekly" },
];

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /billing\nDisallow: /dashboard\nDisallow: /api/\n\nSitemap: ${baseUrl(_req)}/sitemap.xml\n`
    );
  });

  app.get("/sitemap.xml", (req: Request, res: Response) => {
    const base = baseUrl(req);
    const today = new Date().toISOString().split("T")[0];
    const urls = PUBLIC_ROUTES.map(
      (r) =>
        `<url><loc>${base}${r.loc}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    ).join("");
    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
    );
  });
}

function baseUrl(req: Request) {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}
