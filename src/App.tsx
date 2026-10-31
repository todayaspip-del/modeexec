/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { AppNavigation } from './components/common/AppNavigation';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { ToastContainer } from './components/common/ToastContainer';
import { SmoothCursor } from './components/common/SmoothCursor';
import { SiteWallpaper } from './components/common/SiteWallpaper';
import { MacOsDock } from './components/common/MacOsDock';
import { PostItNote } from './components/common/PostItNote';
import { parseRoute } from './lib/router';
import { MacDesktopShell } from './components/mac/MacDesktopShell';
import { VideoLoadingSequence } from './components/common/VideoLoadingSequence';
import { AuthGate, useAuth } from './context/AuthGate';
import { LoginPage } from './pages/LoginPage';
import { AppWindowId } from './hooks/useWindowManager';

// Pages
import { DiagnosticPage } from './pages/DiagnosticPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProgramPage } from './pages/ProgramPage';
import { MissionDetailPage } from './pages/MissionDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MesaPage } from './pages/MesaPage';
import { TasksPage } from './pages/TasksPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { ProcessesPage } from './pages/ProcessesPage';
import { WeeklyReviewPage } from './pages/WeeklyReviewPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { MacDesktop, AppleLogo } from './components/common/MacDesktop';

function mapRouteToAppWindow(name: string): AppWindowId {
  switch (name) {
    case 'workspace':
    case 'projeto-mesa':
      return 'trello-mesa';
    case 'programa':
      return 'programa';
    case 'missao':
      return 'missao';
    case 'projetos':
      return 'projetos';
    case 'tarefas':
      return 'tarefas';
    case 'decisoes':
      return 'decisoes';
    case 'conversas':
      return 'conversas';
    case 'processos':
      return 'processos';
    case 'revisao':
      return 'revisao';
    case 'recuperacao':
      return 'recuperacao';
    case 'biblioteca':
      return 'biblioteca';
    case 'configuracoes':
      return 'configuracoes';
    case 'app-home':
    default:
      return 'hoje';
  }
}

const AppRouter: React.FC = () => {
  const { currentRoute, activeTodayMission, wallpaper } = useApp();
  const [postItOpen, setPostItOpen] = useState(false);

  // Preference for macOS Desktop vs Classic Web mode
  const [desktopMode, setDesktopMode] = useState<'mac' | 'classic'>(() => {
    try {
      return (localStorage.getItem('modo_execucao_desktop_mode') as 'mac' | 'classic') || 'mac';
    } catch {
      return 'mac';
    }
  });

  // Track video loading sequence - plays on load while site processes in background
  const [hasBooted, setHasBooted] = useState<boolean>(false);

  const handleBootComplete = () => {
    setHasBooted(true);
  };

  const parsed = parseRoute(currentRoute);
  const isPublicRoute = ['diagnostico', 'onboarding'].includes(parsed.name);

  // 1. If in macOS Desktop mode and user is inside the app (/app/*)
  if (!isPublicRoute && desktopMode === 'mac') {
    return (
      <>
        <SmoothCursor />
        <MacDesktopShell
          initialAppId={mapRouteToAppWindow(parsed.name)}
          projectId={parsed.params.projectId}
          onSwitchToClassic={() => {
            try {
              localStorage.setItem('modo_execucao_desktop_mode', 'classic');
            } catch {}
            setDesktopMode('classic');
          }}
        />
        <ToastContainer />

        {/* Video loading sequence runs on top while site processes in background */}
        {!hasBooted && (
          <VideoLoadingSequence onComplete={handleBootComplete} />
        )}
      </>
    );
  }

  // 2. Classic View or Public Landing
  const renderContent = () => {
    const { name, params } = parsed;

    switch (name) {
      case 'diagnostico':
        return <DiagnosticPage />;

      case 'onboarding':
        return <OnboardingPage />;

      case 'biblioteca':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LibraryPage />
          </div>
        );

      case 'configuracoes':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SettingsPage />
          </div>
        );

      case 'missao': {
        const parsedId = params.id ? parseInt(params.id, 10) : NaN;
        const missionId = isNaN(parsedId) ? activeTodayMission.id : parsedId;

        return (
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
            <AppNavigation />
            <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
              <MissionDetailPage missionId={missionId} />
            </main>
          </div>
        );
      }

      case 'landing':
      case 'app-home':
      case 'programa':
      case 'projetos':
      case 'projeto-mesa':
      case 'tarefas':
      case 'decisoes':
      case 'conversas':
      case 'processos':
      case 'revisao':
      case 'recuperacao':
      case 'workspace': {
        let subView: React.ReactNode;

        switch (name) {
          case 'workspace':
            subView = <MacDesktop />;
            break;
          case 'programa':
            subView = <ProgramPage />;
            break;
          case 'projetos':
            subView = <ProjectsPage />;
            break;
          case 'projeto-mesa':
            subView = <MesaPage projectId={params.projectId} />;
            break;
          case 'tarefas':
            subView = <TasksPage />;
            break;
          case 'decisoes':
            subView = <DecisionsPage />;
            break;
          case 'conversas':
            subView = <ConversationsPage />;
            break;
          case 'processos':
            subView = <ProcessesPage />;
            break;
          case 'revisao':
            subView = <WeeklyReviewPage />;
            break;
          case 'recuperacao':
            subView = <RecoveryPage />;
            break;
          case 'landing':
          case 'app-home':
          default:
            subView = <DashboardPage />;
            break;
        }

        return (
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
            <AppNavigation />
            <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
              {subView}
            </main>
          </div>
        );
      }

      case 'not-found':
      default:
        return (
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
            <AppNavigation />
            <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
              <DashboardPage />
            </main>
          </div>
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative transition-colors duration-300 ${
        wallpaper.enabled ? 'bg-[#080a14] text-brand-primary' : 'bg-brand-surface text-brand-primary'
      }`}
    >
      <SiteWallpaper />
      <SmoothCursor />
      <Header />

      {/* Floating button to switch back to macOS Desktop if user switched to classic mode */}
      {!isPublicRoute && (
        <div className="fixed top-20 right-4 z-40">
          <button
            onClick={() => {
              try {
                localStorage.setItem('modo_execucao_desktop_mode', 'mac');
              } catch {}
              setDesktopMode('mac');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white border border-white/20 shadow-2xl backdrop-blur-md text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          >
            <AppleLogo className="w-3.5 h-3.5 text-white" />
            <span>Entrar no macOS Desktop</span>
          </button>
        </div>
      )}

      <div className="flex-1 pt-14 sm:pt-20 pb-24 sm:pb-28 relative z-10">
        {renderContent()}
      </div>
      <Footer />
      <MacOsDock onOpenPostIt={() => setPostItOpen((prev: boolean) => !prev)} />
      <PostItNote isOpen={postItOpen} onClose={() => setPostItOpen(false)} />
      <MobileBottomBar onOpenPostIt={() => setPostItOpen(true)} />
      <ToastContainer />

      {/* Video loading sequence runs on top while site processes in background */}
      {!hasBooted && (
        <VideoLoadingSequence onComplete={handleBootComplete} />
      )}
    </div>
  );
};

// Login obrigatório: com Supabase ativo, sem sessão só a tela de login é exibida.
const LoginRequired: React.FC = () => {
  const { cloudEnabled, user } = useAuth();
  if (cloudEnabled && !user) return <LoginPage />;
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthGate>
      <LoginRequired />
    </AuthGate>
  );
}
