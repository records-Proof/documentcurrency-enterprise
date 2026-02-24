export function isCID(cid) {
  const cidv0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidv1 = /^bafy[a-z0-9]{20,}$/;
  return cidv0.test(cid) || cidv1.test(cid);
}

export function gateways() {
  const raw = process.env.IPFS_GATEWAYS || "https://ipfs.io/ipfs";
  return raw.split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);
}

export function ipfsUrl(gw, cid, path) {
  const p = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${gw}/${cid}${p}`;
}

export async function fetchJsonWithFailover(cid, path, { timeoutMs = 8000 } = {}) {
  const gws = gateways();
  let lastErr = null;

  for (const gw of gws) {
    const url = ipfsUrl(gw, cid, path);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP_${r.status}`);
      return { url, json: await r.json(), gateway: gw };
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr || new Error("GATEWAY_FAILOVER_FAILED");
}
