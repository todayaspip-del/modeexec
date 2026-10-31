import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CloudStore, RemoteRow, WriteResult } from './cloudSync';

export interface CloudRuntime {
  client: SupabaseClient;
  store: CloudStore;
}

/**
 * A configuração vem do servidor em tempo de execução (/api/public-config), então
 * trocar o projeto Supabase não exige rebuild. A chave "anon" é pública por desenho:
 * quem protege os dados é a Row Level Security do banco (ver supabase/schema.sql).
 */
let cached: Promise<CloudRuntime | null> | null = null;

export function loadCloud(): Promise<CloudRuntime | null> {
  if (!cached) {
    cached = (async () => {
      try {
        const res = await fetch('/api/public-config', { headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const cfg = (await res.json()) as { enabled?: boolean; supabaseUrl?: string; supabaseAnonKey?: string };
        if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
        const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
        });
        return { client, store: createSupabaseStore(client) };
      } catch {
        return null; // sem servidor/rede na inicialização: segue em modo local
      }
    })();
  }
  return cached;
}

function createSupabaseStore(client: SupabaseClient): CloudStore {
  const TABLE = 'user_data';
  return {
    async fetch(userId): Promise<RemoteRow | null> {
      const { data, error } = await client
        .from(TABLE)
        .select('data, revision, schema_version')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        data: (data.data ?? {}) as Record<string, unknown>,
        revision: data.revision as number,
        schemaVersion: data.schema_version as number
      };
    },

    async insert(userId, payload, schemaVersion): Promise<WriteResult> {
      const { data, error } = await client
        .from(TABLE)
        .insert({ user_id: userId, data: payload, schema_version: schemaVersion, revision: 1 })
        .select('revision')
        .single();
      if (error) {
        if (error.code === '23505') return { ok: false, conflict: true }; // já existe linha: outro aparelho gravou antes
        throw error;
      }
      return { ok: true, revision: data.revision as number };
    },

    async update(userId, payload, schemaVersion, expectedRevision): Promise<WriteResult> {
      const { data, error } = await client
        .from(TABLE)
        .update({ data: payload, schema_version: schemaVersion, revision: expectedRevision + 1 })
        .eq('user_id', userId)
        .eq('revision', expectedRevision)
        .select('revision');
      if (error) throw error;
      if (!data || data.length === 0) return { ok: false, conflict: true };
      return { ok: true, revision: data[0].revision as number };
    }
  };
}
