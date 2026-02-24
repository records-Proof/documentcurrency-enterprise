function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
export function normalizeSha(s) {
  if (!s) return "";
  let x = String(s).trim().replace(/^SHA256:/i, "").replace(/^0x/i, "");
  return x.toLowerCase();
}
export async function sha256Url(url, { timeoutMs = 12000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP_${r.status}`);
    const ab = await r.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", ab);
    return toHex(hash);
  } finally {
    clearTimeout(t);
  }
}
