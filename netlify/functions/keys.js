const crypto = require("node:crypto");
const { json, auth, readItems, writeItems, configured } = require("./lib");

const clean = value => ({
  id: String(value.id || crypto.randomUUID()),
  service: String(value.service || "").slice(0, 120), user: String(value.user || "").slice(0, 180),
  password: String(value.password || "").slice(0, 500), category: String(value.category || "Trabajo").slice(0, 50),
  url: String(value.url || "").slice(0, 500), notes: String(value.notes || "").slice(0, 1000),
  updatedAt: new Date().toISOString()
});

exports.handler = async event => {
  if (!configured()) return json(503, { error: "Falta configurar Netlify" });
  if (!auth(event)) return json(401, { error: "Sesión vencida" });
  try {
    const items = await readItems();
    if (event.httpMethod === "GET") return json(200, { items });
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (Array.isArray(body.items)) { const replaced = body.items.slice(0, 2000).map(clean); await writeItems(replaced); return json(200, { items: replaced }); }
      const item = clean(body); const next = [item, ...items]; await writeItems(next); return json(201, { item });
    }
    if (event.httpMethod === "PUT") { const body = clean(JSON.parse(event.body || "{}")); const next = items.map(x => x.id === body.id ? body : x); await writeItems(next); return json(200, { item: body }); }
    if (event.httpMethod === "DELETE") { const id = event.queryStringParameters?.id || new URLSearchParams(event.rawQuery || "").get("id"); const next = items.filter(x => x.id !== id); await writeItems(next); return json(200, { ok: true }); }
    return json(405, { error: "Método no permitido" });
  } catch (error) { console.error(error); return json(500, { error: "No se pudo procesar la operación" }); }
};
