import crypto from "node:crypto";

const DB_OFF = (process.env.DB_OFF || "").toLowerCase() === "true";

let prisma = null;

async function getPrisma() {
  if (DB_OFF) return null;
  if (prisma) return prisma;

  // Lazy import so Termux can run UI-only without Prisma crashing build
  const mod = await import("@prisma/client");
  const PrismaClient = mod.PrismaClient;

  prisma = globalThis.__prisma || new PrismaClient();
  globalThis.__prisma = prisma;
  return prisma;
}

// Simple in-memory rate limiter (Redis later)
const bucket = new Map();
function nowMin() { return Math.floor(Date.now() / 60000); }
function rateLimit(key, limitPerMin) {
  const m = nowMin();
  const k = `${key}:${m}`;
  const n = (bucket.get(k) || 0) + 1;
  bucket.set(k, n);
  return n <= limitPerMin;
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function parseApiKey(hdr) {
  if (!hdr) return null;
  const v = hdr.replace(/^Bearer\s+/i, "").trim();
  const m = v.match(/^dc_pk_([a-zA-Z0-9_-]{6,})\.([a-zA-Z0-9_-]{12,})$/);
  if (!m) return null;
  return { prefix: `dc_pk_${m[1]}`, secret: m[2] };
}

async function authFromRequest(req) {
  if (DB_OFF) return null;

  const limit = Number(process.env.API_RATE_LIMIT_PER_MIN || "120");
  const ipAddr = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`ip:${ipAddr}`, limit)) return null;

  const hdr = req.headers.get("authorization");
  const parsed = parseApiKey(hdr);
  if (!parsed) return null;

  if (!rateLimit(`key:${parsed.prefix}`, limit)) return null;

  const p = await getPrisma();
  if (!p) return null;

  const rec = await p.apiKey.findFirst({
    where: { prefix: parsed.prefix, revokedAt: null },
    select: { id: true, orgId: true, hash: true },
  });
  if (!rec) return null;

  const candidate = sha256(`${parsed.prefix}.${parsed.secret}`);
  if (candidate !== rec.hash) return null;

  return { orgId: rec.orgId, userId: null, apiKeyId: rec.id };
}

function ip(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

async function saveVerification({ orgId, cid, tld, verification }) {
  if (DB_OFF) return;
  const p = await getPrisma();
  if (!p) return;

  await p.verification.create({
    data: {
      orgId,
      cid,
      status: verification.checks?.expired ? "EXPIRED" : (verification.ok ? "VERIFIED" : "INVALID"),
      errorsJson: JSON.stringify(verification.errors || []),
      warningsJson: JSON.stringify(verification.warnings || []),
      tldJson: JSON.stringify(tld),
    },
  });
}

async function latestAuditHash(orgId) {
  if (DB_OFF) return null;
  const p = await getPrisma();
  if (!p) return null;

  const last = await p.auditLog.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });
  return last?.hash || null;
}

async function log({ orgId, userId, action, target, ip: ipAddr, meta }) {
  if (DB_OFF) return;
  const p = await getPrisma();
  if (!p) return;

  const prevHash = await latestAuditHash(orgId);
  const metaJson = meta ? JSON.stringify(meta) : null;
  const base = `${orgId}|${userId||""}|${action}|${target||""}|${ipAddr||""}|${metaJson||""}|${prevHash||""}|${Date.now()}`;
  const hash = sha256(base);

  await p.auditLog.create({
    data: { orgId, userId, action, target, ip: ipAddr, metaJson, prevHash, hash },
  });
}

export const db = { getPrisma, authFromRequest, ip, saveVerification };
export const audit = { log };
