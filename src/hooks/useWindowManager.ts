import { useState, useCallback, useEffect, useRef } from 'react';

export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isSnapped?: 'left' | 'right' | 'top' | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  prevGeometry?: { x: number; y: number; width: number; height: number };
  zIndex: number;
  params?: Record<string, any>;
}

export type AppWindowId =
  | 'main'
  | 'hoje'
  | 'tarefas'
  | 'projetos'
  | 'trello-mesa'
  | 'decisoes'
  | 'programa'
  | 'conversas'
  | 'processos'
  | 'revisao'
  | 'recuperacao'
  | 'configuracoes'
  | 'biblioteca'
  | 'missao'
  | 'postit';

interface WindowConfig {
  id: AppWindowId;
  title: string;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
}

export const INITIAL_WINDOWS_CONFIG: Record<AppWindowId, WindowConfig> = {
  main: {
    id: 'main',
    title: 'Modo Execução • Plataforma Unificada',
    defaultPosition: { x: 70, y: 46 },
    defaultSize: { width: 1060, height: 680 }
  },
  hoje: {
    id: 'hoje',
    title: 'Hoje (Ação de Agora)',
    defaultPosition: { x: 90, y: 55 },
    defaultSize: { width: 880, height: 600 }
  },
  'trello-mesa': {
    id: 'trello-mesa',
    title: 'Mesa Executiva (Trello Workspace)',
    defaultPosition: { x: 140, y: 65 },
    defaultSize: { width: 980, height: 640 }
  },
  tarefas: {
    id: 'tarefas',
    title: 'Minhas Tarefas Físicas & Ações',
    defaultPosition: { x: 90, y: 70 },
    defaultSize: { width: 840, height: 580 }
  },
  projetos: {
    id: 'projetos',
    title: 'Projetos Ativos',
    defaultPosition: { x: 100, y: 80 },
    defaultSize: { width: 860, height: 580 }
  },
  decisoes: {
    id: 'decisoes',
    title: 'Decisões Pendentes',
    defaultPosition: { x: 140, y: 90 },
    defaultSize: { width: 820, height: 560 }
  },
  programa: {
    id: 'programa',
    title: 'Programa 30 Dias',
    defaultPosition: { x: 110, y: 65 },
    defaultSize: { width: 900, height: 620 }
  },
  conversas: {
    id: 'conversas',
    title: 'Conversas Difíceis (Roteiros & Scripts)',
    defaultPosition: { x: 150, y: 85 },
    defaultSize: { width: 850, height: 580 }
  },
  processos: {
    id: 'processos',
    title: 'Processos & Delegação (SOPs)',
    defaultPosition: { x: 130, y: 75 },
    defaultSize: { width: 860, height: 580 }
  },
  revisao: {
    id: 'revisao',
    title: 'Revisão Semanal',
    defaultPosition: { x: 160, y: 70 },
    defaultSize: { width: 880, height: 600 }
  },
  recuperacao: {
    id: 'recuperacao',
    title: 'Modo Recuperação (SOS Executivo)',
    defaultPosition: { x: 180, y: 100 },
    defaultSize: { width: 800, height: 540 }
  },
  configuracoes: {
    id: 'configuracoes',
    title: 'Ajustes do Sistema & Perfil',
    defaultPosition: { x: 200, y: 110 },
    defaultSize: { width: 780, height: 560 }
  },
  biblioteca: {
    id: 'biblioteca',
    title: 'Biblioteca de Execução & Ativos',
    defaultPosition: { x: 140, y: 80 },
    defaultSize: { width: 880, height: 600 }
  },
  missao: {
    id: 'missao',
    title: 'Missão do Dia (Protocolo 30 Dias)',
    defaultPosition: { x: 120, y: 70 },
    defaultSize: { width: 860, height: 620 }
  },
  postit: {
    id: 'postit',
    title: 'Notas Rápidas (Post-it)',
    defaultPosition: { x: 260, y: 120 },
    defaultSize: { width: 380, height: 420 }
  }
};

const STORAGE_KEY_WINDOWS = 'modo_execucao_mac_windows_v4';

