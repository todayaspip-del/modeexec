import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export type RouteName =
  | 'landing'
  | 'diagnostico'
  | 'onboarding'
  | 'biblioteca'
  | 'configuracoes'
  | 'missao'
  | 'app-home'
  | 'programa'
  | 'projetos'
  | 'projeto-mesa'
  | 'tarefas'
  | 'decisoes'
  | 'conversas'
  | 'processos'
  | 'revisao'
  | 'recuperacao'
  | 'workspace'
  | 'not-found';

export interface ParsedRoute {
  name: RouteName;
  params: Record<string, string>;
}

/**
 * Parses path and extracts route name and parameters.
 * Strips query string, hash and trailing slash before matching.
 */
export function parseRoute(path: string): ParsedRoute {
  if (!path) {
    return { name: 'app-home', params: {} };
  }

  // 1. Strip query string and hash
  let clean = path.split(/[?#]/)[0].trim();

  // 2. Strip trailing slashes (except root '/')
  clean = clean.replace(/\/+$/, '');
  if (clean === '') {
    clean = '/';
  }

  // 3. Static public matches
  if (clean === '/' || clean === '/landing') {
    return { name: 'landing', params: {} };
  }
  if (clean === '/diagnostico') {
    return { name: 'diagnostico', params: {} };
  }
  if (clean === '/onboarding') {
    return { name: 'onboarding', params: {} };
  }
  if (clean === '/biblioteca') {
    return { name: 'biblioteca', params: {} };
  }
  if (clean === '/configuracoes') {
    return { name: 'configuracoes', params: {} };
  }

  // 4. Parametrized mission: /app/missao/:id (or /app/missao)
  const missaoMatch = clean.match(/^\/app\/missao(?:\/([^/]+))?$/);
  if (missaoMatch) {
    return {
      name: 'missao',
      params: missaoMatch[1] ? { id: missaoMatch[1] } : {}
    };
  }

  // 5. Static /app routes
  if (clean === '/app') {
    return { name: 'app-home', params: {} };
  }
  if (clean === '/app/programa') {
    return { name: 'programa', params: {} };
  }
  if (clean === '/app/projetos') {
    return { name: 'projetos', params: {} };
  }

  // 6. Parametrized project table: /app/projetos/:projectId
  const projectMesaMatch = clean.match(/^\/app\/projetos\/([^/]+)$/);
  if (projectMesaMatch) {
    return {
      name: 'projeto-mesa',
      params: { projectId: projectMesaMatch[1] }
    };
  }

  if (clean === '/app/tarefas') {
    return { name: 'tarefas', params: {} };
  }
  if (clean === '/app/decisoes') {
    return { name: 'decisoes', params: {} };
  }
  if (clean === '/app/conversas') {
    return { name: 'conversas', params: {} };
  }
  if (clean === '/app/processos') {
    return { name: 'processos', params: {} };
  }
  if (clean === '/app/revisao') {
    return { name: 'revisao', params: {} };
  }
  if (clean === '/app/recuperacao') {
    return { name: 'recuperacao', params: {} };
  }
  if (clean === '/app/workspace') {
    return { name: 'workspace', params: {} };
  }

  // 7. Unknown /app/* paths fall back to the dashboard (preserving existing App.tsx behavior)
  if (clean.startsWith('/app')) {
    return { name: 'app-home', params: {} };
  }

  return { name: 'not-found', params: {} };
}

/**
 * Hook that re-reads window.location.search whenever currentRoute from useApp() changes.
 */
export function useQueryParams(): URLSearchParams {
  const { currentRoute } = useApp();

  return useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    const queryIdx = currentRoute.indexOf('?');
    if (queryIdx !== -1) {
      return new URLSearchParams(currentRoute.slice(queryIdx));
    }
    return new URLSearchParams();
  }, [currentRoute]);
}
