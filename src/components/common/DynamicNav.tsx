import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  ArrowUpRight,
  Compass,
  CalendarCheck2,
  FolderKanban,
  CheckSquare,
  Scale,
  MessageSquareWarning,
  Workflow,
  Sparkles,
  LifeBuoy,
  BookOpen,
  Settings,
  X,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { HelpModal } from '../modals/HelpModal';
import { WallpaperModal } from '../modals/WallpaperModal';
import { ModoExecMark } from './ModoExecLogo';

// 6 dots matrix icon (2 rows of 3 dots) matching the exact user screenshot
export const DotsSixMatrix: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-3.5',
  color = '#D7FF3F'
}) => (
  <svg viewBox="0 0 28 16" className={`${className} shrink-0`} fill="none">
    {/* Row 1: 3 dots */}
    <circle cx="4" cy="4" r="2.3" fill={color} />
    <circle cx="14" cy="4" r="2.3" fill={color} />
    <circle cx="24" cy="4" r="2.3" fill={color} />
    {/* Row 2: 3 dots */}
    <circle cx="4" cy="12" r="2.3" fill={color} />
    <circle cx="14" cy="12" r="2.3" fill={color} />
    <circle cx="24" cy="12" r="2.3" fill={color} />
  </svg>
);

interface NavItem {
  label: string;
  route: string;
  match: (route: string) => boolean;
}

type NavAnimationState = 'closed' | 'contracting' | 'expanding' | 'open' | 'collapsing';

