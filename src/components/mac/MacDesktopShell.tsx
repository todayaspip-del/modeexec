import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useWindowManager, AppWindowId } from '../../hooks/useWindowManager';
import { MacTopBar, WALLPAPER_PRESETS } from './MacTopBar';
import { MacWindow } from './MacWindow';
import { MacOsDock } from '../common/MacOsDock';
import { PostItNote } from '../common/PostItNote';

// Pages wrapped in macOS Windows
import { DashboardPage } from '../../pages/DashboardPage';
import { TasksPage } from '../../pages/TasksPage';
import { ProjectsPage } from '../../pages/ProjectsPage';
import { DecisionsPage } from '../../pages/DecisionsPage';
import { ProgramPage } from '../../pages/ProgramPage';
import { ConversationsPage } from '../../pages/ConversationsPage';
import { ProcessesPage } from '../../pages/ProcessesPage';
import { WeeklyReviewPage } from '../../pages/WeeklyReviewPage';
import { RecoveryPage } from '../../pages/RecoveryPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { LibraryPage } from '../../pages/LibraryPage';
import { MissionDetailPage } from '../../pages/MissionDetailPage';
import { MacDesktop as TrelloMesaWorkspace } from '../common/MacDesktop';

import {
  Compass,
  CheckSquare,
  FolderKanban,
  Scale,
  CalendarCheck2,
  MessageSquareWarning,
  Workflow,
  Sparkles,
  LifeBuoy,
  Settings,
  StickyNote,
  LayoutDashboard,
  BookOpen,
  Target,
  ExternalLink,
  X,
  SplitSquareHorizontal,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MacDesktopShellProps {
  initialAppId?: AppWindowId;
  projectId?: string;
  onSwitchToClassic?: () => void;
}

const STORAGE_KEY_WALLPAPER = 'modo_execucao_mac_wallpaper_v2';

interface AppTabConfig {
  id: AppWindowId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color: string;
  shortDesc: string;
}

const APP_TABS: AppTabConfig[] = [
  { id: 'hoje', label: 'Hoje', icon: Compass, badge: 'Agora', color: 'text-amber-400', shortDesc: 'Prioridades e foco imediato' },
  { id: 'trello-mesa', label: 'Mesa Trello', icon: LayoutDashboard, badge: 'Kanban', color: 'text-blue-400', shortDesc: 'Visual Trello macOS' },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare, color: 'text-emerald-400', shortDesc: 'Ações físicas e próximas tarefas' },
  { id: 'projetos', label: 'Projetos', icon: FolderKanban, color: 'text-indigo-400', shortDesc: 'Mesas e projetos em andamento' },
  { id: 'decisoes', label: 'Decisões', icon: Scale, color: 'text-amber-300', shortDesc: 'Decisões pendentes e critérios' },
  { id: 'programa', label: 'Programa 30D', icon: CalendarCheck2, badge: '30D', color: 'text-red-400', shortDesc: 'Protocolo de transformação' },
  { id: 'conversas', label: 'Conversas', icon: MessageSquareWarning, color: 'text-rose-400', shortDesc: 'Roteiros difíceis' },
  { id: 'processos', label: 'Processos', icon: Workflow, badge: 'SOPs', color: 'text-cyan-400', shortDesc: 'Delegação e rotinas' },
  { id: 'revisao', label: 'Revisão', icon: Sparkles, color: 'text-purple-400', shortDesc: 'Revisão semanal executiva' },
  { id: 'recuperacao', label: 'SOS', icon: LifeBuoy, badge: 'SOS', color: 'text-orange-400', shortDesc: 'Modo Recuperação anti-paralisia' },
  { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen, color: 'text-sky-400', shortDesc: 'Ativos e materiais de apoio' },
  { id: 'configuracoes', label: 'Ajustes', icon: Settings, color: 'text-slate-400', shortDesc: 'Preferências do sistema' }
];

