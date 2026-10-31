/**
 * Sincronização local <-> nuvem.
 *
 * Modelo: todo o estado do app (os "slices" v2_* do localStorage) é tratado como um único
 * documento JSON por usuário, com um número de revisão para detectar conflitos entre
 * aparelhos (controle otimista: só grava se a revisão da nuvem ainda for a que conhecemos).
 *
 * Este módulo NÃO conhece React nem Supabase: recebe um `Storage` e um `CloudStore`,
 * o que permite testar toda a lógica de decisão isoladamente.
 */
import { STORAGE_PREFIX, SCHEMA_VERSION } from './storage';

export const SLICE_PREFIX = `${STORAGE_PREFIX}v2_`;
const META_KEY = 'modo_execucao_sync_meta';
export const BACKUP_KEY = 'modo_execucao_backup_pre_login';
// Preferências de interface que sobrevivem à limpeza do aparelho.
const KEEP_ON_WIPE = new Set(['modo_execucao_desktop_mode']);

export interface KV {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SyncMeta {
  userId: string;
  /** Última revisão da nuvem conhecida por este aparelho (null = nunca gravou). */
  revision: number | null;
  /** Há alterações locais ainda não enviadas. */
  dirty: boolean;
}

export interface RemoteRow {
  data: Record<string, unknown>;
  revision: number;
  schemaVersion: number;
}

export type WriteResult = { ok: true; revision: number } | { ok: false; conflict: true };

export interface CloudStore {
  fetch(userId: string): Promise<RemoteRow | null>;
  insert(userId: string, data: Record<string, unknown>, schemaVersion: number): Promise<WriteResult>;
  update(
    userId: string,
    data: Record<string, unknown>,
    schemaVersion: number,
    expectedRevision: number
  ): Promise<WriteResult>;
}

/* ------------------------------------------------------------------ meta */

export function readMeta(ls: KV): SyncMeta | null {
  try {
    const raw = ls.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string') {
      return {
        userId: parsed.userId,
        revision: typeof parsed.revision === 'number' ? parsed.revision : null,
        dirty: Boolean(parsed.dirty)
      };
    }
  } catch {
    // meta corrompida: tratada como ausente
  }
  return null;
}

export function writeMeta(ls: KV, meta: SyncMeta | null): void {
  try {
    if (meta === null) ls.removeItem(META_KEY);
    else ls.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // sem espaço/permissão: a próxima gravação tenta de novo
  }
}

/* -------------------------------------------------------------- snapshot */

function sliceKeys(ls: KV): string[] {
  const keys: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith(SLICE_PREFIX)) keys.push(k);
  }
  return keys;
}

/** Lê todos os slices locais. Chaves do snapshot não levam o prefixo do app (ex.: "v2_profile"). */
export function collectSnapshot(ls: KV): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of sliceKeys(ls)) {
    try {
      const raw = ls.getItem(k);
      if (raw !== null) out[k.slice(STORAGE_PREFIX.length)] = JSON.parse(raw);
    } catch {
      // slice corrompido: não contamina a nuvem
    }
  }
  return out;
}

/** Substitui os slices locais pelo conteúdo do snapshot. */
export function applySnapshot(ls: KV, data: Record<string, unknown>): void {
  for (const k of sliceKeys(ls)) ls.removeItem(k);
  for (const [name, value] of Object.entries(data)) {
    if (!name.startsWith('v2_')) continue; // ignora qualquer coisa fora do formato esperado
    ls.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(value));
  }
}

/** Remove dados do usuário deste aparelho (usado ao sair, para não vazar entre contas). */
export function wipeLocal(ls: KV): void {
  const toRemove: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith('modo_execucao') && !KEEP_ON_WIPE.has(k)) toRemove.push(k);
  }
  toRemove.forEach((k) => ls.removeItem(k));
}

function wipeSlicesAndMeta(ls: KV): void {
  for (const k of sliceKeys(ls)) ls.removeItem(k);
  writeMeta(ls, null);
}

type ProfileLike = { isDemo?: boolean; onboardingCompleted?: boolean } | undefined;
const profileOf = (snap: Record<string, unknown>) => snap['v2_profile'] as ProfileLike;

export const isDemoSnapshot = (snap: Record<string, unknown>) => profileOf(snap)?.isDemo === true;
export const isEstablishedSnapshot = (snap: Record<string, unknown>) => {
  const p = profileOf(snap);
  return Boolean(p && p.isDemo === false && p.onboardingCompleted === true);
};

/* ------------------------------------------------------------- operações */

export type ReconcileResult =
  | { action: 'none' }
  | { action: 'pushed' }
  | { action: 'applied' }
  | { action: 'wiped' }
  | { action: 'conflict' };

