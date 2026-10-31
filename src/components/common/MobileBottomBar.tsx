import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  CheckCircle2,
  Scale,
  CheckSquare,
  Menu,
  X,
  CalendarCheck2,
  FolderKanban,
  MessageSquareWarning,
  Workflow,
  Sparkles,
  LifeBuoy,
  BookOpen,
  Settings,
  ArrowRight,
  StickyNote
} from 'lucide-react';

interface MobileBottomBarProps {
  onOpenPostIt?: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ onOpenPostIt }) => {
  const { currentRoute, navigateTo, activeTodayMission, userProfile } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const cleanPath = currentRoute.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const isApp = cleanPath.startsWith('/app');
  if (!isApp) return null;

  const quickNav = [
    { label: 'Hoje', route: '/app', icon: Compass, active: cleanPath === '/app' },
    { label: 'Tarefas', route: '/app/tarefas', icon: CheckSquare, active: cleanPath === '/app/tarefas' },
    { label: 'Decisões', route: '/app/decisoes', icon: Scale, active: cleanPath === '/app/decisoes' }
  ];

  const drawerItems = [
    { label: 'Programa 30 Dias', route: '/app/programa', icon: CalendarCheck2 },
    { label: 'Projetos Ativos', route: '/app/projetos', icon: FolderKanban },
    { label: 'Conversas Difíceis', route: '/app/conversas', icon: MessageSquareWarning },
    { label: 'Processos & Delegação', route: '/app/processos', icon: Workflow },
    { label: 'Revisão Semanal', route: '/app/revisao', icon: Sparkles },
    { label: 'Modo Recuperação', route: '/app/recuperacao', icon: LifeBuoy, highlight: true },
    {
      label: 'Post-it (Notas Rápidas)',
      icon: StickyNote,
      postItAction: true
    },
    { label: 'Biblioteca & E-book', route: '/biblioteca', icon: BookOpen },
    { label: 'Configurações', route: '/configuracoes', icon: Settings }
  ];

  return (
    <>
      {/* Fixed Bottom Dock for Mobile */}
      <nav
        aria-label="Navegação rápida mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#101114]/95 backdrop-blur-md border-t border-white/10 shadow-2xl px-2 py-1"
      >
        <div className="grid grid-cols-4 items-center h-14 max-w-md mx-auto">
          {quickNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => {
                  setDrawerOpen(false);
                  navigateTo(item.route);
                }}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
                  item.active ? 'text-[#D7FF3F]' : 'text-[#8D9298] hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${item.active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {item.active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D7FF3F]" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    item.active ? 'font-bold text-white' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More button triggering high-ticket bottom sheet */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
              drawerOpen ? 'text-[#D7FF3F]' : 'text-[#8D9298] hover:text-white'
            }`}
          >
            <div className="relative">
              {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 stroke-[1.8]" />}
            </div>
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* High-Ticket Slide-Up Bottom Drawer Sheet */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full bg-[#16181D] rounded-t-3xl max-h-[82vh] overflow-y-auto p-5 pb-20 shadow-2xl border-t border-white/15 animate-in slide-in-from-bottom duration-250 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#D7FF3F] font-bold tracking-wider">
                  Central Executiva
                </span>
                <h3 className="text-base font-display font-bold text-white">
                  {userProfile.business}
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-[#8D9298] hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of secondary modules */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setDrawerOpen(false);
                      if (item.postItAction) {
                        onOpenPostIt?.();
                      } else if (item.route) {
                        navigateTo(item.route);
                      }
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 text-white font-bold'
                        : item.postItAction
                        ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20'
                        : item.highlight
                        ? 'border-[#8D79FF]/40 bg-[#8D79FF]/10 text-[#8D79FF] hover:bg-[#8D79FF]/20'
                        : 'border-white/10 hover:border-white/20 bg-black/40 text-[#F3F0EB] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7FF3F]' : item.postItAction ? 'text-yellow-400' : item.highlight ? 'text-[#8D79FF]' : 'text-[#8D9298]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Mode & SOS Callout in drawer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8D9298]">
              <span>Modo Atual: <strong className="text-white">{userProfile.currentMode}</strong></span>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigateTo('/app/recuperacao');
                }}
                className="text-[#8D79FF] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Abrir Recuperação</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
