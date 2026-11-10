export interface Env {
  DB: D1Database;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization"
    }
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization"
    }});

    if (url.pathname === "/api/health" && request.method === "GET") {
      try {
        await env.DB.prepare("SELECT 1").first();
        return json({ ok: true, service: "JM Tech Tools API", database: "connected" });
      } catch {
        return json({ ok: false, service: "JM Tech Tools API", database: "unavailable" }, 503);
      }
    }

    if (url.pathname === "/api/config" && request.method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT config_key, config_value FROM app_config ORDER BY config_key"
      ).all<{ config_key: string; config_value: string }>();
      return json({ ok: true, config: Object.fromEntries((rows.results ?? []).map(
        row => [row.config_key, row.config_value]
      ))});
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
};
