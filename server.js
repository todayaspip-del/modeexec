// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Type } from "@google/genai";

// src/server/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";
var AIServerError = class extends Error {
  constructor(code, message, status = 500, details) {
    super(message);
    this.name = "AIServerError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
};
var AI_MODEL = process.env.AI_MODEL || "gemini-3.8-flash";
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new AIServerError("no_api_key", "Gemini API key is not configured on the server.", 401);
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function extractJsonString(raw) {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return text;
}
function parseAndValidate(rawText, validateShape) {
  if (!rawText || rawText.trim() === "") {
    throw new AIServerError("bad_output", "Gemini returned an empty response.", 502);
  }
  const cleaned = extractJsonString(rawText);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new AIServerError("bad_output", "Failed to parse JSON response from Gemini.", 502, err);
  }
  if (parsed === null || parsed === void 0) {
    throw new AIServerError("bad_output", "Parsed JSON response is null or undefined.", 502);
  }
  if (validateShape) {
    if (!validateShape(parsed)) {
      throw new AIServerError("bad_output", "Response failed custom shape validation.", 502, parsed);
    }
    return parsed;
  }
  if (typeof parsed !== "object") {
    throw new AIServerError("bad_output", "Expected JSON object or array from structured response.", 502, parsed);
  }
  return parsed;
}
function mapToAIServerError(err) {
  if (err instanceof AIServerError) {
    return err;
  }
  const message = err?.message || String(err);
  const status = err?.status || err?.statusCode || 500;
  if (err?.name === "AbortError" || message.includes("aborted") || message.includes("timeout") || message.includes("DEADLINE_EXCEEDED")) {
    return new AIServerError("timeout", "Gemini request timed out after 25 seconds.", 504, err);
  }
  if (status === 429 || message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit")) {
    return new AIServerError("rate_limited", "Gemini rate limit or quota exceeded.", 429, err);
  }
  if (status === 401 || message.includes("API_KEY_INVALID") || message.includes("API key not valid") || message.includes("UNAUTHENTICATED")) {
    return new AIServerError("no_api_key", "Invalid or missing Gemini API key.", 401, err);
  }
  return new AIServerError(
    "upstream",
    `Gemini upstream failure: ${message}`,
    status >= 400 && status < 600 ? status : 502,
    err
  );
}
async function generateStructured({
  systemInstruction,
  userPrompt,
  responseSchema,
  temperature = 0.2,
  validateShape
}) {
  const ai = getGeminiClient();
  const performCall = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 25e3);
    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          ...responseSchema ? { responseSchema } : {},
          ...typeof temperature === "number" ? { temperature } : {},
          abortSignal: controller.signal
        }
      });
      return response.text;
    } catch (err) {
      if (controller.signal.aborted) {
        throw new AIServerError("timeout", "Request timed out after 25 seconds.", 504);
      }
      throw mapToAIServerError(err);
    } finally {
      clearTimeout(timeoutId);
    }
  };
  let textOutput;
  try {
    textOutput = await performCall();
    return parseAndValidate(textOutput, validateShape);
  } catch (firstErr) {
    if (firstErr instanceof AIServerError && firstErr.code === "bad_output") {
      try {
        textOutput = await performCall();
        return parseAndValidate(textOutput, validateShape);
      } catch (secondErr) {
        throw mapToAIServerError(secondErr);
      }
    }
    throw mapToAIServerError(firstErr);
  }
}

