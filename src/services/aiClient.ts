/**
 * Client-Side AI Service Layer
 *
 * CRITICAL SECURITY RULE:
 * This client service connects strictly to our own server endpoints via relative URLs.
 * The client NEVER references, imports, or manages any API keys.
 */

export type AIErrorCode = 'no_api_key' | 'timeout' | 'bad_output' | 'rate_limited' | 'upstream' | 'unauthorized';

// Fornecido pelo AuthGate: devolve o token do usuário logado (ou null no modo local).
let accessTokenProvider: (() => Promise<string | null>) | null = null;
export function setAccessTokenProvider(fn: (() => Promise<string | null>) | null): void {
  accessTokenProvider = fn;
}

export class AIError extends Error {
  code: AIErrorCode;
  status: number;
  details?: unknown;

  constructor(code: AIErrorCode, message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Session cache for AI availability
let sessionAICachedStatus: boolean | null = null;
const SESSION_STORAGE_KEY = 'modo_execucao_ai_available';

/**
 * Checks the server AI availability status via /api/health and caches the result
 * for the duration of the user's session.
 */
export async function getAIStatus(): Promise<boolean> {
  // 1. Check in-memory session cache first
  if (sessionAICachedStatus !== null) {
    return sessionAICachedStatus;
  }

  // 2. Check browser sessionStorage
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored !== null) {
      sessionAICachedStatus = stored === 'true';
      return sessionAICachedStatus;
    }
  } catch {
    // Graceful fallback if sessionStorage is restricted
  }

  // 3. Query /api/health
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('/api/health', {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      sessionAICachedStatus = false;
      return false;
    }

    const data = await res.json();
    const isAvailable = Boolean(data && data.ok === true && data.ai === true);

    sessionAICachedStatus = isAvailable;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, String(isAvailable));
    } catch {}

    return isAvailable;
  } catch {
    sessionAICachedStatus = false;
    return false;
  }
}

/**
 * Sends a structured POST request to the server's AI endpoints with a strict 30-second timeout,
 * relative URL enforcement, JSON handling, and typed AIError exceptions.
 */
export async function postAI<TReq, TRes>(
  path: string,
  body: TReq,
  signal?: AbortSignal
): Promise<TRes> {
  // Ensure relative path starting with /
  const url = path.startsWith('/') ? path : `/${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000); // 30 seconds timeout as required

  // Forward external abort signal if provided
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new AIError('timeout', 'A requisição foi cancelada.', 499);
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    try {
      const token = accessTokenProvider ? await accessTokenProvider() : null;
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // sem token: o servidor decide se isso é aceitável
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch (parseErr) {
      if (!response.ok) {
        throw new AIError('upstream', `Servidor retornou erro ${response.status}`, response.status, parseErr);
      }
      throw new AIError('bad_output', 'Resposta inválida recebida do servidor.', 502, parseErr);
    }

    if (!response.ok) {
      const errObj = (data && typeof data === 'object' ? data : {}) as {
        error?: string;
        message?: string;
        code?: AIErrorCode;
      };

      const message = errObj.error || errObj.message || `Erro ${response.status} na requisição`;
      let code: AIErrorCode = errObj.code || 'upstream';

      if (!errObj.code) {
        if (response.status === 401) code = 'no_api_key';
        else if (response.status === 429) code = 'rate_limited';
        else if (response.status === 504) code = 'timeout';
        else if (response.status === 502) code = 'bad_output';
      }

      throw new AIError(code, message, response.status, data);
    }

    return data as TRes;
  } catch (err: unknown) {
    if (err instanceof AIError) {
      throw err;
    }

    if (controller.signal.aborted) {
      throw new AIError('timeout', 'A requisição de IA expirou após 30 segundos.', 504);
    }

    const errorMsg = (err as Error)?.message || 'Falha de comunicação com o servidor de IA.';
    throw new AIError('upstream', errorMsg, 500, err);
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
