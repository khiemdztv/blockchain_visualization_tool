export const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const API = isLocal ? "http://localhost:3001" : window.location.origin;

export async function sha256browser(msg) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function apiHash(input) {
  try {
    const r = await fetch(`${API}/api/hash`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
    const d = await r.json();
    return d?.hash || null;
  } catch { return null; }
}