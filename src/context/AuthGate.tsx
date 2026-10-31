import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { loadCloud, type CloudRuntime } from '../lib/supabase';
import {
  SLICE_PREFIX,
  pushNow,
  readMeta,
  reconcileOnLogin,
  resolveWithCloudVersion,
  wipeLocal,
  writeMeta
} from '../lib/cloudSync';
import { LOCAL_WRITE_EVENT } from '../lib/storage';
import { setAccessTokenProvider } from '../services/aiClient';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict';
export interface AuthResult {
  error?: string;
  /** Conta criada, mas é preciso confirmar o e-mail antes de entrar. */
  needsEmailConfirmation?: boolean;
  /** Link enviado por e-mail (login sem senha ou recuperação). */
  emailSent?: boolean;
}

export interface AuthContextValue {
  /** false = Supabase não configurado: o app funciona só neste navegador (modo local). */
  cloudEnabled: boolean;
  user: { id: string; email: string } | null;
  recovery: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>;
  sendMagicLink: (email: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
  resolveConflict: (choice: 'cloud' | 'local') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthGate>.');
  return ctx;
}

function translateAuthError(message: string | undefined, code?: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já tem conta. Entre ou recupere a senha.';
  if (m.includes('password should be') || m.includes('weak password')) return 'Escolha uma senha mais forte (mínimo de 8 caracteres).';
  if (code === 'over_email_send_rate_limit' || m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if (m.includes('signups not allowed') || m.includes('signup is disabled') || m.includes('user not found'))
    return 'Este e-mail não está autorizado. Fale com o administrador.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Informe um e-mail válido.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão. Verifique sua internet e tente de novo.';
  if (m.includes('same password')) return 'A nova senha precisa ser diferente da atual.';
  return 'Não foi possível concluir agora. Tente novamente em instantes.';
}

const Splash: React.FC = () => (
  <div className="min-h-screen bg-[#101114] flex items-center justify-center">
    <div className="text-xs font-mono text-[#8D9298] animate-pulse">Carregando seu ambiente…</div>
  </div>
);

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<'booting' | 'hydrating' | 'ready'>('booting');
  const [cloud, setCloud] = useState<CloudRuntime | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [hydratedUid, setHydratedUid] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const statusRef = useRef<SyncStatus>('idle');
  const setSyncStatus = useCallback((s: SyncStatus) => {
    statusRef.current = s;
    setSyncStatusState(s);
  }, []);
  const writeCounter = useRef(0);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const scheduleRef = useRef<(ms: number) => void>(() => {});
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  /* 1. Carrega a configuração e a sessão existente */
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    (async () => {
      const runtime = await loadCloud();
      if (cancelled) return;
      if (!runtime) {
        setPhase('ready'); // modo local
        return;
      }
      setCloud(runtime);
      const { data: sub } = runtime.client.auth.onAuthStateChange((event, s) => {
        if (event === 'PASSWORD_RECOVERY') setRecovery(true);
        setSession(s); // não chamar o Supabase aqui dentro (risco de deadlock); efeitos reagem ao estado
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      const { data } = await runtime.client.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setPhase(data.session ? 'hydrating' : 'ready');
    })();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /* 2. Token para o servidor validar chamadas de IA */
  useEffect(() => {
    setAccessTokenProvider(async () => {
      if (!cloud) return null;
      const { data } = await cloud.client.auth.getSession();
      return data.session?.access_token ?? null;
    });
    return () => setAccessTokenProvider(null);
  }, [cloud]);

  /* 3. Hidratação: decide quem vence (local x nuvem) ANTES do React ler o localStorage */
  const uid = session?.user.id ?? null;
  useEffect(() => {
    if (!cloud) return;
    if (!uid) {
      if (hydratedUid) setHydratedUid(null); // sessão encerrada (ex.: em outra aba)
      if (phase === 'hydrating') setPhase('ready');
      return;
    }
    if (hydratedUid === uid) return;

    let cancelled = false;
    setPhase('hydrating');
    (async () => {
      try {
        const result = await reconcileOnLogin(localStorage, cloud.store, uid);
        if (cancelled) return;
        setSyncStatus(result.action === 'conflict' ? 'conflict' : 'saved');
        if (result.action !== 'conflict') setLastSyncedAt(Date.now());
      } catch {
        if (cancelled) return;
        // Sem rede ao abrir: segue com o que há localmente, exceto dados de OUTRA conta.
        const meta = readMeta(localStorage);
        if (meta && meta.userId !== uid) {
          wipeLocal(localStorage);
        }
        setSyncStatus('offline');
      }
      if (cancelled) return;
      setHydratedUid(uid);
      setPhase('ready');
      if (/[?&]code=/.test(window.location.search)) {
        window.history.replaceState({}, '', window.location.pathname); // limpa o código do link mágico
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud, uid]);

  /* 4. Laço de sincronização: grava na nuvem (com debounce) a cada alteração local */
  useEffect(() => {
    if (!cloud || !hydratedUid) return;
    const userId = hydratedUid;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight: Promise<void> | null = null;
    let stopped = false;

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void run(), ms);
    };
    scheduleRef.current = schedule;

    const run = (): Promise<void> => {
      if (inFlight) return inFlight;
      inFlight = (async () => {
        const meta = readMeta(localStorage);
        if (stopped || !meta?.dirty || meta.userId !== userId || statusRef.current === 'conflict') return;
        setSyncStatus('saving');
        const seen = writeCounter.current;
        try {
          const res = await pushNow(localStorage, cloud.store, userId);
          if (res.status === 'conflict') {
            setSyncStatus('conflict');
            return;
          }
          const changedMeanwhile = writeCounter.current !== seen;
          writeMeta(localStorage, { userId, revision: res.revision, dirty: changedMeanwhile });
          setLastSyncedAt(Date.now());
          setSyncStatus('saved');
          if (changedMeanwhile) schedule(1500);
        } catch {
          setSyncStatus('offline');
          schedule(15000); // tenta de novo sozinho
        }
      })().finally(() => {
        inFlight = null;
      });
      return inFlight;
    };
    flushRef.current = run;

    const onLocalWrite = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key ?? '';
      if (!key.startsWith(SLICE_PREFIX)) return;
      writeCounter.current++;
      const meta = readMeta(localStorage);
      writeMeta(localStorage, {
        userId,
        revision: meta && meta.userId === userId ? meta.revision : null,
        dirty: true
      });
      if (statusRef.current !== 'conflict') schedule(2000);
    };
    const onOnline = () => schedule(500);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') schedule(0);
    };

    window.addEventListener(LOCAL_WRITE_EVENT, onLocalWrite);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);
    if (readMeta(localStorage)?.dirty) schedule(500); // havia algo pendente da última sessão

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener(LOCAL_WRITE_EVENT, onLocalWrite);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [cloud, hydratedUid, setSyncStatus]);

  /* ----------------------------------------------------------- ações */
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!cloud) return { error: 'Contas ainda não estão disponíveis neste ambiente.' };
      const { error } = await cloud.client.auth.signInWithPassword({ email: email.trim(), password });
      return error ? { error: translateAuthError(error.message, (error as { code?: string }).code) } : {};
    },
    [cloud]
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!cloud) return { error: 'Contas ainda não estão disponíveis neste ambiente.' };
      if (password.length < 8) return { error: 'A senha precisa ter ao menos 8 caracteres.' };
      const { data, error } = await cloud.client.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${origin}/app` }
      });
      if (error) return { error: translateAuthError(error.message, (error as { code?: string }).code) };
      // Com confirmação de e-mail ligada, e-mail já cadastrado volta "sucesso" sem identidades.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
        return { error: 'Este e-mail já tem conta. Entre ou recupere a senha.' };
      if (!data.session) return { needsEmailConfirmation: true };
      return {};
    },
    [cloud, origin]
  );

  const sendMagicLink = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!cloud) return { error: 'Contas ainda não estão disponíveis neste ambiente.' };
      const { error } = await cloud.client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${origin}/app`, shouldCreateUser: false }
      });
      return error ? { error: translateAuthError(error.message, (error as { code?: string }).code) } : { emailSent: true };
    },
    [cloud, origin]
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!cloud) return { error: 'Contas ainda não estão disponíveis neste ambiente.' };
      const { error } = await cloud.client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/app` });
      return error ? { error: translateAuthError(error.message, (error as { code?: string }).code) } : { emailSent: true };
    },
    [cloud, origin]
  );

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!cloud) return { error: 'Contas ainda não estão disponíveis neste ambiente.' };
      if (password.length < 8) return { error: 'A senha precisa ter ao menos 8 caracteres.' };
      const { error } = await cloud.client.auth.updateUser({ password });
      if (error) return { error: translateAuthError(error.message, (error as { code?: string }).code) };
      setRecovery(false);
      return {};
    },
    [cloud]
  );

  const signOut = useCallback(async () => {
    if (cloud && hydratedUid) {
      // tenta enviar o que estiver pendente antes de limpar este aparelho
      await Promise.race([flushRef.current(), new Promise((r) => setTimeout(r, 4000))]);
      if (readMeta(localStorage)?.dirty) {
        const leave = window.confirm(
          'Há alterações que ainda não foram sincronizadas e serão perdidas se você sair agora. Sair mesmo assim?'
        );
        if (!leave) return;
      }
    }
    wipeLocal(localStorage); // evita que a próxima pessoa neste aparelho veja estes dados
    try {
      await cloud?.client.auth.signOut();
    } catch {
      // sessão local já foi limpa
    }
    window.location.assign('/');
  }, [cloud, hydratedUid]);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!cloud || !sessionRef.current) return { error: 'Você precisa estar logado.' };
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionRef.current.access_token}` }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.error || 'Não foi possível excluir a conta agora.' };
      }
    } catch {
      return { error: 'Sem conexão. Tente novamente.' };
    }
    wipeLocal(localStorage);
    try {
      await cloud.client.auth.signOut({ scope: 'local' });
    } catch {
      // o usuário já não existe mais no servidor
    }
    window.location.assign('/');
    return {};
  }, [cloud]);

  const resolveConflict = useCallback(
    async (choice: 'cloud' | 'local') => {
      if (!cloud || !hydratedUid) return;
      if (choice === 'cloud') {
        await resolveWithCloudVersion(localStorage, cloud.store, hydratedUid);
        window.location.reload(); // recarrega para o React ler o estado novo
        return;
      }
      try {
        const res = await pushNow(localStorage, cloud.store, hydratedUid, { force: true });
        if (res.status === 'saved') {
          writeMeta(localStorage, { userId: hydratedUid, revision: res.revision, dirty: false });
          setSyncStatus('saved');
          setLastSyncedAt(Date.now());
        }
      } catch {
        setSyncStatus('offline');
        scheduleRef.current(15000);
      }
    },
    [cloud, hydratedUid, setSyncStatus]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      cloudEnabled: Boolean(cloud),
      user: session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null,
      recovery,
      syncStatus,
      lastSyncedAt,
      signInWithPassword,
      signUpWithPassword,
      sendMagicLink,
      sendPasswordReset,
      updatePassword,
      signOut,
      deleteAccount,
      resolveConflict
    }),
    [
      cloud, session, recovery, syncStatus, lastSyncedAt, signInWithPassword, signUpWithPassword,
      sendMagicLink, sendPasswordReset, updatePassword, signOut, deleteAccount, resolveConflict
    ]
  );

  if (phase !== 'ready') return <Splash />;

  return (
    <AuthContext.Provider value={value}>
      {/* key: ao trocar de conta o app inteiro remonta e relê o estado já hidratado */}
      <React.Fragment key={hydratedUid ?? 'anon'}>{children}</React.Fragment>
      {syncStatus === 'conflict' && hydratedUid && (
        <div role="alertdialog" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,34rem)] p-4 rounded-2xl bg-[#16181D] border border-[#D7FF3F]/40 shadow-2xl text-xs text-[#F3F0EB] space-y-3">
          <div className="font-bold text-white">Seus dados foram alterados em outro aparelho</div>
          <p className="text-[#8D9298]">
            Existem alterações aqui e na nuvem. Escolha qual versão manter — a outra fica guardada como backup neste aparelho.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => void resolveConflict('cloud')}
              className="flex-1 px-3 py-2 rounded-lg font-bold bg-[#D7FF3F] text-[#101114] hover:bg-white transition-colors cursor-pointer"
            >
              Usar a versão da nuvem
            </button>
            <button
              onClick={() => void resolveConflict('local')}
              className="flex-1 px-3 py-2 rounded-lg font-semibold bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Manter a deste aparelho
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
