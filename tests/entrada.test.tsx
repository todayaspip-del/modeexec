import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

// ---- Supabase simulado: controlamos sessão e dados da "nuvem" por teste ----
const cloudState: { enabled: boolean; session: any; rows: Map<string, any> } = { enabled: false, session: null, rows: new Map() };
vi.mock('../src/lib/supabase', () => ({
  loadCloud: async () => {
    if (!cloudState.enabled) return null;
    return {
      client: {
        auth: {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          getSession: async () => ({ data: { session: cloudState.session } }),
          signOut: async () => ({})
        }
      },
      store: {
        fetch: async (u: string) => cloudState.rows.get(u) ?? null,
        insert: async (u: string, data: any) => { cloudState.rows.set(u, { data, revision: 1, schemaVersion: 2 }); return { ok: true, revision: 1 }; },
        update: async (u: string, data: any, _sv: number, exp: number) => { const r = cloudState.rows.get(u); if (!r || r.revision !== exp) return { ok: false, conflict: true }; cloudState.rows.set(u, { data, revision: exp + 1, schemaVersion: 2 }); return { ok: true, revision: exp + 1 }; }
      }
    };
  }
}));

// Componentes pesados/visuais que não importam para estes testes.
vi.mock('../src/components/common/VideoLoadingSequence', () => ({ VideoLoadingSequence: () => <div data-testid="boot-video" /> }));
vi.mock('../src/components/common/SmoothCursor', () => ({ SmoothCursor: () => null }));
vi.mock('../src/components/mac/MacDesktopShell', () => ({ MacDesktopShell: () => <div data-testid="mac-shell">APP-SHELL</div> }));

const goto = (path: string) => window.history.replaceState({}, '', path);
const P = 'modo_execucao_storage_v2_';

async function mountApp() {
  vi.resetModules(); // cada teste começa com módulos "limpos" (estado de módulo do aiClient etc.)
  const { default: App } = await import('../src/App');
  return render(<App />);
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  cloudState.enabled = false;
  cloudState.session = null;
  cloudState.rows = new Map();
});

describe('Item 6 — primeiro acesso (modo local)', () => {
  it('"/" mostra a LANDING (antes caía direto no dashboard) e não grava dados demo', async () => {
    goto('/');
    await mountApp();
    await waitFor(() => expect(screen.getAllByText(/MODO EXECUÇÃO/i).length).toBeGreaterThan(0));
    expect(screen.queryByTestId('mac-shell')).toBeNull();
    expect(screen.queryByTestId('boot-video')).toBeNull(); // sem vídeo de abertura na landing
    expect(screen.queryByText(/Rafael/)).toBeNull();
  });

  it('"/app" sem onboarding redireciona para /onboarding, em vez de abrir os dados do Rafael', async () => {
    goto('/app');
    await mountApp();
    await waitFor(() => expect(window.location.pathname).toBe('/onboarding'));
    expect(await screen.findByText(/Como você gostaria de ser chamado/i)).toBeTruthy();
    expect(screen.queryByTestId('mac-shell')).toBeNull();
    expect(screen.queryByText(/Rafael/)).toBeNull();
  });

  it('o estado inicial não contém projetos, tarefas nem decisões de demonstração', async () => {
    goto('/app/projetos');
    await mountApp();
    await waitFor(() => expect(window.location.pathname).toBe('/onboarding'));
    for (const k of ['projects', 'tasks', 'decisions', 'processes', 'stages', 'ideas']) {
      const raw = localStorage.getItem(P + k);
      expect(raw === null || raw === '[]', `slice ${k} deveria estar vazio`).toBe(true);
    }
  });

  it('usuário com onboarding concluído entra direto no app', async () => {
    localStorage.setItem(P + 'profile', JSON.stringify({ name: 'Ana', business: 'Loja', teamSize: '1 pessoa', currentMode: 'Normal', dailyMinutes: 20, isDemo: false, onboardingCompleted: true, createdAt: '2026-10-01T00:00:00Z' }));
    goto('/app');
    await mountApp();
    expect(await screen.findByTestId('mac-shell')).toBeTruthy();
    expect(window.location.pathname).toBe('/app');
  });

  it('"explorar com dados de exemplo" é opt-in, explícito, e libera o app', async () => {
    goto('/onboarding');
    await mountApp();
    const btn = await screen.findByText(/explorar primeiro, com dados de exemplo/i);
    btn.click();
    expect(await screen.findByTestId('mac-shell')).toBeTruthy();
    const profile = JSON.parse(localStorage.getItem(P + 'profile')!);
    expect(profile.isDemo).toBe(true);
  });
});