export function useWindowManager(initialRoute?: string) {
  const nextZIndexRef = useRef(100);

  // Initialize windows
  const [windows, setWindows] = useState<Record<string, WindowState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WINDOWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {}

    const initialMap: Record<string, WindowState> = {};
    Object.values(INITIAL_WINDOWS_CONFIG).forEach((cfg, idx) => {
      initialMap[cfg.id] = {
        id: cfg.id,
        title: cfg.title,
        isOpen: cfg.id === 'main',
        isMinimized: false,
        isMaximized: false,
        position: cfg.defaultPosition,
        size: cfg.defaultSize,
        zIndex: 50 + idx
      };
    });
    return initialMap;
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>('main');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WINDOWS, JSON.stringify(windows));
    } catch {}
  }, [windows]);

  // Bring window to front
  const focusWindow = useCallback((id: string) => {
    nextZIndexRef.current += 1;
    const currentHighest = nextZIndexRef.current;

    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return {
        ...prev,
        [id]: {
          ...target,
          isMinimized: false,
          zIndex: currentHighest
        }
      };
    });
    setActiveWindowId(id);
  }, []);

  // Open window
  const openWindow = useCallback(
    (id: string, params?: Record<string, any>) => {
      nextZIndexRef.current += 1;
      const currentHighest = nextZIndexRef.current;

      setWindows((prev) => {
        const existing = prev[id];
        const config = INITIAL_WINDOWS_CONFIG[id as AppWindowId];

        if (existing) {
          return {
            ...prev,
            [id]: {
              ...existing,
              isOpen: true,
              isMinimized: false,
              zIndex: currentHighest,
              params: params ? { ...existing.params, ...params } : existing.params
            }
          };
        }

        // New window fallback
        return {
          ...prev,
          [id]: {
            id,
            title: config?.title || id,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: config?.defaultPosition || { x: 100, y: 80 },
            size: config?.defaultSize || { width: 840, height: 580 },
            zIndex: currentHighest,
            params
          }
        };
      });
      setActiveWindowId(id);
    },
    []
  );

  // Close window
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return {
        ...prev,
        [id]: {
          ...target,
          isOpen: false,
          isMinimized: false,
          isMaximized: false
        }
      };
    });

    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  // Minimize window (to dock)
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return {
        ...prev,
        [id]: {
          ...target,
          isMinimized: true
        }
      };
    });

    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  // Toggle maximize
  const toggleMaximizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;

      if (target.isMaximized) {
        // Restore to previous position & size
        return {
          ...prev,
          [id]: {
            ...target,
            isMaximized: false,
            isSnapped: null,
            position: target.prevGeometry ? { x: target.prevGeometry.x, y: target.prevGeometry.y } : target.position,
            size: target.prevGeometry ? { width: target.prevGeometry.width, height: target.prevGeometry.height } : target.size
          }
        };
      } else {
        // Maximize
        return {
          ...prev,
          [id]: {
            ...target,
            isMaximized: true,
            isSnapped: null,
            prevGeometry: {
              x: target.position.x,
              y: target.position.y,
              width: target.size.width,
              height: target.size.height
            }
          }
        };
      }
    });
  }, []);

  // Snap window (left, right, top)
  const snapWindow = useCallback((id: string, snapType: 'left' | 'right' | 'top') => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;

      return {
        ...prev,
        [id]: {
          ...target,
          isSnapped: snapType,
          isMaximized: snapType === 'top',
          prevGeometry: target.prevGeometry || {
            x: target.position.x,
            y: target.position.y,
            width: target.size.width,
            height: target.size.height
          }
        }
      };
    });
  }, []);

  // Update window position
  const updateWindowPosition = useCallback((id: string, pos: { x: number; y: number }) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return {
        ...prev,
        [id]: {
          ...target,
          position: pos,
          isMaximized: false,
          isSnapped: null
        }
      };
    });
  }, []);

  // Update window size
  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }, pos?: { x: number; y: number }) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return {
        ...prev,
        [id]: {
          ...target,
          size,
          position: pos ? pos : target.position,
          isMaximized: false,
          isSnapped: null
        }
      };
    });
  }, []);

  return {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    snapWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize
  };
}