// src/server/ai/guard.ts
var rateLimitStore = /* @__PURE__ */ new Map();
var RATE_LIMIT_WINDOW_MS = 60 * 1e3;
var MAX_REQUESTS_PER_MINUTE = 10;
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1e3).unref();
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { timestamps: [] };
  const recent = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = recent[0];
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1e3));
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  rateLimitStore.set(ip, { timestamps: recent });
  return { allowed: true };
}
function rateLimitMiddleware(req, res, next) {
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "127.0.0.1";
  const limitCheck = checkRateLimit(clientIp);
  if (!limitCheck.allowed) {
    res.setHeader("Retry-After", limitCheck.retryAfterSeconds || 60);
    return res.status(429).json({
      error: "Limite de requisi\xE7\xF5es excedido. M\xE1ximo de 10 requisi\xE7\xF5es por minuto.",
      code: "rate_limited"
    });
  }
  next();
}
var DEFAULT_MAX_STRING_LENGTH = 2e3;
function sanitizeString(val, maxLength = DEFAULT_MAX_STRING_LENGTH) {
  if (typeof val !== "string") return "";
  const collapsed = val.trim().replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n");
  return collapsed.slice(0, maxLength);
}
function sanitizeInput(input, maxLength = DEFAULT_MAX_STRING_LENGTH) {
  if (typeof input === "string") {
    return sanitizeString(input, maxLength);
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item, maxLength));
  }
  if (input !== null && typeof input === "object") {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeInput(value, maxLength);
    }
    return sanitizedObj;
  }
  return input;
}
function wrapUserData(content, label = "USER_INPUT") {
  const sanitized = sanitizeString(content);
  return `<<<${label}_DATA_START>>>
${sanitized}
<<<${label}_DATA_END>>>`;
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var isProd = process.env.NODE_ENV === "production";
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  res.json({
    ok: true,
    ai: hasKey
  });
});
var STAGES_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    stages: {
      type: Type.ARRAY,
      description: "Sequential execution stages from 3 to 6 stages",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Stage title in Brazilian Portuguese, at most 6 words"
          },
          doneCriteria: {
            type: Type.STRING,
            description: "Observable, verifiable completion criteria in Brazilian Portuguese (one sentence, no vague verbs)"
          },
          cards: {
            type: Type.ARRAY,
            description: "Action cards: ONLY the first stage gets 3 to 5 cards; other stages get 0 to 2 cards",
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Physical action starting with an action verb, max 90 characters"
                },
                durationMinutes: {
                  type: Type.INTEGER,
                  description: "Duration in minutes between 5 and 25"
                },
                expectedEvidence: {
                  type: Type.STRING,
                  description: "Tangible observable evidence produced upon finishing"
                }
              },
              required: ["title", "durationMinutes", "expectedEvidence"]
            }
          }
        },
        required: ["title", "doneCriteria", "cards"]
      }
    }
  },
  required: ["stages"]
};
app.post("/api/ai/stages", rateLimitMiddleware, async (req, res) => {
  try {
    const rawBody = req.body || {};
    const sanitized = sanitizeInput(rawBody);
    const name = sanitized.name?.trim();
    const desiredOutcome = sanitized.desiredOutcome?.trim();
    if (!name || !desiredOutcome) {
      return res.status(400).json({
        error: "Nome do projeto e resultado desejado s\xE3o obrigat\xF3rios.",
        code: "bad_output"
      });
    }
    const mode = sanitized.mode?.trim() || "Normal";
    const executionPattern = sanitized.executionPattern?.trim();
    const deadline = sanitized.deadline?.trim();
    const businessContext = sanitized.businessContext?.trim();
    const systemInstruction = `You are an execution coach for entrepreneurs who procrastinate.
Your mission is to break the desired outcome into 3 to 6 sequential stages.

CORE PRODUCT PHILOSOPHY & MANDATORY RULES:
1. Output language: All output MUST be in natural Brazilian Portuguese (pt-BR).
2. Stages: Break the desired outcome into 3 to 6 sequential stages ordered chronologically from first step to final delivery.
3. Stage specifications:
   - "title": at most 6 words.
   - "doneCriteria": observable and verifiable, one sentence. NEVER use vague verbs such as "melhorar", "otimizar", "pensar", "analisar", "desenvolver". Use tangible definitions of done (e.g., "Primeira vers\xE3o escrita em 1 p\xE1gina e validada", "Link enviado para 3 clientes com confirma\xE7\xE3o de recebimento").
   - "cards": list of cards for the stage.
4. Card distribution:
   - ONLY the first stage gets 3 to 5 cards (immediate physical momentum).
   - The other stages get 0 to 2 cards (keep future stages light to avoid overwhelm).
5. Card specifications:
   - "title": a physical action that starts with a verb, at most 90 characters.
   - "durationMinutes": an integer from 5 to 25.
   - "expectedEvidence": something the user can show: a file, a sent message, a link, a photo.
6. Respect user mode:
   - 'Reduzido': cards of at most 15 minutes and at most 4 stages.
   - 'Recupera\xE7\xE3o': cards of at most 10 minutes and at most 3 stages.
   - 'Normal': cards between 5 and 25 minutes, 3 to 6 stages.
7. Adapt to executionPattern when present:
   - perfeccionismo: define a minimum viable version in the card title (e.g., "Escrever rascunho imperfeito em 1 p\xE1gina", "Criar vers\xE3o m\xEDnima de teste").
   - excesso_planejamento: fewer stages, emphasize fast real-world physical action over research.
   - dispersao or sobrecarga: make the very first card a 5 to 10 minute micro-action to break inertia.
8. Grounding:
   - Never invent facts about the user's business. When information is missing, create cards whose purpose is to gather or clarify it.`;
    const userPrompt = `Project Name: ${wrapUserData(name, "PROJECT_NAME")}
Desired Outcome: ${wrapUserData(desiredOutcome, "DESIRED_OUTCOME")}
Deadline: ${deadline ? wrapUserData(deadline, "DEADLINE") : "N\xE3o especificado"}
Operational Mode: ${mode}
Execution Pattern / Saboteur: ${executionPattern ? wrapUserData(executionPattern, "EXECUTION_PATTERN") : "Nenhum"}
Business Context: ${businessContext ? wrapUserData(businessContext, "BUSINESS_CONTEXT") : "N\xE3o informado"}`;
    const aiResult = await generateStructured({
      systemInstruction,
      userPrompt,
      responseSchema: STAGES_RESPONSE_SCHEMA,
      temperature: 0.3
    });
    const rawStages = Array.isArray(aiResult?.stages) ? aiResult.stages : [];
    const maxStages = mode === "Recupera\xE7\xE3o" ? 3 : mode === "Reduzido" ? 4 : 6;
    const maxCardDuration = mode === "Recupera\xE7\xE3o" ? 10 : mode === "Reduzido" ? 15 : 25;
    const clampedStages = rawStages.slice(0, maxStages).map((stg, sIdx) => {
      const rawTitle = (typeof stg.title === "string" ? stg.title : "").trim();
      const words = rawTitle.split(/\s+/).filter(Boolean);
      const title = words.slice(0, 6).join(" ").slice(0, 80) || `Etapa ${sIdx + 1}`;
      const rawDone = (typeof stg.doneCriteria === "string" ? stg.doneCriteria : "").trim();
      const doneCriteria = rawDone.slice(0, 200) || "Crit\xE9rio observ\xE1vel de conclus\xE3o da etapa";
      const maxCards = sIdx === 0 ? 5 : 2;
      const rawCards = Array.isArray(stg.cards) ? stg.cards : [];
      const validCards = rawCards.filter((c) => c && typeof c === "object" && typeof c.title === "string" && c.title.trim().length > 0).slice(0, maxCards).map((c) => {
        const cardTitle = c.title.trim().slice(0, 90);
        const rawMinutes = Math.round(Number(c.durationMinutes)) || 15;
        const durationMinutes = Math.min(maxCardDuration, Math.max(5, rawMinutes));
        const rawEvidence = (typeof c.expectedEvidence === "string" ? c.expectedEvidence : "").trim();
        const expectedEvidence = rawEvidence.slice(0, 120) || "Arquivo salvo ou mensagem enviada";
        return {
          title: cardTitle,
          durationMinutes,
          expectedEvidence
        };
      });
      return {
        title,
        doneCriteria,
        cards: validCards
      };
    });
    res.json({ stages: clampedStages });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Erro ao gerar etapas com IA.",
      code: err.code || "upstream"
    });
  }
});
async function startServer() {
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      try {
        const fs = await import("fs/promises");
        const template = await fs.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Modo Execu\xE7\xE3o listening on http://0.0.0.0:${PORT} (${isProd ? "production" : "development"})`);
  });
}
startServer();