export const DynamicNav: React.FC = () => {
  const { currentRoute, navigateTo, userProfile, activeTodayMission, setExecutionMode, wallpaper } = useApp();

  // Navigation state starts RETRACTED (closed pill) as requested by the user
  const [navState, setNavState] = useState<NavAnimationState>('closed');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const isApp = currentRoute.startsWith('/app');

  // Shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        if (drawerOpen) {
          setDrawerOpen(false);
        } else if (navState === 'open') {
          handleCollapse();
        }
        setModeMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, navState]);

  // Click outside collapses navbar back to retracted pill
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        if (navState === 'open') {
          handleCollapse();
        }
        setDrawerOpen(false);
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navState]);

  // Choreographed Opening Animation:
  // 1. User clicks: icons fade out + pill retracts minimally (scale: 0.92, width shrinks)
  // 2. Then expands sideways smoothly with spring physics!
  const handleTriggerOpen = () => {
    if (navState !== 'closed') return;
    setNavState('contracting');

    // After minimal retraction and icon disappearance (130ms), expand sideways!
    setTimeout(() => {
      setNavState('expanding');
      setTimeout(() => {
        setNavState('open');
      }, 340);
    }, 130);
  };

  // Smooth collapse back to the compact pill
  const handleCollapse = () => {
    if (navState !== 'open') return;
    setDrawerOpen(false);
    setModeMenuOpen(false);
    setNavState('collapsing');
    setTimeout(() => {
      setNavState('closed');
    }, 280);
  };

  const go = (route: string) => {
    setDrawerOpen(false);
    setModeMenuOpen(false);
    navigateTo(route);
  };

  // Public Links
  const publicLinks: NavItem[] = [
    { label: 'Visão geral', route: '/', match: (r) => r === '/' || r === '' },
    { label: 'Diagnóstico', route: '/diagnostico', match: (r) => r === '/diagnostico' },
    { label: 'Programa 30D', route: '/app/programa', match: (r) => r.startsWith('/app/programa') },
    { label: 'Biblioteca', route: '/biblioteca', match: (r) => r === '/biblioteca' }
  ];

  // Workspace App Links
  const appLinks: NavItem[] = [
    { label: 'Hoje', route: '/app', match: (r) => r === '/app' },
    { label: '30 Dias', route: '/app/programa', match: (r) => r.startsWith('/app/programa') || r.startsWith('/app/missao') },
    { label: 'Tarefas', route: '/app/tarefas', match: (r) => r === '/app/tarefas' },
    { label: 'Decisões', route: '/app/decisoes', match: (r) => r === '/app/decisoes' },
    { label: 'Projetos', route: '/app/projetos', match: (r) => r === '/app/projetos' }
  ];

  const currentLinks = isApp ? appLinks : publicLinks;

  // Executive modules inside the command center
  const executiveModules = [
    { label: 'Hoje / Agora', desc: 'Missão prioritária e ação física do dia', route: '/app', icon: Compass, color: 'text-amber-400' },
    { label: 'Programa de 30 Dias', desc: 'Jornada estruturada em 4 semanas', route: '/app/programa', icon: CalendarCheck2, color: 'text-emerald-400' },
    { label: 'Tarefas & Ações', desc: 'Ações físicas observáveis com evidência', route: '/app/tarefas', icon: CheckSquare, color: 'text-blue-400' },
    { label: 'Decisões Pendentes', desc: 'Matriz do custo de adiamento', route: '/app/decisoes', icon: Scale, color: 'text-amber-400' },
    { label: 'Projetos Ativos', desc: 'Controle de projetos e próxima ação', route: '/app/projetos', icon: FolderKanban, color: 'text-indigo-400' },
    { label: 'Conversas Difíceis', desc: 'Roteiros guiados para diálogos críticos', route: '/app/conversas', icon: MessageSquareWarning, color: 'text-rose-400' },
    { label: 'Processos & Delegação', desc: 'Passo a passo operacional com contexto', route: '/app/processos', icon: Workflow, color: 'text-cyan-400' },
    { label: 'Revisão Semanal', desc: 'Balanço de entregas, retomadas e foco', route: '/app/revisao', icon: Sparkles, color: 'text-purple-400' },
    { label: 'Modo Recuperação (SOS)', desc: 'Retomada suave sem punição ou culpa', route: '/app/recuperacao', icon: LifeBuoy, color: 'text-orange-400', highlight: true },
    { label: 'Biblioteca & E-book', desc: 'Capítulos, templates e materiais de apoio', route: '/biblioteca', icon: BookOpen, color: 'text-[#8D9298]' },
    { label: 'Diagnóstico Inicial', desc: 'Avaliação dos seus padrões de adiamento', route: '/diagnostico', icon: ShieldCheck, color: 'text-[#D7FF3F]' },
    { label: 'Configurações de Conta', desc: 'Perfil executivo e preferências', route: '/configuracoes', icon: Settings, color: 'text-[#8D9298]' }
  ];

  const currentMode = userProfile.currentMode || 'Normal';
  const isRetracted = navState === 'closed' || navState === 'contracting';

  return (
    <>
      {/* Floating Dynamic Nav Shell */}
      <div
        ref={navRef}
        className="fixed top-2.5 sm:top-4 inset-x-0 mx-auto w-[calc(100%-1.25rem)] sm:w-[94%] max-w-5xl z-50 pointer-events-none flex justify-center"
      >
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* 1. RETRACTED CLOSED PILL (Exact visual matching the user screenshot)      */}
          {/* ========================================================================= */}
          {isRetracted ? (
            <motion.button
              key="closed-pill"
              onClick={handleTriggerOpen}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={
                navState === 'contracting'
                  ? {
                      scale: 0.92,
                      width: 120,
                      opacity: 0.9,
                      filter: 'blur(2px)'
                    }
                  : {
                      scale: 1,
                      width: 144,
                      opacity: 1,
                      filter: 'blur(0px)'
                    }
              }
              exit={{
                scale: 0.92,
                opacity: 0,
                filter: 'blur(6px)',
                transition: { duration: 0.12 }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 240,
                mass: 0.8
              }}
              aria-label="Abrir barra de navegação"
              title="Clique para expandir o menu"
              className="pointer-events-auto h-[48px] rounded-full bg-[#08080a] border border-white/12 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)] px-3.5 flex items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left: Starburst Radial Logo */}
              <motion.div
                animate={{
                  opacity: navState === 'contracting' ? 0 : 1,
                  scale: navState === 'contracting' ? 0.7 : 1
                }}
                transition={{ duration: 0.1 }}
              >
                <ModoExecMark className="w-6 h-6" color="#D7FF3F" />
              </motion.div>

              {/* Right: 6 Dots Matrix (2 rows of 3 dots) */}
              <motion.div
                animate={{
                  opacity: navState === 'contracting' ? 0 : 1,
                  scale: navState === 'contracting' ? 0.7 : 1
                }}
                transition={{ duration: 0.1 }}
                className="group-hover:scale-110 transition-transform duration-200"
              >
                <DotsSixMatrix className="w-5 h-3 text-[#D7FF3F]" color="#D7FF3F" />
              </motion.div>
            </motion.button>
          ) : (
            /* ========================================================================= */
            /* 2. EXPANDED SIDEWAYS NAVBAR WITH SPRING PHYSICS                           */
            /* ========================================================================= */
            <motion.nav
              key="expanded-navbar"
              initial={{
                width: 130,
                opacity: 0.5,
                scale: 0.95,
                filter: 'blur(8px)'
              }}
              animate={{
                width: '100%',
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)'
              }}
              exit={{
                width: 130,
                opacity: 0,
                scale: 0.94,
                filter: 'blur(8px)',
                transition: { duration: 0.22 }
              }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 210,
                mass: 0.9
              }}
              className={`pointer-events-auto relative mx-auto transition-all duration-300 w-full ${
                drawerOpen
                  ? 'bg-[#101114]/98 backdrop-blur-2xl border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.8)] rounded-3xl p-3 sm:p-4'
                  : 'bg-[#101114]/94 backdrop-blur-xl border border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.6)] rounded-full px-3 sm:px-4 py-2 sm:py-2.5'
              }`}
            >
              {/* Main Horizontal Pill Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.2 }}
                className="flex items-center justify-between gap-2 sm:gap-4"
              >
                {/* Left: Brand Identity + Dynamic Mode Beacon */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => go(isApp ? '/app' : '/')}
                    className="group flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
                    aria-label="Modo eXec - Início"
                  >
                    {/* Official Brand Mark */}
                    <ModoExecMark className="w-7 h-7 sm:w-8 sm:h-8" color="#D7FF3F" />

                    <div className="hidden xs:flex flex-col">
                      <span className="font-display text-[14px] sm:text-[15px] font-bold tracking-tight text-white leading-tight flex items-center gap-0.5">
                        Modo <span className="text-[#D7FF3F]">eXec</span>
                        <span className="text-[9px] text-[#8D9298] font-normal align-top ml-0.5">®</span>
                      </span>
                      <span className="text-[10px] text-[#8D9298] font-medium tracking-wide leading-none">
                        {isApp ? `Dia ${activeTodayMission.day || '02'} • 30D` : 'Menos desculpas. Mais execução.'}
                      </span>
                    </div>
                  </button>

                  {/* Dynamic Status / Mode Pill (In App) */}
                  {isApp && (
                    <div className="relative">
                      <button
                        onClick={() => setModeMenuOpen(!modeMenuOpen)}
                        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/90 transition-colors cursor-pointer"
                        title="Alternar Modo de Execução"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            currentMode === 'Recuperação'
                              ? 'bg-[#8D79FF]'
                              : currentMode === 'Reduzido'
                              ? 'bg-[#F3F0EB]'
                              : 'bg-[#D7FF3F]'
                          }`}
                        />
                        <span className="hidden sm:inline">Modo</span>
                        <span>{currentMode}</span>
                        <ChevronDown className="w-3 h-3 text-white/50" />
                      </button>

                      {/* Mode Dropdown Menu */}
                      <AnimatePresence>
                        {modeMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-2 w-48 rounded-2xl bg-[#16181D] border border-white/15 p-1.5 shadow-2xl z-50 space-y-1"
                          >
                            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8D9298] uppercase tracking-wider">
                              Nível de Execução
                            </div>
                            {(['Normal', 'Reduzido', 'Recuperação'] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => {
                                  setExecutionMode(m);
                                  setModeMenuOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  currentMode === m
                                    ? 'bg-[#D7FF3F]/15 text-[#D7FF3F] font-bold'
                                    : 'text-white/80 hover:bg-white/5'
                                }`}
                              >
                                <span>Modo {m}</span>
                                {currentMode === m && <span className="w-2 h-2 rounded-full bg-[#D7FF3F]" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Center: Gliding Interactive Navigation Links (Desktop) */}
                <div className="hidden md:flex items-center gap-1 relative bg-white/4 p-1 rounded-full border border-white/6">
                  {currentLinks.map((link) => {
                    const isActive = link.match(currentRoute);
                    return (
                      <button
                        key={link.route}
                        onClick={() => go(link.route)}
                        className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-colors cursor-pointer z-10 ${
                          isActive ? 'text-[#101114] font-bold' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="dynamic-nav-active-indicator"
                            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                            className="absolute inset-0 rounded-full bg-[#D7FF3F] shadow-sm shadow-[#D7FF3F]/30"
                          />
                        )}
                        <span className="relative z-10">{link.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Quick Tools + Signature DotsSix Trigger + CTA + Collapse Button */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Quick Search Button (⌘K) */}
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Buscar rapidamente no sistema"
                    className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden lg:inline text-[11px] text-white/50">Buscar</span>
                    <kbd className="hidden lg:inline text-[9px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                      ⌘K
                    </kbd>
                  </button>

                  {/* Help & Principles */}
                  <button
                    onClick={() => setHelpOpen(true)}
                    aria-label="3 Perguntas de Ação"
                    title="Princípios de Execução"
                    className="hidden sm:grid place-items-center w-8 h-8 rounded-full bg-white/6 hover:bg-white/12 text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  {/* Discreet Wallpaper & Atmosphere Customizer */}
                  <button
                    onClick={() => setWallpaperOpen(true)}
                    aria-label="Personalizar papel de parede do site"
                    title={wallpaper.enabled ? `Papel de Parede: ${wallpaper.presetName}` : 'Personalizar papel de parede'}
                    className={`grid place-items-center w-8 h-8 rounded-full transition-colors cursor-pointer ${
                      wallpaper.enabled
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                        : 'bg-white/6 hover:bg-white/12 text-white/70 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Primary Executive CTA Button */}
                  <button
                    onClick={() =>
                      go(
                        isApp
                          ? activeTodayMission.completed
                            ? '/app/tarefas'
                            : `/app/missao/${activeTodayMission.id}`
                          : '/app'
                      )
                    }
                    className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-bold text-[#10142B] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-white hover:to-white shadow-md shadow-amber-400/20 transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    <span>{isApp ? 'Executar' : 'Entrar'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  {/* Signature Framer DotsSix Icon Trigger (Opens Module Matrix) */}
                  <button
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    aria-label={drawerOpen ? 'Fechar gaveta executiva' : 'Abrir central de módulos'}
                    title="Central de Comandos & Módulos"
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full grid place-items-center transition-all cursor-pointer ${
                      drawerOpen
                        ? 'bg-amber-400 text-[#10142B] shadow-md shadow-amber-400/30'
                        : 'bg-white/10 hover:bg-white/15 text-white hover:text-amber-300 border border-white/10'
                    }`}
                  >
                    {drawerOpen ? (
                      <X className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <DotsSixMatrix className="w-4 h-2.5 text-amber-400" color="#f59e0b" />
                    )}
                  </button>

                  {/* Collapse back to retracted pill button */}
                  <button
                    onClick={handleCollapse}
                    aria-label="Recolher barra de navegação"
                    title="Recolher barra (voltar ao modo retraído)"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/6 hover:bg-white/12 text-white/60 hover:text-white border border-white/10 grid place-items-center transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>

              {/* Dynamic Island Expandable Executive Command Matrix */}
              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                    className="overflow-hidden mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10"
                  >
                    {/* Header within drawer */}
                    <div className="flex items-center justify-between pb-3 px-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D7FF3F] animate-ping" />
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#D7FF3F]">
                          Central Executiva Modo eXec
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8D9298]">
                        {userProfile.business} • Modo {currentMode}
                      </span>
                    </div>

                    {/* Grid of Interactive Modules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 py-1 max-h-[60vh] sm:max-h-none overflow-y-auto">
                      {executiveModules.map((item) => {
                        const Icon = item.icon;
                        const isSelected = currentRoute === item.route;
                        return (
                          <button
                            key={item.route}
                            onClick={() => go(item.route)}
                            className={`group p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? 'bg-[#D7FF3F]/15 border-[#D7FF3F]/50 shadow-inner'
                                : item.highlight
                                ? 'bg-[#8D79FF]/15 border-[#8D79FF]/30 hover:bg-[#8D79FF]/20'
                                : 'bg-white/4 border-white/6 hover:bg-white/8 hover:border-white/15'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-[#D7FF3F] text-[#101114]'
                                  : item.highlight
                                  ? 'bg-[#8D79FF]/25 text-[#8D79FF]'
                                  : 'bg-white/8 text-white/80 group-hover:text-[#D7FF3F] group-hover:bg-white/12'
                              }`}
                            >
                              <Icon className="w-4 h-4 stroke-[2]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isSelected ? 'text-[#D7FF3F]' : 'text-white group-hover:text-[#D7FF3F]'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.highlight && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#8D79FF]/20 text-[#8D79FF] border border-[#8D79FF]/30">
                                    SOS
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#8D9298] line-clamp-1 mt-0.5 leading-snug">
                                {item.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer action bar inside drawer */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                      <div className="flex items-center gap-2 text-[#8D9298] text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF3F]" />
                        <span>Execução sem paralisia • Menos desculpas. Mais execução.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => go('/diagnostico')}
                          className="px-2.5 py-1 rounded-lg bg-white/6 hover:bg-white/10 text-white/80 text-[11px] font-semibold cursor-pointer"
                        >
                          Diagnóstico
                        </button>
                        <button
                          onClick={() => {
                            setDrawerOpen(false);
                            setWallpaperOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/6 hover:bg-white/10 text-white/80 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <ImageIcon className="w-3 h-3 text-[#D7FF3F]" />
                          <span>Papel de Parede</span>
                        </button>
                        <button
                          onClick={handleCollapse}
                          className="px-2.5 py-1 rounded-lg bg-white/6 hover:bg-white/10 text-white/80 text-[11px] font-semibold cursor-pointer"
                        >
                          Recolher barra
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Global Modals triggered from Dynamic Nav */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <WallpaperModal isOpen={wallpaperOpen} onClose={() => setWallpaperOpen(false)} />
    </>
  );
};
