import crypto from "node:crypto";
import { db, audit } from "../../lib/enterprise";

function rand(len = 24) {
  return crypto.randomBytes(len).toString("base64url");
}
function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req) {
  const expected = process.env.BOOTSTRAP_SECRET || "";
  const got = req.headers.get("x-bootstrap-secret") || "";
  if (!expected || got !== expected) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const p = await db.getPrisma();
  if (!p) {
    return Response.json(
      { ok: false, error: "DB_OFF", message: "Database is disabled on this environment. Deploy to Linux to run bootstrap + migrations." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const orgName = (body.orgName || "DocumentCurrency Enterprise").toString();

  const org = await p.organization.create({ data: { name: orgName } });

  const suffix = rand(6);
  const prefix = `dc_pk_${suffix}`;
  const secret = rand(18);
  const full = `${prefix}.${secret}`;
  const hash = sha256(full);

  const key = await p.apiKey.create({
    data: { orgId: org.id, name: "Bootstrap Key", prefix, hash },
  });

  await audit.log({
    orgId: org.id,
    userId: null,
    action: "BOOTSTRAP_ORG",
    target: key.id,
    ip: db.ip(req),
    meta: { prefix },
  });

  return Response.json({
    ok: true,
    org: { id: org.id, name: org.name },
    api_key: { prefix, secret, full },
    note: "Save this key now. It cannot be shown again.",
  });
}
