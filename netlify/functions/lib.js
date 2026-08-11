const crypto = require("node:crypto");

const json = (status, body) => ({ statusCode: status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, body: JSON.stringify(body) });
const secret = () => process.env.SESSION_SECRET || "";
const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const sign = payload => { const data = Buffer.from(JSON.stringify(payload)).toString("base64url"); const sig = crypto.createHmac("sha256", secret()).update(data).digest("base64url"); return `${data}.${sig}`; };
const verify = token => { try { const [data, sig] = String(token || "").split("."); const expected = crypto.createHmac("sha256", secret()).update(data).digest("base64url"); if (!safeEqual(sig, expected)) return null; const payload = JSON.parse(Buffer.from(data, "base64url").toString()); return payload.exp > Date.now() ? payload : null; } catch { return null; } };
const auth = event => verify((event.headers.authorization || "").replace(/^Bearer\s+/i, ""));
const encryptionKey = () => crypto.createHash("sha256").update(process.env.DATA_ENCRYPTION_KEY || "").digest();
const encrypt = value => { const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv); const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]); return JSON.stringify({ v: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: encrypted.toString("base64") }); };
const decrypt = raw => { if (!raw) return []; const box = JSON.parse(raw), decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(box.iv, "base64")); decipher.setAuthTag(Buffer.from(box.tag, "base64")); return JSON.parse(Buffer.concat([decipher.update(Buffer.from(box.data, "base64")), decipher.final()]).toString("utf8")); };
const headers = () => ({ apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "content-type": "application/json" });
const base = () => `${String(process.env.SUPABASE_URL || "").replace(/\/$/, "")}/rest/v1/app_store`;
const getRaw = async id => { const res = await fetch(`${base()}?id=eq.${encodeURIComponent(id)}&select=payload`, { headers: headers() }); if (!res.ok) throw Error(`Database read failed: ${res.status}`); const rows = await res.json(); return rows[0]?.payload || null; };
const setRaw = async (id, payload) => { const res = await fetch(base(), { method: "POST", headers: { ...headers(), prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id, payload, updated_at: new Date().toISOString() }) }); if (!res.ok) throw Error(`Database write failed: ${res.status}`); };
const deleteRaw = async id => { const res = await fetch(`${base()}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: headers() }); if (!res.ok) throw Error(`Database delete failed: ${res.status}`); };
const readItems = async () => decrypt(await getRaw("records"));
const writeItems = async items => setRaw("records", encrypt(items));
const configured = () => Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD && secret().length >= 24 && (process.env.DATA_ENCRYPTION_KEY || "").length >= 24 && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = { json, safeEqual, sign, auth, getRaw, setRaw, deleteRaw, readItems, writeItems, configured };
