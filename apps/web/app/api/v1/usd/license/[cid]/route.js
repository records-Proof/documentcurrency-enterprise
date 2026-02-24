import { isCID, fetchJsonWithFailover } from "../../../../../lib/core.js";
import { verifyTldLicense } from "../../../../../lib/core.js";
import { db, audit } from "../../../../../lib/enterprise.js";

export async function GET(req, { params }) {
  const cid = params.cid;

  if (!isCID(cid)) return Response.json({ ok: false, error: "INVALID_CID" }, { status: 400 });

  // Enterprise: API key auth (optional for public; required for enterprise endpoints)
  const ctx = await db.authFromRequest(req); // { orgId, userId, apiKeyId } or null
  const orgId = ctx?.orgId || null;

  try {
    const fetched = await fetchJsonWithFailover(cid, "tld.json");
    const tld = fetched.json;

    const verification = await verifyTldLicense({ cid, tld });

    // Persist verification when org context exists
    if (orgId) {
      await db.saveVerification({ orgId, cid, tld, verification });
      await audit.log({ orgId, userId: ctx?.userId, action: "VERIFY_LICENSE", target: cid, ip: db.ip(req), meta: { gateway: fetched.gateway } });
    }

    return Response.json({
      ok: true,
      route: "usd/license",
      cid,
      fetched_from: fetched.url,
      tld,
      verification,
    });
  } catch (e) {
    if (orgId) {
      await audit.log({ orgId, userId: ctx?.userId, action: "VERIFY_LICENSE_ERROR", target: cid, ip: db.ip(req), meta: { error: String(e?.message || e) } });
    }
    return Response.json({ ok: false, error: "FETCH_OR_VERIFY_FAILED", cid }, { status: 502 });
  }
}