function backupLocal(ls: KV, snapshot: Record<string, unknown>): void {
  try {
    ls.setItem(BACKUP_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data: snapshot }));
  } catch {
    // backup é "melhor esforço"
  }
}

/**
 * Decide o que fazer quando um usuário autenticado abre o app neste aparelho.
 * Deve rodar ANTES de o estado do React ser lido do localStorage.
 *
 * Regras:
 *  - Mesmo dono, nada mudou na nuvem        -> envia o que estiver pendente.
 *  - Mesmo dono, nuvem mais nova, sem pendência -> aplica a nuvem.
 *  - Mesmo dono, nuvem mais nova E pendência local -> conflito (o usuário decide).
 *  - Dono diferente / sem dono, nuvem vazia  -> descarta demo/dados de outra conta;
 *                                               dados anônimos válidos viram da conta.
 *  - Dono diferente / sem dono, nuvem com dados -> a nuvem vence (local vira backup).
 */
export async function reconcileOnLogin(ls: KV, store: CloudStore, userId: string): Promise<ReconcileResult> {
  const meta = readMeta(ls);
  const remote = await store.fetch(userId);
  const local = collectSnapshot(ls);
  const hasLocal = Object.keys(local).length > 0;
  const sameOwner = meta?.userId === userId;

  const insertLocal = async (): Promise<ReconcileResult> => {
    const res = await store.insert(userId, local, SCHEMA_VERSION);
    if (res.ok) {
      writeMeta(ls, { userId, revision: res.revision, dirty: false });
      return { action: 'pushed' };
    }
    writeMeta(ls, { userId, revision: null, dirty: true });
    return { action: 'conflict' };
  };

  if (sameOwner && meta) {
    if (!remote) {
      if (!hasLocal) {
        writeMeta(ls, { userId, revision: null, dirty: false });
        return { action: 'none' };
      }
      return insertLocal();
    }
    if (meta.revision === remote.revision) {
      if (!meta.dirty) return { action: 'none' };
      const res = await store.update(userId, local, SCHEMA_VERSION, remote.revision);
      if (res.ok) {
        writeMeta(ls, { userId, revision: res.revision, dirty: false });
        return { action: 'pushed' };
      }
      return { action: 'conflict' };
    }
    if (meta.revision !== null && remote.revision > meta.revision && !meta.dirty) {
      applySnapshot(ls, remote.data);
      writeMeta(ls, { userId, revision: remote.revision, dirty: false });
      return { action: 'applied' };
    }
    return { action: 'conflict' };
  }

  const foreignOwner = Boolean(meta && meta.userId !== userId);

  if (!remote) {
    if (foreignOwner || isDemoSnapshot(local)) {
      wipeSlicesAndMeta(ls);
      writeMeta(ls, { userId, revision: null, dirty: false });
      return { action: 'wiped' };
    }
    if (!hasLocal) {
      writeMeta(ls, { userId, revision: null, dirty: false });
      return { action: 'none' };
    }
    // Dados anônimos deste aparelho (ex.: resultado do diagnóstico) passam a pertencer à conta.
    return insertLocal();
  }

  if (!foreignOwner && isEstablishedSnapshot(local)) backupLocal(ls, local);
  applySnapshot(ls, remote.data);
  writeMeta(ls, { userId, revision: remote.revision, dirty: false });
  return { action: 'applied' };
}

/** Envia o estado local. Com `force`, sobrescreve a nuvem usando a revisão atual dela. */
export async function pushNow(
  ls: KV,
  store: CloudStore,
  userId: string,
  opts: { force?: boolean } = {}
): Promise<{ status: 'saved'; revision: number } | { status: 'conflict' }> {
  const snapshot = collectSnapshot(ls);
  let expected: number | null;
  if (opts.force) {
    const remote = await store.fetch(userId);
    expected = remote ? remote.revision : null;
  } else {
    const meta = readMeta(ls);
    expected = meta && meta.userId === userId ? meta.revision : null;
  }
  const res =
    expected === null
      ? await store.insert(userId, snapshot, SCHEMA_VERSION)
      : await store.update(userId, snapshot, SCHEMA_VERSION, expected);
  return res.ok ? { status: 'saved', revision: res.revision } : { status: 'conflict' };
}

/** Resolve um conflito a favor da nuvem: guarda backup do local e aplica o que está na nuvem. */
export async function resolveWithCloudVersion(ls: KV, store: CloudStore, userId: string): Promise<void> {
  const remote = await store.fetch(userId);
  const local = collectSnapshot(ls);
  if (Object.keys(local).length > 0) backupLocal(ls, local);
  if (remote) {
    applySnapshot(ls, remote.data);
    writeMeta(ls, { userId, revision: remote.revision, dirty: false });
  } else {
    writeMeta(ls, { userId, revision: null, dirty: true });
  }
}