export const MacDesktopShell: React.FC<MacDesktopShellProps> = ({
  initialAppId,
  projectId,
  onSwitchToClassic
}) => {
  const { currentRoute, projects, showToast, activeTodayMission } = useApp();

  const {
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
  } = useWindowManager(currentRoute);

  // Active tab within the Main Unified Window
  const [mainActiveTab, setMainActiveTab] = useState<AppWindowId>(() => {
    if (initialAppId && initialAppId !== 'main') return initialAppId;
    return 'hoje';
  });

  // Prompt state for "OPEN IN A SEPARATE WINDOW?"
  const [promptTab, setPromptTab] = useState<{
    tabId: AppWindowId;
    label: string;
    tabElementLeft: number;
  } | null>(null);

  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Selected wallpaper preset
  const [currentWallpaper, setCurrentWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_WALLPAPER) || WALLPAPER_PRESETS[0].style;
    } catch {
      return WALLPAPER_PRESETS[0].style;
    }
  });

  const handleSelectWallpaper = (style: string) => {
    setCurrentWallpaper(style);
    try {
      localStorage.setItem(STORAGE_KEY_WALLPAPER, style);
    } catch {}
  };

  // Sync route with main window tab
  useEffect(() => {
    if (initialAppId && initialAppId !== 'main') {
      setMainActiveTab(initialAppId);
      openWindow('main');
    } else if (currentRoute.includes('/app/projetos/')) {
      setMainActiveTab('trello-mesa');
      openWindow('main');
    } else if (currentRoute.includes('/app/tarefas')) {
      setMainActiveTab('tarefas');
      openWindow('main');
    } else if (currentRoute.includes('/app/decisoes')) {
      setMainActiveTab('decisoes');
      openWindow('main');
    } else if (currentRoute.includes('/app/programa') || currentRoute.includes('/app/missao')) {
      setMainActiveTab('programa');
      openWindow('main');
    } else if (currentRoute.includes('/app/conversas')) {
      setMainActiveTab('conversas');
      openWindow('main');
    } else if (currentRoute.includes('/app/processos')) {
      setMainActiveTab('processos');
      openWindow('main');
    } else if (currentRoute.includes('/app/revisao')) {
      setMainActiveTab('revisao');
      openWindow('main');
    } else if (currentRoute.includes('/app/recuperacao')) {
      setMainActiveTab('recuperacao');
      openWindow('main');
    } else if (currentRoute.includes('/configuracoes')) {
      setMainActiveTab('configuracoes');
      openWindow('main');
    } else if (currentRoute === '/app') {
      setMainActiveTab('hoje');
      openWindow('main');
    }
  }, [currentRoute, initialAppId, openWindow]);

  // Close prompt on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (promptBoxRef.current && !promptBoxRef.current.contains(e.target as Node)) {
        setPromptTab(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    };
  }, []);

  // Active App name for the top menu bar
  const activeAppName = useMemo(() => {
    if (!activeWindowId) return 'Finder';
    if (activeWindowId === 'main') {
      const activeTabDef = APP_TABS.find((t) => t.id === mainActiveTab);
      return activeTabDef ? `Modo Execução — ${activeTabDef.label}` : 'Modo Execução';
    }
    const active = windows[activeWindowId];
    return active ? active.title : 'Finder';
  }, [activeWindowId, mainActiveTab, windows]);

  // Close all windows
  const handleCloseAllWindows = () => {
    Object.keys(windows).forEach((id) => {
      minimizeWindow(id);
    });
  };

  // Target project for Trello Mesa
  const targetProject = useMemo(() => {
    const mesaWin = windows['trello-mesa'];
    const pid = mesaWin?.params?.projectId || projectId;
    return projects.find((p) => p.id === pid) || projects[0];
  }, [windows, projectId, projects]);

  // --------------------------------------------------------------------------
  // TAB CLICK HANDLER: Switch tab & show subtle "OPEN IN A SEPARATE WINDOW?" box
  // --------------------------------------------------------------------------
  const handleTabClick = (tabId: AppWindowId, label: string, e: React.MouseEvent<HTMLElement>) => {
    // 1. Immediately switch view inside the current main window (zero friction!)
    setMainActiveTab(tabId);

    // 2. Clear any active auto-dismiss timer
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
    }

    // 3. Calculate position relative to tab bar container
    let tabLeft = 20;
    if (tabBarRef.current) {
      const barRect = tabBarRef.current.getBoundingClientRect();
      const targetRect = e.currentTarget.getBoundingClientRect();
      tabLeft = targetRect.left - barRect.left + targetRect.width / 2;
    }

    setPromptTab({
      tabId,
      label,
      tabElementLeft: tabLeft
    });

    // 4. Auto-dismiss after 6 seconds so user's workflow is never interrupted
    promptTimerRef.current = setTimeout(() => {
      setPromptTab(null);
    }, 6000);
  };

  // --------------------------------------------------------------------------
  // USER CHOOSES "YES": Create separate window for that tab
  // --------------------------------------------------------------------------
  const handleConfirmSeparateWindow = (tabId: AppWindowId, label: string) => {
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    setPromptTab(null);

    // Position the new window slightly offset to the right so user can immediately compare side-by-side
    const mainPos = windows['main']?.position || { x: 70, y: 46 };
    const offsetRightX = Math.min(window.innerWidth - 860, mainPos.x + 320);
    const offsetRightY = Math.min(window.innerHeight - 600, mainPos.y + 35);

    openWindow(tabId, tabId === 'trello-mesa' && targetProject?.id ? { projectId: targetProject.id } : undefined);
    updateWindowPosition(tabId, {
      x: Math.max(30, offsetRightX),
      y: Math.max(35, offsetRightY)
    });
    focusWindow(tabId);

    showToast(`Janela de "${label}" criada! Arraste ou use os botões no topo para alinhar lado a lado.`, 'success');
  };

  // --------------------------------------------------------------------------
  // DOCK & DESKTOP LAUNCH HANDLER
  // --------------------------------------------------------------------------
  const handleAppLaunch = (appId: string) => {
    if (appId === 'main') {
      openWindow('main');
      focusWindow('main');
      return;
    }
    if (appId === 'postit') {
      openWindow('postit');
      focusWindow('postit');
      return;
    }

    // If separate window for this app is already open on desktop, focus it!
    if (windows[appId]?.isOpen && !windows[appId]?.isMinimized) {
      focusWindow(appId);
      return;
    }

    // Otherwise, ensure main window is open, focus it, and switch to that tab!
    openWindow('main');
    focusWindow('main');
    setMainActiveTab(appId as AppWindowId);
  };

  // Reintegrate separate window back into main window
  const handleReintegrate = (id: string, label: string) => {
    closeWindow(id);
    setMainActiveTab(id as AppWindowId);
    openWindow('main');
    focusWindow('main');
    showToast(`Janela "${label}" reintegrada na visualização principal.`, 'info');
  };

  // --------------------------------------------------------------------------
  // RENDER TAB VIEW CONTENT (inside Main Window)
  // --------------------------------------------------------------------------
  const renderTabContent = (tabId: AppWindowId) => {
    switch (tabId) {
      case 'trello-mesa':
        return (
          <div className="w-full h-full flex flex-col overflow-hidden bg-[#0c1024]">
            <TrelloMesaWorkspace
              project={targetProject}
              projectId={targetProject?.id}
              embedded={true}
              onSwitchToClassic={() => setMainActiveTab('projetos')}
            />
          </div>
        );

      case 'tarefas':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <TasksPage />
          </div>
        );

      case 'projetos':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <ProjectsPage />
          </div>
        );

      case 'decisoes':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <DecisionsPage />
          </div>
        );

      case 'programa':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <ProgramPage />
          </div>
        );

      case 'conversas':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <ConversationsPage />
          </div>
        );

      case 'processos':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <ProcessesPage />
          </div>
        );

      case 'revisao':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <WeeklyReviewPage />
          </div>
        );

      case 'recuperacao':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <RecoveryPage />
          </div>
        );

      case 'biblioteca':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <LibraryPage />
          </div>
        );

      case 'configuracoes':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <SettingsPage />
          </div>
        );

      case 'missao':
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <MissionDetailPage missionId={activeTodayMission.id} />
          </div>
        );

      case 'hoje':
      default:
        return (
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
            <DashboardPage />
          </div>
        );
    }
  };

  const activeTabDef = APP_TABS.find((t) => t.id === mainActiveTab) || APP_TABS[0];
  const ActiveTabIcon = activeTabDef.icon;

  // --------------------------------------------------------------------------
  // RENDER MACOS DESKTOP
  // --------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-30 w-screen h-screen overflow-hidden flex flex-col select-none font-sans"
      style={{
        background: currentWallpaper,
        backgroundSize: 'cover'
      }}
    >
      {/* 1. macOS Top Menu Bar */}
      <MacTopBar
        activeAppName={activeAppName}
        onSelectWallpaper={handleSelectWallpaper}
        currentWallpaper={currentWallpaper}
        onCloseAllWindows={handleCloseAllWindows}
        onOpenApp={(id) => handleAppLaunch(id)}
        onSwitchToClassic={onSwitchToClassic}
      />

      {/* 2. Desktop Canvas Area */}
      <div className="flex-1 relative w-full h-[calc(100vh-28px-64px)] overflow-hidden">
        {/* Desktop Icons (Right column, macOS standard) */}
        <div className="absolute top-4 right-4 flex flex-col gap-4 z-10 hidden sm:flex items-center text-center">
          {/* Main App Window Icon */}
          <div
            onClick={() => handleAppLaunch('main')}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-2 flex items-center justify-center shadow-xl border border-indigo-400/40 backdrop-blur-md group-hover:scale-105 transition-all">
              <Compass className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md bg-black/50 px-2 py-0.5 rounded-md">
              Modo Execução
            </span>
          </div>

          {/* Trello Workspace Icon */}
          <div
            onClick={() => handleAppLaunch('trello-mesa')}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-2 flex items-center justify-center shadow-xl border border-blue-400/40 backdrop-blur-md group-hover:scale-105 transition-all">
              <div className="w-full h-full flex gap-1 p-0.5 items-start justify-center">
                <div className="w-1/2 h-full bg-white rounded-xs" />
                <div className="w-1/2 h-2/3 bg-white rounded-xs" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md bg-black/50 px-2 py-0.5 rounded-md">
              Trello Mesa
            </span>
          </div>

          {/* Tarefas */}
          <div
            onClick={() => handleAppLaunch('tarefas')}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-2 flex items-center justify-center shadow-xl border border-emerald-400/30 backdrop-blur-md group-hover:scale-105 transition-all">
              <CheckSquare className="w-7 h-7 text-emerald-300" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md bg-black/50 px-2 py-0.5 rounded-md">
              Tarefas
            </span>
          </div>

          {/* Post-it Notes */}
          <div
            onClick={() => openWindow('postit')}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 p-2 flex items-center justify-center shadow-xl border border-yellow-200 backdrop-blur-md group-hover:scale-105 transition-all">
              <StickyNote className="w-7 h-7 text-amber-900" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md bg-black/50 px-2 py-0.5 rounded-md">
              Post-it
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. PRIMARY MAIN WINDOW (Holds ALL tabs together in the same window)*/}
        {/* ================================================================== */}
        {windows['main'] && windows['main'].isOpen && (
          <MacWindow
            window={windows['main']}
            isActive={activeWindowId === 'main'}
            icon={<ActiveTabIcon className={`w-3.5 h-3.5 ${activeTabDef.color}`} />}
            onFocus={() => focusWindow('main')}
            onClose={() => closeWindow('main')}
            onMinimize={() => minimizeWindow('main')}
            onToggleMaximize={() => toggleMaximizeWindow('main')}
            onPositionChange={(pos) => updateWindowPosition('main', pos)}
            onSizeChange={(size, pos) => updateWindowSize('main', size, pos)}
            onSnap={(snap) => snapWindow('main', snap)}
            contentClassName="flex-1 overflow-hidden relative flex flex-col bg-[#0F1424]"
          >
            {/* -------------------------------------------------------------- */}
            {/* MACOS TABS TOOLBAR: All tabs organized together in one place  */}
            {/* -------------------------------------------------------------- */}
            <div
              ref={tabBarRef}
              className="relative w-full bg-[#0a0d1d]/95 backdrop-blur-md border-b border-white/10 px-2.5 pt-2 pb-1.5 flex items-center justify-between gap-2 z-20 shrink-0 select-none shadow-xs"
            >
              {/* Scrollable Tab Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar scroll-smooth flex-1 pr-2 py-0.5">
                {APP_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = mainActiveTab === tab.id;
                  const isOpenedSeparately = Boolean(windows[tab.id]?.isOpen && !windows[tab.id]?.isMinimized);

                  return (
                    <button
                      key={tab.id}
                      onClick={(e) => handleTabClick(tab.id, tab.label, e)}
                      title={`${tab.label}: ${tab.shortDesc}${isOpenedSeparately ? ' (Janela aberta separadamente)' : ''}`}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                        isActive
                          ? 'bg-white/15 text-white border-white/20 shadow-md font-semibold'
                          : 'text-white/65 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${tab.color}`} />
                      <span className="truncate max-w-[120px]">{tab.label}</span>

                      {/* Optional Badge */}
                      {tab.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-white/80 border border-white/10">
                          {tab.badge}
                        </span>
                      )}

                      {/* Indicator if this tab is ALREADY running in a separate window */}
                      {isOpenedSeparately && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)] shrink-0"
                          title="Aberta em janela separada"
                        />
                      )}

                      {/* Quick Detach icon on tab */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmSeparateWindow(tab.id, tab.label);
                        }}
                        title="Destacar esta aba em uma nova janela independente"
                        className="opacity-0 group-hover:opacity-80 hover:opacity-100 hover:text-amber-400 transition-opacity p-0.5 rounded cursor-pointer ml-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Side-by-side Hint / Status */}
              <div className="hidden lg:flex items-center gap-2 shrink-0 pl-2 border-l border-white/10 text-[11px] text-white/40">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <SplitSquareHorizontal className="w-3 h-3 text-amber-400/80" />
                  Clique em qualquer aba para destacar lado a lado
                </span>
              </div>

              {/* ============================================================== */}
              {/* CLEAN SUBTLE PROMPT BOX: "OPEN IN A SEPARATE WINDOW?"         */}
              {/* ============================================================== */}
              {promptTab && (
                <div
                  ref={promptBoxRef}
                  className="absolute top-12 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top pointer-events-auto"
                  style={{
                    left: Math.max(12, Math.min(promptTab.tabElementLeft - 160, 480))
                  }}
                >
                  <div className="w-[340px] rounded-2xl bg-[#14182e]/98 backdrop-blur-2xl border border-white/20 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white ring-1 ring-black/50">
                    {/* Pointer Triangle */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#14182e] border-t border-l border-white/20 rotate-45" />

                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 relative z-10">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>OPEN IN A SEPARATE WINDOW?</span>
                      </div>
                      <button
                        onClick={() => setPromptTab(null)}
                        className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Fechar caixa"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Question / Description */}
                    <div className="space-y-1.5 relative z-10">
                      <p className="text-xs text-slate-100 font-medium leading-snug">
                        Deseja abrir a aba <span className="font-bold text-amber-300">"{promptTab.label}"</span> em uma nova janela separada?
                      </p>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Isso cria uma janela independente para você arrastar, redimensionar e utilizar o sistema <strong className="text-white font-semibold">lado a lado</strong>.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 mt-3.5 pt-2 border-t border-white/10 relative z-10">
                      <button
                        onClick={() => setPromptTab(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Não, manter aqui
                      </button>
                      <button
                        onClick={() => handleConfirmSeparateWindow(promptTab.tabId, promptTab.label)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Sim, abrir janela</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* -------------------------------------------------------------- */}
            {/* VIEWPORT BODY: Renders the active tab in full glory           */}
            {/* -------------------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#0F1424] relative">
              {renderTabContent(mainActiveTab)}
            </div>
          </MacWindow>
        )}

        {/* ================================================================== */}
        {/* 4. OPTIONAL SEPARATE WINDOWS (Opened when user selects "Yes")      */}
        {/* ================================================================== */}

        {/* SEPARATE WINDOW: TRELLO MESA WORKSPACE */}
        {windows['trello-mesa'] && windows['trello-mesa'].isOpen && (
          <MacWindow
            window={windows['trello-mesa']}
            isActive={activeWindowId === 'trello-mesa'}
            icon={<LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />}
            onFocus={() => focusWindow('trello-mesa')}
            onClose={() => closeWindow('trello-mesa')}
            onMinimize={() => minimizeWindow('trello-mesa')}
            onToggleMaximize={() => toggleMaximizeWindow('trello-mesa')}
            onPositionChange={(pos) => updateWindowPosition('trello-mesa', pos)}
            onSizeChange={(size, pos) => updateWindowSize('trello-mesa', size, pos)}
            onSnap={(snap) => snapWindow('trello-mesa', snap)}
            onReintegrate={() => handleReintegrate('trello-mesa', 'Mesa Trello')}
            contentClassName="flex-1 overflow-hidden bg-[#0c1024] relative flex flex-col"
          >
            <TrelloMesaWorkspace
              project={targetProject}
              projectId={targetProject?.id}
              embedded={true}
              onSwitchToClassic={() => handleReintegrate('trello-mesa', 'Mesa Trello')}
            />
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: HOJE / DASHBOARD */}
        {windows['hoje'] && windows['hoje'].isOpen && (
          <MacWindow
            window={windows['hoje']}
            isActive={activeWindowId === 'hoje'}
            icon={<Compass className="w-3.5 h-3.5 text-amber-400" />}
            onFocus={() => focusWindow('hoje')}
            onClose={() => closeWindow('hoje')}
            onMinimize={() => minimizeWindow('hoje')}
            onToggleMaximize={() => toggleMaximizeWindow('hoje')}
            onPositionChange={(pos) => updateWindowPosition('hoje', pos)}
            onSizeChange={(size, pos) => updateWindowSize('hoje', size, pos)}
            onSnap={(snap) => snapWindow('hoje', snap)}
            onReintegrate={() => handleReintegrate('hoje', 'Hoje')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <DashboardPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: TAREFAS */}
        {windows['tarefas'] && windows['tarefas'].isOpen && (
          <MacWindow
            window={windows['tarefas']}
            isActive={activeWindowId === 'tarefas'}
            icon={<CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
            onFocus={() => focusWindow('tarefas')}
            onClose={() => closeWindow('tarefas')}
            onMinimize={() => minimizeWindow('tarefas')}
            onToggleMaximize={() => toggleMaximizeWindow('tarefas')}
            onPositionChange={(pos) => updateWindowPosition('tarefas', pos)}
            onSizeChange={(size, pos) => updateWindowSize('tarefas', size, pos)}
            onSnap={(snap) => snapWindow('tarefas', snap)}
            onReintegrate={() => handleReintegrate('tarefas', 'Tarefas')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <TasksPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: PROJETOS ATIVOS */}
        {windows['projetos'] && windows['projetos'].isOpen && (
          <MacWindow
            window={windows['projetos']}
            isActive={activeWindowId === 'projetos'}
            icon={<FolderKanban className="w-3.5 h-3.5 text-indigo-400" />}
            onFocus={() => focusWindow('projetos')}
            onClose={() => closeWindow('projetos')}
            onMinimize={() => minimizeWindow('projetos')}
            onToggleMaximize={() => toggleMaximizeWindow('projetos')}
            onPositionChange={(pos) => updateWindowPosition('projetos', pos)}
            onSizeChange={(size, pos) => updateWindowSize('projetos', size, pos)}
            onSnap={(snap) => snapWindow('projetos', snap)}
            onReintegrate={() => handleReintegrate('projetos', 'Projetos')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <ProjectsPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: DECISÕES */}
        {windows['decisoes'] && windows['decisoes'].isOpen && (
          <MacWindow
            window={windows['decisoes']}
            isActive={activeWindowId === 'decisoes'}
            icon={<Scale className="w-3.5 h-3.5 text-amber-400" />}
            onFocus={() => focusWindow('decisoes')}
            onClose={() => closeWindow('decisoes')}
            onMinimize={() => minimizeWindow('decisoes')}
            onToggleMaximize={() => toggleMaximizeWindow('decisoes')}
            onPositionChange={(pos) => updateWindowPosition('decisoes', pos)}
            onSizeChange={(size, pos) => updateWindowSize('decisoes', size, pos)}
            onSnap={(snap) => snapWindow('decisoes', snap)}
            onReintegrate={() => handleReintegrate('decisoes', 'Decisões')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <DecisionsPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: PROGRAMA 30 DIAS */}
        {windows['programa'] && windows['programa'].isOpen && (
          <MacWindow
            window={windows['programa']}
            isActive={activeWindowId === 'programa'}
            icon={<CalendarCheck2 className="w-3.5 h-3.5 text-red-400" />}
            onFocus={() => focusWindow('programa')}
            onClose={() => closeWindow('programa')}
            onMinimize={() => minimizeWindow('programa')}
            onToggleMaximize={() => toggleMaximizeWindow('programa')}
            onPositionChange={(pos) => updateWindowPosition('programa', pos)}
            onSizeChange={(size, pos) => updateWindowSize('programa', size, pos)}
            onSnap={(snap) => snapWindow('programa', snap)}
            onReintegrate={() => handleReintegrate('programa', 'Programa 30D')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <ProgramPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: CONVERSAS DIFÍCEIS */}
        {windows['conversas'] && windows['conversas'].isOpen && (
          <MacWindow
            window={windows['conversas']}
            isActive={activeWindowId === 'conversas'}
            icon={<MessageSquareWarning className="w-3.5 h-3.5 text-rose-400" />}
            onFocus={() => focusWindow('conversas')}
            onClose={() => closeWindow('conversas')}
            onMinimize={() => minimizeWindow('conversas')}
            onToggleMaximize={() => toggleMaximizeWindow('conversas')}
            onPositionChange={(pos) => updateWindowPosition('conversas', pos)}
            onSizeChange={(size, pos) => updateWindowSize('conversas', size, pos)}
            onSnap={(snap) => snapWindow('conversas', snap)}
            onReintegrate={() => handleReintegrate('conversas', 'Conversas')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <ConversationsPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: PROCESSOS & DELEGAÇÃO */}
        {windows['processos'] && windows['processos'].isOpen && (
          <MacWindow
            window={windows['processos']}
            isActive={activeWindowId === 'processos'}
            icon={<Workflow className="w-3.5 h-3.5 text-cyan-400" />}
            onFocus={() => focusWindow('processos')}
            onClose={() => closeWindow('processos')}
            onMinimize={() => minimizeWindow('processos')}
            onToggleMaximize={() => toggleMaximizeWindow('processos')}
            onPositionChange={(pos) => updateWindowPosition('processos', pos)}
            onSizeChange={(size, pos) => updateWindowSize('processos', size, pos)}
            onSnap={(snap) => snapWindow('processos', snap)}
            onReintegrate={() => handleReintegrate('processos', 'Processos')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <ProcessesPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: REVISÃO SEMANAL */}
        {windows['revisao'] && windows['revisao'].isOpen && (
          <MacWindow
            window={windows['revisao']}
            isActive={activeWindowId === 'revisao'}
            icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            onFocus={() => focusWindow('revisao')}
            onClose={() => closeWindow('revisao')}
            onMinimize={() => minimizeWindow('revisao')}
            onToggleMaximize={() => toggleMaximizeWindow('revisao')}
            onPositionChange={(pos) => updateWindowPosition('revisao', pos)}
            onSizeChange={(size, pos) => updateWindowSize('revisao', size, pos)}
            onSnap={(snap) => snapWindow('revisao', snap)}
            onReintegrate={() => handleReintegrate('revisao', 'Revisão')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <WeeklyReviewPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: RECUPERAÇÃO (SOS) */}
        {windows['recuperacao'] && windows['recuperacao'].isOpen && (
          <MacWindow
            window={windows['recuperacao']}
            isActive={activeWindowId === 'recuperacao'}
            icon={<LifeBuoy className="w-3.5 h-3.5 text-orange-400" />}
            onFocus={() => focusWindow('recuperacao')}
            onClose={() => closeWindow('recuperacao')}
            onMinimize={() => minimizeWindow('recuperacao')}
            onToggleMaximize={() => toggleMaximizeWindow('recuperacao')}
            onPositionChange={(pos) => updateWindowPosition('recuperacao', pos)}
            onSizeChange={(size, pos) => updateWindowSize('recuperacao', size, pos)}
            onSnap={(snap) => snapWindow('recuperacao', snap)}
            onReintegrate={() => handleReintegrate('recuperacao', 'Recuperação')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <RecoveryPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: CONFIGURAÇÕES */}
        {windows['configuracoes'] && windows['configuracoes'].isOpen && (
          <MacWindow
            window={windows['configuracoes']}
            isActive={activeWindowId === 'configuracoes'}
            icon={<Settings className="w-3.5 h-3.5 text-slate-400" />}
            onFocus={() => focusWindow('configuracoes')}
            onClose={() => closeWindow('configuracoes')}
            onMinimize={() => minimizeWindow('configuracoes')}
            onToggleMaximize={() => toggleMaximizeWindow('configuracoes')}
            onPositionChange={(pos) => updateWindowPosition('configuracoes', pos)}
            onSizeChange={(size, pos) => updateWindowSize('configuracoes', size, pos)}
            onSnap={(snap) => snapWindow('configuracoes', snap)}
            onReintegrate={() => handleReintegrate('configuracoes', 'Ajustes')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <SettingsPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: POST-IT NOTES */}
        {windows['postit'] && windows['postit'].isOpen && (
          <MacWindow
            window={windows['postit']}
            isActive={activeWindowId === 'postit'}
            icon={<StickyNote className="w-3.5 h-3.5 text-yellow-400" />}
            onFocus={() => focusWindow('postit')}
            onClose={() => closeWindow('postit')}
            onMinimize={() => minimizeWindow('postit')}
            onToggleMaximize={() => toggleMaximizeWindow('postit')}
            onPositionChange={(pos) => updateWindowPosition('postit', pos)}
            onSizeChange={(size, pos) => updateWindowSize('postit', size, pos)}
            onSnap={(snap) => snapWindow('postit', snap)}
          >
            <div className="p-4">
              <PostItNote isOpen={true} onClose={() => closeWindow('postit')} />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: BIBLIOTECA */}
        {windows['biblioteca'] && windows['biblioteca'].isOpen && (
          <MacWindow
            window={windows['biblioteca']}
            isActive={activeWindowId === 'biblioteca'}
            icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />}
            onFocus={() => focusWindow('biblioteca')}
            onClose={() => closeWindow('biblioteca')}
            onMinimize={() => minimizeWindow('biblioteca')}
            onToggleMaximize={() => toggleMaximizeWindow('biblioteca')}
            onPositionChange={(pos) => updateWindowPosition('biblioteca', pos)}
            onSizeChange={(size, pos) => updateWindowSize('biblioteca', size, pos)}
            onSnap={(snap) => snapWindow('biblioteca', snap)}
            onReintegrate={() => handleReintegrate('biblioteca', 'Biblioteca')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <LibraryPage />
            </div>
          </MacWindow>
        )}

        {/* SEPARATE WINDOW: MISSÃO DO DIA */}
        {windows['missao'] && windows['missao'].isOpen && (
          <MacWindow
            window={windows['missao']}
            isActive={activeWindowId === 'missao'}
            icon={<Target className="w-3.5 h-3.5 text-rose-400" />}
            onFocus={() => focusWindow('missao')}
            onClose={() => closeWindow('missao')}
            onMinimize={() => minimizeWindow('missao')}
            onToggleMaximize={() => toggleMaximizeWindow('missao')}
            onPositionChange={(pos) => updateWindowPosition('missao', pos)}
            onSizeChange={(size, pos) => updateWindowSize('missao', size, pos)}
            onSnap={(snap) => snapWindow('missao', snap)}
            onReintegrate={() => handleReintegrate('missao', 'Missão do Dia')}
          >
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <MissionDetailPage missionId={windows['missao']?.params?.missionId || activeTodayMission.id} />
            </div>
          </MacWindow>
        )}
      </div>

      {/* 5. Bottom macOS Dock */}
      <MacOsDock
        alwaysVisible={true}
        onOpenPostIt={() => openWindow('postit')}
        onOpenApp={(appId) => handleAppLaunch(appId)}
        activeWindowIds={[
          'main',
          ...Object.values(windows)
            .filter((w) => w.isOpen && !w.isMinimized)
            .map((w) => w.id)
        ]}
      />
    </div>
  );
};

export default MacDesktopShell;
