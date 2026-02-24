import { ipfsUrl, gateways } from "./cid.js";
import { sha256Url, normalizeSha } from "./crypto.js";

function parseDate(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function verifyTldLicense({ cid, tld }) {
  const out = {
    ok: true,
    checks: {
      format_ok: false,
      subtype_ok: false,
      denom_ok: true,
      expired: false,
      payload_hash_match: null,
    },
    errors: [],
    warnings: [],
  };

  out.checks.format_ok = tld?.format === "TOP_LEVEL_DOCUMENT.V1";
  out.checks.subtype_ok = (tld?.subtype === "TLD.LICENSE") || (tld?.type === "LICENSE");

  if (!out.checks.format_ok) out.errors.push("FORMAT_MISMATCH");
  if (!out.checks.subtype_ok) out.errors.push("SUBTYPE_MISMATCH");

  if (tld?.denomination?.unit && tld.denomination.unit !== "DOC.USD") {
    out.checks.denom_ok = false;
    out.errors.push("DENOMINATION_MISMATCH");
  }

  const expires = tld?.license?.expires_on || tld?.expires_on;
  if (expires) {
    const d = parseDate(expires);
    if (!d) out.warnings.push("EXPIRES_INVALID_DATE");
    else if (d.getTime() < Date.now()) out.checks.expired = true;
  }

  const payloads = Array.isArray(tld?.payloads) ? tld.payloads : [];
  const pdf = payloads.find(p => p?.name === "license.pdf" || p?.type === "application/pdf") || null;
  const declared = normalizeSha(pdf?.sha256 || tld?.license?.payload_sha256 || "");

  if (!declared) out.warnings.push("NO_DECLARED_PAYLOAD_HASH");
  else {
    // Use first gateway for payload by default; failover can be added similarly
    const gw = gateways()[0];
    const url = ipfsUrl(gw, cid, "license.pdf");
    try {
      const actual = normalizeSha(await sha256Url(url));
      out.checks.payload_hash_match = (actual === declared);
      if (!out.checks.payload_hash_match) out.errors.push("PAYLOAD_HASH_MISMATCH");
    } catch {
      out.checks.payload_hash_match = false;
      out.errors.push("PAYLOAD_FETCH_FAILED");
    }
  }

  out.ok = out.errors.length === 0 && !out.checks.expired;
  return out;
}
