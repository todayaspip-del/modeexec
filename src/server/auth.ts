import type { Request, Response, NextFunction } from 'express';

/**
 * Validação de usuário no servidor, usando a própria API de Auth do Supabase
 * (sem SDK e sem guardar segredo: só a URL e a chave pública "anon").
 *
 * Se SUPABASE_URL/SUPABASE_ANON_KEY não estiverem definidas, o app roda em modo local
 * e estes middlewares deixam tudo passar (comportamento anterior).
 */
export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
  return { enabled: Boolean(url && anonKey), url, anonKey };
}

interface CacheEntry {
  id: string;
  email: string;
  expires: number;
}
const tokenCache = new Map<string, CacheEntry>();
const CACHE_MS = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of tokenCache) if (v.expires < now) tokenCache.delete(k);
}, 5 * 60_000).unref();

export async function verifyToken(token: string): Promise<{ id: string; email: string } | null> {
  const cfg = getSupabaseConfig();
  if (!cfg.enabled || !token) return null;

  const hit = tokenCache.get(token);
  if (hit && hit.expires > Date.now()) return { id: hit.id, email: hit.email };

  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string; email?: string };
    if (!user.id) return null;
    tokenCache.set(token, { id: user.id, email: user.email || '', expires: Date.now() + CACHE_MS });
    return { id: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

function bearer(req: Request): string {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

/** Exige usuário logado quando as contas estão ativas. Anexa req.userId para o rate limit por usuário. */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!getSupabaseConfig().enabled) return next();
  const user = await verifyToken(bearer(req));
  if (!user) {
    return res.status(401).json({ error: 'Entre na sua conta para usar a inteligência artificial.', code: 'unauthorized' });
  }
  (req as AuthedRequest).userId = user.id;
  (req as AuthedRequest).userEmail = user.email;
  next();
}

/**
 * Exclusão definitiva da conta (direito de eliminação — LGPD art. 18).
 * Precisa da SUPABASE_SERVICE_ROLE_KEY (somente no servidor, nunca no navegador).
 * A linha em user_data some junto, por "on delete cascade".
 */
export async function deleteAccountHandler(req: Request, res: Response) {
  const cfg = getSupabaseConfig();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!cfg.enabled) return res.status(404).json({ error: 'Contas não estão ativas neste ambiente.' });
  if (!serviceKey) {
    return res.status(501).json({ error: 'A exclusão automática não está configurada. Solicite pelo e-mail de suporte.' });
  }

  const user = await verifyToken(bearer(req));
  if (!user) return res.status(401).json({ error: 'Sessão inválida. Entre novamente.', code: 'unauthorized' });

  try {
    const r = await fetch(`${cfg.url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return res.status(502).json({ error: 'Não foi possível excluir a conta agora. Tente novamente.' });
    for (const [k, v] of tokenCache) if (v.id === user.id) tokenCache.delete(k);
    return res.json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Não foi possível excluir a conta agora. Tente novamente.' });
  }
}
