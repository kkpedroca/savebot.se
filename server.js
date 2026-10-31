import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "25mb" }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente." }
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "SaveBot" }));

app.post("/api/generateContent", chatLimiter, async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: "O serviço de IA ainda não foi configurado no servidor." });
    }
    const { contents, generationConfig, systemInstruction } = req.body ?? {};
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: "O histórico da conversa está vazio ou inválido." });
    }
    if (contents.length > 80) {
      return res.status(400).json({ error: "A conversa está muito longa. Inicie um novo chat." });
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: Number(generationConfig?.temperature ?? 0.7),
        topK: Number(generationConfig?.topK ?? 40),
        topP: Number(generationConfig?.topP ?? 0.95),
        maxOutputTokens: Math.min(Number(generationConfig?.maxOutputTokens ?? 2048), 4096)
      }
    };
    if (systemInstruction && Array.isArray(systemInstruction.parts)) payload.systemInstruction = systemInstruction;

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000)
      }
    );
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("Gemini API retornou status:", upstream.status);
      return res.status(upstream.status >= 500 ? 502 : upstream.status).json({
        error: result?.error?.message || "Não foi possível obter resposta da IA."
      });
    }
    return res.json(result);
  } catch (error) {
    console.error("Erro ao processar solicitação:", error?.name || "Error");
    if (error?.name === "TimeoutError") return res.status(504).json({ error: "A IA demorou para responder. Tente novamente." });
    return res.status(500).json({ error: "Erro interno ao processar sua mensagem." });
  }
});

app.use(express.static("public", {
  extensions: ["html"],
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile("index.html", { root: "public" });
});
app.listen(PORT, "0.0.0.0", () => console.log(`SaveBot ativo na porta ${PORT}`));
