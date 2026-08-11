const crypto = require("node:crypto");
const { json, safeEqual, sign, getRaw, setRaw, deleteRaw, configured } = require("./lib");

exports.handler = async event => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });
  if (!configured()) return json(503, { error: "Falta configurar las variables privadas en Netlify" });
  let body; try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Solicitud inválida" }); }
  const ip = event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "unknown";
  const attemptKey = `attempt-${crypto.createHash("sha256").update(ip).digest("hex").slice(0, 24)}`;
  const attempts = JSON.parse((await getRaw(attemptKey)) || "{\"count\":0,\"until\":0}");
  if (attempts.until > Date.now()) return json(429, { error: "Demasiados intentos. Esperá un minuto." });
  const ok = safeEqual(body.username, process.env.ADMIN_USER) && safeEqual(body.password, process.env.ADMIN_PASSWORD);
  if (!ok) {
    const count = attempts.count + 1;
    await setRaw(attemptKey, JSON.stringify(count >= 5 ? { count: 0, until: Date.now() + 60000 } : { count, until: 0 }));
    return json(401, { error: count >= 5 ? "Acceso bloqueado durante un minuto." : `Usuario o contraseña incorrectos. Intento ${count} de 5.` });
  }
  await deleteRaw(attemptKey);
  return json(200, { token: sign({ sub: "admin", exp: Date.now() + 12 * 60 * 60 * 1000 }), expiresIn: 43200 });
};