describe('Item 2 — contas (modo nuvem)', () => {
  it('sem sessão, "/app" mostra o LOGIN (não o app, não o onboarding)', async () => {
    cloudState.enabled = true;
    goto('/app');
    await mountApp();
    expect(await screen.findByText(/Entre na sua Central de Execução/i)).toBeTruthy();
    expect(screen.queryByTestId('mac-shell')).toBeNull();
  });

  it('sem sessão, a landing e o diagnóstico continuam públicos', async () => {
    cloudState.enabled = true;
    goto('/');
    await mountApp();
    await waitFor(() => expect(screen.getAllByText(/MODO EXECUÇÃO/i).length).toBeGreaterThan(0));
    expect(screen.queryByText(/Entre na sua Central de Execução/i)).toBeNull();
  });

  it('com sessão e dados na nuvem: hidrata do banco e abre o app (mesmo com localStorage vazio / outro aparelho)', async () => {
    cloudState.enabled = true;
    cloudState.session = { access_token: 't', user: { id: 'u1', email: 'ana@x.com' } };
    cloudState.rows.set('u1', {
      revision: 7, schemaVersion: 2,
      data: { v2_profile: { name: 'Ana da Nuvem', business: 'Loja', teamSize: '1 pessoa', currentMode: 'Normal', dailyMinutes: 20, isDemo: false, onboardingCompleted: true, createdAt: '2026-10-01T00:00:00Z' } }
    });
    goto('/app');
    await mountApp();
    expect(await screen.findByTestId('mac-shell')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(P + 'profile')!).name).toBe('Ana da Nuvem');
    expect(JSON.parse(localStorage.getItem('modo_execucao_sync_meta')!)).toMatchObject({ userId: 'u1', revision: 7, dirty: false });
  });

  it('conta nova (nuvem vazia) com demo antigo no aparelho: demo é descartado e o usuário vai ao onboarding', async () => {
    cloudState.enabled = true;
    cloudState.session = { access_token: 't', user: { id: 'novo', email: 'novo@x.com' } };
    localStorage.setItem(P + 'profile', JSON.stringify({ name: 'Rafael', isDemo: true, onboardingCompleted: true }));
    localStorage.setItem(P + 'tasks', JSON.stringify([{ id: 'demo-1' }]));
    goto('/app');
    await mountApp();
    await waitFor(() => expect(window.location.pathname).toBe('/onboarding'));
    expect(await screen.findByText(/Como você gostaria de ser chamado/i)).toBeTruthy();
    expect(cloudState.rows.has('novo')).toBe(false); // demo não foi para a conta
    expect(localStorage.getItem(P + 'tasks')).toBeNull();
  });

  it('alterações locais são enviadas à nuvem (debounce) e a revisão avança', async () => {
    cloudState.enabled = true;
    cloudState.session = { access_token: 't', user: { id: 'u2', email: 'b@x.com' } };
    cloudState.rows.set('u2', { revision: 1, schemaVersion: 2, data: { v2_profile: { name: 'B', business: 'x', teamSize: '1 pessoa', currentMode: 'Normal', dailyMinutes: 20, isDemo: false, onboardingCompleted: true, createdAt: '2026-10-01T00:00:00Z' } } });
    goto('/app/configuracoes');
    await mountApp();
    await screen.findByTestId('mac-shell');
    const { safeWrite } = await import('../src/lib/storage');
    safeWrite(P + 'ideas', [{ id: 'i1', text: 'nova ideia' }]); // simula qualquer alteração do app
    await waitFor(() => expect(cloudState.rows.get('u2').revision).toBe(2), { timeout: 6000 });
    expect(cloudState.rows.get('u2').data.v2_ideas).toEqual([{ id: 'i1', text: 'nova ideia' }]);
    expect(JSON.parse(localStorage.getItem('modo_execucao_sync_meta')!)).toMatchObject({ revision: 2, dirty: false });
  });
});
