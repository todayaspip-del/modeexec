import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  CalendarCheck2,
  FolderKanban,
  LayoutDashboard,
  CheckSquare,
  Scale,
  MessageSquareWarning,
  Workflow,
  Sparkles,
  LifeBuoy,
  BookOpen,
  Settings
} from 'lucide-react';

import { ModoExecLogo } from './ModoExecLogo';

export const AppNavigation: React.FC = () => {
  const { currentRoute, navigateTo, userProfile } = useApp();

  const groups = [
    { title: 'Executar', items: [
      { label: 'Hoje', route: '/app', icon: Compass },
      { label: 'Workspace Mac (Trello)', route: '/app/workspace', icon: LayoutDashboard },
      { label: 'Minhas tarefas', route: '/app/tarefas', icon: CheckSquare },
      { label: 'Projetos e Mesa', route: '/app/projetos', icon: FolderKanban } ] },
    { title: 'Destravar', items: [
      { label: 'Decisões', route: '/app/decisoes', icon: Scale },
      { label: 'Conversas', route: '/app/conversas', icon: MessageSquareWarning },
      { label: 'Processos', route: '/app/processos', icon: Workflow } ] },
    { title: 'Revisar', items: [
      { label: 'Revisão semanal', route: '/app/revisao', icon: Sparkles },
      { label: 'Programa 30D', route: '/app/programa', icon: CalendarCheck2 } ] },
    { title: 'Apoio', items: [
      { label: 'Recuperação', route: '/app/recuperacao', icon: LifeBuoy },
      { label: 'Biblioteca', route: '/biblioteca', icon: BookOpen } ] },
    { title: 'Conta', items: [{ label: 'Ajustes', route: '/configuracoes', icon: Settings }] }
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-[#16181D] lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto p-4 rounded-2xl mx-4 my-2 border border-white/10 shadow-2xl">
      {/* Brand Header */}
      <div className="pb-4 mb-3 border-b border-white/10">
        <ModoExecLogo className="mb-2" />
        <div className="text-[11px] text-[#8D9298] font-mono uppercase tracking-wider">Operação atual</div>
        <div className="text-sm font-semibold text-white truncate mt-0.5">{userProfile.business}</div>
      </div>
      <nav className="space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="px-3 mb-1 text-[11px] font-mono uppercase tracking-wider text-[#8D9298]/80">{g.title}</div>
            {g.items.map((item) => {
              const Icon = item.icon;
              const cleanPath = currentRoute.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
              const active = item.route === '/app' ? cleanPath === '/app' : cleanPath.startsWith(item.route);
              return (
                <button key={item.route} onClick={() => navigateTo(item.route)}
                  className={`relative w-full flex items-center gap-3 pl-3 pr-3 py-2 text-sm rounded-xl cursor-pointer text-left transition-all ${
                    active
                      ? 'bg-[#D7FF3F]/12 text-[#D7FF3F] font-semibold border border-[#D7FF3F]/30 shadow-xs'
                      : 'text-[#8D9298] hover:text-white hover:bg-white/5 border border-transparent'}`}>
                  {active && <span className="absolute left-1.5 top-2.5 bottom-2.5 w-[3px] bg-[#D7FF3F] rounded-full shadow-[0_0_8px_rgba(215,255,63,0.6)]" />}
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#D7FF3F]' : 'text-[#8D9298]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
