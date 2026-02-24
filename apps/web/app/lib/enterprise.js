import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = globalThis.__prisma || new PrismaClient();
globalThis.__prisma = prisma;

// Simple in-memory rate limiter (upgrade to Redis in production)
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

// API key format: dc_pk_<prefix>.<secret>
function parseApiKey(hdr) {
  if (!hdr) return null;
  const v = hdr.replace(/^Bearer\s+/i, "").trim();
  const m = v.match(/^dc_pk_([a-zA-Z0-9_-]{6,})\.([a-zA-Z0-9_-]{12,})$/);
  if (!m) return null;
  return { prefix: `dc_pk_${m[1]}`, secret: m[2] };
}

async function authFromRequest(req) {
  const limit = Number(process.env.API_RATE_LIMIT_PER_MIN || "120");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit by IP always
  if (!rateLimit(`ip:${ip}`, limit)) return null;

  const hdr = req.headers.get("authorization");
  const parsed = parseApiKey(hdr);
  if (!parsed) return null;

  // Rate limit by key prefix too
  if (!rateLimit(`key:${parsed.prefix}`, limit)) return null;

  const rec = await prisma.apiKey.findFirst({
    where: { prefix: parsed.prefix, revokedAt: null },
    select: { id: true, orgId: true, hash: true },
  });
  if (!rec) return null;

  const candidate = sha256(`${parsed.prefix}.${parsed.secret}`);
  if (candidate !== rec.hash) return null;

  // For now: api-key auth only (no user). Later: add session auth -> userId.
  return { orgId: rec.orgId, userId: null, apiKeyId: rec.id };
}

function ip(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

async function saveVerification({ orgId, cid, tld, verification }) {
  await prisma.verification.create({
    data: {
      orgId,
      cid,
      status: verification.checks.expired ? "EXPIRED" : (verification.ok ? "VERIFIED" : "INVALID"),
      errorsJson: JSON.stringify(verification.errors || []),
      warningsJson: JSON.stringify(verification.warnings || []),
      tldJson: JSON.stringify(tld),
    },
  });
}

async function latestAuditHash(orgId) {
  const last = await prisma.auditLog.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });
  return last?.hash || null;
}

async function log({ orgId, userId, action, target, ip, meta }) {
  const prevHash = await latestAuditHash(orgId);
  const metaJson = meta ? JSON.stringify(meta) : null;
  const base = `${orgId}|${userId||""}|${action}|${target||""}|${ip||""}|${metaJson||""}|${prevHash||""}|${Date.now()}`;
  const hash = sha256(base);

  await prisma.auditLog.create({
    data: { orgId, userId, action, target, ip, metaJson, prevHash, hash },
  });
}

export const db = { prisma, authFromRequest, ip, saveVerification };
export const audit = { log };
