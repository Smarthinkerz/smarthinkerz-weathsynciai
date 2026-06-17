#!/usr/bin/env node
// Phase 11 — Route registry validator.
// Scans backend route definitions (both app.X(...) and Express routers mounted via
// app.use(prefix, router)) plus client API calls, then reports:
//   - Frontend calls to endpoints that the backend never registers (ghost calls)
//
// Usage: node scripts/validate-routes.mjs   (exits 1 if ghost calls are found)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const ROOT = process.cwd();
const SERVER_DIR = join(ROOT, 'server');
const CLIENT_DIR = join(ROOT, 'client', 'src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

const APP_RE = /app\.(?:get|post|put|patch|delete|use)\(\s*['"`]([^'"`]+)['"`]/g;
const ROUTER_DECL_RE = /(?:export\s+(?:const|default)\s+(\w+)|const\s+(\w+))\s*=\s*(?:express\.)?Router\(\)/g;
const ROUTER_METHOD_RE = /(\w+)\.(?:get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
const USE_RE = /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g;
const IMPORT_DEFAULT_RE = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
const IMPORT_NAMED_RE = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const CALL_RE = /['"`](\/api\/[a-zA-Z0-9/_-]+)/g;

function normalize(p) {
  return p.replace(/\/:[^/]+/g, '/:param').replace(/\/+$/, '') || '/';
}

// Step 1: collect direct app.METHOD routes
const serverRoutes = new Set();
const routerFiles = new Map(); // varName -> set of paths declared on that router (per file)
const fileRouters = new Map(); // filePath -> Map<varName, Set<paths>>

for (const f of walk(SERVER_DIR)) {
  const src = readFileSync(f, 'utf8');

  let m;
  APP_RE.lastIndex = 0;
  while ((m = APP_RE.exec(src)) !== null) {
    if (m[1].startsWith('/api')) serverRoutes.add(normalize(m[1]));
  }

  // routers declared in this file
  const localRouters = new Map(); // varName -> Set<paths>
  ROUTER_DECL_RE.lastIndex = 0;
  while ((m = ROUTER_DECL_RE.exec(src)) !== null) {
    const name = m[1] || m[2];
    if (!localRouters.has(name)) localRouters.set(name, new Set());
  }
  // For each router var, find router.METHOD calls
  ROUTER_METHOD_RE.lastIndex = 0;
  while ((m = ROUTER_METHOD_RE.exec(src)) !== null) {
    const [, varName, path] = m;
    if (!localRouters.has(varName)) continue;
    localRouters.get(varName).add(path);
  }
  // Also: many files declare `const router = Router(); ... export default router;`
  // capture default export name → set
  if (localRouters.size) fileRouters.set(f, localRouters);
}

// Step 2: walk app.use(prefix, importedRouter) and resolve each imported router to its file
for (const f of walk(SERVER_DIR)) {
  const src = readFileSync(f, 'utf8');
  const imports = new Map(); // localName -> resolved file path
  let m;
  const resolveImport = (importPath) => {
    if (!importPath.startsWith('.')) return null;
    const base = join(f, '..', importPath);
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']) {
      const candidate = base + ext;
      try { statSync(candidate); return candidate; } catch {}
    }
    return null;
  };
  IMPORT_DEFAULT_RE.lastIndex = 0;
  while ((m = IMPORT_DEFAULT_RE.exec(src)) !== null) {
    const r = resolveImport(m[2]);
    if (r) imports.set(m[1], r);
  }
  IMPORT_NAMED_RE.lastIndex = 0;
  while ((m = IMPORT_NAMED_RE.exec(src)) !== null) {
    const r = resolveImport(m[2]);
    if (!r) continue;
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/).pop();
      if (name) imports.set(name, r);
    }
  }
  USE_RE.lastIndex = 0;
  while ((m = USE_RE.exec(src)) !== null) {
    const [, prefix, importedName] = m;
    if (!prefix.startsWith('/api')) continue;
    const targetFile = imports.get(importedName);
    if (!targetFile) continue;
    const routers = fileRouters.get(targetFile);
    if (!routers) continue;
    // mount every path under prefix (assume single default-exported router per file)
    for (const paths of routers.values()) {
      for (const p of paths) {
        serverRoutes.add(normalize(prefix.replace(/\/$/, '') + (p.startsWith('/') ? p : '/' + p)));
      }
    }
  }
}

// Step 3: frontend calls
const clientCalls = new Map();
for (const f of walk(CLIENT_DIR)) {
  const src = readFileSync(f, 'utf8');
  let m;
  CALL_RE.lastIndex = 0;
  while ((m = CALL_RE.exec(src)) !== null) {
    const p = normalize(m[1]);
    if (!p.startsWith('/api/')) continue;
    if (!clientCalls.has(p)) clientCalls.set(p, []);
    clientCalls.get(p).push(f.replace(ROOT + '/', ''));
  }
}

function matchesRoute(call, routes) {
  if (routes.has(call)) return true;
  // try prefix-of-routes (frontend may call a longer path that maps to a :param)
  for (const r of routes) {
    const re = new RegExp('^' + r.replace(/\/:param/g, '/[^/]+') + '$');
    if (re.test(call)) return true;
    // also: frontend may call /api/x/123 where backend has /api/x/:id (already covered)
  }
  // permit frontend prefix calls that match a route prefix (e.g. /api/companies → /api/companies/:id)
  for (const r of routes) {
    if (r.startsWith(call + '/')) return true;
  }
  return false;
}

const ghosts = [];
for (const [call, files] of clientCalls) {
  if (!matchesRoute(call, serverRoutes)) ghosts.push({ call, files: [...new Set(files)] });
}

console.log(`Backend routes registered: ${serverRoutes.size}`);
console.log(`Frontend /api/* call sites: ${clientCalls.size}`);
console.log(`Ghost calls (frontend → unregistered): ${ghosts.length}`);

if (ghosts.length) {
  console.log('\nGhost calls:');
  for (const g of ghosts.slice(0, 60)) {
    console.log(`  ${g.call}`);
    for (const f of g.files.slice(0, 2)) console.log(`    used in: ${f}`);
  }
  if (ghosts.length > 60) console.log(`  ... and ${ghosts.length - 60} more`);
  process.exit(1);
}

console.log('\n✓ No ghost API calls detected.');
