// Nadi feedback API. POST only; stored in a private Cloudflare D1 database.
// No public read endpoint or visitor analytics.
const ALLOWED_ORIGINS = new Set(["https://nadi.asalbikin.id", "https://nadilabs.github.io"]);
const MAX_BODY = 4096;

function response(data, status, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const path = new URL(request.url).pathname;
    if (path !== "/api/feedback") return response({ error: "not_found" }, 404, origin);
    if (request.method === "OPTIONS") {
      return response({}, ALLOWED_ORIGINS.has(origin) ? 200 : 403, origin);
    }
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405, origin);
    if (!ALLOWED_ORIGINS.has(origin)) return response({ error: "forbidden" }, 403, origin);
    if ((request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")
      return response({ error: "invalid_content_type" }, 415, origin);
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY)
      return response({ error: "too_large" }, 413, origin);
    let input;
    try {
      const body = await request.text();
      if (body.length > MAX_BODY) return response({ error: "too_large" }, 413, origin);
      input = JSON.parse(body);
    } catch {
      return response({ error: "invalid_json" }, 400, origin);
    }
    if (!input || typeof input !== "object")
      return response({ error: "invalid_input" }, 400, origin);
    // Hidden honeypot field; routine spambots receive no stored record.
    if (input.website) return response({ ok: true }, 200, origin);
    if (typeof input.msg !== "string" ||
        (input.contact !== undefined && typeof input.contact !== "string"))
      return response({ error: "invalid_input" }, 400, origin);
    const msg = input.msg.replace(/\r\n?/g, "\n").trim();
    const contact = (input.contact || "").trim();
    if (msg.length < 5 || msg.length > 1500 || contact.length > 120 ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(msg + contact))
      return response({ error: "invalid_input" }, 400, origin);
    try {
      // Safety cap on stored submissions, not analytics or personal tracking.
      const today = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM feedback WHERE created_at >= datetime('now','start of day')"
      ).first();
      if (Number(today?.count || 0) >= 250)
        return response({ error: "temporarily_unavailable" }, 429, origin);
      await env.DB.prepare(
        "INSERT INTO feedback (message, contact) VALUES (?, ?)"
      ).bind(msg, contact || null).run();
      return response({ ok: true }, 201, origin);
    } catch {
      return response({ error: "temporarily_unavailable" }, 503, origin);
    }
  }
};
