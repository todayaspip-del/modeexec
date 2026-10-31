import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Express body parser with 100kb limit as required
app.use(express.json({ limit: '100kb' }));

import { Type } from '@google/genai';
import { generateStructured } from './src/server/ai/gemini';
import { requireUser, getSupabaseConfig, deleteAccountHandler } from './src/server/auth';
import { rateLimitMiddleware, sanitizeInput, wrapUserData } from './src/server/ai/guard';

// Health check endpoint: returns { ok: true, ai: Boolean(process.env.GEMINI_API_KEY) }
// NEVER exposes the Gemini API key.
app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    ok: true,
    ai: hasKey
  });
});

// Config pública (URL + chave anon) para o navegador criar o cliente Supabase em runtime.
app.get('/api/public-config', (_req, res) => {
  const cfg = getSupabaseConfig();
  res.json({ enabled: cfg.enabled, supabaseUrl: cfg.url, supabaseAnonKey: cfg.anonKey });
});
app.delete('/api/account', deleteAccountHandler);

// JSON Schema for structured stages output using @google/genai Type enum
const STAGES_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    stages: {
      type: Type.ARRAY,
      description: 'Sequential execution stages from 3 to 6 stages',
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Stage title in Brazilian Portuguese, at most 6 words'
          },
          doneCriteria: {
            type: Type.STRING,
            description: 'Observable, verifiable completion criteria in Brazilian Portuguese (one sentence, no vague verbs)'
          },
          cards: {
            type: Type.ARRAY,
            description: 'Action cards: ONLY the first stage gets 3 to 5 cards; other stages get 0 to 2 cards',
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Physical action starting with an action verb, max 90 characters'
                },
                durationMinutes: {
                  type: Type.INTEGER,
                  description: 'Duration in minutes between 5 and 25'
                },
                expectedEvidence: {
                  type: Type.STRING,
                  description: 'Tangible observable evidence produced upon finishing'
                }
              },
              required: ['title', 'durationMinutes', 'expectedEvidence']
            }
          }
        },
        required: ['title', 'doneCriteria', 'cards']
      }
    }
  },
  required: ['stages']
};

interface AIStageRaw {
  title?: string;
  doneCriteria?: string;
  cards?: Array<{
    title?: string;
    durationMinutes?: number;
    expectedEvidence?: string;
  }>;
}

// POST /api/ai/stages: Suggest stages and cards with AI
app.post('/api/ai/stages', requireUser, rateLimitMiddleware, async (req, res) => {
  try {
    const rawBody = req.body || {};
    const sanitized = sanitizeInput<{
      name?: string;
      desiredOutcome?: string;
      deadline?: string;
      mode?: string;
      executionPattern?: string;
      businessContext?: string;
    }>(rawBody);

    const name = sanitized.name?.trim();
    const desiredOutcome = sanitized.desiredOutcome?.trim();

    if (!name || !desiredOutcome) {
      return res.status(400).json({
        error: 'Nome do projeto e resultado desejado são obrigatórios.',
        code: 'bad_output'
      });
    }

    const mode = sanitized.mode?.trim() || 'Normal';
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
   - "doneCriteria": observable and verifiable, one sentence. NEVER use vague verbs such as "melhorar", "otimizar", "pensar", "analisar", "desenvolver". Use tangible definitions of done (e.g., "Primeira versão escrita em 1 página e validada", "Link enviado para 3 clientes com confirmação de recebimento").
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
   - 'Recuperação': cards of at most 10 minutes and at most 3 stages.
   - 'Normal': cards between 5 and 25 minutes, 3 to 6 stages.
7. Adapt to executionPattern when present:
   - perfeccionismo: define a minimum viable version in the card title (e.g., "Escrever rascunho imperfeito em 1 página", "Criar versão mínima de teste").
   - excesso_planejamento: fewer stages, emphasize fast real-world physical action over research.
   - dispersao or sobrecarga: make the very first card a 5 to 10 minute micro-action to break inertia.
8. Grounding:
   - Never invent facts about the user's business. When information is missing, create cards whose purpose is to gather or clarify it.`;

    const userPrompt = `Project Name: ${wrapUserData(name, 'PROJECT_NAME')}
Desired Outcome: ${wrapUserData(desiredOutcome, 'DESIRED_OUTCOME')}
Deadline: ${deadline ? wrapUserData(deadline, 'DEADLINE') : 'Não especificado'}
Operational Mode: ${mode}
Execution Pattern / Saboteur: ${executionPattern ? wrapUserData(executionPattern, 'EXECUTION_PATTERN') : 'Nenhum'}
Business Context: ${businessContext ? wrapUserData(businessContext, 'BUSINESS_CONTEXT') : 'Não informado'}`;

    const aiResult = await generateStructured<{ stages: AIStageRaw[] }>({
      systemInstruction,
      userPrompt,
      responseSchema: STAGES_RESPONSE_SCHEMA,
      temperature: 0.3
    });

    const rawStages = Array.isArray(aiResult?.stages) ? aiResult.stages : [];

    // Clamping limits based on user mode
    const maxStages = mode === 'Recuperação' ? 3 : mode === 'Reduzido' ? 4 : 6;
    const maxCardDuration = mode === 'Recuperação' ? 10 : mode === 'Reduzido' ? 15 : 25;

    const clampedStages = rawStages.slice(0, maxStages).map((stg, sIdx) => {
      // Title: clamp to at most 6 words
      const rawTitle = (typeof stg.title === 'string' ? stg.title : '').trim();
      const words = rawTitle.split(/\s+/).filter(Boolean);
      const title = words.slice(0, 6).join(' ').slice(0, 80) || `Etapa ${sIdx + 1}`;

      // Done Criteria: single sentence, clamped
      const rawDone = (typeof stg.doneCriteria === 'string' ? stg.doneCriteria : '').trim();
      const doneCriteria = rawDone.slice(0, 200) || 'Critério observável de conclusão da etapa';

      // First stage gets 3 to 5 cards, others 0 to 2 cards
      const maxCards = sIdx === 0 ? 5 : 2;
      const rawCards = Array.isArray(stg.cards) ? stg.cards : [];

      // Drop empty cards
      const validCards = rawCards
        .filter((c) => c && typeof c === 'object' && typeof c.title === 'string' && c.title.trim().length > 0)
        .slice(0, maxCards)
        .map((c) => {
          const cardTitle = c.title!.trim().slice(0, 90);
          const rawMinutes = Math.round(Number(c.durationMinutes)) || 15;
          const durationMinutes = Math.min(maxCardDuration, Math.max(5, rawMinutes));
          const rawEvidence = (typeof c.expectedEvidence === 'string' ? c.expectedEvidence : '').trim();
          const expectedEvidence = rawEvidence.slice(0, 120) || 'Arquivo salvo ou mensagem enviada';

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
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Erro ao gerar etapas com IA.',
      code: err.code || 'upstream'
    });
  }
});

async function startServer() {
  if (!isProd) {
    // Development mode: mount Vite as middleware with SPA mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);

    // Fallback for SPA routing in development so deep links survive refresh
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs/promises');
        const template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production mode: serve dist statically with SPA fallback to index.html
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // Non-/api GET requests return index.html for SPA deep links (e.g. /app/projetos/<id>)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Modo Execução listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
