const ALLOWED_ORIGINS = new Set([
  "https://savebot.site",
  "https://www.savebot.site",
  "https://savebot-v1.web.app",
  "https://savebot-v1.firebaseapp.com",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://savebot.site";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/generateContent") {
      return Response.json({ error: "Rota não encontrada." }, { status: 404, headers: cors });
    }
    if (request.method !== "POST") {
      return Response.json({ error: "Método não permitido." }, { status: 405, headers: cors });
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return Response.json({ error: "Origem não autorizada." }, { status: 403, headers: cors });
    }
    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY não configurada no Cloudflare Worker." }, { status: 503, headers: cors });
    }

    try {
      const body = await request.json();
      if (!body || !Array.isArray(body.contents) || body.contents.length === 0) {
        return Response.json({ error: "Corpo inválido: informe contents com ao menos uma mensagem." }, { status: 400, headers: cors });
      }

      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );
      const result = await upstream.text();
      return new Response(result, {
        status: upstream.status,
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
      });
    } catch (error) {
      return Response.json({ error: "Falha ao processar a solicitação ao Gemini.", detail: error.message }, { status: 500, headers: cors });
    }
  }
};
